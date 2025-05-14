// popup.js
// handles the popup UI and interactions with page and backend

// configuration
const BACKEND_URL = 'https://joshuazhou-8000.theianext-0-labs-prod-misc-tools-us-east-0.proxy.cognitiveclass.ai';
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
    
    // check if we were previously scanning (persists if popup closes)
    chrome.storage.local.get(['isScanning'], (result) => {
        isScanning = result.isScanning || false;
        
        // if active scan, check how long it's been running
        if (isScanning) {
            chrome.storage.local.get(['scanStartTime'], (timeResult) => {
                const scanStartTime = timeResult.scanStartTime || 0;
                const timeElapsed = Date.now() - scanStartTime;
                
                // if it's been longer than the timeout, assume scan finished or failed
                if (timeElapsed > SCAN_TIMEOUT) {
                    isScanning = false;
                    chrome.storage.local.set({ isScanning: false });
                }
                
                updateButtonState(isScanning);
            });
        }
    });
    
    // initial connection check
    checkConnection();
    
    // set up periodic connection checking
    connectionCheckTimer = setInterval(checkConnection, CONNECTION_CHECK_INTERVAL);

    // content-script events
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.action === 'scan-started') {
            isScanning = true;
            chrome.storage.local.set({ 
                isScanning: true,
                scanStartTime: Date.now()
            });
            updateButtonState(true);
        }
        if (msg.action === 'scan-finished') {
            isScanning = false;
            chrome.storage.local.set({ isScanning: false });
            updateButtonState(false);
        }
    });

    scanButton.addEventListener('click', startScan);
    clearButton.addEventListener('click', clearConsole);
});

// check backend connection
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

        // fire-and-forget: content.js will send a response (start/end)
        chrome.tabs.sendMessage(tab.id, { action: 'scan' }, () => {
            // swallow any "no listener" errors silently
            if (chrome.runtime.lastError) return;
        });

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