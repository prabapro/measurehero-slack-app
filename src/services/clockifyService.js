// src/services/clockifyService.js

import axios from 'axios';
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Sleep helper for retry delays
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create a task in Clockify with retry logic
 * @param {string} projectId - Clockify project ID
 * @param {Object} taskData - Task data
 * @returns {string} Created task ID
 */
export const createClockifyTask = async (projectId, taskData) => {
  const { maxRetries, retryDelayMs, apiKey, workspaceId, baseUrl } = config.clockify;
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Creating Clockify task (attempt ${attempt}/${maxRetries})`, {
        projectId,
        taskTitle: taskData.title,
      });

      const response = await axios.post(
        `${baseUrl}/workspaces/${workspaceId}/projects/${projectId}/tasks`,
        {
          name: taskData.title,
          description: formatTaskDescription(taskData),
          status: 'ACTIVE',
          billable: true,
        },
        {
          headers: {
            'X-Api-Key': apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      const taskId = response.data.id;
      logger.info('Clockify task created successfully', { 
        taskId, 
        projectId,
        attempt 
      });

      return taskId;
    } catch (error) {
      lastError = error;
      
      logger.warn(`Clockify API call failed (attempt ${attempt}/${maxRetries})`, {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        projectId,
      });

      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        logger.error('Clockify API returned client error, not retrying', {
          status: error.response.status,
          error: error.response.data,
        });
        throw error;
      }

      // Wait before retrying (except on last attempt)
      if (attempt < maxRetries) {
        logger.info(`Waiting ${retryDelayMs}ms before retry...`);
        await sleep(retryDelayMs);
      }
    }
  }

  // All retries exhausted
  logger.error('All Clockify retry attempts exhausted', {
    maxRetries,
    projectId,
    lastError: lastError.message,
  });

  throw new Error(
    `Failed to create Clockify task after ${maxRetries} attempts: ${lastError.message}`
  );
};

/**
 * Format task description for Clockify
 * @param {Object} taskData - Task data
 * @returns {string} Formatted description
 */
const formatTaskDescription = (taskData) => {
  let description = `**Detailed Requirement:**\n${taskData.requirement}\n\n`;
  
  if (taskData.websiteUrl) {
    description += `**Website URL:**\n${taskData.websiteUrl}\n\n`;
  }
  
  if (taskData.systemAccess) {
    description += `**System Access:**\n${taskData.systemAccess}\n\n`;
  }
  
  if (taskData.screenRecording) {
    description += `**Screen Recording:**\n${taskData.screenRecording}\n\n`;
  }
  
  description += `**Submitted by:** ${taskData.createdBy}`;
  
  return description;
};

/**
 * Get task details from Clockify
 * @param {string} projectId - Clockify project ID
 * @param {string} taskId - Clockify task ID
 * @returns {Object} Task details
 */
export const getClockifyTask = async (projectId, taskId) => {
  try {
    const { apiKey, workspaceId, baseUrl } = config.clockify;

    const response = await axios.get(
      `${baseUrl}/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
      {
        headers: {
          'X-Api-Key': apiKey,
        },
      }
    );

    logger.info('Clockify task retrieved', { taskId, projectId });
    return response.data;
  } catch (error) {
    logger.error('Error retrieving Clockify task', {
      error: error.message,
      taskId,
      projectId,
    });
    throw error;
  }
};

/**
 * Verify Clockify API access
 * @returns {boolean} True if API is accessible
 */
export const verifyClockifyAccess = async () => {
  try {
    const { apiKey, workspaceId, baseUrl } = config.clockify;

    await axios.get(`${baseUrl}/workspaces/${workspaceId}`, {
      headers: {
        'X-Api-Key': apiKey,
      },
    });

    logger.info('Clockify API access verified');
    return true;
  } catch (error) {
    logger.error('Error verifying Clockify access', { error: error.message });
    return false;
  }
};
