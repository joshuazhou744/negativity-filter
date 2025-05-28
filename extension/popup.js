// popup.js
// handles the popup UI and interactions with the backend

// detect if the browser is Firefox or Chrome

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// configuration for global constants
const CONFIG = {
    BACKEND_URL: 'configure me',
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

// check backend connection
async function checkConnection() {
    try {
        const response = await fetch(`${CONFIG.BACKEND_URL}/health`);
        state.isConnected = response.ok;
    } catch (error) {
        state.isConnected = false;
    }
    updateConnectionStatus();
    updateScanButton();
}

/* UI updates */

// update the connection status indicator
function updateConnectionStatus() {
    // give the status indicator class active if connected
    elements.statusIndicator.classList.toggle('active', state.isConnected);
    // update the status text
    elements.statusText.textContent = state.isConnected 
        ? 'Connected to backend' 
        : 'Backend not available';
    // update the scan button state
    updateScanButton();
}

// update the scan button state based on the connection and scan state
function updateScanButton() {
    // update the scan button state
    elements.scanButton.disabled = state.isScanning || !state.isConnected;
    // update the scan button text
    if (state.isScanning) {
        elements.scanButton.textContent = 'Scanning...';
    } else if (!state.isConnected) {
        elements.scanButton.textContent = 'Backend Unavailable';
    } else {
        elements.scanButton.textContent = 'Scan Page';
    }
}

// check the previous scan state when popup opens
async function checkPreviousScanState() {
    try {
        // get the previous scan state from local storage
        const { isScanning } = await browserAPI.storage.local.get(['isScanning']);
        // set the scan state
        state.isScanning = isScanning || false;
        // update the button state
        updateScanButton();
    } catch (error) {
        // if error, set the scan state to false
        console.error('Error checking scan state:', error);
        state.isScanning = false;
        updateScanButton();
    }
}

// set scan state
async function setScanningState(scanning) {
    try {
        // update the local and stored scan state
        state.isScanning = scanning;
        await browserAPI.storage.local.set({ isScanning: scanning });
        // update the button state
        updateScanButton();
    } catch (error) {
        // if error, set the scan state to false
        console.error('Error setting scan state:', error);
        state.isScanning = false;
        await browserAPI.storage.local.set({ isScanning: false });
        updateScanButton();
    }
}

// send a message to the content script to scan the current page
async function startScan() {
    if (!state.isConnected || state.isScanning) return;

    try {
        // get the active and current window tab
        const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
        
        // if the tab is an internal page, alert the user and return
        if ((tab.url.startsWith('chrome://')) || tab.url.startsWith('about:')) {
            alert('Cannot scan browser internal pages');
            return;
        }

        // set the scanning state to true
        await setScanningState(true);
        // send a message to the content script to scan the current page
        browserAPI.tabs.sendMessage(tab.id, { action: 'scan' }, () => {
            // if there is an error, return
            if (browserAPI.runtime.lastError) return;
        });

    } catch (err) {
        // if error, set the scanning state to false
        console.error('Scan error:', err);
        await setScanningState(false);
    }
}

// send a message to the content script to clear the console
async function clearConsole() {
    try {
        // get the active and current window tab
        const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });

        // if the tab is an internal page, alert the user and return
        if ((tab.url.startsWith('chrome://')) || tab.url.startsWith('about:')) {
            alert('Cannot clear console in browser internal pages');
            return;
        }

        // send a message to the content script to clear the console
        browserAPI.tabs.sendMessage(tab.id, { action: 'clear-console' }, () => {
            // if there is an error, return
            if (browserAPI.runtime.lastError) return;
        });
    } catch (err) {
        // if error, log the error
        console.error('Clear console error:', err);
    }
}

// message handling from the content script
const messageListener = (request) => {
    switch (request.action) {
        case 'scan-started':
            setScanningState(true);
            break;
        case 'scan-finished':
            setScanningState(false);
            break;
        case 'reset':
            setScanningState(false)
            break;
    }
}

function initialize() {
    // set up periodic connection checking
    checkConnection();
    state.connectionCheckTimer = setInterval(checkConnection, CONFIG.CONNECTION_CHECK_INTERVAL);

    // check the previous scan state
    checkPreviousScanState();
    
    // set up event listeners for the scan and clear console buttons
    elements.scanButton.addEventListener('click', startScan);
    elements.clearButton.addEventListener('click', clearConsole);

    // listen for content script messages
    browserAPI.runtime.onMessage.addListener(messageListener);
}

// start everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);