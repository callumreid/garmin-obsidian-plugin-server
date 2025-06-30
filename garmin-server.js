const express = require('express');
const cors = require('cors');
const { GarminConnect } = require('garmin-connect');

const app = express();
const port = 3001;

// Enable CORS for Obsidian plugin
app.use(cors());
app.use(express.json());

// Your Garmin credentials
const GARMIN_USERNAME = 'callum.taylor.reid@gmail.com';
const GARMIN_PASSWORD = 'Bikesforchumps69!';

let garminInstance = null;
let lastLoginTime = null;

async function getGarminConnection() {
    const now = Date.now();
    
    // Re-login if more than 1 hour has passed
    if (!garminInstance || !lastLoginTime || (now - lastLoginTime) > 3600000) {
        console.log('Logging into Garmin Connect...');
        garminInstance = new GarminConnect({
            username: GARMIN_USERNAME,
            password: GARMIN_PASSWORD
        });
        
        await garminInstance.login();
        lastLoginTime = now;
        console.log('✅ Logged into Garmin Connect');
    }
    
    return garminInstance;
}

app.get('/garmin-data', async (req, res) => {
    try {
        // Get date from query parameter or use today
        const dateParam = req.query.date;
        let targetDate;
        let dateStr;
        
        if (dateParam) {
            targetDate = new Date(dateParam);
            dateStr = dateParam;
            console.log(`Fetching Garmin data for ${dateStr}...`);
        } else {
            targetDate = new Date();
            dateStr = targetDate.toISOString().split('T')[0];
            console.log('Fetching Garmin data for today...');
        }
        
        const garmin = await getGarminConnection();
        
        // Fetch sleep and activity data
        const [sleepData, activities] = await Promise.all([
            garmin.getSleepData(targetDate).catch(err => {
                console.log('Sleep data error:', err.message);
                return null;
            }),
            garmin.getActivities(0, 50).catch(err => { // Get more activities for backfill
                console.log('Activities error:', err.message);
                return [];
            })
        ]);

        // Filter activities for the target date
        const targetDateActivities = activities.filter(activity => {
            const activityDate = new Date(activity.startTimeLocal).toISOString().split('T')[0];
            return activityDate === dateStr;
        });

        // Format exercises
        const exercises = targetDateActivities.map(activity => ({
            type: activity.activityType?.typeKey || 'Exercise',
            startTime: new Date(activity.startTimeLocal).toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            duration: activity.duration || 0,
            calories: activity.calories,
            distance: activity.distance ? (activity.distance / 1000) : undefined
        }));

        // Format response
        const response = {
            date: dateStr,
            sleepScore: sleepData?.dailySleepDTO?.sleepScores?.overall?.value,
            sleepStartTime: sleepData?.dailySleepDTO?.sleepStartTimestampLocal ? 
                new Date(sleepData.dailySleepDTO.sleepStartTimestampLocal).toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }) : undefined,
            sleepEndTime: sleepData?.dailySleepDTO?.sleepEndTimestampLocal ? 
                new Date(sleepData.dailySleepDTO.sleepEndTimestampLocal).toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }) : undefined,
            exercises: exercises
        };

        console.log('✅ Garmin data fetched successfully');
        console.log('Sleep score:', response.sleepScore);
        console.log('Activities:', exercises.length);
        
        res.json(response);
        
    } catch (error) {
        console.error('❌ Error fetching Garmin data:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Garmin server is running' });
});

app.listen(port, () => {
    console.log(`🚀 Garmin server running at http://localhost:${port}`);
    console.log(`📊 Garmin data endpoint: http://localhost:${port}/garmin-data`);
});

process.on('SIGINT', () => {
    console.log('\n👋 Shutting down Garmin server...');
    process.exit(0);
});