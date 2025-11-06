import fs from "fs";
import csv from "csv-parser";

/**
 * Read usernames from a CSV file
 * Supports multiple column names: username, user, handle, instagram_username, Username
 * @param {string} filePath - path to CSV file
 * @returns {Promise<string[]>} array of usernames
 */
export async function readUsernamesFromCSV(filePath) {
  return new Promise((resolve, reject) => {
    const usernames = [];

    if (!fs.existsSync(filePath)) {
      reject(new Error(`CSV file not found at: ${filePath}`));
      return;
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        // Support multiple column names
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
