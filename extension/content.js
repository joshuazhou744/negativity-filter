// content.js

// Configuration
const BACKEND_URL = 'http://localhost:8000';
const TEXT_SELECTORS = "p, div, span, h1, h2, h3, h4, h5, h6, a, li, ol, ul, textarea, input, button, td, th, tr";
const MAX_ELEMENTS = 300;
const seen = new Set();
let scanning = false;
let index = 0;

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
        
        // Run scan and handle completion
        scanPage()
            .then(() => {
                console.log('Scan complete');
                chrome.runtime.sendMessage({ action: 'scan-finished' });
            })
            .catch(error => console.error('Scan error:', error))
            .finally(() => scanning = false);
    }
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'reset') {
        index = 0;
        seen.clear();
        console.log('Reset index and seen set');
    }
});

// Main scanning function
async function scanPage() {
    console.clear();
    
    // Find elements to scan
    const body = document.body;
    if (!body) return 0;
    
    const allElements = Array.from(body.querySelectorAll(TEXT_SELECTORS));
    const elements = allElements.slice(index, index + MAX_ELEMENTS);
    console.log(`Found ${elements.length} elements to scan (starting at index ${index}, total on page: ${allElements.length})`);

    let processed = 0;
    let sentenceCount = 0;
    let elementsWithToxic = 0;
    
    // Process elements in batches of 10
    for (let i = 0; i < elements.length; i += 10) {
        const batch = elements.slice(i, i + 10);
        
        // Process all elements in current batch
        await Promise.all(batch.map(async (element) => {
            // Skip elements that aren't good candidates
            if (element.children.length > 0) {
                return;
            }
            
            const style = window.getComputedStyle(element);
            if (style.display === 'none' || style.visibility === 'hidden') {
                return;
            }
            
            const text = element.textContent.trim().replace(/\s+/g, ' ');
            if (!text) {
                return;
            }
            
            if (seen.has(text)) {
                return;
            }
            
            seen.add(text);
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
            if (hasToxic) {
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
        console.error('Backend error:', error);
        return [text, false];
    }
}
