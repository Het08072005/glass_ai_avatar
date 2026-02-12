import axios from 'axios';

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add response interceptor to handle plain text JWT tokens
instance.interceptors.response.use(
    response => {
        // Handle plain text responses (JWT tokens from /getToken)
        // FastAPI returns plain text, axios puts it in response.data directly
        return response;
    },
    error => {
        if (error.response) {
            // Server responded with error status
            console.error('API Error Response:', error.response.status, error.response.data);
        } else if (error.request) {
            // Request made but no response received
            console.error('API Error: No response received - is backend server running?', error.request);
        } else {
            // Error in request setup
            console.error('API Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default instance;