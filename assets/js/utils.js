/**
 * Utility functions for Project Lee tools
 */

// Theme management
const themeUtils = {
  // Get user preferred theme
  getPreferredTheme() {
    const savedTheme = localStorage.getItem('preferredTheme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },
  
  // Set theme
  setTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('preferredTheme', theme);
  },
  
  // Toggle theme
  toggleTheme() {
    const currentTheme = this.getPreferredTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  },
  
  // Initialize theme
  initTheme() {
    this.setTheme(this.getPreferredTheme());
    
    // Add listener for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (localStorage.getItem('preferredTheme') === 'system') {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
};

// Local storage utilities
const storageUtils = {
  // Save data to localStorage
  saveData(key, data) {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`Error saving data to localStorage (${key}):`, error);
      return false;
    }
  },
  
  // Load data from localStorage
  loadData(key, defaultValue = null) {
    try {
      const serialized = localStorage.getItem(key);
      return serialized ? JSON.parse(serialized) : defaultValue;
    } catch (error) {
      console.error(`Error loading data from localStorage (${key}):`, error);
      return defaultValue;
    }
  },
  
  // Remove data from localStorage
  removeData(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing data from localStorage (${key}):`, error);
      return false;
    }
  },
  
  // Clear all localStorage data for the app
  clearAppData(prefix) {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error(`Error clearing app data (${prefix}):`, error);
      return false;
    }
  }
};

// DOM utilities
const domUtils = {
  // Create an element with attributes and children
  createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'textContent') {
        element.textContent = value;
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.entries(value).forEach(([prop, val]) => {
          element.style[prop] = val;
        });
      } else if (key.startsWith('on') && typeof value === 'function') {
        element.addEventListener(key.substring(2).toLowerCase(), value);
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // Add children
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    });
    
    return element;
  },
  
  // Create a button element
  createButton(text, options = {}) {
    const { className = 'btn', onClick = null, ...attributes } = options;
    
    return this.createElement('button', {
      className,
      textContent: text,
      onClick,
      ...attributes
    });
  },
  
  // Show a toast notification
  showToast(message, type = 'info', duration = 3000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = this.createElement('div', {
        id: 'toast-container',
        className: 'fixed top-4 right-4 z-50 flex flex-col items-end space-y-2'
      });
      document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = this.createElement('div', {
      className: `px-4 py-2 rounded shadow-lg fade-in ${
        type === 'error' ? 'bg-red-500 text-white' :
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'warning' ? 'bg-amber-500 text-white' :
        'bg-blue-500 text-white'
      }`,
      textContent: message
    });
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Remove after duration
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
    
    return toast;
  }
};

// Date utilities
const dateUtils = {
  // Format date
  formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    
    return new Date(date).toLocaleDateString(undefined, { ...defaultOptions, ...options });
  },
  
  // Format time
  formatTime(date, options = {}) {
    const defaultOptions = {
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return new Date(date).toLocaleTimeString(undefined, { ...defaultOptions, ...options });
  },
  
  // Format date and time
  formatDateTime(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return new Date(date).toLocaleString(undefined, { ...defaultOptions, ...options });
  },
  
  // Get relative time (e.g., "5 minutes ago")
  getRelativeTime(date) {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }
};

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
  themeUtils.initTheme();
});

// Export utilities
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { themeUtils, storageUtils, domUtils, dateUtils };
}
