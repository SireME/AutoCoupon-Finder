/**
 * This script checks if the current webpage is an ecommerce site and sends a message to the background script to fetch coupons.
 * It uses keywords associated with ecommerce sites to determine if coupon searching should be initiated.
 */
const isEcommerceSite = () => {
    /**
     * Check if the page contains keywords associated with ecommerce sites
     * @returns {boolean} True if the page appears to be an ecommerce site, false otherwise
     */
    const keywords = ["checkout", "add to cart", "buy now", "subscribe"];
    return keywords.some(keyword => document.body.innerText.toLowerCase().includes(keyword));
  };
  
  if (isEcommerceSite()) {
    /**
     * Send a message to the background script to initiate the coupon search process
     * @param {object} message - The message to send to the background script
     */
    chrome.runtime.sendMessage({action: 'fetchCoupons'});
  }