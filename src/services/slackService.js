// src/services/slackService.js

import { WebClient } from '@slack/web-api';
import config from '../config/index.js';
import logger from '../utils/logger.js';

const slackClient = new WebClient(config.slack.botToken);

/**
 * Open a modal for the user
 * @param {string} triggerId - Slack trigger ID
 * @param {Object} view - Modal view definition
 */
export const openModal = async (triggerId, view) => {
	try {
		await slackClient.views.open({
			trigger_id: triggerId,
			view,
		});
		logger.info('Modal opened successfully', { triggerId });
	} catch (error) {
		logger.error('Error opening modal', { error: error.message, triggerId });
		throw error;
	}
};

/**
 * Post a message to a Slack channel
 * @param {string} channelId - Channel ID
 * @param {string} text - Message text
 * @param {Array} blocks - Optional message blocks
 * @param {string} threadTs - Optional thread timestamp
 * @returns {Object} Slack API response
 */
export const postMessage = async (
	channelId,
	text,
	blocks = null,
	threadTs = null,
) => {
	try {
		const message = {
			channel: channelId,
			text,
			...(blocks && { blocks }),
			...(threadTs && { thread_ts: threadTs }),
		};

		const result = await slackClient.chat.postMessage(message);
		logger.info('Message posted successfully', { channelId, threadTs });
		return result;
	} catch (error) {
		logger.error('Error posting message', {
			error: error.message,
			channelId,
			threadTs,
		});
		throw error;
	}
};

/**
 * Post an ephemeral message (only visible to user)
 * @param {string} channelId - Channel ID
 * @param {string} userId - User ID
 * @param {string} text - Message text
 * @param {Array} blocks - Optional message blocks
 */
export const postEphemeral = async (channelId, userId, text, blocks = null) => {
	try {
		const message = {
			channel: channelId,
			user: userId,
			text,
			...(blocks && { blocks }),
		};

		await slackClient.chat.postEphemeral(message);
		logger.info('Ephemeral message posted', { channelId, userId });
	} catch (error) {
		logger.error('Error posting ephemeral message', {
			error: error.message,
			channelId,
			userId,
		});
		throw error;
	}
};

/**
 * Get user information
 * @param {string} userId - Slack user ID
 * @returns {Object} User information
 */
export const getUserInfo = async (userId) => {
	try {
		const result = await slackClient.users.info({ user: userId });
		logger.debug('User info retrieved', { userId });
		return result.user;
	} catch (error) {
		logger.error('Error getting user info', { error: error.message, userId });
		throw error;
	}
};

/**
 * Format initial task submission message (creates thread)
 * @param {string} userId - User ID
 * @param {Object} taskData - Task submission data
 * @returns {Object} Message content with text and blocks
 */
export const formatTaskSubmissionMessage = (userId, taskData) => {
	const blocks = [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `🚀 <@${userId}> just submitted a new task. Processing now...`,
			},
		},
		{
			type: 'divider',
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `*Title:*\n${taskData.title}`,
			},
		},
	];

	// Add Website URL and System Access side-by-side if either exists
	if (taskData.websiteUrl || taskData.systemAccess) {
		const sideFields = [];

		if (taskData.websiteUrl) {
			sideFields.push({
				type: 'mrkdwn',
				text: `*Website URL:*\n${taskData.websiteUrl}`,
			});
		}

		if (taskData.systemAccess) {
			sideFields.push({
				type: 'mrkdwn',
				text: `*System Access:*\n${taskData.systemAccess}`,
			});
		}

		blocks.push({
			type: 'section',
			fields: sideFields,
		});
	}

	// Add Screen Recording if provided
	if (taskData.screenRecording) {
		blocks.push({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `*Screen Recording:*\n${taskData.screenRecording}`,
			},
		});
	}

	// Add Detailed Requirement
	blocks.push({
		type: 'section',
		text: {
			type: 'mrkdwn',
			text: `*Detailed Requirement:*\n${taskData.requirement}`,
		},
	});

	blocks.push({
		type: 'divider',
	});

	return {
		text: `Task submitted by <@${userId}>`,
		blocks: blocks,
	};
};

/**
 * Format task confirmation message with Task ID (thread reply)
 * @param {string} userId - User ID
 * @param {string} taskId - Clockify task ID
 * @param {string} sheetUrl - Google Sheets URL
 * @param {number} tasksAtATime - Number of tasks handled at a time
 * @returns {Object} Message content with text and blocks
 */
export const formatTaskConfirmationMessage = (
	userId,
	taskId,
	sheetUrl,
	tasksAtATime,
) => {
	return {
		text: `Task ID: ${taskId}`,
		blocks: [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `Hey <@${userId}>\n\nThanks for the task. Here's your Task ID: \`${taskId}\`\n\nWe'll validate it and get back to you soon.`,
				},
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `• For any additional notes or questions, please reply to this thread to keep everything organized.\n\n• You can check all tasks <${sheetUrl}|here>. If you have multiple tasks and need to set priorities, just let us know. We handle ${tasksAtATime} tasks at a time.`,
				},
			},
		],
	};
};

export default slackClient;
