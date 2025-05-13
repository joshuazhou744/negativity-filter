// popup.js

// Configuration
const BACKEND_URL = 'https://joshuazhou-8000.theianext-0-labs-prod-misc-tools-us-east-0.proxy.cognitiveclass.ai';
const SCAN_TIMEOUT = 30000; // 30 second timeout
const CONNECTION_CHECK_INTERVAL = 10000; // Check connection every 10 seconds

// DOM Elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const scanButton = document.getElementById('scanButton');
const clearButton = document.getElementById('clearButton');

// State
let isConnected = false;
let fallbackTimer = null;
let connectionCheckTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    // Initially disable the scan button until we check connection
    scanButton.disabled = true;
    
    // Initial connection check
    checkConnection();
    
    // Set up periodic connection checking
    connectionCheckTimer = setInterval(checkConnection, CONNECTION_CHECK_INTERVAL);

    // React to content-script events
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.action === 'scan-started') {
            updateButtonState(true);
        }
        if (msg.action === 'scan-finished') {
            clearTimeout(fallbackTimer);
            updateButtonState(false);
        }
    });

    scanButton.addEventListener('click', startScan);
    clearButton.addEventListener('click', clearConsole);
});

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
    
    // Ensure scan button is disabled when backend is not connected
    scanButton.disabled = !isConnected;
    
    // Update button text to indicate why it's disabled
    if (!isConnected) {
        scanButton.textContent = 'Backend Unavailable';
    } else if (!scanButton.disabled) {
        scanButton.textContent = 'Scan Page';
    }
}

// Update button state based on scanning status
function updateButtonState(scanning) {
    scanButton.disabled = scanning || !isConnected;
    if (scanning) {
        scanButton.textContent = 'Scanning...';
    } else if (!isConnected) {
        scanButton.textContent = 'Backend Unavailable';
    } else {
        scanButton.textContent = 'Scan Page';
    }
}

async function startScan() {
    // Double-check connection before scanning
    if (!isConnected || scanButton.disabled) return;

    // Immediately disable & change text
    updateButtonState(true);

    // Fallback in case no finish message ever comes
    fallbackTimer = setTimeout(() => {
        updateButtonState(false);
    }, SCAN_TIMEOUT);

    try {
        const [tab] = await chrome.tabs.query({
            active: true, currentWindow: true
        });

        if (tab.url.startsWith('chrome://')) {
            alert('Cannot scan chrome:// pages');
            clearTimeout(fallbackTimer);
            updateButtonState(false);
            return;
        }

        // Fire-and-forget: content.js will send scan-started/scan-finished
        chrome.tabs.sendMessage(tab.id, { action: 'scan' }, () => {
            // swallow any "no listener" errors silently
            if (chrome.runtime.lastError) return;
        });

    } catch (err) {
        console.error('Popup error:', err);
        clearTimeout(fallbackTimer);
        updateButtonState(false);
    }
}

async function clearConsole() {
    try {
        const [tab] = await chrome.tabs.query({
            active: true, currentWindow: true
        });
        
        if (tab.url.startsWith('chrome://')) {
            return;
        }

        chrome.tabs.sendMessage(tab.id, { action: 'clear-console' }, () => {
            if (chrome.runtime.lastError) return;
        });
    } catch (err) {
        console.error('Error clearing console:', err);
    }
}