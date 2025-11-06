import puppeteer from "puppeteer";
import fs from "fs";
import csv from "csv-parser";
import dotenv from "dotenv";

dotenv.config();

// Configuration
const CONFIG = {
  BATCH_SIZE_SMALL: 10,
  BATCH_SIZE_LARGE: 100,
  WAIT_TIME_SHORT: 0.5 * 60 * 1000, // 1 minutes in milliseconds
  WAIT_TIME_LONG: 5 * 60 * 1000, // 5 minutes in milliseconds
  INSTAGRAM_USERNAME: process.env.INSTAGRAM_USERNAME,
  INSTAGRAM_PASSWORD: process.env.INSTAGRAM_PASSWORD,
  CSV_FILE_PATH: process.env.CSV_FILE_PATH || "./users_to_unfollow.csv",
  HEADLESS: process.env.HEADLESS === "true" || false,
  USE_ARC_BROWSER: process.env.USE_ARC_BROWSER === "true" || false,
  ARC_EXECUTABLE_PATH:
    process.env.ARC_EXECUTABLE_PATH ||
    "/Applications/Arc.app/Contents/MacOS/Arc",
};

// Utility function to sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Append a username to the removed users CSV (creates file with header if needed)
function appendToRemovedCSV(username) {
  const removedPath = "./removed_users.csv";
  let existing = "";
  if (fs.existsSync(removedPath)) {
    existing = fs.readFileSync(removedPath, "utf8");
  }

  // Normalize username (no @ and trimmed)
  const clean = username.trim().replace(/^@/, "");

  // If already present, skip
  const already = existing
    .split(/\r?\n/)
    .map((l) => l.replace(/"/g, "").split(",")[0]?.trim())
    .filter(Boolean)
    .some((u) => u.toLowerCase() === clean.toLowerCase());

  if (already) return;

  if (!existing) {
    // create with header
    fs.writeFileSync(removedPath, `username\n${clean}\n`, "utf8");
  } else {
    fs.appendFileSync(removedPath, `${clean}\n`, "utf8");
  }
}

// Remove a username from the original CSV file. This rewrites the CSV as a
// single-column file with header 'username' followed by remaining values.
// NOTE: This simplifies multi-column CSVs into a single-column file. If your
// CSV contains more data per row you may want a more-preserving implementation.
function removeUsernameFromCSV(filePath, username) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== "");

  // Determine if first line is a header
  let dataLines = lines;
  if (lines.length > 0 && /username/i.test(lines[0])) {
    dataLines = lines.slice(1);
  }

  const clean = username.trim().replace(/^@/, "");

  const remaining = dataLines
    .map((line) => line.replace(/"/g, "").split(",")[0]?.trim())
    .filter(Boolean)
    .filter((u) => u.toLowerCase() !== clean.toLowerCase());

  const out = ["username", ...remaining].join("\n") + "\n";
  fs.writeFileSync(filePath, out, "utf8");
}

// Read CSV file and extract usernames
async function readUsernamesFromCSV(filePath) {
  return new Promise((resolve, reject) => {
    const usernames = [];

    if (!fs.existsSync(filePath)) {
      reject(new Error(`CSV file not found at: ${filePath}`));
      return;
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        // Support multiple column names: username, user, handle, instagram_username
        const username =
          row.username ||
          row.user ||
          row.handle ||
          row.instagram_username ||
          row.Username;
        if (username && username.trim()) {
          usernames.push(username.trim().replace("@", ""));
        }
      })
      .on("end", () => {
        console.log(`📋 Loaded ${usernames.length} usernames from CSV`);
        resolve(usernames);
      })
      .on("error", reject);
  });
}

// Login to Instagram
async function loginToInstagram(page) {
  console.log("🔐 Logging in to Instagram...");

  await page.goto("https://www.instagram.com/accounts/login/", {
    waitUntil: "networkidle2",
  });

  // Wait for login form
  await page.waitForSelector('input[name="username"]', { timeout: 10000 });
  await sleep(1000);

  // Enter credentials
  await page.type('input[name="username"]', CONFIG.INSTAGRAM_USERNAME, {
    delay: 100,
  });
  await page.type('input[name="password"]', CONFIG.INSTAGRAM_PASSWORD, {
    delay: 100,
  });

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for navigation after login
  console.log("   Waiting for login to complete...");
  await sleep(8000);

  // Handle "Save Your Login Info?" prompt if it appears
  try {
    const notNowButton = await page.$x("//button[contains(text(), 'Not Now')]");
    if (notNowButton.length > 0) {
      console.log("   Dismissing 'Save Login Info' prompt...");
      await notNowButton[0].click();
      await sleep(3000);
    }
  } catch (e) {
    console.log('   No "Save Login Info" prompt found');
  }

  // Handle "Turn on Notifications?" prompt if it appears
  try {
    const notNowButton = await page.$x("//button[contains(text(), 'Not Now')]");
    if (notNowButton.length > 0) {
      console.log("   Dismissing 'Turn on Notifications' prompt...");
      await notNowButton[0].click();
      await sleep(3000);
    }
  } catch (e) {
    console.log('   No "Turn on Notifications" prompt found');
  }

  // Extra time to ensure everything is loaded
  console.log("   Ensuring session is fully established...");
  await sleep(3000);

  console.log("✅ Successfully logged in!");
}

// Check if profile exists
async function checkProfileExists(page, username) {
  try {
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: "networkidle2",
      timeout: 15000,
    });

    await sleep(2000);

    // Check if "Sorry, this page isn't available" message appears
    const pageNotFound = await page.evaluate(() => {
      return (
        document.body.innerText.includes("Sorry, this page isn't available") ||
        document.body.innerText.includes("The link you followed may be broken")
      );
    });

    return !pageNotFound;
  } catch (error) {
    console.log(`⚠️  Error checking profile ${username}: ${error.message}`);
    return false;
  }
}

