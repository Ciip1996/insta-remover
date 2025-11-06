import dotenv from "dotenv";

dotenv.config();

/**
 * Application configuration
 * Centralizes all environment variables and default settings
 */
export const config = {
  // Batch processing settings
  batchSizeSmall: 10,
  batchSizeLarge: 100,
  waitTimeShort: 0.5 * 60 * 1000, // 0.5 minutes
  waitTimeLong: 5 * 60 * 1000, // 5 minutes

  // Follower threshold settings
  minFollowersToUnfollow:
    parseInt(process.env.MIN_FOLLOWERS_TO_UNFOLLOW, 10) || 3000,
  skipForFollowersEnabled: process.env.SKIP_FOR_FOLLOWERS_ENABLED
    ? process.env.SKIP_FOR_FOLLOWERS_ENABLED === "true"
    : true,

  // Instagram credentials
  instagram: {
    username: process.env.INSTAGRAM_USERNAME,
    password: process.env.INSTAGRAM_PASSWORD,
  },

  // File paths
  // Input CSV stays in root for easy access
  csvFilePath: process.env.CSV_FILE_PATH || "./users_to_unfollow.csv",

  // All outputs go to output/ directory to keep root clean
  outputDir: "./output/",
  removedUsersPath: "./output/removed_users.csv",
  skippedUsersPath: "./output/skipped_users.csv",
  notFoundUsersPath: "./output/not_found_users.csv",
  resultsLogPath: "./output/unfollow_results.json",

  // Browser settings
  headless: process.env.HEADLESS === "true" || false,
  useArcBrowser: process.env.USE_ARC_BROWSER === "true" || false,
  arcExecutablePath:
    process.env.ARC_EXECUTABLE_PATH ||
    "/Applications/Arc.app/Contents/MacOS/Arc",
};

/**
 * Validates required configuration
 * @throws {Error} if required config is missing
 */
export function validateConfig() {
  if (!config.instagram.username || !config.instagram.password) {
    throw new Error(
      "Missing required configuration: INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD must be set in .env file"
    );
  }
}
