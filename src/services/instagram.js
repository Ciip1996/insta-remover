import { sleep } from "../utils/sleep.js";

/**
 * Login to Instagram
 * @param {import('puppeteer').Page} page - Puppeteer page object
 * @param {string} username - Instagram username
 * @param {string} password - Instagram password
 */
export async function login(page, username, password) {
  console.log("🔐 Logging in to Instagram...");

  await page.goto("https://www.instagram.com/accounts/login/", {
    waitUntil: "networkidle2",
  });

  // Wait for login form
  await page.waitForSelector('input[name="username"]', { timeout: 10000 });
  await sleep(1000);

  // Enter credentials
  await page.type('input[name="username"]', username, { delay: 100 });
  await page.type('input[name="password"]', password, { delay: 100 });

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for navigation after login
  console.log("   Waiting for login to complete...");
  await sleep(8000);

  // Handle "Save Your Login Info?" prompt
  await dismissPrompt(page, "Save Login Info");

  // Handle "Turn on Notifications?" prompt
  await dismissPrompt(page, "Turn on Notifications");

  // Extra time to ensure session is established
  console.log("   Ensuring session is fully established...");
  await sleep(3000);

  console.log("✅ Successfully logged in!");
}

/**
 * Dismiss Instagram prompts (e.g., "Save Login Info", "Turn on Notifications")
 * @param {import('puppeteer').Page} page - Puppeteer page object
 * @param {string} promptName - name of the prompt for logging
 */
async function dismissPrompt(page, promptName) {
  try {
    const notNowButton = await page.$x("//button[contains(text(), 'Not Now')]");
    if (notNowButton.length > 0) {
      console.log(`   Dismissing '${promptName}' prompt...`);
      await notNowButton[0].click();
      await sleep(3000);
    }
  } catch (e) {
    console.log(`   No "${promptName}" prompt found`);
  }
}

/**
 * Check if a profile exists
 * @param {import('puppeteer').Page} page - Puppeteer page object
 * @param {string} username - Instagram username to check
 * @returns {Promise<boolean>} true if profile exists, false otherwise
 */
export async function checkProfileExists(page, username) {
  try {
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: "networkidle2",
      timeout: 15000,
    });

    await sleep(2000);

    // Check if "Sorry, this page isn't available" or "Profile isn't available" message appears
    const pageNotFound = await page.evaluate(() => {
      return (
        document.body.innerText.includes("Sorry, this page isn't available") ||
        document.body.innerText.includes(
          "The link you followed may be broken"
        ) ||
        document.body.innerText.includes("Profile isn't available")
      );
    });

    return !pageNotFound;
  } catch (error) {
    console.log(`⚠️  Error checking profile ${username}: ${error.message}`);
    return false;
  }
}

/**
 * Click the "Following" button on a profile
 * @param {import('puppeteer').Page} page - Puppeteer page object
 * @returns {Promise<boolean>} true if button was clicked, false otherwise
 */
export async function clickFollowingButton(page) {
  return await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const followingBtn = buttons.find(
      (btn) =>
        btn.innerText.includes("Following") ||
        btn.innerText.includes("Requested")
    );

    if (followingBtn) {
      followingBtn.click();
      return true;
    }
    return false;
  });
}

/**
 * Click the "Unfollow" button in the confirmation modal
 * Uses multiple strategies to find and click the button
 * @param {import('puppeteer').Page} page - Puppeteer page object
 * @returns {Promise<boolean>} true if button was clicked, false otherwise
 */
export async function confirmUnfollow(page) {
  let unfollowConfirmed = false;

  // Method 1: Try XPath for any clickable element (not just button)
  try {
    const unfollowElements = await page.$x("//*[text()='Unfollow']");
    if (unfollowElements.length > 0) {
      console.log(
        `   Found Unfollow element via XPath (${unfollowElements.length} found), clicking first...`
      );
      await unfollowElements[0].click();
      unfollowConfirmed = true;
      await sleep(1000);
      return unfollowConfirmed;
    }
  } catch (e) {
    console.log(`   XPath method failed: ${e.message}`);
  }

  // Method 2: Click any element with "Unfollow" text in the modal
  if (!unfollowConfirmed) {
    console.log(`   Trying to find Unfollow in modal via evaluate...`);
    unfollowConfirmed = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (modal) {
        const allElements = modal.querySelectorAll("*");
        for (const element of allElements) {
          const text = element.textContent?.trim();
          if (text === "Unfollow") {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0;
            if (isVisible) {
              element.click();
              return true;
            }
          }
        }
      }
      return false;
    });

    if (unfollowConfirmed) {
      console.log(`   Clicked Unfollow via modal element search`);
      await sleep(1000);
      return unfollowConfirmed;
    }
  }

  // Method 3: Try clicking by coordinates
  if (!unfollowConfirmed) {
    try {
      console.log(`   Trying coordinate-based click...`);
      const unfollowElement = await page.evaluateHandle(() => {
        const modal = document.querySelector('[role="dialog"]');
        if (modal) {
          const allElements = modal.querySelectorAll("*");
          for (const element of allElements) {
            if (element.textContent?.trim() === "Unfollow") {
              return element;
            }
          }
        }
        return null;
      });

      if (unfollowElement) {
        const box = await unfollowElement.boundingBox();
        if (box) {
          console.log(`   Found element at coordinates, clicking...`);
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          unfollowConfirmed = true;
          await sleep(1000);
        }
      }
    } catch (e) {
      console.log(`   Coordinate click failed: ${e.message}`);
    }
  }

  return unfollowConfirmed;
}

/**
 * Debug: Log modal content when unfollow fails
 * @param {import('puppeteer').Page} page - Puppeteer page object
 */
export async function logModalContent(page) {
  const modalContent = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]');
    if (modal) {
      const elements = Array.from(modal.querySelectorAll("*"));
      return elements
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && el.textContent?.trim();
        })
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim().substring(0, 50),
          clickable: el.onclick !== null || el.style.cursor === "pointer",
        }))
        .slice(0, 15);
    }
    return [];
  });
  console.log(`   Modal content:`, JSON.stringify(modalContent, null, 2));
}
