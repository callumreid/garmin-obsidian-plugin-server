import { App, Plugin, PluginSettingTab, Setting, Notice, moment, TFile, Modal } from 'obsidian';

interface GarminSyncSettings {
	garminUsername: string;
	garminPassword: string;
	syncOnStart: boolean;
	dailyNoteFolder: string;
	dateFormat: string;
	testMode: boolean;
}

const DEFAULT_SETTINGS: GarminSyncSettings = {
	garminUsername: '',
	garminPassword: '',
	syncOnStart: false,
	dailyNoteFolder: '',
	dateFormat: 'YYYY-MM-DD',
	testMode: false
}

interface GarminData {
	date: string;
	sleepScore?: number;
	sleepStartTime?: string;
	sleepEndTime?: string;
	exercises: Exercise[];
}

interface Exercise {
	type: string;
	startTime: string;
	duration: number;
	calories?: number;
	distance?: number;
}

export default class GarminSyncPlugin extends Plugin {
	settings: GarminSyncSettings;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon('activity', 'Sync Garmin Data', (evt: MouseEvent) => {
			this.syncGarminData();
		});

		this.addCommand({
			id: 'sync-garmin-data',
			name: 'Sync Garmin Data',
			callback: () => {
				this.syncGarminData();
			}
		});

		this.addCommand({
			id: 'backfill-garmin-data',
			name: 'Backfill Garmin Data (Date Range)',
			callback: () => {
				this.showBackfillModal();
			}
		});

		this.addCommand({
			id: 'sync-garmin-yesterday',
			name: 'Sync Garmin Data (Yesterday)',
			callback: () => {
				const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
				this.syncGarminData(yesterday);
			}
		});

		this.addCommand({
			id: 'test-garmin-connection',
			name: 'Test Garmin Connection',
			callback: () => {
				this.testGarminConnection();
			}
		});

		this.addSettingTab(new GarminSyncSettingTab(this.app, this));

		if (this.settings.syncOnStart) {
			this.syncGarminData();
		}
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async testGarminConnection() {
		if (!this.settings.garminUsername || !this.settings.garminPassword) {
			new Notice('Please configure Garmin credentials in settings');
			return;
		}

		new Notice('Testing Garmin connection...');

		try {
			const { GarminConnect } = require('garmin-connect');
			const garmin = new GarminConnect({
				username: this.settings.garminUsername,
				password: this.settings.garminPassword,
			});

			await garmin.login();
			new Notice('✅ Garmin connection successful!');
			console.log('Garmin connection test passed');
		} catch (error) {
			console.error('Garmin connection test failed:', error);
			new Notice(`❌ Garmin connection failed: ${error.message}`);
		}
	}

	async syncGarminData(date?: string) {
		if (!this.settings.garminUsername || !this.settings.garminPassword) {
			new Notice('Please configure Garmin credentials in settings');
			return;
		}

		new Notice('Syncing Garmin data...');

		try {
			const data = await this.fetchGarminData(date);
			await this.updateDailyNote(data);
			const dateLabel = date ? ` for ${date}` : '';
			new Notice(`✅ Garmin data synced successfully${dateLabel}!`);
			console.log('Synced data:', data);
		} catch (error) {
			console.error('Error syncing Garmin data:', error);
			new Notice(`❌ Failed to sync: ${error.message}`);
		}
	}

