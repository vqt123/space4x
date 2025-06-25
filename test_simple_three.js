const { chromium } = require('playwright');
const path = require('path');

async function testSimpleThree() {
    console.log('Testing simple Three.js page...');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Set up console logging
    page.on('console', msg => {
        console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
        console.log(`BROWSER ERROR: ${error.message}`);
    });
    
    try {
        // Navigate to the test HTML file
        const testHtmlPath = path.resolve(__dirname, 'test-three.html');
        const fileUrl = `file://${testHtmlPath}`;
        
        console.log('1. Loading test HTML file:', fileUrl);
        await page.goto(fileUrl);
        
        // Wait for Three.js to load and render
        await page.waitForTimeout(2000);
        
        console.log('2. Taking screenshot...');
        await page.screenshot({ path: 'test-three-screenshot.png', fullPage: true });
        
        // Check the status
        const status = await page.locator('#status').textContent();
        console.log('3. Status:', status);
        
        // Check canvas
        const canvas = await page.locator('#canvas');
        const canvasExists = await canvas.count() > 0;
        console.log('4. Canvas exists:', canvasExists);
        
        if (canvasExists) {
            const boundingBox = await canvas.boundingBox();
            console.log('5. Canvas size:', boundingBox);
        }
        
        console.log('6. Test completed successfully');
        
    } catch (error) {
        console.error('Test failed:', error.message);
        await page.screenshot({ path: 'test-three-error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

testSimpleThree().catch(console.error);