const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const OktaJwtVerifier = require('@okta/jwt-verifier');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const TEMP_DIR = path.join(__dirname, 'temp');
const SCRIPT_DIR = path.join(__dirname, 'scripts');

// Ensure temp and scripts directories exist
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
if (!fs.existsSync(SCRIPT_DIR)) fs.mkdirSync(SCRIPT_DIR, { recursive: true });

// Okta JWT Verifier setup
const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: process.env.OKTA_ISSUER,
  clientId: process.env.OKTA_CLIENT_ID,
  assertClaims: {
    'groups.includes': 'PowerShell_Executor'
  }
});

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '1mb' }));

// Authentication middleware
const authenticationRequired = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/Bearer (.+)/);
    
    if (!match) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const accessToken = match[1];
    const jwt = await oktaJwtVerifier.verifyAccessToken(accessToken, 'api://default');
    
    req.jwt = jwt;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// PowerShell execution route with authentication
app.post('/api/powershell/execute', authenticationRequired, async (req, res) => {
  try {
    const { scriptContent, parameters } = req.body;
    
    if (!scriptContent) {
      return res.status(400).json({ error: 'Script content is required' });
    }
    
    // Generate a unique script name based on timestamp
    const timestamp = Date.now();
    const scriptName = `script_${timestamp}.ps1`;
    const scriptPath = path.join(TEMP_DIR, scriptName);
    
    // Write the script to a temporary file
    fs.writeFileSync(scriptPath, scriptContent);
    
    // Prepare parameters for PowerShell execution
    const psParams = [
      '-ExecutionPolicy', 
      'Bypass', 
      '-NoProfile', 
      '-File', 
      scriptPath
    ];
    
    // Add user-provided parameters
    if (parameters && typeof parameters === 'object') {
      for (const [key, value] of Object.entries(parameters)) {
        // Handle different parameter types
        if (typeof value === 'boolean') {
          if (value === true) {
            psParams.push(`-${key}`);
          }
        } else {
          psParams.push(`-${key}`);
          psParams.push(String(value));
        }
      }
    }
    
    // Log user and script execution for audit purposes
    const userEmail = req.jwt.claims.email || 'unknown';
    const userId = req.jwt.claims.sub;
    console.log(`User ${userEmail} (${userId}) executing PowerShell script: ${scriptName}`);
    
    // Execute the PowerShell script
    const ps = spawn('powershell', psParams);
    
    // Create response data structures
    let output = [];
    let errors = [];
    
    // Setup event handlers
    ps.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      output.push(...lines.map(line => ({ type: 'info', message: line })));
      
      // Send the output as it comes in via Server-Sent Events
      res.write(`data: ${JSON.stringify({ output: lines.map(line => ({ type: 'info', message: line })) })}\n\n`);
    });
    
    ps.stderr.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      errors.push(...lines.map(line => ({ type: 'error', message: line })));
      
      // Send errors as they occur
      res.write(`data: ${JSON.stringify({ output: lines.map(line => ({ type: 'error', message: line })) })}\n\n`);
    });
    
    // Handle script completion
    ps.on('exit', (code) => {
      // Clean up temporary script file
      fs.unlinkSync(scriptPath);
      
      // Send completion message
      const status = code === 0 ? 'success' : 'error';
      res.write(`data: ${JSON.stringify({ status, exitCode: code, complete: true })}\n\n`);
      res.end();
      
      // Log completion
      console.log(`Script execution completed with exit code ${code}`);
      
      // Add to audit log
      const logEntry = {
        timestamp: new Date().toISOString(),
        user: userEmail,
        userId: userId,
        scriptName: scriptName,
        exitCode: code,
        status: status
      };
      
      fs.appendFileSync(
        path.join(__dirname, 'audit_log.json'), 
        JSON.stringify(logEntry) + '\n'
      );
    });
    
    // Set up response headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Send initial response
    res.write(`data: ${JSON.stringify({ status: 'started' })}\n\n`);
    
  } catch (error) {
    console.error('Error executing PowerShell script:', error);
    res.status(500).json({ error: 'Failed to execute script', details: error.message });
  }
});

// Save script route
app.post('/api/powershell/save', authenticationRequired, async (req, res) => {
  try {
    const { name, content } = req.body;
    
    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }
    
    // Sanitize filename to prevent path traversal
    const sanitizedName = name.replace(/[^\w\.\-]/g, '_');
    const scriptPath = path.join(SCRIPT_DIR, `${sanitizedName}.ps1`);
    
    // Write the script to the scripts directory
    fs.writeFileSync(scriptPath, content);
    
    // Log save operation
    const userEmail = req.jwt.claims.email || 'unknown';
    console.log(`User ${userEmail} saved script: ${sanitizedName}`);
    
    res.json({ success: true, scriptName: sanitizedName });
  } catch (error) {
    console.error('Error saving PowerShell script:', error);
    res.status(500).json({ error: 'Failed to save script', details: error.message });
  }
});

// Get available scripts route
app.get('/api/powershell/scripts', authenticationRequired, (req, res) => {
  try {
    const files = fs.readdirSync(SCRIPT_DIR).filter(file => file.endsWith('.ps1'));
    
    const scripts = files.map(file => {
      const stats = fs.statSync(path.join(SCRIPT_DIR, file));
      return {
        name: file.replace('.ps1', ''),
        lastModified: stats.mtime
      };
    });
    
    res.json({ scripts });
  } catch (error) {
    console.error('Error retrieving script list:', error);
    res.status(500).json({ error: 'Failed to retrieve script list', details: error.message });
  }
});

// Get script content
app.get('/api/powershell/scripts/:name', authenticationRequired, (req, res) => {
  try {
    const { name } = req.params;
    const sanitizedName = name.replace(/[^\w\.\-]/g, '_');
    const scriptPath = path.join(SCRIPT_DIR, `${sanitizedName}.ps1`);
    
    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    const content = fs.readFileSync(scriptPath, 'utf8');
    res.json({ name: sanitizedName, content });
  } catch (error) {
    console.error('Error retrieving script:', error);
    res.status(500).json({ error: 'Failed to retrieve script', details: error.message });
  }
});

// Delete script
app.delete('/api/powershell/scripts/:name', authenticationRequired, (req, res) => {
  try {
    const { name } = req.params;
    const sanitizedName = name.replace(/[^\w\.\-]/g, '_');
    const scriptPath = path.join(SCRIPT_DIR, `${sanitizedName}.ps1`);
    
    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    fs.unlinkSync(scriptPath);
    
    // Log delete operation
    const userEmail = req.jwt.claims.email || 'unknown';
    console.log(`User ${userEmail} deleted script: ${sanitizedName}`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting script:', error);
    res.status(500).json({ error: 'Failed to delete script', details: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`PowerShell API server listening on port ${PORT}`);
});
