import { test, expect } from '@playwright/test';

test.describe('Full OrganizeNow Flow Test', () => {
  const testEmail = `test-${Date.now()}@test.com`;
  const associationName = `Test Förening ${Date.now()}`;
  const memberName = 'Test Medlem';

  test('Complete flow: Login → Create Association → Add Member', async ({ page }) => {
    // Debug listeners
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('Browser console error:', msg.text());
    });
    page.on('response', response => {
      if (response.status() >= 400) console.log(`HTTP ${response.status()} ${response.request().method()} ${response.url()}`);
    });
    console.log('=== Starting Full Flow Test ===');
    console.log('Test email:', testEmail);

    // 1. Navigate to home page
    console.log('Step 1: Navigating to home page...');
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle(/OrganizeNow/);
    
    // Check that we're not logged in
    await expect(page.locator('text=Logga in')).toBeVisible();

    // 2. Go to login page
    console.log('Step 2: Going to login page...');
    await page.click('text=Logga in');
    await expect(page).toHaveURL('http://localhost:3000/login');

    // 3. Request magic link
    console.log('Step 3: Requesting magic link...');
    await page.fill('input[type="email"]', testEmail);
    await page.click('button:has-text("Skicka inloggningslänk")');
    
    // Wait for success message
    await expect(page.locator('text=Kolla din e-post')).toBeVisible({ timeout: 10000 });
    console.log('✓ Magic link sent successfully');

    // 4. Get magic link from Inbucket
    console.log('Step 4: Fetching magic link from Inbucket...');
    await page.goto('http://localhost:54324');
    await page.waitForTimeout(2000);

    // Click on the email
    const emailRow = page.locator(`text=${testEmail}`).first();
    await expect(emailRow).toBeVisible({ timeout: 10000 });
    await emailRow.click();

    // Extract magic link from iframe
    const iframe = page.frameLocator('iframe').first();
    await page.waitForTimeout(1000);

    // Find and click the magic link
    const magicLink = iframe.locator('a[href*="auth"]').first();
    const href = await magicLink.getAttribute('href');
    console.log('Magic link found:', href?.substring(0, 50) + '...');

    // 5. Use magic link to authenticate
    console.log('Step 5: Authenticating with magic link...');
    await page.goto(href!);
    await page.waitForTimeout(2000);

    // We should be redirected to dashboard
    await expect(page).toHaveURL(/dashboard/);
    console.log('✓ Successfully authenticated and reached dashboard');

    // 6. Create a new association
    console.log('Step 6: Creating new association...');
    await page.click('text=Skapa ny förening');
    await expect(page).toHaveURL(/associations\/new/);

    // Fill in association form
    await page.fill('input[name="name"]', associationName);
    await page.fill('textarea[name="description"]', 'En testförening skapad automatiskt');
    
    // Submit form
    await page.click('button:has-text("Skapa förening")');
    console.log('✓ Association form submitted');

    // Wait for redirect to association page
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/associations\/[a-f0-9-]+$/);
    console.log('✓ Association created successfully');

    // Extract association ID from URL
    const url = page.url();
    const associationId = url.split('/').pop();
    console.log('Association ID:', associationId);

    // Verify association details are shown
    await expect(page.locator(`text=${associationName}`)).toBeVisible();

    // 7. Add a member to the association
    console.log('Step 7: Adding a member...');
    await page.click('text=Lägg till medlem');
    await expect(page).toHaveURL(/members\/add/);

    // Fill in member form
    await page.fill('input[name="full_name"]', memberName);
    await page.fill('input[name="email"]', 'medlem@test.com');
    await page.fill('input[name="phone"]', '070-123 45 67');
    await page.fill('input[name="member_number"]', 'TEST001');

    // Submit form
    await page.click('button:has-text("Lägg till medlem")');
    console.log('✓ Member form submitted');

    // Wait for redirect to members list
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/members$/);
    console.log('✓ Member added successfully');

    // Verify member appears in list
    await expect(page.locator(`text=${memberName}`).first()).toBeVisible();

    // 8. Navigate back to association page
    console.log('Step 8: Navigating back to association page...');
    await page.click('text=Tillbaka');
    await expect(page).toHaveURL(/associations\/[a-f0-9-]+$/);

    // Verify member count updated
    await expect(page.locator('text=Medlemmar').first().locator('..').locator('text=1')).toBeVisible();

    // 9. Test navigation to dashboard
    console.log('Step 9: Testing navigation to dashboard...');
    await page.click('text=Dashboard');
    await expect(page).toHaveURL(/dashboard/);

    // Verify association appears in dashboard
    await expect(page.locator(`text=${associationName}`)).toBeVisible();

    // 10. Sign out
    console.log('Step 10: Signing out...');
    await page.click('text=Logga ut');
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/login/);

    console.log('=== Test Completed Successfully! ===');
    console.log('✅ All features are working correctly');
  });
});

test.setTimeout(120000); // 2 minutes timeout
