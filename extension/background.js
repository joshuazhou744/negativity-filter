// background.js
// handles the background tasks

// reset the extension when the tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // TODO: reset the states of both content and popup scripts when the tab is changed or reloaded
});