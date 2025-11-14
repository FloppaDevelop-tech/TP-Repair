// Data Manager - Utility functions for API calls
// This file provides helper functions for managing data across the application

const API_BASE = window.location.origin + '/api/reports';

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Export functions for use in other scripts
window.dataManager = {
  apiCall,
  API_BASE
};

