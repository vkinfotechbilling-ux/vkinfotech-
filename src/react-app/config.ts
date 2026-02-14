/**
 * Central configuration for the application
 */
export const CONFIG = {
    // Priority: 
    // 1. Environment variable (for custom domains/builds)
    // 2. Localhost detection (for local dev)
    // 3. Relative path (for same-domain hosting)
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL ||
        ((typeof window !== 'undefined' && window.location.hostname === 'localhost')
            ? 'http://localhost:5000/api'
            : '/api')
};

console.log('🔌 Configured API Base URL:', CONFIG.API_BASE_URL);
