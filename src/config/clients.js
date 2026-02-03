// src/config/clients.js

/**
 * Client Configuration
 *
 * Add new clients here with their corresponding Slack channel ID,
 * Google Sheet ID, and Clockify project ID.
 *
 * To get channel ID: Right-click channel → View channel details → Copy ID
 * To get sheet ID: Extract from Google Sheets URL
 * To get project ID: Extract from Clockify project URL or API
 */

const clients = [
	{
		channelId: 'C0ACJSWMREH', // channel name: #measurehero-app-test
		clientName: 'Acme Corp',
		googleSheetId: '1nNNm8GLXEhD2anuo45VNRFuHRovpa66HzB_uVW112Tg', // [MeasureSchool x Acme] MeasureHero Tasks Template - https://docs.google.com/spreadsheets/d/1nNNm8GLXEhD2anuo45VNRFuHRovpa66HzB_uVW112Tg
		clockifyProjectId: '6981d9eb6a30c487a86a63bb', // Acme Corp - https://app.clockify.me/projects/6981d9eb6a30c487a86a63bb/edit
	},
	// Add more clients below
	// {
	//   channelId: 'C06EXAMPLE002',
	//   clientName: 'Acme Corp',
	//   googleSheetId: 'your-sheet-id-here',
	//   clockifyProjectId: 'your-project-id-here',
	// },
];

/**
 * Find client configuration by channel ID
 * @param {string} channelId - Slack channel ID
 * @returns {Object|null} Client configuration or null if not found
 */
export const findClientByChannel = (channelId) => {
	return clients.find((client) => client.channelId === channelId) || null;
};

/**
 * Get all configured channel IDs
 * @returns {string[]} Array of channel IDs
 */
export const getAllChannelIds = () => {
	return clients.map((client) => client.channelId);
};

/**
 * Check if a channel is configured
 * @param {string} channelId - Slack channel ID
 * @returns {boolean} True if channel is configured
 */
export const isChannelConfigured = (channelId) => {
	return clients.some((client) => client.channelId === channelId);
};

export default clients;
