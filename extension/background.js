// background.js
// handles the background tasks

// reset the extension when the tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        chrome.tabs.sendMessage(tabId, { action: 'reset' }, () => {
            if (chrome.runtime.lastError) {};
        });
    }
});
