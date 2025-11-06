import { config, validateConfig } from "./config.js";
import { readUsernamesFromCSV } from "./utils/csvReader.js";
import { createBrowser, createPage } from "./services/browserService.js";
import { login } from "./services/instagram.js";
import {
  unfollowUser,
  handleUnfollowResult,
} from "./services/unfollowService.js";
import { RateLimiter } from "./services/rateLimiter.js";
import { ResultTracker } from "./services/resultTracker.js";

/**
 * Main application orchestrator
 * Coordinates the entire unfollow workflow
 */
export async function main() {
  console.log("🚀 Instagram Unfollower Bot Starting...\n");

  // Validate configuration
  try {
    validateConfig();
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }

  // Read usernames from CSV
  let usernames;
  try {
    usernames = await readUsernamesFromCSV(config.csvFilePath);
  } catch (error) {
    console.error(`❌ Error reading CSV: ${error.message}`);
    process.exit(1);
  }

  if (usernames.length === 0) {
    console.log("⚠️  No usernames found in CSV file");
    process.exit(0);
  }

  // Initialize services
  const rateLimiter = new RateLimiter();
  const resultTracker = new ResultTracker();

  // Launch browser
  const browser = await createBrowser();
  const page = await createPage(browser);

  try {
    // Login to Instagram
    await login(page, config.instagram.username, config.instagram.password);

    console.log(`\n📊 Starting to unfollow ${usernames.length} users...\n`);

    // Process each username
    for (let i = 0; i < usernames.length; i++) {
      const username = usernames[i];
      const result = await unfollowUser(page, username);

      if (result.success) {
        resultTracker.trackSuccess(username);
        handleUnfollowResult(username, result);
        await rateLimiter.applySuccessDelay();
      } else {
        resultTracker.trackFailure(username, result);
        handleUnfollowResult(username, result);
        await rateLimiter.applySkipDelay();
      }
    }

    // Print and save results
    resultTracker.printSummary(usernames.length);
    resultTracker.saveToFile(usernames.length);
  } catch (error) {
    console.error(`❌ Fatal error: ${error.message}`);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log("\n👋 Browser closed. Done!");
  }
}
