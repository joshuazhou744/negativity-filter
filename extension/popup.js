// popup.js
// handles the popup UI and interactions with the backend

const CONFIG = {
    BACKEND_URL: 'https://joshuazhou-8000.theianext-0-labs-prod-misc-tools-us-east-0.proxy.cognitiveclass.ai',
    SCAN_TIMEOUT: 30000,
    CONNECTION_CHECK_INTERVAL: 10000
};

// state management
const state = {
    isConnected: false,
    isScanning: false,
    connectionCheckTimer: null
};

// elements of the UI
const elements = {
    statusIndicator: document.getElementById('statusIndicator'),
    statusText: document.getElementById('statusText'),
    scanButton: document.getElementById('scanButton'),
    clearButton: document.getElementById('clearButton')
};

// UI updates
function updateStatus() {
    elements.statusIndicator.classList.toggle('active', state.isConnected);
    elements.statusText.textContent = state.isConnected 
        ? 'Connected to backend' 
        : 'Backend not available';
    
    updateButtonState();
}

// update the button state based on the connection and scan state
function updateButtonState() {
    const { scanButton } = elements;
    const { isScanning, isConnected } = state;

    scanButton.disabled = isScanning || !isConnected;
    
    if (isScanning) {
        scanButton.textContent = 'Scanning...';
    } else if (!isConnected) {
        scanButton.textContent = 'Backend Unavailable';
    } else {
        scanButton.textContent = 'Scan Page';
    }
}

// check backend connection
async function checkConnection() {
    try {
        const response = await fetch(`${CONFIG.BACKEND_URL}/health`);
        state.isConnected = response.ok;
    } catch (error) {
        state.isConnected = false;
    }
    updateStatus();
}

// set scan state
async function setScanningState(scanning) {
    state.isScanning = scanning;
    await chrome.storage.local.set({ 
        isScanning: scanning,
        scanStartTime: scanning ? Date.now() : null
    });
    updateButtonState();
}

// send a message to the content script to scan the current page
async function startScan() {
    if (!state.isConnected || elements.scanButton.disabled) return;

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab.url.startsWith('chrome://')) {
            alert('Cannot scan chrome:// pages');
            return;
        }

        await setScanningState(true);
        chrome.tabs.sendMessage(tab.id, { action: 'scan' }, () => {
            if (chrome.runtime.lastError) return;
        });

    } catch (err) {
        console.error('Scan error:', err);
        await setScanningState(false);
    }
}

// send a message to the content script to clear the console
async function clearConsole() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab.url.startsWith('chrome://')) return;
        
        chrome.tabs.sendMessage(tab.id, { action: 'clear-console' }, () => {
            if (chrome.runtime.lastError) return;
        });
    } catch (err) {
        console.error('Clear console error:', err);
    }
}

// message handling from the content script
function handleContentScriptMessage(msg) {
    switch (msg.action) {
        case 'scan-started':
            setScanningState(true);
            break;
        case 'scan-finished':
            setScanningState(false);
            break;
    }
}

// check the previous scan state when popup opens
async function checkPreviousScanState() {
    const { isScanning, scanStartTime } = await chrome.storage.local.get(['isScanning', 'scanStartTime']);
    
    // if scan has been running too long, assume it failed
    if (isScanning && Date.now() - (scanStartTime || 0) > CONFIG.SCAN_TIMEOUT) {
        state.isScanning = false;
        await chrome.storage.local.set({ isScanning: false });
    } else {
        state.isScanning = isScanning || false;
    }
    
    updateButtonState();
}

function initialize() {
    // initially disable the scan button
    elements.scanButton.disabled = true;
    
    // set up event listeners for the scan and clear console buttons
    elements.scanButton.addEventListener('click', startScan);
    elements.clearButton.addEventListener('click', clearConsole);
    
    // check the previous scan state
    checkPreviousScanState();
    
    // set up periodic connection checking
    checkConnection();
    state.connectionCheckTimer = setInterval(checkConnection, CONFIG.CONNECTION_CHECK_INTERVAL);

    // listen for content script messages
    chrome.runtime.onMessage.addListener(handleContentScriptMessage);
}

// start everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);