// popup.js

// Configuration
const BACKEND_URL = 'http://localhost:8000';
const SCAN_TIMEOUT = 30000; // 30 second timeout


// DOM Elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const scanButton = document.getElementById('scanButton');

// State
let isConnected = false;
let fallbackTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    checkConnection();

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
    scanButton.disabled = !isConnected;
}

// Update button state based on scanning status
function updateButtonState(scanning) {
    scanButton.disabled = scanning || !isConnected;
    scanButton.textContent = scanning ? 'Scanning...' : 'Scan Page';
}

async function startScan() {
    if (scanButton.disabled) return;

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
            // swallow any “no listener” errors silently
            if (chrome.runtime.lastError) return;
        });

    } catch (err) {
        console.error('Popup error:', err);
        clearTimeout(fallbackTimer);
        updateButtonState(false);
    }
}