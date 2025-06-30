const { GarminConnect } = require('garmin-connect');

async function testGarminConnection() {
    try {
        const garmin = new GarminConnect({
            username: 'callum.taylor.reid@gmail.com',
            password: 'Bikesforchumps69!'
        });
        
        console.log('Attempting to login...');
        await garmin.login();
        console.log('✅ Login successful!');
        
        const today = new Date();
        console.log('Fetching today\'s data...');
        
        // Test sleep data
        try {
            const sleepData = await garmin.getSleepData(today);
            console.log('Sleep data:', sleepData);
        } catch (e) {
            console.log('getSleepData failed:', e.message);
        }
        
        try {
            const sleepDuration = await garmin.getSleepDuration(today);
            console.log('Sleep duration:', sleepDuration);
        } catch (e) {
            console.log('getSleepDuration failed:', e.message);
        }
        
        // Test activities
        try {
            const activities = await garmin.getActivities(0, 5);
            console.log('Recent activities:', activities.length);
            activities.forEach((activity, i) => {
                console.log(`${i+1}. ${activity.activityType?.typeKey || 'Unknown'} - ${activity.startTimeLocal}`);
            });
        } catch (e) {
            console.log('No activities found:', e.message);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testGarminConnection();
