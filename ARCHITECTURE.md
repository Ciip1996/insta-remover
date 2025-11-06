# Instagram Unfollower Bot - Code Structure

## Project Structure

```
insta-remover/
├── index.js                      # Entry point
├── package.json                  # Dependencies
├── .env                          # Configuration (not in git)
├── src/
│   ├── config.js                 # Configuration management
│   ├── main.js                   # Main orchestrator
│   ├── utils/                    # Utility functions
│   │   ├── sleep.js             # Sleep utility
│   │   ├── csvManager.js        # CSV write/update operations
│   │   ├── csvReader.js         # CSV reading operations
│   │   └── followerParser.js    # Follower count parsing
│   └── services/                 # Business logic services
│       ├── browserService.js    # Browser/page creation
│       ├── instagram.js         # Instagram UI interactions
│       ├── unfollowService.js   # Unfollow workflow
│       ├── rateLimiter.js       # Rate limiting logic
│       └── resultTracker.js     # Result tracking and reporting
└── users_to_unfollow.csv        # Input CSV
```

## Architecture Overview

The codebase follows clean architecture principles with clear separation of concerns:

### 1. **Entry Point** (`index.js`)

- Minimal entry point that delegates to the main orchestrator
- Handles top-level error catching

### 2. **Configuration** (`src/config.js`)

- Centralized configuration management
- Environment variable loading with defaults
- Configuration validation

### 3. **Utilities** (`src/utils/`)

Reusable, pure functions with no side effects:

- **sleep.js**: Promise-based delay utility
- **csvManager.js**: CSV file append/remove operations
- **csvReader.js**: CSV file reading and parsing
- **followerParser.js**: Instagram follower count extraction and parsing

### 4. **Services** (`src/services/`)

Business logic and external interactions:

- **browserService.js**: Puppeteer browser/page setup
- **instagram.js**: Low-level Instagram UI interactions (login, button clicks, etc.)
- **unfollowService.js**: High-level unfollow workflow orchestration
- **rateLimiter.js**: Rate limiting state and delay application
- **resultTracker.js**: Result aggregation and reporting

### 5. **Main Orchestrator** (`src/main.js`)

- Coordinates the entire workflow
- Manages high-level application flow
- Handles errors and cleanup

## Design Principles Applied

### Single Responsibility Principle (SRP)

Each module has one clear purpose:

- `csvReader.js` only reads CSV files
- `instagram.js` only handles Instagram UI interactions
- `rateLimiter.js` only manages rate limiting logic

### Dependency Inversion

- High-level modules (main.js, unfollowService.js) don't depend on low-level details
- Dependencies flow inward (utils ← services ← main)

### Separation of Concerns

- **Configuration**: `config.js`
- **I/O Operations**: `csvManager.js`, `csvReader.js`
- **Business Logic**: Service layer
- **Orchestration**: `main.js`

### DRY (Don't Repeat Yourself)

- Common CSV operations extracted to `csvManager.js`
- Sleep utility extracted to dedicated module
- Rate limiting logic centralized in `rateLimiter.js`

### Clean Code Practices

- Descriptive function and variable names
- JSDoc comments for all public functions
- Small, focused functions
- Clear error handling
- Consistent code style

## Module Dependencies

```
index.js
  └── main.js
       ├── config.js
       ├── csvReader.js
       ├── browserService.js
       ├── instagram.js
       ├── unfollowService.js
       │    ├── config.js
       │    ├── sleep.js
       │    ├── csvManager.js
       │    ├── followerParser.js
       │    └── instagram.js
       ├── rateLimiter.js
       │    ├── config.js
       │    └── sleep.js
       └── resultTracker.js
                └── config.js
```

## Benefits of This Structure

1. **Maintainability**: Each module is small and focused
2. **Testability**: Pure functions and isolated services are easy to test
3. **Scalability**: New features can be added without modifying existing code
4. **Readability**: Clear organization makes it easy to find code
5. **Reusability**: Utilities and services can be reused across features
6. **Error Isolation**: Errors are easier to locate and fix

## Running the Application

```bash
# Install dependencies
npm install

# Run the application
npm start
# or
node index.js
```

## Environment Variables

All configuration is managed through `.env`:

```env
# Instagram credentials (required)
INSTAGRAM_USERNAME=your_username
INSTAGRAM_PASSWORD=your_password

# CSV file path (optional)
CSV_FILE_PATH=./users_to_unfollow.csv

# Follower threshold (optional, defaults to 3000)
MIN_FOLLOWERS_TO_UNFOLLOW=3000

# Skip feature flag (optional, defaults to true)
SKIP_FOR_FOLLOWERS_ENABLED=true

# Browser settings (optional)
HEADLESS=false
USE_ARC_BROWSER=false
ARC_EXECUTABLE_PATH=/Applications/Arc.app/Contents/MacOS/Arc
```

## Future Improvements

Potential enhancements that maintain the clean architecture:

1. **Add unit tests**: Test utilities and services independently
2. **Add integration tests**: Test the full workflow
3. **Add logging service**: Centralized logging with levels
4. **Add retry logic**: Handle transient failures
5. **Add progress bar**: Visual progress indicator
6. **Database support**: Replace CSV with SQLite or similar
7. **CLI arguments**: Override config with command-line args
8. **Multi-account support**: Process multiple Instagram accounts
