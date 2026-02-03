// src/controllers/slackController.js

import logger from '../utils/logger.js';
import { findClientByChannel, isChannelConfigured } from '../config/clients.js';
import { createTaskModal, extractModalValues } from '../views/taskModal.js';
import * as slackService from '../services/slackService.js';
import * as taskService from '../services/taskService.js';

/**
 * Handle /measurehero-new-task slash command
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const handleTaskCommand = async (req, res) => {
	try {
		const { trigger_id, channel_id, user_id } = req.body;

		logger.info('Received task command', {
			channelId: channel_id,
			userId: user_id,
		});

		// Check if channel is configured BEFORE acknowledging
		if (!isChannelConfigured(channel_id)) {
			logger.warn('Command used in unconfigured channel', {
				channelId: channel_id,
			});

			// Respond directly to the command - Slack will show this as ephemeral
			return res.status(200).json({
				response_type: 'ephemeral',
				text: '⚠️ This app is only available in MeasureHero channels. Please contact your administrator.',
			});
		}

		// Acknowledge the command immediately
		res.status(200).send();

		// Get client configuration
		const client = findClientByChannel(channel_id);

		// Open the task submission modal
		const modalView = createTaskModal(client);
		await slackService.openModal(trigger_id, modalView);

		logger.info('Task modal opened for user', {
			userId: user_id,
			clientName: client.clientName,
		});
	} catch (error) {
		logger.error('Error handling task command', {
			error: error.message,
			stack: error.stack,
		});

		// If response hasn't been sent yet, send error
		if (!res.headersSent) {
			res.status(500).json({ error: 'Internal server error' });
		}
	}
};

/**
 * Handle modal submission interactions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const handleInteraction = async (req, res) => {
	try {
		const payload = JSON.parse(req.body.payload);

		logger.info('Received interaction', {
			type: payload.type,
			callbackId: payload.view?.callback_id,
		});

		// Handle modal submission
		if (
			payload.type === 'view_submission' &&
			payload.view.callback_id === 'task_submission_modal'
		) {
			// Acknowledge the submission immediately
			res.status(200).json({});

			await handleTaskSubmission(payload);
			return;
		}

		// Unknown interaction type
		logger.warn('Unknown interaction type', { type: payload.type });
		res.status(200).json({});
	} catch (error) {
		logger.error('Error handling interaction', {
			error: error.message,
			stack: error.stack,
		});

		if (!res.headersSent) {
			res.status(500).json({ error: 'Internal server error' });
		}
	}
};

/**
 * Process task submission from modal
 * @param {Object} payload - Slack interaction payload
 */
const handleTaskSubmission = async (payload) => {
	try {
		const { user, view } = payload;

		// Extract metadata
		const metadata = JSON.parse(view.private_metadata);
		const { clientName, channelId, googleSheetId, clockifyProjectId } =
			metadata;

		// Extract form values
		const taskData = extractModalValues(view);

		logger.info('Processing task submission', {
			clientName,
			userId: user.id,
			taskTitle: taskData.title,
		});

		// Validate task data
		const validation = taskService.validateTaskData(taskData);
		if (!validation.isValid) {
			logger.warn('Invalid task data submitted', {
				errors: validation.errors,
				userId: user.id,
			});

			await slackService.postEphemeral(
				channelId,
				user.id,
				`❌ Task validation failed:\n${validation.errors.map((e) => `• ${e}`).join('\n')}`,
			);
			return;
		}

		// Prepare client config
		const client = {
			clientName,
			channelId,
			googleSheetId,
			clockifyProjectId,
		};

		// Process the task asynchronously
		await taskService.processTaskSubmission(
			taskData,
			client,
			user.id,
			channelId,
		);
	} catch (error) {
		logger.error('Error in handleTaskSubmission', {
			error: error.message,
			stack: error.stack,
		});
	}
};
