//this condition ensures the content script runs only in the top iframe window
if (window.top === window.self) {
  // this conditional ensures the content script runs only once
  if (!window.contentScriptLoaded) {
    window.contentScriptLoaded = true;

    // Initial test alert to confirm the content script has been loaded (optional)
    //alert("This is a test run");

    // Function to check if the current webpage is an ecommerce site
    function isEcommerceSite() {
      /**
       * Check if the page contains keywords associated with ecommerce sites
       * @returns {boolean} True if the page appears to be an ecommerce site, false otherwise
       */
      const keywords = [
        //common
        "checkout", "add to cart", "buy now", "subscribe",

        // Promotional Keywords
        "sale", "50% off sale", "holiday sale", "discount", "exclusive discount", 
        "get 20% off", "deal", "best deals", "hot deals today", "special offer", 
        "limited-time offer", "special bundle", "clearance", "clearance sale", 
        "end of season clearance", "free", "free shipping", "buy one get one free", 
        "coupon", "use this coupon code", "bargain", "bargain prices", 
        "unbeatable bargains",
    
        // Product-Specific Keywords
        "buy [product]", "buy laptop online", "buy organic skincare", 
        "shop", "shop fashion", "shop electronics", "best [product]", 
        "best gaming chairs", "best mobile phones", "[product] for sale", 
        "designer shoes for sale", "furniture for sale", "affordable", 
        "affordable luxury", "affordable gadgets", "luxury", "luxury handbags", 
        "luxury watches", "new", "new arrivals", "newest trends", "top-rated", 
        "top-rated electronics", "top-rated home appliances",
    
        // Urgency-Based Keywords
        "limited-time", "limited-time offer", "limited stock available", "hurry", 
        "hurry, while supplies last", "last chance", "last chance to save", 
        "last chance to buy", "today only", "today only deals", 
        "exclusive today-only offer", "now", "shop now", "act now", 
        "ends soon", "sale ends soon", "offer ends soon", "don't miss out", 
        "don’t miss out on this deal", "exclusive", "exclusive sale", 
        "exclusive access",
    
        // Customer-Focused Keywords
        "best-seller", "our best-selling product", "customer favorite", "popular", 
        "popular choice", "trending now", "guaranteed", "satisfaction guaranteed", 
        "money-back guarantee", "customer reviews", "top customer reviews", 
        "rated 5 stars", "trusted", "trusted by thousands", "trusted quality", 
        "recommended", "highly recommended by experts", "recommended by users", 
        "premium", "premium quality", "premium materials", "eco-friendly", 
        "eco-friendly packaging", "sustainable products",
    
        // Convenience/Service-Oriented Keywords
        "free shipping", "free shipping on all orders", "free delivery worldwide", 
        "easy returns", "hassle-free returns", "free returns within 30 days", 
        "24/7 support", "24/7 customer support", "live chat available", 
        "fast delivery", "next-day delivery", "same-day shipping", 
        "secure checkout", "secure payment options", "secure checkout guaranteed", 
        "no hidden fees", "transparent pricing", "no hidden costs", 
        "warranty", "one-year warranty", "lifetime warranty included",
    
        // Location-Based Keywords
        "[product] near me", "flower delivery near me", "clothing stores near me", 
        "[city/region] [product]", "New York furniture stores", "California wine shop", 
        "local", "support local businesses", "local delivery available", 
        "in-store", "in-store pickup", "visit our store in [location]",
    
        // Action-Oriented Keywords
        "buy now", "buy now and save", "buy now with free shipping", 
        "shop now", "shop now for discounts", "shop now before it's too late", 
        "add to cart", "add to cart for instant savings", "order today", 
        "order today for fast shipping", "claim", "claim your discount", 
        "claim your free gift", "get started", "get started with your subscription", 
        "sign up", "sign up for exclusive offers", "subscribe", 
        "subscribe and save", "subscribe for updates",
    
        // Comparison/Competitive Keywords
        "cheaper", "cheaper than competitors", "lowest price guarantee", 
        "better", "better quality", "better than [brand]", "best value", 
        "best value for money", "best deal available", "compared to", 
        "compare to [product]", "compared to [brand]",
    
        // Seasonal Keywords
        "Black Friday", "Black Friday deals", "Black Friday sales event", 
        "Cyber Monday", "Cyber Monday savings", "Christmas", 
        "Christmas gift ideas", "Christmas sale", "summer sale", 
        "summer clearance", "summer specials", "back to school", 
        "back to school sale", "back to school deals"
    ];

      // Check if the body text or clickable elements contain any ecommerce-related keywords
      const keywordFound = keywords.some(
        (keyword) =>
          document.body.innerText.toLowerCase().includes(keyword) ||
          Array.from(document.querySelectorAll("button, a")).some((el) =>
            el.textContent.toLowerCase().includes(keyword)
          )
      );

      return keywordFound;
    }

    // Function to handle the coupon fetching process
    function initiateCouponSearch() {
      try {
        if (isEcommerceSite()) {
          console.log(
            "Ecommerce site detected, sending message to background script to fetch coupons"
          );

          // Send a message to the background script to initiate coupon search
          chrome.runtime.sendMessage({ action: "fetchCoupons" }, (response) => {
            if (chrome.runtime.lastError) {
              console.error(
                "Error sending message:",
                chrome.runtime.lastError.message
              );
            } else if (
              response &&
              response.success &&
              Array.isArray(response.coupons)
            ) {
              console.log("Message sent successfully", response);
              displayCouponNotification(response.coupons);
            }
          });
        } else {
          console.log("Not an ecommerce site, no action taken.");
        }
      } catch (error) {
        console.error(
          "An error occurred while checking the ecommerce site:",
          error
        );
      }
    }

    // Handle pages where content is loaded dynamically (e.g., AJAX)
    function observeForDynamicChanges() {
      const observer = new MutationObserver(() => {
        if (isEcommerceSite()) {
          // Stop observing once we detect an ecommerce site
          observer.disconnect();
          initiateCouponSearch();
        }
      });

      // Observe the entire body for changes in child elements (useful for dynamically loaded content)
      observer.observe(document.body, { childList: true, subtree: true });

      // Also run the check immediately in case the page is already loaded
      initiateCouponSearch();
    }

    // Start observing for changes on the webpage
    observeForDynamicChanges();

    console.log("Content script running only once");
  }

  console.log("Content script running in top window");
}

