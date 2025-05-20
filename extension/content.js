// content.js
// handles content scanning and element discovery on the page

const CONFIG = {
    BACKEND_URL: 'configure me',
    TEXT_SELECTORS: "p, div, span, h1, h2, h3, h4, h5, h6, a, li, ol, ul, textarea, input, button, td, th, tr",
    MAX_ELEMENTS: 100,
    DISCOVERY_INTERVAL: 1000
};

// prevent multiple injections of content.js
if (window.__toxicityFilterInjected) {
    console.log("Toxicity filter already injected");
}
window.__toxicityFilterInjected = true;

// state management for logging and debugging
const state = {
    seen: new Set(),
    elementsToProcess: [],
    scanning: false,
    discovering: false,
    currentIndex: 0,
    discoveryTimer: null
};

// message handling
chrome.runtime.onMessage.addListener((request) => {
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
});

// continuous element discovery functions
function startElementDiscovery() {
    if (state.discovering) return;
    
    state.discovering = true;
    console.log('Starting element discovery');
    
    discoverElements();
    state.discoveryTimer = setInterval(discoverElements, CONFIG.DISCOVERY_INTERVAL);
}

function stopElementDiscovery() {
    if (state.discoveryTimer) {
        clearInterval(state.discoveryTimer);
        state.discoveryTimer = null;
    }
    state.discovering = false;
}

function discoverElements() {
    if (!document.body) return;
    
    const newElements = Array.from(document.body.querySelectorAll(CONFIG.TEXT_SELECTORS))
        .filter(element => {
            if (!isValidElement(element)) return false;
            
            const elementId = getElementId(element);
            if (state.seen.has(elementId)) return false;
            
            state.seen.add(elementId);
            return true;
        });
    
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

// generate a unique id for the element
function getElementId(element) {
    return element.tagName + 
           (element.id ? '#' + element.id : '') + 
           (element.className ? '.' + element.className.replace(/\s+/g, '.') : '') +
           ':' + element.textContent.trim().substring(0, 20);
}

// state management and logging for starting a scan
async function startScan() {
    console.clear();
    state.scanning = true;
    chrome.runtime.sendMessage({ action: 'scan-started' });
    
    if (!state.discovering) {
        startElementDiscovery();
    }
    
    try {
        await scanPage();
        console.log('Scan complete');
    } catch (error) {
        console.error('Scan error:', error);
    } finally {
        state.scanning = false;
        chrome.runtime.sendMessage({ action: 'scan-finished' });
    }
}

// actual scanning of the page
async function scanPage() {
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

    let stats = { processed: 0, sentences: 0, toxic: 0 };
    
    // process elements in batches of 10
    for (let i = 0; i < elements.length; i += 10) {
        const batch = elements.slice(i, i + 10);
        await processBatch(batch, stats);
    }
    
    state.currentIndex += elements.length;
    logStats(stats);
}

// process a batch of elements for scanning
async function processBatch(elements, stats) {
    await Promise.all(elements.map(async (element) => {
        if (!element.isConnected) return;
        
        const text = element.textContent.trim().replace(/\s+/g, ' ');
        stats.processed++;
        
        const [newText, hasToxic, sentenceCount] = await processText(text);
        
        stats.sentences += sentenceCount;
        if (hasToxic) {
            stats.toxic++;
            updateElement(element, newText);
        }
    }));
}

// process the text of an element for scanning
async function processText(text) {
    const sentences = text.split(/(?<=[.!?])\s+/);
    let newText = '';
    let hasToxic = false;
    let sentenceCount = 0;
    
    for (const sentence of sentences) {
        if (!sentence.trim()) continue;
        
        try {
            const [transformed, isToxic] = await transformText(sentence);
            newText += transformed + ' ';
            hasToxic = hasToxic || isToxic;
            sentenceCount++;
        } catch (error) {
            console.error('Error processing sentence:', error);
            newText += sentence + ' ';
        }
    }
    
    return [newText.trim(), hasToxic, sentenceCount];
}

// update the element with the new text
function updateElement(element, newText) {
    if (element.isConnected) {
        element.textContent = newText;
        element.classList.add('toxic-filtered');
    }
}

// log the stats of the scan
function logStats(stats) {
    console.log(`Processed ${stats.processed} elements and ${stats.sentences} sentences`);
    console.log(`Found toxic content in ${stats.toxic} elements`);
    console.log(`Next scan will start at index ${state.currentIndex}`);
}

// reset the state of the scan
function resetState() {
    state.currentIndex = 0;
    state.seen.clear();
    state.elementsToProcess.length = 0;
    stopElementDiscovery();
    startElementDiscovery();
}

// initialize and inject the style for transformed content
const style = document.createElement('style');
style.textContent = 
`.toxic-filtered { 
background-color: yellow !important; color: black !important; 
}`
document.head.appendChild(style);

// start discovery on load
window.addEventListener('load', startElementDiscovery);

// backend communication for transforming text
async function transformText(text) {
    try {
        const response = await axios.post(`${CONFIG.BACKEND_URL}/transform-text`, { text });
        return [response.data.transformed, response.data.is_toxic];
    } catch (error) {
        return [text, false];
    }
}