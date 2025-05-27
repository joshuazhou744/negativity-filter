// background.js
// handles the background tasks

// detect if the browser is Firefox or Chrome
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// reset the extension when the tab is updated
browserAPI.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // send reset to content script
        browserAPI.tabs.sendMessage(tabId, { action: 'reset' }, () => {
            if (browserAPI.runtime.lastError) return;
        });
        
        // send reset to popup
        browserAPI.runtime.sendMessage({ action: 'reset' }, () => {
            if (browserAPI.runtime.lastError) return;
        });
    }
});