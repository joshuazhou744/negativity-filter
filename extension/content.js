// content.js
// handles content scanning and element discovery on the page

// configuration for global constants
const CONFIG = {
    BACKEND_URL: 'configure me',
    TEXT_SELECTORS: "p, div, span, h1, h2, h3, h4, h5, h6, a, li, ol, ul, textarea, input, button, td, th, tr",
    MAX_ELEMENTS: 100,
    DISCOVERY_INTERVAL: 5000, // 5 seconds
    BATCH_SIZE: 10
};   

// state management for logging and debugging
const state = {
    seen: new Set(),
    elementsToProcess: [],
    scanning: false,
    discovering: false,
    currentIndex: 0,
    discoveryTimer: null
};

/* element discovery functions */

function startElementDiscovery() {
    // prevent multiple discoveries
    if (state.discovering) return;
    
    state.discovering = true;
    console.log('Starting element discovery');
    
    discoverElements();
    // start the periodic discovery timer
    state.discoveryTimer = setInterval(discoverElements, CONFIG.DISCOVERY_INTERVAL);
}

function stopElementDiscovery() {
    if (state.discoveryTimer) {
        // stop and disable the periodic discovery timer
        clearInterval(state.discoveryTimer);
        state.discoveryTimer = null;
    }
    state.discovering = false;
}

function discoverElements() {
    // skip if the document body is not available
    if (!document.body) return;
    
    // get new elements to process
    const newElements = Array.from(document.body.querySelectorAll(CONFIG.TEXT_SELECTORS))
        .filter(element => {
            // skip if the element is not valid
            if (!isValidElement(element)) return false;
            
            // skip if the element has already been seen
            const elementId = getElementId(element);
            if (state.seen.has(elementId)) return false;
            
            state.seen.add(elementId);
            return true;
        });
    
    // add new elements to the list of elements to process
    if (newElements.length > 0) {
        console.log(`Discovered ${newElements.length} new elements`);
        state.elementsToProcess.push(...newElements);
    }
}

// check if the element is valid
function isValidElement(element) {
    // skip non-leaf nodes
    if (element.children.length > 0) return false;
    
    // skip hidden elements
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    
    // skip empty elements
    const text = element.textContent.trim();
    return text.length > 0;
}

// generate an id for the element, identical elements will have the same id
function getElementId(element) {
    return element.tagName + 
           (element.id ? '#' + element.id : '') + 
           (element.className ? '.' + element.className.replace(/\s+/g, '.') : '') +
           ':' + element.textContent.trim().substring(0, 20);
}

// state management and logging for starting a scan
async function startScan() {
    if (state.scanning) return;
    
    try {
        state.scanning = true;
        // notify popup that scanning has started
        if (chrome.runtime?.id) {
            chrome.runtime.sendMessage({ action: 'scan-started' });
        }
        
        if (!state.discovering) {
            startElementDiscovery();
        }
        
        await scanPage();
        console.log('Scan complete');
    } catch (error) {
        console.error('Scan error:', error);
    } finally {
        // always attempt to reset state, even if extension context is invalid
        await resetScanState();
    }
}

// actual scanning of the page
async function scanPage() {
    console.clear();
    if (state.elementsToProcess.length === 0) {
        discoverElements();
        if (state.elementsToProcess.length === 0) {
            console.log('No elements found to scan');
            return;
        }
    }

    const elements = state.elementsToProcess.slice(
        state.currentIndex, 
        state.currentIndex + CONFIG.MAX_ELEMENTS
    );

    console.log(`Processing ${elements.length} elements (index: ${state.currentIndex}, total: ${state.elementsToProcess.length})`);
    let stats = { processed: 0, toxic: 0 };
    
    // process elements in batches of 10
    for (let i = 0; i < elements.length; i += CONFIG.BATCH_SIZE) {
        const batch = elements.slice(i, i + CONFIG.BATCH_SIZE);
        await processBatch(batch, stats);
    }
    
    state.currentIndex += elements.length;
    logStats(stats);
}

// process a batch of elements for scanning
async function processBatch(elements, stats) {
    // process each element in the batch in parallel
    await Promise.all(elements.map(async (element) => {
        // check if the element is still connected to the DOM
        if (!element.isConnected) return;
        
        const text = element.textContent.trim().replace(/\s+/g, ' ');
        stats.processed++;
        
        const [newText, hasToxic] = await processText(text);
        
        if (hasToxic) {
            stats.toxic++;
            updateElement(element, newText);
        }
    }));
}

// log the stats of the scan
function logStats(stats) {
    console.log(`Processed ${stats.processed} elements`);
    console.log(`Found toxic content in ${stats.toxic} elements`);
    console.log(`Next scan will start at index ${state.currentIndex}`);
}

// process the text of an element for scanning
async function processText(text) {
    const sentences = text.split(/(?<=[.!?])\s+/);
    let newText = '';
    let hasToxic = false;
    
    // process each sentence in the element sequentially
    for (const sentence of sentences) {
        if (!sentence.trim()) continue;
        
        try {
            const [transformed, isToxic] = await transformText(sentence);
            newText += transformed + ' ';
            hasToxic = hasToxic || isToxic;
        } catch (error) {
            console.error('Error processing sentence:', error);
            newText += sentence + ' ';
        }
    }
    
    return [newText.trim(), hasToxic];
}

// update the element with the new text
function updateElement(element, newText) {
    if (element.isConnected) {
        element.textContent = newText;
        element.classList.add('toxic-transformed');
    }
}

// backend communication for transforming text
async function transformText(text) {
    try {
        const response = await axios.post(`${CONFIG.BACKEND_URL}/transform-text`, { text: text });
        return [response.data.transformed, response.data.is_toxic];
    } catch (error) {
        return [text, false];
    }
}

// reset all states on reload
async function resetState() {
    state.currentIndex = 0;
    state.seen.clear();
    state.elementsToProcess.length = 0;
    stopElementDiscovery();
    startElementDiscovery();
    resetScanState();
}

// reset the scanning states on reload
async function resetScanState() {
    state.scanning = false;
    try {
        if (chrome.runtime?.id) {
            // reset scanning state in local tab storage
            await chrome.storage.local.set({ isScanning: false });
            // notify popup that scanning has been reset
            chrome.runtime.sendMessage({ action: 'scan-finished' });
        }
    } catch (error) {
        console.error('Extension context changed, local state reset only', error);
    }
}

// message handling
const messageListener = (request) => {
    // check if extension is still valid, if not, remove the listener
    if (!chrome.runtime?.id) {
        chrome.runtime.onMessage.removeListener(messageListener);
        return;
    }

    switch (request.action) {
        case 'scan':
            if (!state.scanning) {
                startScan();
            }
            break;
        case 'reset':
            resetState();
            break;
        case 'clear-console':
            console.clear();
            break;
    }
};

function main() {
    // prevent multiple injections of content.js
    if (window.__toxicityFilterInjected) {
        console.log("Toxicity filter already injected");
        return;
    } else {
        window.__toxicityFilterInjected = true;
    }

    // initialize and inject the style for transformed content
    const style = document.createElement('style');
    style.textContent = 
    `.toxic-transformed { 
    background-color: yellow !important; color: black !important; 
    }`
    document.head.appendChild(style);

    // start discovery on load
    window.addEventListener('load', startElementDiscovery);

    // add message listener
    chrome.runtime.onMessage.addListener(messageListener);
}

main();