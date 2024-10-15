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

      fetchCouponsFromSearch(request.query)  // Make sure to send the query in the request
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

// Step 2: Function to perform DuckDuckGo search
async function performDuckDuckGoSearch(query) {
  const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&kl=us-en`;

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
          console.error("Error fetching search results:", response.statusText);
          return '';
      }
  } catch (error) {
      console.error("Error performing DuckDuckGo search:", error);
      return '';
  }
}

// Step 3: Extract text from DuckDuckGo results
function extractDuckDuckGoResults(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const searchResults = [];
  const elements = doc.querySelectorAll('div.result__body');

  elements.forEach(element => {
      const snippet = element.innerText;
      if (snippet) {
          searchResults.push(snippet);
      }
  });

  return searchResults.join(' '); // Return combined snippets as a single text
}

// Step 4: Fetch coupons from search query
async function fetchCouponsFromSearch(query) {
  try {
      const searchHtml = await performDuckDuckGoSearch(query);

      if (!searchHtml) {
          console.error("No search results found");
          return [];
      }

      const searchText = extractDuckDuckGoResults(searchHtml);
      console.log("Search text extracted:", searchText);

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
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}` // Ensure the API key is secure
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
