# File Organization - Best Practices

## Directory Structure

```
insta-remover/
├── index.js                        # Entry point
├── package.json                    # Dependencies
├── .env                           # Config (gitignored)
├── .gitignore                     # Root gitignore
│
├── users_to_unfollow.csv          # INPUT: User list (gitignored for privacy)
│
├── output/                        # OUTPUT: All generated files
│   ├── .gitignore                # Excludes all outputs except README
│   ├── README.md                 # Documentation
│   ├── removed_users.csv          # Generated: Successfully unfollowed users
│   ├── skipped_users.csv          # Generated: Users below threshold
│   ├── not_found_users.csv        # Generated: Users not found or blocked
│   ├── unfollow_results.json      # Generated: Detailed execution logs
│
└── src/                          # SOURCE: Application code
    ├── config.js                 # Configuration management
    ├── main.js                   # Main orchestrator
    ├── utils/                    # Utility functions
    │   ├── sleep.js
    │   ├── csvManager.js
    │   ├── csvReader.js
    │   └── followerParser.js
    └── services/                 # Business logic
        ├── browserService.js
        ├── instagram.js
        ├── unfollowService.js
        ├── rateLimiter.js
        └── resultTracker.js
```

## File Organization Principles

### 1. **Input Files in Root**

✅ **Rationale**: Easy to find and edit  
✅ **Example**: `users_to_unfollow.csv`  
✅ **Privacy**: Gitignored to prevent committing user data

### 2. **Output Files in `output/` Directory**

✅ **Rationale**: Separates generated artifacts from source  
✅ **Benefits**:

- Clean root directory
- Simple `.gitignore` patterns
- Clear distinction between inputs and outputs
- Easy to clean/reset (just delete output folder)

### 3. **Source Code in `src/` Directory**

✅ **Rationale**: Separation from configuration and scripts  
✅ **Structure**: Organized by layer (utils, services, main)

### 4. **Configuration Files in Root**

✅ **Rationale**: Standard practice for tooling and environment  
✅ **Examples**: `.env`, `package.json`, `.gitignore`

## Git Strategy

### Root `.gitignore`

```gitignore
# Dependencies
node_modules/

# Environment & secrets
.env

# Logs
*.log

# OS files
.DS_Store

# Input data (privacy)
users_to_unfollow.csv
```

### `output/.gitignore`

```gitignore
# Ignore all generated files
*

# Keep structure documentation
!.gitignore
!README.md
```

This approach ensures:

- The `output/` directory exists in git (for documentation)
- All generated files are ignored
- Team members get the proper structure on clone

## File Paths in Code

Configuration (`src/config.js`) uses relative paths:

```javascript
// Input: Root directory (easy access)
csvFilePath: "./users_to_unfollow.csv";

// Outputs: output/ directory (organized)
outputDir: "./output";
removedUsersPath: "./output/removed_users.csv";
skippedUsersPath: "./output/skipped_users.csv";
notFoundUsersPath: "./output/not_found_users.csv";
resultsLogPath: "./output/unfollow_results.json";
```

## Benefits

| Aspect              | Benefit                                              |
| ------------------- | ---------------------------------------------------- |
| **Clarity**         | Clear separation between inputs, outputs, and source |
| **Maintainability** | Easy to find files by purpose                        |
| **Git**             | Simple ignore patterns, no accidental commits        |
| **Cleanup**         | Delete `output/` to reset without affecting inputs   |
| **Collaboration**   | Consistent structure across team members             |
| **Deployment**      | Easy to exclude outputs from production builds       |

## Environment Variable Override

You can customize paths via `.env`:

```env
# Override input CSV location
CSV_FILE_PATH=./data/my_users.csv

# All outputs still go to ./output/ directory
# (no override needed - best practice enforced)
```

## Migration from Old Structure

If you have files in the root from the previous structure:

```bash
# Move old output files to output/ directory
mv removed_users.csv output/ 2>/dev/null
mv skipped_users.csv output/ 2>/dev/null
mv not_found_users.csv output/ 2>/dev/null
mv unfollow_results*.json output/ 2>/dev/null

# Input CSV stays in root
# (users_to_unfollow.csv)
```

## Future Considerations

As the project grows, consider:

- `data/` directory for multiple input CSVs
- `logs/` directory separate from `output/`
- `temp/` directory for intermediate files
- `archive/` directory for historical outputs

Current structure is optimal for the current scope and easily extensible.
