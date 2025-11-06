import fs from "fs";
import { config } from "../config.js";

/**
 * Result tracker for unfollow operations
 */
export class ResultTracker {
  constructor() {
    this.results = {
      success: [],
      failed: [],
      notFound: [],
      notFollowing: [],
      belowThreshold: [],
      followerCountUnknown: [],
    };
  }

  /**
   * Track a successful unfollow
   * @param {string} username
   */
  trackSuccess(username) {
    this.results.success.push(username);
  }

  /**
   * Track a failed unfollow
   * @param {string} username
   * @param {{reason: string, followers?: number}} result
   */
  trackFailure(username, result) {
    this.results.failed.push({ username, reason: result.reason });

    switch (result.reason) {
      case "profile_not_found":
        this.results.notFound.push(username);
        break;
      case "not_following":
        this.results.notFollowing.push(username);
        break;
      case "below_threshold":
        this.results.belowThreshold.push({
          username,
          followers: result.followers,
        });
        break;
      case "follower_count_unknown":
        this.results.followerCountUnknown.push(username);
        break;
    }
  }

  /**
   * Print summary to console
   * @param {number} totalProcessed - total number of usernames processed
   */
  printSummary(totalProcessed) {
    console.log("\n" + "=".repeat(50));
    console.log("📊 SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Successfully unfollowed: ${this.results.success.length}`);
    console.log(`❌ Failed to unfollow: ${this.results.failed.length}`);
    console.log(`🚫 Profiles not found: ${this.results.notFound.length}`);
    console.log(`⚠️  Not following: ${this.results.notFollowing.length}`);
    console.log(
      `🔎 Skipped (below threshold ${config.minFollowersToUnfollow}): ${this.results.belowThreshold.length}`
    );
    console.log(
      `❓ Follower count unknown: ${this.results.followerCountUnknown.length}`
    );
    console.log("=".repeat(50));

    // Print detailed lists
    this.printDetailedList("🚫 Profiles not found:", this.results.notFound);

    this.printDetailedList(
      "⚠️  Profiles you weren't following:",
      this.results.notFollowing
    );

    if (this.results.belowThreshold.length > 0) {
      console.log(
        `\n🔎 Profiles skipped (below ${config.minFollowersToUnfollow} followers):`
      );
      this.results.belowThreshold.forEach((u) =>
        console.log(`  - ${u.username} (${u.followers} followers)`)
      );
    }

    this.printDetailedList(
      "❓ Profiles with unknown follower count:",
      this.results.followerCountUnknown
    );
  }

  /**
   * Print a detailed list if it has items
   * @param {string} title
   * @param {string[]} items
   */
  printDetailedList(title, items) {
    if (items.length > 0) {
      console.log(`\n${title}`);
      items.forEach((u) => console.log(`  - ${u}`));
    }
  }

  /**
   * Save results to JSON file
   * @param {number} totalProcessed - total number of usernames processed
   */
  saveToFile(totalProcessed) {
    const resultsLog = {
      timestamp: new Date().toISOString(),
      total: totalProcessed,
      ...this.results,
    };

    fs.writeFileSync(
      config.resultsLogPath,
      JSON.stringify(resultsLog, null, 2)
    );
    console.log(`\n💾 Results saved to ${config.resultsLogPath}`);
  }
}
