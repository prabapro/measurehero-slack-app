// src/index.js

import express from 'express';
import config from './config/index.js';
import logger from './utils/logger.js';
import { verifySlackRequest } from './middleware/slackAuth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import {
	handleTaskCommand,
	handleInteraction,
} from './controllers/slackController.js';

const app = express();

// Save raw body for signature verification
function rawBodySaver(req, res, buf, encoding) {
	if (buf && buf.length) {
		req.rawBody = buf.toString(encoding || 'utf8');
	}
}

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
	res.status(200).json({
		status: 'healthy',
		timestamp: new Date().toISOString(),
		environment: config.nodeEnv,
	});
});

// Root endpoint
app.get('/', (req, res) => {
	res.status(200).json({
		message: 'MeasureHero Slack App',
		version: '1.0.0',
	});
});

// Slack endpoints with signature verification
// IMPORTANT: Apply body parsers here with rawBodySaver, not globally
app.post(
	'/slack/commands',
	express.json({ verify: rawBodySaver }),
	express.urlencoded({ extended: true, verify: rawBodySaver }),
	verifySlackRequest,
	handleTaskCommand,
);

app.post(
	'/slack/interactions',
	express.json({ verify: rawBodySaver }),
	express.urlencoded({ extended: true, verify: rawBodySaver }),
	verifySlackRequest,
	handleInteraction,
);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
	try {
		app.listen(config.port, () => {
			logger.info(`Server started on port ${config.port}`, {
				environment: config.nodeEnv,
				port: config.port,
			});
			logger.info('Available endpoints:', {
				health: `http://localhost:${config.port}/health`,
				commands: `http://localhost:${config.port}/slack/commands`,
				interactions: `http://localhost:${config.port}/slack/interactions`,
			});
		});
	} catch (error) {
		logger.error('Failed to start server', { error: error.message });
		process.exit(1);
	}
};

// Graceful shutdown
process.on('SIGTERM', () => {
	logger.info('SIGTERM signal received: closing HTTP server');
	process.exit(0);
});

process.on('SIGINT', () => {
	logger.info('SIGINT signal received: closing HTTP server');
	process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
	logger.error('Uncaught exception', {
		error: error.message,
		stack: error.stack,
	});
	process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
	logger.error('Unhandled rejection', { reason, promise });
	process.exit(1);
});

// Start the server
startServer();