	async fetchGarminData(date?: string): Promise<GarminData> {
		const targetDate = date || moment().format('YYYY-MM-DD');

		if (this.settings.testMode) {
			return {
				date: targetDate,
				sleepScore: 85,
				sleepStartTime: '22:30',
				sleepEndTime: '06:45',
				exercises: [
					{
						type: 'Running',
						startTime: '07:00',
						duration: 1800,
						calories: 245,
						distance: 3.2
					},
					{
						type: 'Cycling',
						startTime: '18:30',
						duration: 2400,
						calories: 180,
						distance: 12.5
					}
				]
			};
		}

		// Call local Garmin server
		try {
			const url = date ? `http://localhost:3001/garmin-data?date=${date}` : 'http://localhost:3001/garmin-data';
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
			}
			const data = await response.json();
			return data;
		} catch (error) {
			console.error('Failed to fetch from local Garmin server:', error);
			throw new Error(`Garmin server error: ${error.message}. Make sure garmin-server.js is running on port 3001.`);
		}
	}

	async updateDailyNote(data: GarminData) {
		// Generate filename in your format: "June  30  2025.md"
		const date = moment(data.date);
		const fileName = `${date.format('MMMM')}  ${date.format('DD')}  ${date.format('YYYY')}.md`;
		const filePath = this.settings.dailyNoteFolder ? 
			`${this.settings.dailyNoteFolder}/${fileName}` : fileName;

		let file = this.app.vault.getAbstractFileByPath(filePath);
		
		if (!file) {
			// File doesn't exist, create it
			await this.app.vault.create(filePath, `# ${date.format('MMMM DD, YYYY')}\n\n`);
			file = this.app.vault.getAbstractFileByPath(filePath);
		}

		if (file instanceof TFile) {
			const content = await this.app.vault.read(file);
			const garminSection = this.generateGarminSection(data);
			
			const existingGarminIndex = content.indexOf('## Garmin Data');
			if (existingGarminIndex !== -1) {
				const nextSectionIndex = content.indexOf('\n## ', existingGarminIndex + 1);
				const beforeGarmin = content.substring(0, existingGarminIndex);
				const afterGarmin = nextSectionIndex !== -1 ? content.substring(nextSectionIndex) : '';
				const newContent = beforeGarmin + garminSection + afterGarmin;
				await this.app.vault.modify(file, newContent);
			} else {
				const newContent = content + '\n' + garminSection;
				await this.app.vault.modify(file, newContent);
			}
		}
	}

	generateGarminSection(data: GarminData): string {
		let section = '## Garmin Data\n\n';
		
		if (data.sleepScore) {
			section += `**Sleep Score:** ${data.sleepScore}\n`;
		}
		
		if (data.sleepStartTime && data.sleepEndTime) {
			section += `**Sleep Time:** ${data.sleepStartTime} - ${data.sleepEndTime}\n`;
		}
		
		if (data.exercises.length > 0) {
			section += '\n**Exercises:**\n';
			data.exercises.forEach(exercise => {
				section += `- ${exercise.type} at ${exercise.startTime}`;
				if (exercise.duration) {
					const minutes = Math.floor(exercise.duration / 60);
					section += ` (${minutes} min)`;
				}
				if (exercise.calories) {
					section += ` - ${exercise.calories} cal`;
				}
				if (exercise.distance) {
					section += ` - ${exercise.distance} km`;
				}
				section += '\n';
			});
		}
		
		section += '\n';
		return section;
	}
}

class GarminSyncSettingTab extends PluginSettingTab {
	plugin: GarminSyncPlugin;

	constructor(app: App, plugin: GarminSyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Garmin Sync Settings'});

		new Setting(containerEl)
			.setName('Garmin Username')
			.setDesc('Your Garmin Connect username/email')
			.addText(text => text
				.setPlaceholder('Enter your username')
				.setValue(this.plugin.settings.garminUsername)
				.onChange(async (value) => {
					this.plugin.settings.garminUsername = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Garmin Password')
			.setDesc('Your Garmin Connect password')
			.addText(text => text
				.setPlaceholder('Enter your password')
				.setValue(this.plugin.settings.garminPassword)
				.onChange(async (value) => {
					this.plugin.settings.garminPassword = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Daily Note Folder')
			.setDesc('Folder where daily notes are stored (leave empty for root)')
			.addText(text => text
				.setPlaceholder('Daily Notes')
				.setValue(this.plugin.settings.dailyNoteFolder)
				.onChange(async (value) => {
					this.plugin.settings.dailyNoteFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Sync on startup')
			.setDesc('Automatically sync data when Obsidian starts')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.syncOnStart)
				.onChange(async (value) => {
					this.plugin.settings.syncOnStart = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Test mode')
			.setDesc('Use mock data instead of real Garmin data (for testing)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.testMode)
				.onChange(async (value) => {
					this.plugin.settings.testMode = value;
					await this.plugin.saveSettings();
				}));
	}
}