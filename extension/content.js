// Configuration
const SCAN_INTERVAL = 2000; // Scan every 2 seconds
const MAX_TEXT_LENGTH = 500; // Maximum length of text to process at once
const BACKEND_URL = 'http://localhost:8000';

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scan') {
        scanPage();
    }
});

function scanPage() {
    // Get all visible text elements
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
    let allText = '';

    textElements.forEach(element => {
        // Only include visible elements
        const style = window.getComputedStyle(element);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
            const text = element.textContent.trim();
            if (text) {
                allText += text + '\n';
            }
        }
    });


    
    // Log the entire text at once
    console.log('=== Page Text Scan ===\n' + allText + '\n=== Scan Complete ===');
}

document.querySelectorAll('p, span, div').forEach(el => {
  if (el.textContent.includes('toxicword')) {
    el.style.backgroundColor = 'yellow';
  }
});