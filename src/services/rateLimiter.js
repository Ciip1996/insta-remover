import { config } from "../config.js";
import { sleep } from "../utils/sleep.js";

/**
 * Rate limiter to control unfollow frequency
 */
export class RateLimiter {
  constructor() {
    this.totalUnfollowed = 0;
    this.processedInBatch = 0;
  }

  /**
   * Apply rate limiting delays after successful unfollows
   */
  async applySuccessDelay() {
    this.totalUnfollowed++;
    this.processedInBatch++;

    // Check for small batch wait
    if (
      this.processedInBatch === config.batchSizeSmall &&
      this.totalUnfollowed % config.batchSizeLarge !== 0
    ) {
      console.log(
        `\n⏳ Completed ${this.processedInBatch} unfollows. Waiting 0.5 minute...\n`
      );
      await sleep(config.waitTimeShort);
      this.processedInBatch = 0;
    }
    // Check for large batch wait
    else if (
      this.totalUnfollowed > 0 &&
      this.totalUnfollowed % config.batchSizeLarge === 0
    ) {
      console.log(
        `\n⏳ Completed ${config.batchSizeLarge} unfollows. Waiting 5 minutes...\n`
      );
      await sleep(config.waitTimeLong);
      this.processedInBatch = 0;
    }

    // Add small delay between each successful unfollow (1-3s)
    await sleep(1000 + Math.random() * 2000);
  }

  /**
   * Apply minimal delay for skipped entries
   */
  async applySkipDelay() {
    // Tiny throttle to avoid too-fast navigation (300-600ms)
    await sleep(300 + Math.random() * 300);
  }
}
