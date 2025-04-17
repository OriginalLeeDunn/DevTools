# Setting Up Okta Authentication for the PowerShell Tool

This guide will walk you through the process of setting up Okta authentication for the PowerShell Tool.

## Prerequisites

1. An Okta developer account (sign up at [developer.okta.com](https://developer.okta.com) if you don't have one)
2. Access to your Okta admin dashboard
3. Admin rights to create applications and groups in Okta

## Step 1: Create an Okta Application

1. Log in to your Okta developer dashboard
2. Navigate to **Applications** > **Applications** in the sidebar
3. Click the **Create App Integration** button
4. Select **OIDC - OpenID Connect** as the sign-in method
5. Choose **Single-Page Application (SPA)** as the application type
6. Click **Next**

## Step 2: Configure the Application

1. Name your application (e.g., "PowerShell Tool")
2. Add sign-in redirect URIs:
   - Add the path to your PowerShell tool: `https://your-domain.com/powershellTool/powershell_tool.html`
   - For local development: `http://localhost:8080/powershellTool/powershell_tool.html`
3. Add sign-out redirect URIs:
   - Same as the sign-in URIs
4. Under **Assignments**, select **Allow everyone in your organization to access**
5. Click **Save**

## Step 3: Create the PowerShell_Executor Group

1. Navigate to **Directory** > **Groups** in the sidebar
2. Click **Add Group**
3. Name the group "PowerShell_Executor"
4. Provide a description: "Users who can execute PowerShell scripts via the web tool"
5. Click **Save**

## Step 4: Add Users to the PowerShell_Executor Group

1. Navigate to **Directory** > **Groups** in the sidebar
2. Find and click on the "PowerShell_Executor" group
3. Click the **Assign People** button
4. Search for and select the users who should have PowerShell execution permissions
5. Click **Save**

## Step 5: Configure Group Claims in the Authorization Server

1. Navigate to **Security** > **API** in the sidebar
2. Select the **Authorization Servers** tab
3. Click on the default authorization server (or create a new one)
4. Select the **Claims** tab
5. Click **Add Claim**
6. Fill in the following:
   - Name: `groups`
   - Include in token type: `ID Token` and `Access Token`
   - Value type: `Groups`
   - Filter: `Matches regex` with value `.*`
7. Click **Save**

## Step 6: Update Application Configuration

Now you need to get the necessary information to configure your PowerShell Tool:

1. Navigate to **Applications** > **Applications** in the sidebar
2. Click on your PowerShell Tool application
3. Note down the following information:
   - Client ID
   - Issuer URL (found under the **Sign On** tab)

## Step 7: Configure the PowerShell Tool

1. Open `/Users/ffld/Documents/repo/projectLee/powershellTool/config.js`
2. Update the following settings:
```javascript
okta: {
  issuer: 'https://your-okta-domain/oauth2/default', // Replace with your Issuer URL
  clientId: 'your-client-id', // Replace with your Client ID
  redirectUri: window.location.origin + '/powershellTool/powershell_tool.html',
},
```

3. Also update the same settings in the PowerShell Tool HTML file:
```javascript
const oktaAuth = new OktaAuth({
  issuer: 'https://your-okta-domain/oauth2/default', // Replace with your Issuer URL
  clientId: 'your-client-id', // Replace with your Client ID
  redirectUri: window.location.origin + window.location.pathname,
  tokenManager: {
    storage: 'localStorage'
  }
});
```

## Step 8: Configure the Backend Server

1. Create a `.env` file in the `server` directory based on the `.env.example` file
2. Update the Okta settings:
```
OKTA_ISSUER=https://your-okta-domain/oauth2/default
OKTA_CLIENT_ID=your-client-id
CORS_ORIGIN=http://localhost:8080
```

## Testing the Integration

1. Start the backend server:
```bash
cd powershellTool/server
npm install
npm start
```

2. Open the PowerShell Tool in your browser
3. You should be redirected to the Okta login page
4. Log in with a user that is a member of the PowerShell_Executor group
5. After successful authentication, you should be able to use the PowerShell Tool

## Troubleshooting

### Authentication Failures

- Verify the Client ID and Issuer URL are correct
- Check browser console for specific error messages
- Ensure the user is assigned to the application in Okta
- Confirm the user is a member of the PowerShell_Executor group

### CORS Issues

If you encounter CORS errors:

1. Verify the `CORS_ORIGIN` setting in your backend server's `.env` file
2. Check that your Okta application's sign-in redirect URI matches your actual application URL
3. Ensure your backend server is properly configured to send CORS headers

### Token Verification Issues

If the backend rejects tokens:

1. Verify the `OKTA_ISSUER` and `OKTA_CLIENT_ID` in your `.env` file
2. Check that the group claim is properly configured in your Okta authorization server
3. Ensure the user is a member of the required group
