import fs from "fs";

/**
 * Append a username to a CSV file (creates file with header if needed)
 * @param {string} filePath - path to CSV file
 * @param {string} username - username to append
 * @param {string} header - CSV header (default: "username")
 */
export function appendToCSV(filePath, username, header = "username") {
  let existing = "";
  if (fs.existsSync(filePath)) {
    existing = fs.readFileSync(filePath, "utf8");
  }

  // Normalize username (no @ and trimmed)
  const clean = username.trim().replace(/^@/, "");

  // Check if already present to avoid duplicates
  const already = existing
    .split(/\r?\n/)
    .map((l) => l.replace(/"/g, "").split(",")[0]?.trim())
    .filter(Boolean)
    .some((u) => u.toLowerCase() === clean.toLowerCase());

  if (already) return;

  if (!existing) {
    // Create with header
    fs.writeFileSync(filePath, `${header}\n${clean}\n`, "utf8");
  } else {
    fs.appendFileSync(filePath, `${clean}\n`, "utf8");
  }
}

/**
 * Remove a username from a CSV file
 * Rewrites the CSV as a single-column file with header 'username'
 * NOTE: This simplifies multi-column CSVs into a single-column file
 * @param {string} filePath - path to CSV file
 * @param {string} username - username to remove
 */
export function removeUsernameFromCSV(filePath, username) {
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
