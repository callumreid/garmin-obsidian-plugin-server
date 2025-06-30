const fs = require('fs');
const path = require('path');

// Configuration
const VAULT_PATH = '/Users/bronson/Documents/Bronniopollis';
const SERVER_URL = 'http://localhost:3001/garmin-data';

// Helper function to format date for filename
function formatDateForFilename(dateStr) {
    const date = new Date(dateStr);
    const monthName = date.toLocaleString('default', { month: 'long' });
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${monthName}  ${day}  ${year}.md`;
}

// Helper function to get file path
function getFilePath(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const monthName = date.toLocaleString('default', { month: 'long' });
    const fileName = formatDateForFilename(dateStr);
    return path.join(VAULT_PATH, year.toString(), monthName, fileName);
}

// Helper function to format Garmin section
function formatGarminSection(data) {
    let section = '## Garmin Data\n\n';
    
    if (data.sleepScore) {
        section += `**Sleep Score:** ${data.sleepScore}\n`;
    }
    
    if (data.sleepStartTime && data.sleepEndTime) {
        section += `**Sleep Time:** ${data.sleepStartTime} - ${data.sleepEndTime}\n`;
    }
    
    if (data.exercises && data.exercises.length > 0) {
        section += '\n**Exercises:**\n';
        data.exercises.forEach(exercise => {
            const duration = Math.round(exercise.duration / 60);
            section += `- ${exercise.type} at ${exercise.startTime} (${duration} min)`;
            if (exercise.calories) {
                section += ` - ${exercise.calories} cal`;
            }
            if (exercise.distance) {
                section += ` - ${exercise.distance.toFixed(1)} km`;
            }
            section += '\n';
        });
    }
    
    section += '\n';
    return section;
}

// Main backfill function
async function backfillDate(dateStr) {
    try {
        console.log(`📅 Processing ${dateStr}...`);
        
        // Fetch data from server
        const response = await fetch(`${SERVER_URL}?date=${dateStr}`);
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`  📊 Fetched data - Sleep: ${data.sleepScore}, Exercises: ${data.exercises?.length || 0}`);
        
        // Generate file path
        const filePath = getFilePath(dateStr);
        const dirPath = path.dirname(filePath);
        
        // Ensure directory exists
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`  📁 Created directory: ${dirPath}`);
        }
        
        // Generate Garmin section
        const garminSection = formatGarminSection(data);
        
        // Check if file exists
        let content = '';
        let fileExists = fs.existsSync(filePath);
        
        if (fileExists) {
            content = fs.readFileSync(filePath, 'utf8');
            console.log(`  📝 File exists, updating...`);
            
            // Check if Garmin section already exists
            if (content.includes('## Garmin Data')) {
                // Replace existing Garmin section
                const garminStart = content.indexOf('## Garmin Data');
                const nextSectionStart = content.indexOf('\n## ', garminStart + 1);
                const beforeGarmin = content.substring(0, garminStart);
                const afterGarmin = nextSectionStart !== -1 ? content.substring(nextSectionStart) : '';
                content = beforeGarmin + garminSection + afterGarmin;
            } else {
                // Append Garmin section
                content += '\n' + garminSection;
            }
        } else {
            // Create new file
            const date = new Date(dateStr);
            const title = date.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });
            content = `# ${title}\n\n${garminSection}`;
            console.log(`  ✨ Creating new file...`);
        }
        
        // Write file
        fs.writeFileSync(filePath, content);
        console.log(`  ✅ Updated: ${path.basename(filePath)}`);
        
        return { success: true, date: dateStr };
        
    } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`);
        return { success: false, date: dateStr, error: error.message };
    }
}

// Generate date range
function generateDateRange(startDate, endDate) {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    
    return dates;
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('📋 Usage:');
        console.log('  Single date: node backfill-garmin.js 2025-06-27');
        console.log('  Date range:  node backfill-garmin.js 2025-06-25 2025-06-29');
        console.log('  Last 7 days: node backfill-garmin.js --last-week');
        return;
    }
    
    let dates = [];
    
    if (args[0] === '--last-week') {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        dates = generateDateRange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
    } else if (args.length === 1) {
        dates = [args[0]];
    } else if (args.length === 2) {
        dates = generateDateRange(args[0], args[1]);
    }
    
    console.log(`🚀 Starting backfill for ${dates.length} dates...`);
    console.log(`📁 Vault path: ${VAULT_PATH}`);
    console.log(`🌐 Server: ${SERVER_URL}`);
    console.log('');
    
    const results = [];
    
    for (const date of dates) {
        const result = await backfillDate(date);
        results.push(result);
        
        // Small delay to avoid overwhelming the server
        if (dates.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Summary
    console.log('');
    console.log('📊 Summary:');
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
        console.log('\n❌ Failed dates:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  ${r.date}: ${r.error}`);
        });
    }
    
    console.log('\n🎉 Backfill complete!');
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
    const { default: fetch } = require('node-fetch');
    global.fetch = fetch;
}

main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});