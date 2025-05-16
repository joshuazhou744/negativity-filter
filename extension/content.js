// content.js
// handles content of the page

// configuration
const BACKEND_URL = 'configure me';
const TEXT_SELECTORS = "p, div, span, h1, h2, h3, h4, h5, h6, a, li, ol, ul, textarea, input, button, td, th, tr";
const MAX_ELEMENTS = 100;
const DISCOVERY_INTERVAL = 1000;

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
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'scan' && !scanning) {
        // TODO: start scanning page
       
        // TODO: discover elements until none left to discover
        
        // TODO: run scan and handle completion
        
    } else if (request.action === 'reset') {
        // TODO: reset index, seen set and elements to process
        
        // TODO: restart discovery
        
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
    
    // TODO: get all elements and filter them
    
    // TODO: add new elements to all elements
}

// page scanning function
async function scanPage() {
    // clear console before scan
    console.clear();
    
    // TODO: ensure we have elements to scan
    
    // TODO: get the next batch of elements to process

    // scanning counters
    let processed = 0;
    let sentenceCount = 0;
    let elementsWithToxic = 0;
    
    // TODO: process elements in batches of 10
    
    // TODO: update index for subsequent scans
    
    // print scan information
    console.log(`Processed ${processed} elements and ${sentenceCount} sentences`);
    console.log(`Found toxic content in ${elementsWithToxic} elements`);
    console.log(`Next scan will start at index ${index}`);
    
    return sentenceCount;
}

// start the element discovery as soon as the script loads
window.addEventListener('load', startElementDiscovery);

// highlight transformed content style
const style = document.createElement('style');
style.textContent = `
  .toxic-filtered {
    background-color: yellow !important;
    color: black !important;
  }
`;
document.head.appendChild(style);

// transform text function
async function transformText(text) {
    // TODO: call the backend to transform text using axios
}