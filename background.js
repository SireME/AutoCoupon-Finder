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
    alert("tab succesfully changed")


    if (changeInfo.status === 'complete') {
      /**
       * Execute the content script to start searching for coupons on the current webpage
       * @param {object} target - Target details for executing the script
       * @param {string[]} files - Array of file paths to execute
       */
      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['contentScript.js']
      });
    }
  });