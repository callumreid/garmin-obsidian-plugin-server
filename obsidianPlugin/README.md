# Garmin Data Sync for Obsidian

Sync your Garmin Forerunner 265 S (and other Garmin devices) health data directly to your Obsidian daily notes.

## Features

- 📊 Sleep score and sleep duration
- 🏃‍♂️ Exercise activities with time, duration, calories, and distance
- 📝 Automatic daily note integration
- ⚙️ Configurable settings
- 🔄 Manual sync or auto-sync on startup

## Installation

### Method 1: Manual Installation (For Testing)

1. **Build the plugin:**
   ```bash
   cd /path/to/obsidianPlugin
   npm install
   npm run build
   ```

2. **Copy to Obsidian:**
   - Create folder: `YourVault/.obsidian/plugins/garmin-sync/`
   - Copy these files to that folder:
     - `main.js`
     - `manifest.json`
     - `styles.css` (if exists)

3. **Enable in Obsidian:**
   - Settings → Community Plugins → Enable "Garmin Data Sync"

### Method 2: Community Plugin (Coming Soon)
This plugin will be submitted to the Obsidian Community Plugin directory.

## Setup Your Garmin Connection

1. **Get Garmin Connect Account:**
   - You need a Garmin Connect account (free)
   - Same login you use for Garmin Connect app/website

2. **Configure in Obsidian:**
   - Settings → Garmin Data Sync
   - Enter your Garmin Connect username/email
   - Enter your Garmin Connect password
   - Set your daily notes folder (optional)

## Testing the Connection

### Test 1: Manual Sync
1. Click the activity icon in the ribbon (left sidebar)
2. Or use Command Palette: "Sync Garmin Data"
3. Check for success/error notifications

### Test 2: Check Daily Note
Look for a section like this in today's note:
```markdown
## Garmin Data

**Sleep Score:** 85
**Sleep Time:** 22:30 - 06:45

**Exercises:**
- Running at 07:00 (30 min) - 245 cal - 3.2 km
```

### Test 3: Debug Console
1. Open Developer Tools: `Ctrl/Cmd + Shift + I`
2. Go to Console tab
3. Run sync and look for error messages

## Troubleshooting

**"Please configure Garmin credentials"**
- Check username/password in settings
- Make sure you can log into garmin.com with same credentials

**"Failed to sync Garmin data"**
- Check internet connection
- Verify Garmin Connect is working
- Check Developer Console for detailed errors

**No data appears**
- Make sure you have recent activity/sleep data on Garmin Connect
- Plugin only fetches today's data
- Check if daily note was created properly

## Sharing with Others

### For Developers
1. Fork/clone this repository
2. Make improvements
3. Submit pull requests

### For Regular Users
1. Share the built plugin files
2. Or wait for Community Plugin approval
3. Send them this README for setup instructions

## Privacy & Security

- Your Garmin credentials are stored locally in Obsidian
- No data is sent to external servers except Garmin Connect
- All communication is direct between your device and Garmin

## Development

```bash
# Development mode (auto-rebuild)
npm run dev

# Production build
npm run build

# Type checking
npm run build
```

## Support

- Check the console for error messages
- Ensure your Garmin device synced recently
- Test your credentials on garmin.com first