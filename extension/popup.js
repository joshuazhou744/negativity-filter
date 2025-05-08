// Configuration
const BACKEND_URL = 'http://localhost:8000';

// DOM Elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const scanButton = document.getElementById('scanButton');
const clearButton = document.getElementById('clearButton');
const autoScanToggle = document.getElementById('autoScanToggle');
const highlightToggle = document.getElementById('highlightToggle');

// State
let isConnected = false;

// Check backend connection
async function checkConnection() {
    try {
        const response = await fetch(`${BACKEND_URL}/health`);
        isConnected = response.ok;
        updateStatus();
    } catch (error) {
        isConnected = false;
        updateStatus();
    }
}

// Update status UI
function updateStatus() {
    statusIndicator.classList.toggle('active', isConnected);
    statusText.textContent = isConnected ? 'Connected to backend' : 'Backend not available';
    scanButton.disabled = !isConnected;
}

// Send message to content script
async function sendMessageToContentScript(message) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
        chrome.tabs.sendMessage(tab.id, message);
    }
}

// Event Listeners
scanButton.addEventListener('click', () => {
    sendMessageToContentScript({ action: 'scan' });
});

clearButton.addEventListener('click', () => {
    sendMessageToContentScript({ action: 'clear' });
});

autoScanToggle.addEventListener('change', (e) => {
    sendMessageToContentScript({
        action: 'updateSettings',
        settings: { autoScan: e.target.checked }
    });
});

highlightToggle.addEventListener('change', (e) => {
    sendMessageToContentScript({
        action: 'updateSettings',
        settings: { highlight: e.target.checked }
    });
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkConnection();
    // Check connection every 30 seconds
    setInterval(checkConnection, 30000);
}); 