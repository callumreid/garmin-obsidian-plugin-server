# Garmin Obsidian Plugin Server

Complete system for syncing Garmin Connect data to Obsidian daily notes.

## 🚀 Quick Start

### 1. Start the Garmin Server
```bash
cd /Users/bronson/bronson/garminObsidianPluginServer
./start-garmin-server.sh
```

### 2. Enable Plugin in Obsidian
- Settings → Community Plugins → Enable "Garmin Connect Plugin"
- Configure your Garmin username/password in plugin settings

### 3. Sync Today's Data
- Click the activity icon in Obsidian ribbon, OR
- Command Palette → "Sync Garmin Data"

## 📂 Files

### Core System
- `garmin-server.js` - Node.js server that fetches data from Garmin Connect
- `start-garmin-server.sh` - Convenience script to start the server
- `obsidianPlugin/` - Obsidian plugin source code

### Backfill Scripts
- `backfill-garmin.js` - Programmatic backfill for date ranges
- `test-garmin.js` - Test Garmin Connect API connection

### Development Tools
- `build-plugin.sh` - Build the Obsidian plugin
- `compile-plugin.js` - Compile TypeScript to JavaScript
- `manual-backfill.sh` - Manual backfill testing
- `test-backfill.js` - Test backfill functionality

## 📊 Backfill Usage

### Install Dependencies
```bash
npm install node-fetch
```

### Backfill Commands
```bash
# Single date
node backfill-garmin.js 2025-06-27

# Date range  
node backfill-garmin.js 2025-06-25 2025-06-29

# Last week
node backfill-garmin.js --last-week
```

## 🔧 Server API

- `GET /garmin-data` - Today's data
- `GET /garmin-data?date=YYYY-MM-DD` - Specific date
- `GET /health` - Server health check

## 📝 Daily Note Format

Creates/updates daily notes with:
```markdown
## Garmin Data

**Sleep Score:** 83
**Sleep Time:** 22:58 - 06:45

**Exercises:**
- cycling at 20:52 (61 min) - 489 cal - 17.4 km
```

## 🗂 File Structure

Daily notes are created in: `VAULT/YYYY/MonthName/MonthName  DD  YYYY.md`

Example: `2025/June/June  27  2025.md`

## ⚙️ Configuration

Update credentials in:
- `garmin-server.js` (lines 10-11)
- Obsidian Plugin Settings