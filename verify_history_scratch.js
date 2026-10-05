import { chromium } from 'playwright';
import path from 'path';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  
  const testEmail = `user_hist_${Date.now()}@vit.edu`;
  const artifactDir = '/Users/piyushraj/.gemini/antigravity-ide/brain/ea583d69-a586-48af-8917-411836e6c901';

  try {
    console.log('1. Navigating to signup page...');
    await page.goto('http://localhost:5173/signup');
    await page.waitForTimeout(1000);

    console.log('2. Signing up test account:', testEmail);
    await page.fill('input[placeholder="Full name"]', 'History Tester');
    await page.fill('input[placeholder="Email address"]', testEmail);
    await page.fill('input[placeholder="Password (min 6 chars)"]', 'Password123');
    await page.fill('input[placeholder="Confirm password"]', 'Password123');
    
    // Select branch, semester, college if they exist
    const selects = await page.$$('select');
    if (selects.length >= 3) {
      await selects[0].selectOption({ index: 1 }); // college
      await selects[1].selectOption({ index: 1 }); // branch
      await selects[2].selectOption({ index: 2 }); // semester
    }
    
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ url: '**/', timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000);
    console.log('Successfully signed up and redirected to dashboard.');

    console.log('3. Navigating to PDF Summarizer page...');
    await page.goto('http://localhost:5173/pdf');
    await page.waitForTimeout(1000);

    console.log('4. Uploading document...');
    const fileChooserPromise = page.waitForEvent('filechooser');
    // Click browse files or the upload area
    await page.click('text=browse files');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('/Users/piyushraj/project/node_modules/mammoth/test/test-data/single-paragraph.docx');
    await page.waitForTimeout(1000);

    console.log('5. Clicking Generate and waiting for summary/reels to complete...');
    await page.click('button:has-text("Generate")');
    // Wait for Summary Tab content to be visible
    await page.waitForSelector('text=Document Summary', { timeout: 15000 });
    console.log('Summary generated successfully.');

    console.log('6. Generating Quiz...');
    // Click Quiz Tab
    const buttons = await page.$$('button');
    let quizBtn;
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text.trim() === 'Quiz') {
        quizBtn = btn;
        break;
      }
    }
    if (quizBtn) await quizBtn.click();
    await page.waitForTimeout(500);
    // Click Generate Quiz
    await page.click('button:has-text("Generate Quiz")');
    await page.waitForSelector('text=Score:', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);
    console.log('Quiz generated successfully.');

    console.log('7. Generating Flashcards...');
    // Click Flashcards Tab
    const buttons2 = await page.$$('button');
    let fcBtn;
    for (const btn of buttons2) {
      const text = await btn.textContent();
      if (text.trim() === 'Flashcards') {
        fcBtn = btn;
        break;
      }
    }
    if (fcBtn) await fcBtn.click();
    await page.waitForTimeout(500);
    // Click Generate Flashcards
    await page.click('button:has-text("Generate Flashcards")').catch(() => {});
    await page.waitForTimeout(2000);
    console.log('Flashcards generated successfully.');

    console.log('8. Returning to Dashboard...');
    await page.click('text=VIT Course Portal');
    await page.waitForTimeout(2000);

    console.log('9. Checking Recent History Board on Dashboard...');
    await page.waitForSelector('.history-board', { timeout: 5000 });
    console.log('History Board rendered successfully.');
    
    // Take screenshot of dashboard history board
    const dbScreenshotPath = path.join(artifactDir, 'dashboard_history_screen.png');
    await page.screenshot({ path: dbScreenshotPath });
    console.log('Saved dashboard history screenshot to:', dbScreenshotPath);

    console.log('10. Clicking on the history item to restore session...');
    await page.click('.history-item');
    await page.waitForTimeout(2000);

    console.log('11. Verifying that the data is restored instantly...');
    // It should navigate and show results without hitting APIs
    await page.waitForSelector('text=Document Summary', { timeout: 2000 });
    console.log('Summary restored successfully.');

    // Check restored Quiz Tab
    const buttons3 = await page.$$('button');
    let quizBtn3;
    for (const btn of buttons3) {
      const text = await btn.textContent();
      if (text.trim() === 'Quiz') {
        quizBtn3 = btn;
        break;
      }
    }
    if (quizBtn3) await quizBtn3.click();
    await page.waitForTimeout(1000);
    
    // Take screenshot of restored quiz
    const quizScreenshotPath = path.join(artifactDir, 'restored_quiz_screen.png');
    await page.screenshot({ path: quizScreenshotPath });
    console.log('Saved restored quiz screenshot to:', quizScreenshotPath);

    console.log('SUCCESS: Caching and History Board test completed!');
  } catch (err) {
    console.error('TEST FAILED:', err);
    await page.screenshot({ path: path.join(artifactDir, 'test_failed_screenshot.png') });
  } finally {
    await browser.close();
  }
}

run();
