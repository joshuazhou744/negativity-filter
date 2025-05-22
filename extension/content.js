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

// generate a common identifier for the element
function getElementId(element) {
    // add position-based identification for elements without stable identifiers
    if (!element.id && !element.className) {
        const parent = element.parentElement;
        const index = parent ? Array.from(parent.children).indexOf(element) : -1;
        return `${baseId}:nth-child(${index})`;
    }
    // use only stable properties that won't change after transformation (id and className without toxic-filtered class)
    const baseId = element.tagName + 
           (element.id ? '#' + element.id : '') +
           // remove toxic-filtered class
           (element.className ? '.' + element.className.replace('toxic-filtered', '').trim().replace(/\s+/g, '.') : '');
    
    return baseId;
}

// state management and logging for starting a scan
async function startScan() {
    // TODO: start the scan
}

// actual scanning of the page
async function scanPage() {
    // TODO: scan the page
}

// process a batch of elements for scanning
async function processBatch(elements, stats) {
    // TODO: process a batch of elements
}

// process the text of an element for scanning
async function processText(text) {
    // TODO: process the text of an element after splitting it into sentences
}

// update the element with the new text
function updateElement(element, newText) {
    // TODO: update the element in DOM with the new text
}

// log the stats of the scan
function logStats(stats) {
    // TODO: log the stats of the scan
}

// reset all states on reload
async function resetState() {
    
}

// reset the scanning states on reload
async function resetScanState() {
    // TODO: reset the scanning states on reload
}

// TODO: initialize and inject the style for transformed content

// backend communication for transforming text
async function transformText(text) {
    // TODO: communicate with the backend to transform the text
}

function main() {
    // TODO: prevent multiple injections of content.js

    // TODO: start discovery on load

    const messageListener = (request) => {
        // TODO: handle the message
    };

    chrome.runtime.onMessage.addListener(messageListener);
}

main();