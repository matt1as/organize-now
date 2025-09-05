import { test, expect } from '@playwright/test';

test('debug magic link authentication flow', async ({ page }) => {
  // Set up console logging to capture any errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser console error:', msg.text());
    }
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`HTTP ${response.status()} error: ${response.url()}`);
    }
  });

  // 1. Go to login page
  console.log('Step 1: Navigating to login page...');
  await page.goto('http://localhost:3000/login');
  await expect(page).toHaveTitle(/OrganizeNow/);
  
  // 2. Enter email and submit
  const testEmail = 'playwright@test.com';
  console.log(`Step 2: Entering email: ${testEmail}`);
  await page.fill('input[type="email"]', testEmail);
  await page.click('button[type="submit"]');
  
  // 3. Wait for success message
  console.log('Step 3: Waiting for success message...');
  await expect(page.locator('text=Kolla din e-post')).toBeVisible({ timeout: 10000 });
  
  // 4. Navigate to Inbucket to get the magic link
  console.log('Step 4: Fetching email from Inbucket...');
  await page.goto('http://localhost:54324');
  
  // Wait for email to appear
  await page.waitForTimeout(2000);
  
  // Check if email exists
  const emailRow = page.locator(`text=${testEmail}`).first();
  const emailExists = await emailRow.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (!emailExists) {
    console.log('ERROR: Email not found in Inbucket');
    return;
  }
  
  // Click on the email
  console.log('Step 5: Opening email...');
  await emailRow.click();
  
  // Wait for email content to load
  await page.waitForTimeout(1000);
  
  // Get the magic link from iframe
  const iframe = page.frameLocator('iframe').first();
  
  // Try multiple selectors to find the magic link
  let magicLinkHref = null;
  
  // Method 1: Look for "Confirm your email" link
  const confirmLink = iframe.locator('a:has-text("Confirm")').first();
  if (await confirmLink.isVisible({ timeout: 2000 }).catch(() => false)) {
    magicLinkHref = await confirmLink.getAttribute('href');
    console.log('Found confirm link');
  }
  
  // Method 2: Look for any link with auth/callback
  if (!magicLinkHref) {
    const authLink = iframe.locator('a[href*="auth/callback"]').first();
    if (await authLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      magicLinkHref = await authLink.getAttribute('href');
      console.log('Found auth/callback link');
    }
  }
  
  // Method 3: Look for any link with token parameter
  if (!magicLinkHref) {
    const tokenLink = iframe.locator('a[href*="token="]').first();
    if (await tokenLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      magicLinkHref = await tokenLink.getAttribute('href');
      console.log('Found token link');
    }
  }
  
  // Method 4: Get all links and find the right one
  if (!magicLinkHref) {
    const allLinks = await iframe.locator('a').all();
    console.log(`Found ${allLinks.length} links in email`);
    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      if (href && (href.includes('auth/callback') || href.includes('token='))) {
        magicLinkHref = href;
        console.log('Found link via iteration:', href.substring(0, 100));
        break;
      }
    }
  }
  
  if (magicLinkHref) {
    console.log('Step 6: Navigating to magic link...');
    console.log('Magic link URL:', magicLinkHref);
    await page.goto(magicLinkHref);
  } else {
    console.log('ERROR: Could not find magic link in email');
    // Try to get the raw HTML to debug
    const htmlContent = await iframe.locator('body').innerHTML();
    console.log('Email HTML preview:', htmlContent.substring(0, 1000));
  }
  
  // 7. Check where we ended up
  console.log('Step 7: Checking final destination...');
  await page.waitForTimeout(2000);
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);
  
  // Check if we're on the dashboard or got redirected back to login
  if (currentUrl.includes('/dashboard')) {
    console.log('✅ SUCCESS: Reached dashboard');
    await expect(page.locator('text=Välkommen')).toBeVisible();
  } else if (currentUrl.includes('/login')) {
    console.log('❌ FAILURE: Redirected back to login');
    
    // Check for any error messages
    const errorMessage = await page.locator('.text-red-800').textContent().catch(() => null);
    if (errorMessage) {
      console.log('Error message found:', errorMessage);
    }
    
    // Check cookies
    const cookies = await page.context().cookies();
    const authCookies = cookies.filter(c => c.name.includes('auth') || c.name.includes('supabase'));
    console.log('Auth-related cookies:', authCookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })));
    
    // Check localStorage
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.includes('supabase')) {
          items[key] = window.localStorage.getItem(key);
        }
      }
      return items;
    });
    console.log('Supabase localStorage items:', Object.keys(localStorage));
  } else {
    console.log('❓ UNEXPECTED: Ended up at', currentUrl);
  }
});

test.setTimeout(60000);
