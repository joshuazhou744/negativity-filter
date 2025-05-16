// popup.js
// handles the popup UI and interactions with page and backend

// configuration
const BACKEND_URL = 'configure me';
const SCAN_TIMEOUT = 30000; // 30 second timeout
const CONNECTION_CHECK_INTERVAL = 10000; // Check connection every 10 seconds

// DOM elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const scanButton = document.getElementById('scanButton');
const clearButton = document.getElementById('clearButton');

// states
let isConnected = false;
let isScanning = false;
let connectionCheckTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    // initially disable the scan button until connection is established
    scanButton.disabled = true;
    
    // check if we were previously scanning  (persists if popup closes)
    chrome.storage.local.get(['isScanning'], (result) => {
        // TODO: update the scanning state based on the local storage isScanning value
    });
    
    // initial connection check
    checkConnection();
    
    // set up periodic connection checking
    connectionCheckTimer = setInterval(checkConnection, CONNECTION_CHECK_INTERVAL);

    // TODO: content-script events
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.action === 'scan-started') {
            // TODO: scan started event
        }
        if (msg.action === 'scan-finished') {
            // TODO: scan finished event
        }
    });

    scanButton.addEventListener('click', startScan);
    clearButton.addEventListener('click', clearConsole);
});

// check backend connection
async function checkConnection() {
    // TODO: check the backend health
}

// update status UI
function updateStatus() {
    statusIndicator.classList.toggle('active', isConnected);
    statusText.textContent = isConnected ? 'Connected to backend' : 'Backend not available';
    
    // update button state based on backend connection
    updateButtonState(isScanning);
}

// update button state based on scanning status
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
    // double-check connection and button status before scanning
    if (!isConnected || scanButton.disabled) return;

    // set scanning states
    isScanning = true;
    chrome.storage.local.set({ 
        isScanning: true,
        scanStartTime: Date.now()
    });
    updateButtonState(true);

    try {
        const [tab] = await chrome.tabs.query({
            active: true, currentWindow: true
        });

        // no scanning in chrome settings
        if (tab.url.startsWith('chrome://')) {
            alert('Cannot scan chrome:// pages');
            isScanning = false;
            chrome.storage.local.set({ isScanning: false });
            updateButtonState(false);
            return;
        }

        // TODO: send the scan request to the content script

    } catch (err) {
        console.error('Popup error:', err);
        isScanning = false;
        chrome.storage.local.set({ isScanning: false });
        updateButtonState(false);
    }
}

// clear console handler
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