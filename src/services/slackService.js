// src/services/slackService.js

import { WebClient } from '@slack/bolt';
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
export const postMessage = async (channelId, text, blocks = null, threadTs = null) => {
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
      threadTs 
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
      userId 
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
 * Format message with task details and sheet link
 * @param {string} userName - User's display name
 * @param {string} taskId - Clockify task ID
 * @param {string} sheetUrl - Google Sheets URL
 * @returns {Object} Message blocks
 */
export const formatTaskConfirmationMessage = (userName, taskId, sheetUrl) => {
  return {
    text: `Hey ${userName}\n\nThanks for the task. Task ID: ${taskId}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Hey <@${userName}>\n\nThanks for the task. Task ID: *${taskId}*`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `You can check all tasks <${sheetUrl}|here>. If you have multiple tasks and need to set priorities, just let us know. We handle three tasks at a time.`,
        },
      },
    ],
  };
};

export default slackClient;
