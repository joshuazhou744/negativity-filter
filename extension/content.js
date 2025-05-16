// content.js
// handles content of the page

// Firefox compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// configuration
const BACKEND_URL = 'configure me';
const TEXT_SELECTORS = "p, div, span, h1, h2, h3, h4, h5, h6, a, li, ol, ul, textarea, input, button, td, th, tr";
const MAX_ELEMENTS = 100;
const DISCOVERY_INTERVAL = 1000; // 1 second discovery interval

// states
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

// process messages from the popup
browserAPI.runtime.onMessage.addListener((request) => {
    if (request.action === 'scan' && !scanning) {
        // start scanning page
        scanning = true;
        browserAPI.runtime.sendMessage({ action: 'scan-started' });
        
        // discover elements until none left to discover
        if (!discovering) {
            startElementDiscovery();
        }
        
        // run scan and handle completion
        scanPage()
            .then(() => {
                console.log('Scan complete');
                browserAPI.runtime.sendMessage({ action: 'scan-finished' });
            })
            .catch(error => console.error('Scan error:', error))
            .finally(() => scanning = false);
    } else if (request.action === 'reset') {
        // reset index, seen set and elements to process
        index = 0;
        seen.clear();
        allElementsToProcess.length = 0;
        
        // restart discovery
        stopElementDiscovery();
        startElementDiscovery();
        
        console.log('Reset index and element tracking');
    } else if (request.action === 'clear-console') {
        // self-explanatory
        console.clear();
    }
});

// background task for element discovery
function startElementDiscovery() {
    if (discovering) return;
    
    discovering = true;
    console.log('Starting element discovery');
    
    // initial discovery
    discoverElements();
    
    // set up periodic discovery
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
    
    // get all elements and filter them
    const newElements = Array.from(body.querySelectorAll(TEXT_SELECTORS))
        .filter(element => {
            // generate a unique identifer
            const elementId = element.tagName + 
                              (element.id ? '#' + element.id : '') + 
                              (element.className ? '.' + element.className.replace(/\s+/g, '.') : '') +
                              ':' + element.textContent.trim().substring(0, 20);
            
            // skip if we've already seen this element
            if (seen.has(elementId)) {
                return false;
            }
            
            // skip elements with children (non-leaf nodes)
            if (element.children.length > 0) {
                return false;
            }
            
            // skip hidden elements
            const style = window.getComputedStyle(element);
            if (style.display === 'none' || style.visibility === 'hidden') {
                seen.add(elementId); // mark as seen even if we're skipping
                return false;
            }
            
            // skip empty elements
            const text = element.textContent.trim().replace(/\s+/g, ' ');
            if (!text) {
                seen.add(elementId); // mark as seen even if we're skipping
                return false;
            }
            
            // mark as seen and keep
            seen.add(elementId);
            return true;
        });
    
    // add new elements to all elements
    if (newElements.length > 0) {
        console.log(`Discovered ${newElements.length} new elements to process`);
        allElementsToProcess.push(...newElements);
    }
}

// page scanning function
async function scanPage() {
    console.clear();
    
    // ensure we have elements to scan
    if (allElementsToProcess.length === 0) {
        console.log('No elements to scan. Discovering...');
        discoverElements();
        
        if (allElementsToProcess.length === 0) {
            console.log('Still no elements found to scan');
            return 0;
        }
    }
    
    // get the next batch of elements to process
    const elements = allElementsToProcess.slice(index, index + MAX_ELEMENTS);
    console.log(`Processing ${elements.length} elements (starting at index ${index}, total discovered: ${allElementsToProcess.length})`);

    // scanning counters
    let processed = 0;
    let sentenceCount = 0;
    let elementsWithToxic = 0;
    
    // process elements in batches of 10
    for (let i = 0; i < elements.length; i += 10) {
        const batch = elements.slice(i, i + 10);
        
        // process all elements in current batch
        await Promise.all(batch.map(async (element) => {
            // skip if the element is no longer in the DOM
            if (!element.isConnected) {
                return;
            }
            
            // trim whitespace
            const text = element.textContent.trim().replace(/\s+/g, ' ');
            processed++;
            
           // split element text into sentences using lookahead regex
            const sentences = text.split(/(?<=[.!?])\s+/);
            let newText = '';
            let hasToxic = false;
            
            // scan each sentence
            for (let j = 0; j < sentences.length; j++) {
                const sentence = sentences[j].trim();
                if (!sentence) continue;
                
                try {
                    // scan for toxicity and transform if toxic
                    const [transformedSentence, isToxic] = await transformText(sentence);
                    
                    if (isToxic) {
                        hasToxic = true;
                        console.log(`Negative content found: "${transformedSentence}"`);
                        newText += transformedSentence;
                    } else {
                        newText += sentence;
                    }
                    
                    // add space after each sentence
                    newText += " ";
                    sentenceCount++;
                } catch (error) {
                    console.error('Error processing:', error);
                    newText += sentence + " ";
                }
            }
            
            // update element if toxic content was found and it exists in DOM
            if (hasToxic && element.isConnected) {
                elementsWithToxic++;
                element.textContent = newText.trim();
                element.classList.add('toxic-filtered');
            }
        }));
    }
    
    // update index for subsequent scans
    index += elements.length;
    
    // print scan information
    console.log(`Processed ${processed} elements and ${sentenceCount} sentences`);
    console.log(`Found toxic content in ${elementsWithToxic} elements`);
    console.log(`Next scan will start at index ${index}`);
    
    return sentenceCount;
}

// start the element discovery as soon as the script loads
window.addEventListener('load', startElementDiscovery);

// highlight transformed content
const style = document.createElement('style');
style.textContent = `
  .toxic-filtered {
    background-color: yellow !important;
    color: black !important;
  }
`;
document.head.appendChild(style);

// call the backend to transform text
async function transformText(text) {
    try {
        console.log('Sending request to:', `${BACKEND_URL}/transform-text`);
        const response = await axios.post(`${BACKEND_URL}/transform-text`, { text: text });
        console.log('Response:', response.data);
        return [response.data.transformed, response.data.is_toxic];
    } catch (error) {
        return [text, false];
    }
}
