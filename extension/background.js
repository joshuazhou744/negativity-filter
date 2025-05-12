chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        chrome.tabs.sendMessage(tabId, { action: 'reset' }, () => {
            if (chrome.runtime.lastError) {};
        });
    }
});
