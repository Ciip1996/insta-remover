# Output Directory

This directory contains all generated files from the Instagram Unfollower Bot.

## Files Generated

- `removed_users.csv` - Users that were successfully unfollowed or already not being followed
- `skipped_users.csv` - Users skipped because they have fewer than the threshold followers
- `not_found_users.csv` - Users that could not be found or have privacy restrictions
- `unfollow_results.json` - Detailed JSON log of each run with timestamps and statistics

## Why Separate Output?

✅ **Clean Root**: Keeps the project root clean and organized  
✅ **Easy Gitignore**: Simple to exclude all outputs with `output/`  
✅ **Clear Separation**: Input CSVs in root, outputs here  
✅ **Better Organization**: All generated files in one place

## .gitignore

These files are typically excluded from version control:

```
output/*.csv
output/*.json
```
