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

document.addEventListener('DOMContentLoaded', () => {
    const scanButton = document.getElementById('scanButton');
    
    scanButton.addEventListener('click', async () => {
        try {
            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if we can inject scripts into this page
            if (tab.url.startsWith('chrome://')) {
                console.error('Cannot scan chrome:// pages');
                return;
            }
            
            // Inject the content script if it's not already there
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
            
            // Send message to content script to scan the page
            chrome.tabs.sendMessage(tab.id, { action: 'scan' });
        } catch (error) {
            console.error('Error:', error);
        }
    });
});