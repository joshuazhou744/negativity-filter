// content.js
// handles content of the page

// Configuration
const BACKEND_URL = 'https://joshuazhou-8000.theianext-0-labs-prod-misc-tools-us-east-0.proxy.cognitiveclass.ai';
const TEXT_SELECTORS = "p, div, span, h1, h2, h3, h4, h5, h6, a, li, ol, ul, textarea, input, button, td, th, tr";
const MAX_ELEMENTS = 100;
const DISCOVERY_INTERVAL = 1000; // 1 second

// State
const seen = new Set();
const allElementsToProcess = [];
let scanning = false;
let discovering = false;
let index = 0;
let discoveryTimer = null;

if (window.__toxicityFilterInjected) {
    console.log("Toxicity filter already injected");
}
window.__toxicityFilterInjected = true;

// Process messages from the popup
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'scan' && !scanning) {
        // Start scanning
        scanning = true;
        chrome.runtime.sendMessage({ action: 'scan-started' });
        
        // Ensure we have the latest elements
        if (!discovering) {
            startElementDiscovery();
        }
        
        // Run scan and handle completion
        scanPage()
            .then(() => {
                console.log('Scan complete');
                chrome.runtime.sendMessage({ action: 'scan-finished' });
            })
            .catch(error => console.error('Scan error:', error))
            .finally(() => scanning = false);
    } else if (request.action === 'reset') {
        // Reset our state
        index = 0;
        seen.clear();
        allElementsToProcess.length = 0; // Clear the array
        
        // Restart discovery
        stopElementDiscovery();
        startElementDiscovery();
        
        console.log('Reset index and element tracking');
    } else if (request.action === 'clear-console') {
        console.clear();
    }
});

// Background task for element discovery
function startElementDiscovery() {
    if (discovering) return;
    
    discovering = true;
    console.log('Starting element discovery');
    
    // Initial discovery
    discoverElements();
    
    // Set up periodic discovery
    discoveryTimer = setInterval(discoverElements, DISCOVERY_INTERVAL);
}

function stopElementDiscovery() {
    if (discoveryTimer) {
        clearInterval(discoveryTimer);
        discoveryTimer = null;
    }
    discovering = false;
    console.log('Stopped element discovery');
}

function discoverElements() {
    const body = document.body;
    if (!body) return;
    
    // Get all elements and filter them immediately
    const newElements = Array.from(body.querySelectorAll(TEXT_SELECTORS))
        .filter(element => {
            // Generate a unique identifier for this element
            const elementId = element.tagName + 
                              (element.id ? '#' + element.id : '') + 
                              (element.className ? '.' + element.className.replace(/\s+/g, '.') : '') +
                              ':' + element.textContent.trim().substring(0, 20);
            
            // Skip if we've already seen this element
            if (seen.has(elementId)) {
                return false;
            }
            
            // Skip elements with children (non-leaf nodes)
            if (element.children.length > 0) {
                return false;
            }
            
            // Skip hidden elements
            const style = window.getComputedStyle(element);
            if (style.display === 'none' || style.visibility === 'hidden') {
                seen.add(elementId); // Mark as seen even if we're skipping
                return false;
            }
            
            // Skip empty elements
            const text = element.textContent.trim().replace(/\s+/g, ' ');
            if (!text) {
                seen.add(elementId); // Mark as seen even if we're skipping
                return false;
            }
            
            // Mark as seen and keep
            seen.add(elementId);
            return true;
        });
    
    if (newElements.length > 0) {
        console.log(`Discovered ${newElements.length} new elements to process`);
        allElementsToProcess.push(...newElements);
    }
}

// Main scanning function
async function scanPage() {
    console.clear();
    
    // Ensure we have elements to scan
    if (allElementsToProcess.length === 0) {
        console.log('No elements to scan. Discovering...');
        discoverElements();
        
        if (allElementsToProcess.length === 0) {
            console.log('Still no elements found to scan');
            return 0;
        }
    }
    
    // Get the next batch of elements to process
    const elements = allElementsToProcess.slice(index, index + MAX_ELEMENTS);
    console.log(`Processing ${elements.length} elements (starting at index ${index}, total discovered: ${allElementsToProcess.length})`);

    let processed = 0;
    let sentenceCount = 0;
    let elementsWithToxic = 0;
    
    // Process elements in batches of 10
    for (let i = 0; i < elements.length; i += 10) {
        const batch = elements.slice(i, i + 10);
        
        // Process all elements in current batch
        await Promise.all(batch.map(async (element) => {
            // Skip if the element is no longer in the DOM
            if (!element.isConnected) {
                return;
            }
            
            const text = element.textContent.trim().replace(/\s+/g, ' ');
            processed++;
            
            // Process text by sentences
            // Use lookahead regex to split at sentence boundaries but keep punctuation with sentences
            const sentences = text.split(/(?<=[.!?])\s+/);
            let newText = '';
            let hasToxic = false;
            
            // Check each sentence
            for (let j = 0; j < sentences.length; j++) {
                const sentence = sentences[j].trim();
                if (!sentence) continue;
                
                try {
                    // Check for toxicity and transform
                    const [transformed, isToxic] = await transformText(sentence);
                    
                    if (isToxic) {
                        hasToxic = true;
                        console.log(`Toxic content found: "${transformed}"`);
                        newText += transformed;
                    } else {
                        newText += sentence;
                    }
                    
                    // Add space between sentences if not the last one
                    if (j < sentences.length - 1) {
                        newText += " ";
                    }
                    
                    sentenceCount++;
                } catch (error) {
                    console.error('Error processing:', error);
                    newText += sentence + (j < sentences.length - 1 ? " " : "");
                }
            }
            
            // Update element if toxic content was found
            if (hasToxic && element.isConnected) {
                elementsWithToxic++;
                element.textContent = newText.trim();
                element.classList.add('toxic-filtered');
            }
        }));
    }
    
    // Update index for next scan (if needed)
    index += elements.length;
    
    console.log(`Processed ${processed} elements and ${sentenceCount} sentences`);
    console.log(`Found toxic content in ${elementsWithToxic} elements`);
    console.log(`Next scan will start at index ${index}`);
    
    return sentenceCount;
}

// Start the element discovery as soon as the script loads
window.addEventListener('load', startElementDiscovery);

const style = document.createElement('style');
style.textContent = `
  .toxic-filtered {
    background-color: yellow !important;
    color: black !important;
  }
`;
document.head.appendChild(style);

// Call the backend to transform text
async function transformText(text) {
    try {
        const response = await axios.post(`${BACKEND_URL}/transform-text`, { text: text });
        return [response.data.transformed, response.data.is_toxic];
    } catch (error) {
        return [text, false];
    }
}
