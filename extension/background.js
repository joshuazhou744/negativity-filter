// Configuration
const BACKEND_URL = 'http://localhost:8000';

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkToxicity') {
        checkToxicity(request.text)
            .then(sendResponse)
            .catch(error => sendResponse({ error: error.message }));
        return true; // Required for async sendResponse
    }
});

// API communication
async function checkToxicity(text) {
    try {
        const response = await fetch(`${BACKEND_URL}/transform-text?text=${encodeURIComponent(text)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error checking toxicity:', error);
        throw error;
    }
}

// Health check endpoint
async function checkHealth() {
    try {
        const response = await fetch(`${BACKEND_URL}/health`);
        return response.ok;
    } catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
}

// Periodic health check
setInterval(checkHealth, 30000); 