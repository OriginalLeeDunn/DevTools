/**
 * Configuration settings for PowerShell tool
 * 
 * This file contains settings that should be modified before deployment.
 */

const config = {
  // Okta Authentication Settings
  okta: {
    issuer: 'https://nordstrom.okta.com/oauth2/default',
    clientId: 'your-client-id',
    redirectUri: window.location.origin + '/powershellTool/powershell_tool.html',
  },
  
  // PowerShell API Server
  api: {
    url: 'http://localhost:3000', // For development
    // url: 'https://your-production-api.com', // For production
  },
  
  // Editor Settings
  editor: {
    theme: 'vs-dark',  // Options: 'vs', 'vs-dark', 'hc-black'
    fontSize: 14,
    tabSize: 4,
  },
  
  // Default script template
  defaultScript: `# New PowerShell Script
# Created: ${new Date().toLocaleDateString()}

param (
    # Define parameters here
)

# Your script code here
Write-Host "Hello, PowerShell!" -ForegroundColor Cyan
`,

  // Sample scripts to show when no scripts exist
  sampleScripts: [
    {
      name: "ServiceAccountStatus",
      description: "Check status of service accounts",
      path: "../powershell-scripts/ServiceAccountStatus.ps1"
    },
    {
      name: "SystemInfo",
      description: "Gather basic system information",
      path: "../powershell-scripts/SystemInfo.ps1"
    }
  ]
};

// Export config for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}
