/**
 * Authentication utilities for Project Lee
 * Handles Okta auth integration and user authentication state
 */

class ProjectAuth {
  constructor(config = {}) {
    this.oktaAuth = null;
    this.isInitialized = false;
    this.authState = {
      isAuthenticated: false,
      user: null,
      token: null
    };
    this.listeners = [];
    
    // Default config
    this.config = {
      useAuth: true,  // Whether to enforce authentication
      oktaConfig: {   // Okta configuration
        issuer: 'https://your-okta-domain/oauth2/default',
        clientId: 'your-client-id',
        redirectUri: window.location.origin + window.location.pathname,
        scopes: ['openid', 'profile', 'email'],
      },
      ...config
    };
    
    // Init if Okta is available
    if (window.OktaAuth && this.config.useAuth) {
      this.init();
    }
  }
  
  // Initialize Okta auth
  init() {
    if (this.isInitialized) return;
    
    try {
      this.oktaAuth = new OktaAuth(this.config.oktaConfig);
      this.isInitialized = true;
      this.checkAuthentication();
    } catch (error) {
      console.error('Failed to initialize authentication:', error);
    }
  }
  
  // Check if user is authenticated
  async checkAuthentication() {
    if (!this.isInitialized) return false;
    
    try {
      const isAuthenticated = await this.oktaAuth.isAuthenticated();
      
      if (isAuthenticated) {
        const accessToken = await this.oktaAuth.tokenManager.get('accessToken');
        const userInfo = await this.oktaAuth.getUser();
        
        this.authState = {
          isAuthenticated: true,
          user: userInfo,
          token: accessToken ? accessToken.accessToken : null
        };
        
        this.notifyListeners();
        return true;
      } else {
        this.authState = {
          isAuthenticated: false,
          user: null,
          token: null
        };
        
        this.notifyListeners();
        return false;
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }
  
  // Log in with redirect
  login() {
    if (!this.isInitialized) return;
    this.oktaAuth.signInWithRedirect();
  }
  
  // Log out
  async logout() {
    if (!this.isInitialized) return;
    await this.oktaAuth.signOut();
    this.authState = {
      isAuthenticated: false,
      user: null,
      token: null
    };
    this.notifyListeners();
  }
  
  // Handle redirect callback (call this on page load)
  async handleRedirect() {
    if (!this.isInitialized) return;
    
    try {
      await this.oktaAuth.handleLoginRedirect();
    } catch (error) {
      console.error('Error handling login redirect:', error);
    }
  }
  
  // Subscribe to auth state changes
  subscribe(callback) {
    this.listeners.push(callback);
    // Immediately notify with current state
    callback(this.authState);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
  
  // Notify all listeners of state changes
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.authState));
  }
  
  // Get the current auth token
  getToken() {
    return this.authState.token;
  }
  
  // Get the current user
  getUser() {
    return this.authState.user;
  }
  
  // Check if the user has a specific role
  hasRole(role) {
    if (!this.authState.user || !this.authState.user.groups) {
      return false;
    }
    return this.authState.user.groups.includes(role);
  }
}

// Create a default instance
const projectAuth = new ProjectAuth();

// Export the class and default instance
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProjectAuth, projectAuth };
}
