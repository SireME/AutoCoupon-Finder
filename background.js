// Step 1: Listen for tab updates and execute the content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
      if (tab.url.startsWith("chrome://")) {
          console.log("Ignoring chrome:// URL");
          return;
      }

      // Execute the content script
      chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['contentScript.js']
      });
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchCoupons") {
      console.log("Received request to fetch coupons from:", sender.tab.url);

      fetchCouponsFromGoogle(sender.tab.url)  // Fetch coupons from Google Search
          .then(coupons => {
              console.log("Coupons fetched successfully:", coupons);
              sendResponse({ success: true, coupons: coupons });
          })
          .catch(error => {
              console.error("Error fetching coupons:", error);
              sendResponse({ success: false, error: error.message });
          });

      return true; // Indicates async response
  }
});

// Step 2: Function to perform Google Search
async function performGoogleSearch(query) {
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  try {
      const response = await fetch(searchUrl, {
          method: 'GET',
          headers: {
              'Content-Type': 'text/html',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
      });

      if (response.ok) {
          const html = await response.text();
          return html;
      } else {
          console.error("Error fetching Google search results:", response.statusText);
          return '';
      }
  } catch (error) {
      console.error("Error performing Google search:", error);
      return '';
  }
}

// Step 3: Extract text from Google search results
function extractGoogleResults(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const searchResults = [];
  const elements = doc.querySelectorAll('div.BNeawe.s3v9rd.AP7Wnd'); // Adjust the selector to match Google's search result format

  elements.forEach(element => {
      const snippet = element.innerText;
      if (snippet) {
          searchResults.push(snippet);
      }
  });

  return searchResults.join(' '); // Return combined snippets as a single text
}

// Step 4: Fetch coupons from search query
async function fetchCouponsFromGoogle(url) {
  try {
      const searchHtml = await performGoogleSearch(`coupons for site: ${url}`);
      //console.log(searchHtml);
      if (!searchHtml) {
          console.error("No search results found");
          return [];
      }

      // Send the search HTML to the content script for parsing
      const searchText = await new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "parseSearchResults", html: searchHtml }, (response) => {
                    if (response && response.success) {
                        resolve(response.coupons); // Resolve with the parsed coupons
                    } else {
                        resolve([]); // Resolve with an empty array if no coupons are found
                    }
                });
            } else {
                resolve([]); // Resolve with an empty array if no tabs are found
            }
        });
    });
      
    console.log(`Extraction from content script:\n ${searchText}`);
      
    // Step 5: Send extracted text to Groq API for coupon extraction
    const coupons = await sendToGroqAPI(searchText);
    return coupons.length ? coupons : []; // Return structured coupons or empty array

  } catch (error) {
      console.error("Error in coupon fetching process:", error);
      return [];
  }
}

// Step 6: Function to send extracted text to Groq API
async function sendToGroqAPI(text) {
  const response = await fetch('https://api.groq.com/chat/completions', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}` // Securely fetch the API key
      },
      body: JSON.stringify({
          messages: [{
              role: "user",
              content: `
                  Extract all coupon codes from the following text. 
                  Each coupon code is a string, typically consisting of uppercase letters and numbers. 
                  Please return the result as a JSON array of objects, where each object contains:
                  
                  - code: The coupon code string (e.g., "SAVE10")
                  - description: A brief description of the coupon (e.g., "Save 10% on your next purchase")

                  If no coupon codes are found, return an empty array: [].

                  Here is the text to process: 
                  ${text}

                  Example output:
                  [
                      {
                          "code": "SAVE10",
                          "description": "Save 10% on your next purchase"
                      },
                      {
                          "code": "FREESHIP",
                          "description": "Free shipping on orders over $50"
                      }
                  ]
              `
          }],
          model: "llama3-8b-8192"
      })
  });

  if (response.ok) {
      const jsonResponse = await response.json();
      return jsonResponse.choices.map(choice => choice.message.content); // Extract coupon codes
  } else {
      console.error("Error fetching from Groq API:", response.statusText);
      return [];
  }
}
