// src/services/taskService.js

import logger from '../utils/logger.js';
import * as sheetsService from './googleSheetsService.js';
import * as clockifyService from './clockifyService.js';
import * as slackService from './slackService.js';

/**
 * Process a task submission through the entire workflow
 * @param {Object} taskData - Task submission data
 * @param {Object} client - Client configuration
 * @param {string} userId - Slack user ID
 * @param {string} channelId - Slack channel ID
 */
export const processTaskSubmission = async (taskData, client, userId, channelId) => {
  try {
    logger.info('Starting task submission process', {
      clientName: client.clientName,
      taskTitle: taskData.title,
      userId,
    });

    // Step 1: Get user information for display name
    const userInfo = await slackService.getUserInfo(userId);
    const userName = userInfo.real_name || userInfo.name;
    
    const enrichedTaskData = {
      ...taskData,
      createdBy: `@${userName}`,
    };

    // Step 2: Append task to Google Sheets
    logger.info('Appending task to Google Sheets', { 
      sheetId: client.googleSheetId 
    });
    const rowIndex = await sheetsService.appendTaskToSheet(
      client.googleSheetId,
      enrichedTaskData
    );

    // Step 3: Create task in Clockify (with retry logic)
    logger.info('Creating task in Clockify', { 
      projectId: client.clockifyProjectId 
    });
    const clockifyTaskId = await clockifyService.createClockifyTask(
      client.clockifyProjectId,
      enrichedTaskData
    );

    // Step 4: Update Google Sheets with Clockify task ID
    logger.info('Updating sheet with Clockify task ID', { 
      rowIndex, 
      taskId: clockifyTaskId 
    });
    await sheetsService.updateTaskId(
      client.googleSheetId,
      rowIndex,
      clockifyTaskId
    );

    // Step 5: Wait for configured delay before posting confirmation
    const delayMs = 15000; // 15 seconds
    logger.info(`Waiting ${delayMs}ms before posting confirmation...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));

    // Step 6: Post confirmation message in channel
    const sheetUrl = sheetsService.getSheetUrl(client.googleSheetId);
    const messageContent = slackService.formatTaskConfirmationMessage(
      userId,
      clockifyTaskId,
      sheetUrl
    );

    await slackService.postMessage(
      channelId,
      messageContent.text,
      messageContent.blocks
    );

    logger.info('Task submission process completed successfully', {
      clientName: client.clientName,
      taskId: clockifyTaskId,
      sheetRow: rowIndex,
    });

    return {
      success: true,
      taskId: clockifyTaskId,
      rowIndex,
    };
  } catch (error) {
    logger.error('Error processing task submission', {
      error: error.message,
      stack: error.stack,
      clientName: client.clientName,
      taskTitle: taskData.title,
    });

    // Attempt to notify user of failure
    try {
      await slackService.postEphemeral(
        channelId,
        userId,
        '❌ Sorry, there was an error processing your task submission. Our team has been notified. Please try again or contact support.'
      );
    } catch (notifyError) {
      logger.error('Failed to send error notification to user', {
        error: notifyError.message,
      });
    }

    throw error;
  }
};

/**
 * Validate task data
 * @param {Object} taskData - Task data to validate
 * @returns {Object} Validation result with errors array
 */
export const validateTaskData = (taskData) => {
  const errors = [];

  if (!taskData.title || taskData.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!taskData.requirement || taskData.requirement.trim().length === 0) {
    errors.push('Detailed requirement is required');
  }

  if (taskData.websiteUrl && !isValidUrl(taskData.websiteUrl)) {
    errors.push('Website URL is not valid');
  }

  if (taskData.screenRecording && !isValidUrl(taskData.screenRecording)) {
    errors.push('Screen recording link is not valid');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Check if a string is a valid URL
 * @param {string} string - String to validate
 * @returns {boolean} True if valid URL
 */
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (error) {
    return false;
  }
};