// Unfollow a user
async function unfollowUser(page, username) {
  try {
    console.log(`🔄 Processing: ${username}`);

    // Check if profile exists
    const exists = await checkProfileExists(page, username);

    if (!exists) {
      console.log(`❌ Profile does not exist: ${username}`);
      return { success: false, reason: "profile_not_found" };
    }

    await sleep(500);

    // Look for the "Following" button
    const followingButton = await page.evaluate(() => {
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

    if (!followingButton) {
      console.log(`⚠️  Not following ${username} or couldn't find button`);
      return { success: false, reason: "not_following" };
    }

    // Wait for the unfollow confirmation modal to appear
    console.log(`   Waiting for confirmation modal...`);
    await sleep(2000);

    // Try to click the unfollow option in the modal using multiple methods
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
      }
    } catch (e) {
      console.log(`   XPath method failed: ${e.message}`);
    }

    // Method 2: Click any element with "Unfollow" text in the modal
    if (!unfollowConfirmed) {
      console.log(`   Trying to find Unfollow in modal via evaluate...`);
      unfollowConfirmed = await page.evaluate(() => {
        // Look in the modal specifically
        const modal = document.querySelector('[role="dialog"]');
        if (modal) {
          // Check all clickable elements (button, div, span, etc.)
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
      }
    }

    // Method 3: Try clicking by coordinates if we can find the element
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
            await page.mouse.click(
              box.x + box.width / 2,
              box.y + box.height / 2
            );
            unfollowConfirmed = true;
            await sleep(1000);
          }
        }
      } catch (e) {
        console.log(`   Coordinate click failed: ${e.message}`);
      }
    }

    if (unfollowConfirmed) {
      console.log(`✅ Successfully unfollowed: ${username}`);
      await sleep(1500);
      return { success: true };
    } else {
      console.log(`⚠️  Could not confirm unfollow for: ${username}`);

      // Debug: Log what's in the modal
      const modalContent = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]');
        if (modal) {
          const elements = Array.from(modal.querySelectorAll("*"));
          return elements
            .filter((el) => {
              const rect = el.getBoundingClientRect();
              return (
                rect.width > 0 && rect.height > 0 && el.textContent?.trim()
              );
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

      return { success: false, reason: "unfollow_failed" };
    }
  } catch (error) {
    console.log(`❌ Error unfollowing ${username}: ${error.message}`);
    return { success: false, reason: "error", error: error.message };
  }
}

