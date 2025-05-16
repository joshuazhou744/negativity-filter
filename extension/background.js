// background.js
// handles the background tasks

// Firefox compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// reset the extension when the tab is updated
browserAPI.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        browserAPI.tabs.sendMessage(tabId, { action: 'reset' }, () => {
            if (browserAPI.runtime.lastError) {};
        });
    }
});
