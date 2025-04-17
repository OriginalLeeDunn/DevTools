/**
 * API utilities for Project Lee
 * Handles API calls with authentication
 */

class ProjectAPI {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:3000';
    this.endpoints = config.endpoints || {};
    this.getToken = config.getToken || (() => {
      // Try to get token from ProjectAuth by default
      return window.projectAuth?.getToken() || null;
    });
  }
  
  // Make a GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, { 
      method: 'GET', 
      ...options 
    });
  }
  
  // Make a POST request
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options 
    });
  }
  
  // Make a PUT request
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options 
    });
  }
  
  // Make a DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { 
      method: 'DELETE', 
      ...options 
    });
  }
  
  // Generic request method
  async request(endpoint, options = {}) {
    try {
      const token = this.getToken();
      
      // Add authorization header if token exists
      const headers = {
        ...options.headers
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Determine the full URL
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
      
      // Make the request
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      // Handle JSON responses
      if (response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'API request failed');
        }
        
        return data;
      }
      
      // Handle non-JSON responses
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      return await response.text();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
  
  // Special method for event-source (streaming) endpoints
  createEventSource(endpoint, options = {}) {
    const token = this.getToken();
    const params = new URLSearchParams({
      ...(token ? { token } : {}),
      ...options.params
    });
    
    const url = `${this.baseUrl}${endpoint}?${params}`;
    return new EventSource(url);
  }
}

// Create a default API instance
const projectAPI = new ProjectAPI();

// Export the class and default instance
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProjectAPI, projectAPI };
}
