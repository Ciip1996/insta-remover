import { config } from "../config.js";
import { sleep } from "../utils/sleep.js";
import { appendToCSV, removeUsernameFromCSV } from "../utils/csvManager.js";
import { getFollowerCount } from "../utils/followerParser.js";
import {
  checkProfileExists,
  clickFollowingButton,
  confirmUnfollow,
  logModalContent,
} from "./instagram.js";

/**
 * Unfollow a user with all validation and error handling
 * @param {import('puppeteer').Page} page - Puppeteer page object
 * @param {string} username - Instagram username to unfollow
 * @returns {Promise<{success: boolean, reason?: string, followers?: number, error?: string}>}
 */
export async function unfollowUser(page, username) {
  try {
    console.log(`🔄 Processing: ${username}`);

    // Check if profile exists
    const exists = await checkProfileExists(page, username);
    if (!exists) {
      console.log(`❌ Profile does not exist: ${username}`);
      return { success: false, reason: "profile_not_found" };
    }

    await sleep(500);

    // Get follower count and apply threshold validation
    const followers = await getFollowerCount(page);
    if (followers === null) {
      console.log(
        `⚠️  Could not determine follower count for ${username}, skipping`
      );
      return { success: false, reason: "follower_count_unknown" };
    }

    if (followers < config.minFollowersToUnfollow) {
      console.log(
        `ℹ️  Skipping ${username}: ${followers} followers < threshold ${config.minFollowersToUnfollow}`
      );

      // If the skip-to-CSV feature is enabled, record and remove the entry
      if (config.skipForFollowersEnabled) {
        try {
          appendToCSV(config.skippedUsersPath, username);
          removeUsernameFromCSV(config.csvFilePath, username);
        } catch (e) {
          console.log(
            `⚠️  Failed updating skipped CSV for ${username}: ${e.message}`
          );
        }
      } else {
        console.log(
          `ℹ️  SKIP_FOR_FOLLOWERS_ENABLED=false -> leaving ${username} in source CSV`
        );
      }

      return { success: false, reason: "below_threshold", followers };
    }

    // Look for the "Following" button
    const followingButton = await clickFollowingButton(page);
    if (!followingButton) {
      console.log(`⚠️  Not following ${username} or couldn't find button`);
      return { success: false, reason: "not_following" };
    }

    // Wait for the unfollow confirmation modal to appear
    console.log(`   Waiting for confirmation modal...`);
    await sleep(2000);

    // Try to click the unfollow option in the modal
    const unfollowConfirmed = await confirmUnfollow(page);

    if (unfollowConfirmed) {
      console.log(`✅ Successfully unfollowed: ${username}`);
      await sleep(1500);
      return { success: true };
    } else {
      console.log(`⚠️  Could not confirm unfollow for: ${username}`);
      // Debug: Log what's in the modal
      await logModalContent(page);
      return { success: false, reason: "unfollow_failed" };
    }
  } catch (error) {
    console.log(`❌ Error unfollowing ${username}: ${error.message}`);
    return { success: false, reason: "error", error: error.message };
  }
}

/**
 * Handle post-unfollow actions (CSV updates)
 * @param {string} username - username that was processed
 * @param {{success: boolean, reason?: string}} result - unfollow result
 */
export function handleUnfollowResult(username, result) {
  if (result.success) {
    // On successful unfollow, record and remove from source CSV
    try {
      appendToCSV(config.removedUsersPath, username);
      removeUsernameFromCSV(config.csvFilePath, username);
    } catch (e) {
      console.log(`⚠️  Failed updating CSV for ${username}: ${e.message}`);
    }
  } else if (result.reason === "not_following") {
    // If we already aren't following, treat as removed
    try {
      appendToCSV(config.removedUsersPath, username);
      removeUsernameFromCSV(config.csvFilePath, username);
    } catch (e) {
      console.log(`⚠️  Failed updating CSV for ${username}: ${e.message}`);
    }
  } else if (result.reason === "profile_not_found") {
    // Profile not available (blocked, deleted, or username changed)
    try {
      appendToCSV(config.notFoundUsersPath, username);
      removeUsernameFromCSV(config.csvFilePath, username);
      console.log(`  → Added to not_found_users.csv (profile not available)`);
    } catch (e) {
      console.log(
        `⚠️  Failed updating not_found CSV for ${username}: ${e.message}`
      );
    }
  }
}