// Function to display the notification for detected coupons
function displayCouponNotification(coupons) {
  // Create notification element
  const notification = document.createElement("div");
  notification.style.position = "fixed";
  notification.style.bottom = "20px";
  notification.style.left = "20px";
  notification.style.backgroundColor = "#4CAF50"; // Green background
  notification.style.color = "white";
  notification.style.padding = "10px";
  notification.style.borderRadius = "5px";
  notification.style.zIndex = "9999";
  notification.style.cursor = "pointer";
  notification.innerText = "COUPONS DETECTED! CLICK TO SEE COUPONS";

  // Append to body
  document.body.appendChild(notification);

  // On click, create the coupon table
  notification.onclick = function () {
    createCouponTable(coupons);
    document.body.removeChild(notification); // Remove notification after click
  };
}

// Function to create and display the coupon table
function createCouponTable(coupons) {
  const couponTable = document.createElement("div");
  couponTable.style.position = "fixed";
  couponTable.style.bottom = "60px"; // Adjusted to show above the notification
  couponTable.style.left = "20px";
  couponTable.style.backgroundColor = "#fff";
  couponTable.style.border = "1px solid #ccc";
  couponTable.style.borderRadius = "5px";
  couponTable.style.padding = "10px";
  couponTable.style.zIndex = "9999";
  couponTable.style.maxHeight = "300px"; // Limit height
  couponTable.style.overflowY = "auto"; // Add scroll if needed

  // Create table element
  const table = document.createElement("table");
  const headerRow = document.createElement("tr");
  const headerCell1 = document.createElement("th");
  headerCell1.textContent = "Coupon Code  ";
  const headerCell2 = document.createElement("th");
  headerCell2.textContent = "Description";

  headerRow.appendChild(headerCell1);
  headerRow.appendChild(headerCell2);
  table.appendChild(headerRow);

  // Populate the table with coupon data
  coupons.forEach((coupon) => {
    const row = document.createElement("tr");
    const couponCell = document.createElement("td");
    couponCell.textContent = coupon.code; // Access coupon code
    const descriptionCell = document.createElement("td");
    descriptionCell.textContent = coupon.description; // Access description

    row.appendChild(couponCell);
    row.appendChild(descriptionCell);
    table.appendChild(row);
  });

  couponTable.appendChild(table);
  document.body.appendChild(couponTable);

  // Optional: Add close button to remove table
  const closeButton = document.createElement("button");
  closeButton.innerText = "Close";
  closeButton.style.marginTop = "10px";
  closeButton.onclick = function () {
    document.body.removeChild(couponTable);
  };
  couponTable.appendChild(closeButton);
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "parseSearchResults") {
    //console.log(`what is to be parsedresults:  ${request.html}`);
    const coupons = extractGoogleResults(request.html);
    console.log(
      `where we parse search results in contenscript results:\n  ${coupons}`
    );
    sendResponse({ success: true, coupons: coupons });
  }
});

// Extract text from Google results
function extractGoogleResults(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const searchResults = [];
  const elements = doc.querySelectorAll("div.g"); // Select Google search result elements

  elements.forEach((element) => {
    const snippet = element.innerText; // Get the inner text of each result
    if (snippet) {
      searchResults.push(snippet); // Add the snippet to the results array
    }
  });

  return searchResults; // Return an array of snippets
}
