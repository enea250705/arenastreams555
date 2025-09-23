const puppeteer = require('puppeteer');

async function viewFrontend() {
  console.log('Starting Puppeteer to view frontend...');
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: false, // Show browser window
    defaultViewport: null,
    args: ['--start-maximized']
  });

  console.log('Browser launched successfully!');
  
  // Create a new page
  const page = await browser.newPage();
  
  // Navigate to our local server
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  console.log('Frontend loaded successfully!');
  
  // Take a screenshot
  await page.screenshot({ 
    path: 'frontend-view.png',
    fullPage: true 
  });
  
  console.log('Screenshot saved as frontend-view.png');
  
  // Keep the browser open so we can see it
  console.log('Browser will stay open. Close it manually when done viewing.');
  
  // Don't close the browser automatically
  // await browser.close();
}

// Run the function
viewFrontend().catch(console.error);
