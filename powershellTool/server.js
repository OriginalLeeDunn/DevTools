const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { OktaJwtVerifier } = require('@okta/jwt-verifier');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure Okta JWT verifier
const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: process.env.OKTA_ISSUER,
  clientId: process.env.OKTA_CLIENT_ID
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Authentication middleware
const authenticationRequired = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/Bearer (.+)/);
    
    if (!match) {
      return res.status(401).send('Authentication required');
    }
    
    const accessToken = match[1];
    const { claims } = await oktaJwtVerifier.verifyAccessToken(accessToken, 'api');
    
    // Check if user is in the PowerShell_Executor group
    if (claims.groups && Array.isArray(claims.groups)) {
      const isPowerShellExecutor = claims.groups.includes('PowerShell_Executor');
      if (!isPowerShellExecutor) {
        return res.status(403).send('You do not have permission to execute PowerShell scripts');
      }
    }
    
    req.jwt = claims;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).send(`Authentication error: ${error.message}`);
  }
};

// Ensure script directories exist
const scriptsDir = path.join(__dirname, 'scripts');
const tempDir = path.join(__dirname, 'temp');

if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Routes
app.get('/api/healthcheck', (req, res) => {
  res.json({ status: 'ok', message: 'PowerShell API is running' });
});

// Get list of saved scripts
app.get('/api/powershell/scripts', authenticationRequired, (req, res) => {
  try {
    const files = fs.readdirSync(scriptsDir);
    
    const scripts = files
      .filter(file => file.endsWith('.ps1'))
      .map(file => ({
        name: file.replace('.ps1', ''),
        path: path.join(scriptsDir, file),
        size: fs.statSync(path.join(scriptsDir, file)).size,
        lastModified: fs.statSync(path.join(scriptsDir, file)).mtime
      }));
    
    res.json({ scripts });
  } catch (error) {
    console.error('Error listing scripts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific script by name
app.get('/api/powershell/scripts/:name', authenticationRequired, (req, res) => {
  try {
    const scriptName = req.params.name;
    const scriptPath = path.join(scriptsDir, `${scriptName}.ps1`);
    
    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    const content = fs.readFileSync(scriptPath, 'utf8');
    
    res.json({
      name: scriptName,
      content,
      path: scriptPath,
      lastModified: fs.statSync(scriptPath).mtime
    });
  } catch (error) {
    console.error('Error loading script:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save a script
app.post('/api/powershell/save', authenticationRequired, (req, res) => {
  try {
    const { name, content } = req.body;
    
    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }
    
    // Sanitize the script name to prevent directory traversal
    const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const scriptPath = path.join(scriptsDir, `${sanitizedName}.ps1`);
    
    fs.writeFileSync(scriptPath, content, 'utf8');
    
    res.json({ 
      success: true, 
      message: 'Script saved successfully',
      name: sanitizedName,
      path: scriptPath
    });
  } catch (error) {
    console.error('Error saving script:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a script
app.delete('/api/powershell/scripts/:name', authenticationRequired, (req, res) => {
  try {
    const scriptName = req.params.name;
    const scriptPath = path.join(scriptsDir, `${scriptName}.ps1`);
    
    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    fs.unlinkSync(scriptPath);
    
    res.json({ 
      success: true, 
      message: 'Script deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting script:', error);
    res.status(500).json({ error: error.message });
  }
});

// Execute PowerShell script (stream response)
app.post('/api/powershell/execute', authenticationRequired, (req, res) => {
  try {
    const { scriptContent, parameters } = req.body;
    
    if (!scriptContent) {
      return res.status(400).json({ error: 'Script content is required' });
    }
    
    // Create a temporary script file
    const scriptId = Date.now().toString();
    const tempScriptPath = path.join(tempDir, `temp_script_${scriptId}.ps1`);
    
    fs.writeFileSync(tempScriptPath, scriptContent, 'utf8');
    
    // Build parameter arguments
    const paramArgs = [];
    if (parameters) {
      Object.entries(parameters).forEach(([key, value]) => {
        // Handle different parameter types
        if (typeof value === 'boolean') {
          if (value) {
            paramArgs.push(`-${key}:$true`);
          } else {
            paramArgs.push(`-${key}:$false`);
          }
        } else if (value !== '') {
          paramArgs.push(`-${key}`);
          paramArgs.push(`"${value.toString().replace(/"/g, '\\"')}"`);
        }
      });
    }
    
    // Execute PowerShell script
    const powershell = spawn('pwsh', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', tempScriptPath, ...paramArgs]);
    
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Send script output as it arrives
    powershell.stdout.on('data', (data) => {
      const output = data.toString();
      const event = {
        output: [{ message: output, type: 'info' }]
      };
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });
    
    powershell.stderr.on('data', (data) => {
      const output = data.toString();
      const event = {
        output: [{ message: output, type: 'error' }]
      };
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });
    
    powershell.on('close', (code) => {
      // Delete the temporary script
      try {
        fs.unlinkSync(tempScriptPath);
      } catch (error) {
        console.error('Error deleting temporary script:', error);
      }
      
      // Send completion event
      const event = {
        status: code === 0 ? 'success' : 'error',
        exitCode: code,
        complete: true
      };
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      res.end();
    });
    
    // Handle client disconnect
    req.on('close', () => {
      powershell.kill();
      
      // Clean up the temp file
      if (fs.existsSync(tempScriptPath)) {
        try {
          fs.unlinkSync(tempScriptPath);
        } catch (error) {
          console.error('Error deleting temporary script on disconnect:', error);
        }
      }
    });
    
  } catch (error) {
    console.error('Error executing script:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`PowerShell API server running on port ${PORT}`);
});
