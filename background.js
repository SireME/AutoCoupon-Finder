/**
 * This script listens for tab updates and executes the content script when a tab becomes complete.
 * It uses the Chrome API to monitor tab status changes and trigger the coupon search process.
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    /**
     * Check if the tab update is complete
     * @param {number} tabId - The ID of the tab being updated
     * @param {object} changeInfo - Information about the change
     * @param {object} tab - Details about the tab
     * @returns {boolean} True if the tab update is complete, false otherwise
     */

    // test
    console.log(`tab succesfully changed with ID: ${tabId}`);


    if (changeInfo.status === 'complete' && tab.url) {
      /**
       * Execute the content script to start searching for coupons on the current webpage
       * @param {object} target - Target details for executing the script
       * @param {string[]} files - Array of file paths to execute
       */
    // Ignore chrome:// URLs
    if (tab.url.startsWith("chrome://")) {
    console.log("Ignoring chrome:// URL");
    return;
    }

      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['contentScript.js']
      });
    }
  });


  // Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchCoupons") {
    console.log("Received request to fetch coupons from:", sender.tab.url);

    // Simulated coupon fetching process (you can replace this with an actual API call)
    fetchCoupons()
      .then(coupons => {
        console.log("Coupons fetched successfully:", coupons);
        // Send the fetched coupons back as the response
        sendResponse({ success: true, coupons: coupons });
      })
      .catch(error => {
        console.error("Error fetching coupons:", error);
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate that we will send a response asynchronously
    return true; 
  }
});

// Example function to simulate fetching coupons from an API
async function fetchCoupons() {
  // Here, you could make an actual API call using fetch or XMLHttpRequest
  // For demonstration purposes, we return a static array of coupons
  return new Promise((resolve, reject) => {
    // Simulate a network request delay
    setTimeout(() => {
      const coupons = [
        { code: "SAVE10", description: "Save 10% on your next purchase" },
        { code: "FREESHIP", description: "Free shipping on orders over $50" },
      ];
      resolve(coupons);
    }, 2000); // Simulate 2 seconds delay
  });
}


//function to perform duckduckgo search and return results for processing
async function performDuckDuckGoSearch(query) {
  const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&kl=us-en`; // Forces English search results

  try {
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' // A typical user agent
      }
    });

    if (response.ok) {
      const html = await response.text();
      return html; // Return the raw HTML
    } else {
      console.error("Error fetching search results:", response.statusText);
      return ''; // Return an empty string on failure
    }
  } catch (error) {
    console.error("Error performing DuckDuckGo search:", error);
    return ''; // Return empty string if there's an error
  }
}
