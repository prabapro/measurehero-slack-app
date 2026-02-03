// src/config/index.js

import dotenv from 'dotenv';

dotenv.config();

const config = {
	// Server
	port: process.env.PORT || 3000,
	nodeEnv: process.env.NODE_ENV || 'development',

	// Slack
	slack: {
		botToken: process.env.SLACK_BOT_TOKEN,
		signingSecret: process.env.SLACK_SIGNING_SECRET,
	},

	// Google Sheets
	google: {
		serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
		privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
	},

	// Clockify
	clockify: {
		apiKey: process.env.CLOCKIFY_API_KEY,
		workspaceId: process.env.CLOCKIFY_WORKSPACE_ID,
		baseUrl: 'https://api.clockify.me/api/v1',
		maxRetries: parseInt(process.env.CLOCKIFY_MAX_RETRIES || '3', 10),
		retryDelayMs: parseInt(process.env.CLOCKIFY_RETRY_DELAY_MS || '2000', 10),
	},

	// Sheet configuration
	sheet: {
		name: 'submissions',
		columns: {
			timestamp: 0, // Column A (0-indexed)
			dateTime: 1, // Column B
			title: 2, // Column C
			requirement: 3, // Column D
			websiteUrl: 4, // Column E
			systemAccess: 5, // Column F
			screenRecording: 6, // Column G
			createdBy: 7, // Column H
			taskId: 8, // Column I
			status: 9, // Column J
			notes: 10, // Column K
		},
	},

	// Task processing
	tasksAtATime: parseInt(process.env.TASKS_AT_A_TIME || '3', 10),
};

// Validate required environment variables
const validateConfig = () => {
	const required = [
		'SLACK_BOT_TOKEN',
		'SLACK_SIGNING_SECRET',
		'GOOGLE_SERVICE_ACCOUNT_EMAIL',
		'GOOGLE_PRIVATE_KEY',
		'CLOCKIFY_API_KEY',
		'CLOCKIFY_WORKSPACE_ID',
	];

	const missing = required.filter((key) => !process.env[key]);

	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missing.join(', ')}`,
		);
	}
};

validateConfig();

export default config;
