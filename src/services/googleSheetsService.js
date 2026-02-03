// src/services/googleSheetsService.js

import { google } from 'googleapis';
import config from '../config/index.js';
import logger from '../utils/logger.js';

// Initialize Google Sheets API client
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: config.google.serviceAccountEmail,
    private_key: config.google.privateKey,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

/**
 * Append a new row to the sheet
 * @param {string} sheetId - Google Sheet ID
 * @param {Object} taskData - Task data to append
 * @returns {number} Row index of the appended data
 */
export const appendTaskToSheet = async (sheetId, taskData) => {
  try {
    const now = new Date();
    const unixTimestamp = Math.floor(now.getTime() / 1000);
    const utcDateTime = now.toUTCString().replace('GMT', '').trim();

    // Prepare row data based on column configuration
    const rowData = [
      unixTimestamp,                    // Column A: Unix Timestamp
      utcDateTime,                      // Column B: UTC Date & Time
      taskData.title,                   // Column C: Title
      taskData.requirement,             // Column D: Detailed requirement
      taskData.websiteUrl || '',        // Column E: Website URL
      taskData.systemAccess || '',      // Column F: System access
      taskData.screenRecording || '',   // Column G: Screen recording link
      taskData.createdBy,               // Column H: Created by
      '',                               // Column I: Task ID (to be filled later)
      '',                               // Column J: Status (manual)
      '',                               // Column K: Notes (manual)
    ];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${config.sheet.name}!A:K`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    // Extract the row number from the update range
    // Example: 'submissions!A15:K15' -> row 15
    const updatedRange = response.data.updates.updatedRange;
    const rowIndex = parseInt(updatedRange.match(/\d+/)[0]);

    logger.info('Task appended to sheet', { 
      sheetId, 
      rowIndex, 
      title: taskData.title 
    });

    return rowIndex;
  } catch (error) {
    logger.error('Error appending task to sheet', { 
      error: error.message, 
      sheetId,
      taskTitle: taskData.title 
    });
    throw error;
  }
};

/**
 * Update task ID in a specific row
 * @param {string} sheetId - Google Sheet ID
 * @param {number} rowIndex - Row number (1-indexed)
 * @param {string} taskId - Clockify task ID
 */
export const updateTaskId = async (sheetId, rowIndex, taskId) => {
  try {
    const taskIdColumn = String.fromCharCode(65 + config.sheet.columns.taskId); // Convert 8 to 'I'
    const range = `${config.sheet.name}!${taskIdColumn}${rowIndex}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[taskId]],
      },
    });

    logger.info('Task ID updated in sheet', { sheetId, rowIndex, taskId });
  } catch (error) {
    logger.error('Error updating task ID in sheet', { 
      error: error.message, 
      sheetId, 
      rowIndex, 
      taskId 
    });
    throw error;
  }
};

/**
 * Get Google Sheets URL for a specific sheet
 * @param {string} sheetId - Google Sheet ID
 * @returns {string} Full Google Sheets URL
 */
export const getSheetUrl = (sheetId) => {
  return `https://docs.google.com/spreadsheets/d/${sheetId}`;
};

/**
 * Verify sheet exists and has proper structure
 * @param {string} sheetId - Google Sheet ID
 * @returns {boolean} True if sheet is accessible
 */
export const verifySheetAccess = async (sheetId) => {
  try {
    await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });
    logger.info('Sheet access verified', { sheetId });
    return true;
  } catch (error) {
    logger.error('Error verifying sheet access', { 
      error: error.message, 
      sheetId 
    });
    return false;
  }
};
