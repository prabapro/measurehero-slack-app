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
	// Acme Corp - Test Client
	{
		clientName: 'Acme Corp',
		channelId: 'C0ACJSWMREH', // channel name: #measurehero-app-test
		googleSheetId: '1nNNm8GLXEhD2anuo45VNRFuHRovpa66HzB_uVW112Tg', // [MeasureSchool x Acme] MeasureHero Tasks Template - https://docs.google.com/spreadsheets/d/1nNNm8GLXEhD2anuo45VNRFuHRovpa66HzB_uVW112Tg
		clockifyProjectId: '6981d9eb6a30c487a86a63bb', // Acme Corp - https://app.clockify.me/projects/6981d9eb6a30c487a86a63bb/edit
	},
	// Digr - Norway - Jon Ragnar
	{
		clientName: 'Digr',
		channelId: 'C088PCEJM9U',
		googleSheetId: '1W9MVHDDhVIp3GiEuD9pJBTpNMnsCMfRvVp-CS9OeJX8',
		clockifyProjectId: '67886e8ecd49ab24d3a7a7a2',
	},
	// Equans - Switzerland - Chris Riedlsperger
	{
		clientName: 'Equans',
		channelId: 'C0AC73KTAAX',
		googleSheetId: '1HvY-jq1Y-pmE1AQJSEeviTUTpGxUtbpSImbaXaYfisU',
		clockifyProjectId: '69808678bed1dd0a0311aa9a',
	},
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
