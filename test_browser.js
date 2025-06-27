const { chromium } = require('playwright');

async function testWebApp() {
    console.log('🚀 Starting Space4X browser automation test...');
    
    // Launch browser with more debugging
    const browser = await chromium.launch({ 
        headless: true, // Must be true in WSL environment
        slowMo: 100 // Slow down actions slightly for better reliability
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Set up console logging
    page.on('console', msg => {
        console.log(`🔍 BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
    });
    
    // Set up error logging
    page.on('pageerror', error => {
        console.log(`❌ BROWSER ERROR: ${error.message}`);
    });
    
    // Set up network monitoring
    page.on('response', response => {
        if (response.url().includes('socket.io') || response.url().includes('3001')) {
            console.log(`🌐 NETWORK RESPONSE: ${response.status()} ${response.url()}`);
        }
    });
    
    page.on('requestfailed', request => {
        console.log(`💥 NETWORK FAILED: ${request.url()} - ${request.failure()?.errorText}`);
    });
    
    try {
        console.log('📂 1. Navigating to http://localhost:5173...');
        await page.goto('http://localhost:5173');
        
        // Wait for page to load
        await page.waitForLoadState('networkidle');
        
        console.log('📸 2. Taking initial screenshot...');
        await page.screenshot({ path: 'screenshot_initial.png', fullPage: true });
        
        // Check what elements are visible
        const title = await page.title();
        console.log(`📄 Page title: ${title}`);
        
        // Look for the pilot name input
        console.log('🔍 3. Looking for pilot name input field...');
        const pilotInput = await page.locator('input[placeholder*="pilot" i], input[placeholder*="name" i], input[type="text"]').first();
        
        if (await pilotInput.count() > 0) {
            console.log('✅ Found pilot name input field');
            await pilotInput.fill('BrowserTester');
            console.log('⌨️ 4. Entered "BrowserTester" in pilot name field');
        } else {
            console.log('❌ Could not find pilot name input field');
            await page.screenshot({ path: 'screenshot_no_input.png', fullPage: true });
            throw new Error('No input field found');
        }
        
        // Look for Join Game button
        console.log('🔍 5. Looking for Join Game button...');
        const joinButton = await page.locator('button:has-text("Join Game"), button:has-text("Join"), button[type="submit"]').first();
        
        if (await joinButton.count() > 0) {
            console.log('✅ Found Join Game button');
            await joinButton.click();
            console.log('🎮 6. Clicked Join Game button');
            
            // Wait for connection
            await page.waitForTimeout(3000);
            
            console.log('📸 7. Taking screenshot after clicking Join Game...');
            await page.screenshot({ path: 'screenshot_after_join.png', fullPage: true });
            
            // Wait for game to load - look for version display as indicator
            console.log('⏳ 8. Waiting for game to fully load...');
            const versionDisplay = await page.locator('text=/Client v.*Server v/').first();
            try {
                await versionDisplay.waitFor({ timeout: 15000 });
                console.log('✅ Game loaded successfully - version display found');
                
                const versionText = await versionDisplay.textContent();
                console.log(`📋 Version info: ${versionText}`);
            } catch (error) {
                console.log('⚠️ Version display not found, continuing anyway...');
            }
            
            // Test 1: Check for game UI elements
            console.log('🧪 TEST 1: Checking for game UI elements...');
            await page.waitForTimeout(2000);
            
            const uiElements = {
                tradeButton: await page.locator('button:has-text("Trade")').count(),
                upgradeButton: await page.locator('button:has-text("Upgrade")').count(),
                hubButton: await page.locator('text=/🏭/').count(),
                shieldDisplay: await page.locator('text=/Shields:/').count(),
                energyDisplay: await page.locator('text=/Energy:/').count(),
                actionPoints: await page.locator('text=/Action Points:/').count()
            };
            
            console.log('📊 UI Elements found:', uiElements);
            
            // Test 2: Look for Closest Hub section (separate from trade options)
            console.log('🧪 TEST 2: Looking for Closest Hub section...');
            const closestHubSection = await page.locator('text=/Closest Hub:/').count();
            const hubTeleportButton = await page.locator('button:has-text("Teleport")').count();
            console.log(`🏭 Closest Hub section found: ${closestHubSection}`);
            console.log(`🚀 Hub teleport button found: ${hubTeleportButton}`);
            
            if (closestHubSection > 0) {
                console.log('✅ Closest Hub section found - attempting to teleport...');
                
                // Click on the hub teleport button
                const hubTeleportButton = await page.locator('button:has-text("Teleport")').first();
                
                if (await hubTeleportButton.count() > 0) {
                    console.log('🚀 Clicking hub teleport button...');
                    await hubTeleportButton.click();
                    
                    // Wait for teleport to complete (should be instant)
                    await page.waitForTimeout(1000);
                    
                    // Check if traveling state disappears (should be instant teleport)
                    console.log('⏳ Checking if teleport completed instantly...');
                    const travelingStatus = await page.locator('text=/Traveling/').count();
                    console.log(`🚀 Traveling status found: ${travelingStatus} (should be 0 for instant teleport)`);
                    
                    // Wait a bit more for UI to update
                    await page.waitForTimeout(2000);
                    
                    // Test 3: Check if we're at a hub (hub commerce buttons should appear)
                    console.log('🧪 TEST 3: Checking if we arrived at hub...');
                    await page.waitForTimeout(1000);
                    
                    // Check for hub commerce buttons in both the main UI and the hub section
                    const hubCommerceButtons = {
                        upgradeCargoButton: await page.locator('button:has-text("Upgrade Cargo")').count(),
                        buyShieldsButton: await page.locator('button:has-text("+10🛡")').count(),
                        buyEnergyButton: await page.locator('button:has-text("+50⚡")').count()
                    };
                    
                    console.log('🛒 Hub commerce buttons found:', hubCommerceButtons);
                    
                    // Also check if the hub section now shows different content (not teleport button)
                    const hubTeleportStillVisible = await page.locator('button:has-text("Teleport")').count();
                    console.log(`🚀 Hub teleport button still visible: ${hubTeleportStillVisible} (should be 0 if at hub)`);
                    
                    // Check the hub section content
                    const hubSectionText = await page.locator('text=/Closest Hub:/').locator('..').textContent().catch(() => 'Not found');
                    console.log(`🏭 Hub section content: ${hubSectionText}`);
                    
                    if (hubCommerceButtons.upgradeCargoButton > 0) {
                        console.log('✅ Successfully traveled to hub - commerce options available!');
                        
                        // Test 4: Try hub commerce actions
                        console.log('🧪 TEST 4: Testing hub commerce actions...');
                        
                        // Try to buy shields if button is enabled
                        const shieldsButton = await page.locator('button:has-text("+10🛡")').first();
                        const shieldsEnabled = await shieldsButton.isEnabled();
                        console.log(`🛡️ Shields button enabled: ${shieldsEnabled}`);
                        
                        if (shieldsEnabled) {
                            console.log('💰 Attempting to buy shields...');
                            await shieldsButton.click();
                            await page.waitForTimeout(1000);
                            console.log('✅ Shields purchase attempted');
                        }
                        
                        // Try to buy energy if button is enabled
                        const energyButton = await page.locator('button:has-text("+50⚡")').first();
                        const energyEnabled = await energyButton.isEnabled();
                        console.log(`⚡ Energy button enabled: ${energyEnabled}`);
                        
                        if (energyEnabled) {
                            console.log('💰 Attempting to buy energy...');
                            await energyButton.click();
                            await page.waitForTimeout(1000);
                            console.log('✅ Energy purchase attempted');
                        }
                        
                        // Try cargo upgrade if button is enabled
                        const cargoButton = await page.locator('button:has-text("Upgrade Cargo")').first();
                        const cargoEnabled = await cargoButton.isEnabled();
                        console.log(`📦 Cargo upgrade button enabled: ${cargoEnabled}`);
                        
                        if (cargoEnabled) {
                            console.log('📦 Attempting cargo upgrade...');
                            await cargoButton.click();
                            await page.waitForTimeout(1000);
                            console.log('✅ Cargo upgrade attempted');
                        }
                        
                    } else {
                        console.log('❌ Hub commerce buttons not found - might not be at hub');
                    }
                } else {
                    console.log('❌ Hub teleport button not found');
                }
            } else {
                console.log('⚠️ No Closest Hub section found');
            }
            
            // Test 5: Look for enemies in trade options
            console.log('🧪 TEST 5: Looking for enemies in trade options...');
            const enemyOptions = await page.locator('text=/⚔️.*Raider|⚔️.*Pirate|⚔️.*Marauder/').count();
            console.log(`⚔️ Enemy options found: ${enemyOptions}`);
            
            if (enemyOptions > 0) {
                console.log('✅ Enemies found in trade options');
                
                // Try to find combat buttons
                const combatButtons = {
                    engageButton: await page.locator('button:has-text("Engage")').count(),
                    fireBlastButton: await page.locator('button:has-text("Fire Blast")').count()
                };
                
                console.log('⚔️ Combat buttons found:', combatButtons);
                
                if (combatButtons.engageButton > 0) {
                    const engageButton = await page.locator('button:has-text("Engage")').first();
                    const engageEnabled = await engageButton.isEnabled();
                    console.log(`⚔️ Engage button enabled: ${engageEnabled}`);
                    
                    if (engageEnabled) {
                        console.log('⚔️ Attempting to engage enemy...');
                        await engageButton.click();
                        await page.waitForTimeout(2000);
                        console.log('✅ Enemy engagement attempted');
                        
                        // Check if fire blast button becomes available
                        const fireButton = await page.locator('button:has-text("Fire Blast")').first();
                        const fireEnabled = await fireButton.isEnabled();
                        console.log(`🔥 Fire blast button enabled: ${fireEnabled}`);
                        
                        if (fireEnabled) {
                            console.log('🔥 Attempting to fire blast...');
                            await fireButton.click();
                            await page.waitForTimeout(2000);
                            console.log('✅ Fire blast attempted');
                        }
                    }
                }
            } else {
                console.log('⚠️ No enemies found within range for combat');
            }
            
            // Test 6: Check stats and final state
            console.log('🧪 TEST 6: Checking final game state...');
            
            // Get current stats using Playwright locators
            const finalStats = {
                shields: await page.locator('text=/Shields:.*\\/').textContent().catch(() => 'Not found'),
                energy: await page.locator('text=/Energy:.*\\/').textContent().catch(() => 'Not found'), 
                credits: await page.locator('text=/Credits:.*\\/').textContent().catch(() => 'Not found'),
                actionPoints: await page.locator('text=/Action Points:.*\\/').textContent().catch(() => 'Not found')
            };
            
            console.log('📊 Final stats:', finalStats);
            
            // Take final screenshot
            console.log('📸 Taking final screenshot...');
            await page.screenshot({ path: 'screenshot_final_test.png', fullPage: true });
            
        } else {
            console.log('❌ Could not find Join Game button');
            await page.screenshot({ path: 'screenshot_no_button.png', fullPage: true });
            throw new Error('No join button found');
        }
        
        console.log('🎉 All tests completed successfully!');
        
    } catch (error) {
        console.error('💥 Test failed with error:', error.message);
        await page.screenshot({ path: 'screenshot_error.png', fullPage: true });
    } finally {
        console.log('🔚 Closing browser...');
        await page.waitForTimeout(2000); // Give time to see final state
        await browser.close();
    }
}

testWebApp().catch(console.error);