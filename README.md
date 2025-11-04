# Instagram Unfollower Bot 🤖

Automated Instagram unfollower tool using Puppeteer with intelligent rate limiting to avoid detection.

## Features ✨

- ✅ Automated unfollowing from CSV list
- ✅ Smart rate limiting (10 unfollows → 2min wait; 50 unfollows → 30min wait)
- ✅ Profile validation (checks if accounts exist)
- ✅ Detailed logging and results export
- ✅ Random delays to mimic human behavior
- ✅ Headless or visible browser mode

## How It Works 🔧

The bot follows this logic:

1. **Unfollows 10 users** → Waits **2 minutes**
2. Repeats until **50 users** are unfollowed → Waits **30 minutes**
3. Continues this pattern until all users are processed
4. Validates each profile before attempting to unfollow
5. Logs profiles that don't exist or you're not following

## Installation 📦

1. Clone or download this repository

2. Install dependencies:

```bash
npm install
```

3. Create your `.env` file:

```bash
cp .env.example .env
```

4. Edit `.env` with your Instagram credentials:

```env
INSTAGRAM_USERNAME=your_username_here
INSTAGRAM_PASSWORD=your_password_here
CSV_FILE_PATH=./users_to_unfollow.csv
HEADLESS=false
```

## CSV Format 📋

Create a CSV file with usernames to unfollow. The file should have a header row with one of these column names:

- `username`
- `user`
- `handle`
- `instagram_username`

Example (`users_to_unfollow.csv`):

```csv
username
user1
user2
user3
example_user
```

## Usage 🚀

1. **Prepare your CSV file** with Instagram usernames to unfollow

2. **Configure your credentials** in `.env` file

3. **Run the bot**:

```bash
npm start
```

4. **Watch the magic happen!** The browser will open (unless headless mode is enabled) and start unfollowing users automatically.

## Output 📊

The bot provides:

- Real-time console logging of each action
- A summary at the end showing:
  - Successfully unfollowed users
  - Failed unfollows
  - Profiles not found
  - Profiles you weren't following
- `unfollow_results.json` - Detailed results file for your records

## Configuration Options ⚙️

| Variable             | Description                  | Default                   |
| -------------------- | ---------------------------- | ------------------------- |
| `INSTAGRAM_USERNAME` | Your Instagram username      | Required                  |
| `INSTAGRAM_PASSWORD` | Your Instagram password      | Required                  |
| `CSV_FILE_PATH`      | Path to your CSV file        | `./users_to_unfollow.csv` |
| `HEADLESS`           | Run browser in headless mode | `false`                   |

## Rate Limiting 🕐

The bot includes intelligent rate limiting to avoid Instagram's spam detection:

- **Every 10 unfollows**: 2-minute wait
- **Every 50 unfollows**: 30-minute wait
- **Between unfollows**: 2-4 seconds random delay

## Important Notes ⚠️

1. **Use at your own risk**: Automated actions may violate Instagram's Terms of Service
2. **Account safety**: Use a test account first or be prepared for potential account restrictions
3. **Rate limits**: Instagram has strict rate limits; the bot includes delays to minimize risk
4. **Stay logged in**: Don't log in from other devices while the bot is running
5. **Two-factor authentication**: If enabled, you may need to handle it manually on first run

## Troubleshooting 🔍

### "Login failed" or button not found

- Instagram's UI changes frequently
- Try running in non-headless mode (`HEADLESS=false`) to see what's happening
- You may need to handle 2FA manually

### "Profile not found" for valid accounts

- The profile might be private or restricted
- Instagram might be rate-limiting your requests
- Wait and try again later

### Bot stops unexpectedly

- Check your internet connection
- Instagram might have detected automation
- Check `unfollow_results.json` to see progress

## CSV Column Name Support 📝

The bot supports multiple CSV column names for flexibility:

- `username`
- `user`
- `handle`
- `instagram_username`
- `Username` (case-insensitive)

It automatically removes @ symbols if present.

## Example Output 💻

```
🚀 Instagram Unfollower Bot Starting...

📋 Loaded 25 usernames from CSV
🌐 Launching browser...
🔐 Logging in to Instagram...
✅ Successfully logged in!

📊 Starting to unfollow 25 users...

🔄 Processing: user1
✅ Successfully unfollowed: user1
🔄 Processing: user2
✅ Successfully unfollowed: user2
...
⏳ Completed 10 unfollows. Waiting 2 minutes...
...
⏳ Completed 50 unfollows. Waiting 30 minutes...

==================================================
📊 SUMMARY
==================================================
✅ Successfully unfollowed: 20
❌ Failed to unfollow: 5
🚫 Profiles not found: 3
⚠️  Not following: 2
==================================================

💾 Results saved to unfollow_results.json
👋 Browser closed. Done!
```

## License 📄

MIT License - Use at your own risk

## Disclaimer ⚖️

This tool is for educational purposes only. The author is not responsible for any account restrictions, bans, or other consequences that may result from using this tool. Use responsibly and at your own risk.

---

**Made with ❤️ for automating tedious tasks**
