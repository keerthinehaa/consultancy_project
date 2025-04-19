
        const { test, expect } = require('@playwright/test');

        
        test('functional (56% confidence)', async ({ page }) => {
          
    // 1. Check application availability
    let appAvailable = true;
    try {
      const response = await page.request.get('http://localhost:3000');
      appAvailable = response.status() === 200;
    } catch {
      appAvailable = false;
    }

    if (!appAvailable) {
      throw new Error('Frontend application not running at http://localhost:3000');
    }

    // 2. Proceed with tests
    
    // Role test
    const role = 'user';
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', role + '@test.com');
    await page.fill('#password', role + '123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('http://localhost:3000/' + role + '-dashboard');
    
    
    
    // System check
    const dbResponse = await page.request.get('http://localhost:3000/api/health');
    await expect(dbResponse).toBeOK();
    await expect(await dbResponse.json()).toHaveProperty('status', 'healthy');
    
  
        });

        test('use case (33% confidence)', async ({ page }) => {
          
    // 1. Check application availability
    let appAvailable = true;
    try {
      const response = await page.request.get('http://localhost:3000');
      appAvailable = response.status() === 200;
    } catch {
      appAvailable = false;
    }

    if (!appAvailable) {
      throw new Error('Frontend application not running at http://localhost:3000');
    }

    // 2. Proceed with tests
    
    // Role test
    const role = 'user';
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', role + '@test.com');
    await page.fill('#password', role + '123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('http://localhost:3000/' + role + '-dashboard');
    
    
    
    // System check
    const dbResponse = await page.request.get('http://localhost:3000/api/health');
    await expect(dbResponse).toBeOK();
    await expect(await dbResponse.json()).toHaveProperty('status', 'healthy');
    
  
        });

        test('non-functional (12% confidence)', async ({ page }) => {
          
    // 1. Check application availability
    let appAvailable = true;
    try {
      const response = await page.request.get('http://localhost:3000');
      appAvailable = response.status() === 200;
    } catch {
      appAvailable = false;
    }

    if (!appAvailable) {
      throw new Error('Frontend application not running at http://localhost:3000');
    }

    // 2. Proceed with tests
    
    // Role test
    const role = 'user';
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', role + '@test.com');
    await page.fill('#password', role + '123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('http://localhost:3000/' + role + '-dashboard');
    
    
    
    // System check
    const dbResponse = await page.request.get('http://localhost:3000/api/health');
    await expect(dbResponse).toBeOK();
    await expect(await dbResponse.json()).toHaveProperty('status', 'healthy');
    
  
        });
      