// Main function
async function main() {
  console.log("🚀 Instagram Unfollower Bot Starting...\n");

  // Validate configuration
  if (!CONFIG.INSTAGRAM_USERNAME || !CONFIG.INSTAGRAM_PASSWORD) {
    console.error(
      "❌ Please set INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD in .env file"
    );
    process.exit(1);
  }

  // Read usernames from CSV
  let usernames;
  try {
    usernames = await readUsernamesFromCSV(CONFIG.CSV_FILE_PATH);
  } catch (error) {
    console.error(`❌ Error reading CSV: ${error.message}`);
    process.exit(1);
  }

  if (usernames.length === 0) {
    console.log("⚠️  No usernames found in CSV file");
    process.exit(0);
  }

  // Launch browser
  console.log(
    `🌐 Launching browser${CONFIG.USE_ARC_BROWSER ? " (Arc)" : ""}...`
  );

  const launchOptions = {
    headless: CONFIG.HEADLESS,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
    ],
  };

  // Use Arc browser if configured
  if (CONFIG.USE_ARC_BROWSER) {
    launchOptions.executablePath = CONFIG.ARC_EXECUTABLE_PATH;
  }

  const browser = await puppeteer.launch(launchOptions);

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Set user agent to avoid detection
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  try {
    // Login
    await loginToInstagram(page);

    // Process unfollows
    let totalUnfollowed = 0;
    let processedInBatch = 0;
    const results = {
      success: [],
      failed: [],
      notFound: [],
      notFollowing: [],
    };

    console.log(`\n📊 Starting to unfollow ${usernames.length} users...\n`);

    for (let i = 0; i < usernames.length; i++) {
      const username = usernames[i];
      const result = await unfollowUser(page, username);

      if (result.success) {
        totalUnfollowed++;
        processedInBatch++;
        results.success.push(username);
        // On successful unfollow, record and remove from source CSV
        try {
          appendToRemovedCSV(username);
          removeUsernameFromCSV(CONFIG.CSV_FILE_PATH, username);
        } catch (e) {
          console.log(`⚠️  Failed updating CSV for ${username}: ${e.message}`);
        }
      } else {
        results.failed.push({ username, reason: result.reason });
        if (result.reason === "profile_not_found") {
          results.notFound.push(username);
        } else if (result.reason === "not_following") {
          results.notFollowing.push(username);
          // If we already aren't following, treat as removed: add to removed CSV and remove from source CSV
          try {
            appendToRemovedCSV(username);
            removeUsernameFromCSV(CONFIG.CSV_FILE_PATH, username);
          } catch (e) {
            console.log(
              `⚠️  Failed updating CSV for ${username}: ${e.message}`
            );
          }
        }
      }

      // Rate limiting and per-unfollow delay: only apply the longer waits and
      // the 2-4s per-unfollow delay when an unfollow action actually
      // occurred. If the profile was missing or you weren't following, skip
      // the long waits and only do a very short pause so the script can
      // continue quickly.
      if (result.success) {
        if (
          processedInBatch === CONFIG.BATCH_SIZE_SMALL &&
          totalUnfollowed % CONFIG.BATCH_SIZE_LARGE !== 0
        ) {
          console.log(
            `\n⏳ Completed ${processedInBatch} unfollows. Waiting 1 minute...\n`
          );
          await sleep(CONFIG.WAIT_TIME_SHORT);
          processedInBatch = 0;
        } else if (
          totalUnfollowed > 0 &&
          totalUnfollowed % CONFIG.BATCH_SIZE_LARGE === 0
        ) {
          console.log(
            `\n⏳ Completed ${CONFIG.BATCH_SIZE_LARGE} unfollows. Waiting 5 minutes...\n`
          );
          await sleep(CONFIG.WAIT_TIME_LONG);
          processedInBatch = 0;
        }

        // Add small delay between each successful unfollow (2-4s)
        await sleep(1000 + Math.random() * 2000);
      } else {
        // No unfollow performed: skip long waits and heavy delay. A tiny
        // throttle to avoid too-fast navigation (300-600ms).
        await sleep(300 + Math.random() * 300);
      }
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Successfully unfollowed: ${results.success.length}`);
    console.log(`❌ Failed to unfollow: ${results.failed.length}`);
    console.log(`🚫 Profiles not found: ${results.notFound.length}`);
    console.log(`⚠️  Not following: ${results.notFollowing.length}`);
    console.log("=".repeat(50));

    if (results.notFound.length > 0) {
      console.log("\n🚫 Profiles not found:");
      results.notFound.forEach((u) => console.log(`  - ${u}`));
    }

    if (results.notFollowing.length > 0) {
      console.log("\n⚠️  Profiles you weren't following:");
      results.notFollowing.forEach((u) => console.log(`  - ${u}`));
    }

    // Save results to file
    const resultsLog = {
      timestamp: new Date().toISOString(),
      total: usernames.length,
      ...results,
    };

    fs.writeFileSync(
      "./unfollow_results.json",
      JSON.stringify(resultsLog, null, 2)
    );
    console.log("\n💾 Results saved to unfollow_results.json");
  } catch (error) {
    console.error(`❌ Fatal error: ${error.message}`);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log("\n👋 Browser closed. Done!");
  }
}

// Run the script
main().catch(console.error);
