# Test info

- Name: Generated Tests from remote >> use case (0%)
- Location: D:\KEC\sem6\consultancy_project\qa-automation-system - Copy\server\generated-tests\test_script.spec.js:122:3

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('a[href*="login"]')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('a[href*="login"]')

    at D:\KEC\sem6\consultancy_project\qa-automation-system - Copy\server\generated-tests\test_script.spec.js:137:52
```

# Page snapshot

```yaml
- heading "QA Automation System" [level=1]
- heading "System Status" [level=2]
- text: "Backend: Online Database: Connected"
- heading "Upload SRS Document" [level=2]
- text: Select Document (PDF or DOCX, max 5MB)
- button "Choose File"
- button "Analyze Document" [disabled]
```

# Test source

```ts
   37 | //   });
   38 |
   39 | //   test('use case (0%)', async ({ page }) => {
   40 |
   41 | //     const response = await page.request.get(BASE_URL);
   42 | //     await expect(response).toBeOK();
   43 |
   44 |   
   45 | //     await page.goto(BASE_URL);
   46 | //     await expect(page).toHaveURL(BASE_URL);
   47 |
   48 |
   49 | //     await expect(page.locator('body')).not.toBeEmpty();
   50 |
   51 |
   52 | //     await expect(page.locator('a[href*="login"]')).toBeVisible();
   53 | //   });
   54 |
   55 | //   test('constraint (0%)', async ({ page }) => {
   56 |
   57 | //     const response = await page.request.get(BASE_URL);
   58 | //     await expect(response).toBeOK();
   59 | //     await page.goto(BASE_URL);
   60 | //     await expect(page).toHaveURL(BASE_URL);
   61 |
   62 |
   63 | //     await expect(page.locator('body')).not.toBeEmpty();
   64 |
   65 |
   66 | //     await expect(page.locator('body')).toBeVisible();
   67 | //   });
   68 | // });
   69 |
   70 |
   71 | // -------------------------------------------
   72 |
   73 | const { test, expect } = require('@playwright/test');
   74 | const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
   75 |
   76 | test.describe('Generated Tests from remote', () => {
   77 |
   78 |   test('functional requirement (0%)', async ({ page }) => {
   79 |     // 1. Basic application availability check
   80 |     const response = await page.request.get(BASE_URL);
   81 |     await expect(response).toBeOK();
   82 |
   83 |     // 2. Navigate to page
   84 |     await page.goto(BASE_URL);
   85 |     await expect(page).toHaveURL(BASE_URL);
   86 |
   87 |     // 3. Basic content checks
   88 |     await expect(page.locator('body')).not.toBeEmpty();
   89 |
   90 |     // 4. Category-specific checks
   91 |     
   92 |     // Functional requirement checks
   93 |     await expect(page).toHaveTitle(/./); // Title exists
   94 |     const buttons = await page.locator('button').count();
   95 |     await expect(buttons).toBeGreaterThan(0); // At least one button
   96 |   
   97 |   });
   98 |
   99 |   test('non-functional requirement (0%)', async ({ page }) => {
  100 |     // 1. Basic application availability check
  101 |     const response = await page.request.get(BASE_URL);
  102 |     await expect(response).toBeOK();
  103 |
  104 |     // 2. Navigate to page
  105 |     await page.goto(BASE_URL);
  106 |     await expect(page).toHaveURL(BASE_URL);
  107 |
  108 |     // 3. Basic content checks
  109 |     await expect(page.locator('body')).not.toBeEmpty();
  110 |
  111 |     // 4. Category-specific checks
  112 |     
  113 |     // Performance check
  114 |     const startTime = Date.now();
  115 |     await page.reload();
  116 |     const loadTime = Date.now() - startTime;
  117 |     console.log('Page loaded in', loadTime, 'ms');
  118 |     await expect(loadTime).toBeLessThan(2000); // Under 2 seconds
  119 |   
  120 |   });
  121 |
  122 |   test('use case (0%)', async ({ page }) => {
  123 |     // 1. Basic application availability check
  124 |     const response = await page.request.get(BASE_URL);
  125 |     await expect(response).toBeOK();
  126 |
  127 |     // 2. Navigate to page
  128 |     await page.goto(BASE_URL);
  129 |     await expect(page).toHaveURL(BASE_URL);
  130 |
  131 |     // 3. Basic content checks
  132 |     await expect(page.locator('body')).not.toBeEmpty();
  133 |
  134 |     // 4. Category-specific checks
  135 |     
  136 |     // Use case validation
> 137 |     await expect(page.locator('a[href*="login"]')).toBeVisible();
      |                                                    ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  138 |   
  139 |   });
  140 |
  141 |   test('constraint (0%)', async ({ page }) => {
  142 |     // 1. Basic application availability check
  143 |     const response = await page.request.get(BASE_URL);
  144 |     await expect(response).toBeOK();
  145 |
  146 |     // 2. Navigate to page
  147 |     await page.goto(BASE_URL);
  148 |     await expect(page).toHaveURL(BASE_URL);
  149 |
  150 |     // 3. Basic content checks
  151 |     await expect(page.locator('body')).not.toBeEmpty();
  152 |
  153 |     // 4. Category-specific checks
  154 |     
  155 |     // Default validation
  156 |     await expect(page.locator('body')).toBeVisible();
  157 |   
  158 |   });
  159 |
  160 | });
  161 |
```