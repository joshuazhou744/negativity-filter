// Configuration
const SCAN_INTERVAL = 2000; // Scan every 2 seconds
const MAX_TEXT_LENGTH = 500; // Maximum length of text to process at once
const BACKEND_URL = 'http://localhost:8000';

// State management
let isScanning = false;
let processedElements = new Set();

// Helper function to get text content from an element
function getElementText(element) {
    // Skip if element is hidden or empty
    if (!element.offsetParent || !element.textContent.trim()) {
        return null;
    }

    // Get text content and clean it
    let text = element.textContent.trim();
    
    // Skip if text is too long
    if (text.length > MAX_TEXT_LENGTH) {
        return null;
    }

    // Skip if element has already been processed
    if (processedElements.has(element)) {
        return null;
    }

    return text;
}

// Function to check if text is toxic
async function checkToxicity(text) {
    try {
        const response = await fetch(`${BACKEND_URL}/transform-text?text=${encodeURIComponent(text)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error checking toxicity:', error);
        return null;
    }
}

// Function to process a section of the page
async function processSection(elements) {
    for (const element of elements) {
        const text = getElementText(element);
        if (!text) continue;

        const result = await checkToxicity(text);
        if (result && result.is_toxic) {
            // Mark element as processed
            processedElements.add(element);
            
            // Create a wrapper for the transformed text
            const wrapper = document.createElement('span');
            wrapper.className = 'toxicity-filter-transformed';
            wrapper.textContent = result.transformed_text;
            
            // Replace the original text
            element.textContent = '';
            element.appendChild(wrapper);
        }
    }
}

// Function to scan the page
async function scanPage() {
    if (isScanning) return;
    isScanning = true;

    try {
        // Get all text nodes in the current viewport
        const textElements = Array.from(document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6'))
            .filter(element => {
                const rect = element.getBoundingClientRect();
                return (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                );
            });

        // Process elements in batches
        const batchSize = 5;
        for (let i = 0; i < textElements.length; i += batchSize) {
            const batch = textElements.slice(i, i + batchSize);
            await processSection(batch);
        }
    } catch (error) {
        console.error('Error scanning page:', error);
    } finally {
        isScanning = false;
    }
}

// Start scanning when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initial scan
    scanPage();

    // Set up periodic scanning
    setInterval(scanPage, SCAN_INTERVAL);

    // Scan on scroll
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(scanPage, 100);
    });
}); 