/**
 * Parse follower count strings like "3,200", "4.5k", "1.2m" into integers
 * @param {string} text - follower count text
 * @returns {number|null} parsed follower count or null if invalid
 */
export function parseFollowersText(text) {
  if (!text) return null;

  const t = text.trim().toLowerCase();
  // Remove "followers" label
  const onlyNumber = t.replace(/followers?/i, "").trim();
  // Remove spaces
  const s = onlyNumber.replace(/\s+/g, "");

  // Match K/M shorthand: e.g., "3.2k", "1.5m", "3,200"
  const match = s.match(/^([0-9,.]*)(k|m)?$/i);
  if (!match) return null;

  let num = match[1] || "0";
  num = num.replace(/,/g, "");
  const suffix = match[2];

  let value = parseFloat(num);
  if (Number.isNaN(value)) return null;

  if (suffix === "k") value = Math.round(value * 1000);
  if (suffix === "m") value = Math.round(value * 1000000);

  return Math.round(value);
}

/**
 * Extract follower count from a profile page
 * @param {import('puppeteer').Page} page - Puppeteer page object
 * @returns {Promise<number|null>} follower count or null if cannot be determined
 */
export async function getFollowerCount(page) {
  try {
    const text = await page.evaluate(() => {
      // Strategy 1: find an <a> that links to '/followers/' and get its innerText or child <span>
      const a = Array.from(document.querySelectorAll("a")).find(
        (el) => el.href && /\/followers\/?($|\?)/i.test(el.href)
      );
      if (a) {
        const span = a.querySelector("span");
        if (span) {
          return span.getAttribute("title") || span.innerText || a.innerText;
        }
        return a.getAttribute("title") || a.innerText;
      }

      // Strategy 2: look for header counts (li elements inside header)
      const header = document.querySelector("header");
      if (header) {
        const possible = Array.from(header.querySelectorAll("li, a, span"));
        for (const el of possible) {
          const txt =
            (el.getAttribute && (el.getAttribute("title") || el.innerText)) ||
            el.innerText;
          if (txt && /followers?/i.test(txt)) return txt;
        }
      }

      // Strategy 3: search document for text nodes containing 'followers'
      const all = Array.from(document.querySelectorAll("*"));
      for (const el of all) {
        const txt = el.textContent || "";
        if (/followers?/i.test(txt)) {
          return txt;
        }
      }

      return null;
    });

    if (!text) return null;

    // Extract the first numeric token (e.g., "3,200 followers" or "3.2k followers")
    const numMatch = text.match(/([0-9,.]+\s*[kmKM]?)/);
    const candidate = numMatch ? numMatch[0] : text;

    return parseFollowersText(candidate);
  } catch (e) {
    console.log(`⚠️  Error getting follower count: ${e.message}`);
    return null;
  }
}
