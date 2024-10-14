chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'displayCoupons') {
      const couponList = message.coupons.map(coupon => `<li>${coupon}</li>`).join('');
      document.getElementById('couponCodes').innerHTML = couponList;
    }
  });
  