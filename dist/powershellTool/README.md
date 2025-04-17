# PowerShell Script Manager

A web-based PowerShell script management and execution tool with Okta authentication.

## Features

- Create and edit PowerShell scripts with syntax highlighting
- Run PowerShell scripts directly from the web interface
- Centralized script management
- Parameter definition and management
- Export scripts to .ps1 files
- Secure authentication via Okta
- Full permission controls

## Setup

### Prerequisites

- Node.js (v14+) for the backend server
- PowerShell Core (v7+) installed on the server
- Okta developer account

### Backend Server Setup

1. Navigate to the server directory:
```bash
cd powershellTool/server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Open the `.env` file and update:
   - `OKTA_ISSUER`: Your Okta domain with `/oauth2/default` appended
   - `OKTA_CLIENT_ID`: Your Okta application client ID
   - `CORS_ORIGIN`: URL where your frontend is hosted

5. Start the server:
```bash
npm start
```

### Frontend Configuration

1. Open `config.js` and update:
   - Okta settings (issuer, clientId, redirectUri)
   - API URL to point to your backend server

### Security Configuration

1. In your Okta admin console, create a group called `PowerShell_Executor`
2. Assign users who should have access to execute PowerShell scripts to this group
3. Configure your Okta application to include group claims in tokens

## Deployment Options

### Option 1: Development Mode

```bash
# Start backend server
cd server
npm run dev

# Serve frontend files with live-server or similar
```

### Option 2: Production Deployment

The backend can be deployed to a server with PowerShell Core installed:

1. Use PM2 or similar process manager:
```bash
npm install -g pm2
pm2 start server.js --name powershell-api
```

2. Configure a reverse proxy with Nginx or Apache to serve static frontend files and proxy API requests to the Node.js server.

## Usage

1. Navigate to the PowerShell tool in your browser
2. Log in with your Okta credentials
3. Create or select a script to edit
4. Add parameters if needed
5. Run the script and view the results in real-time

## Security Considerations

- The backend executes PowerShell scripts with the permissions of the user running the Node.js process
- Consider using Windows authentication bridge for proper user isolation
- Implement additional authorization checks based on script path/content
- Limit which PowerShell modules and commands are available

## Limitations

- Large file uploads may be restricted based on server configuration
- Long-running scripts might time out depending on your server settings
- Some PowerShell features may require additional modules or permissions
