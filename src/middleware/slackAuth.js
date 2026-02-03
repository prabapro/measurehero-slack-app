// src/middleware/slackAuth.js

import crypto from 'crypto';
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Verify Slack request signature to ensure requests are from Slack
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const verifySlackRequest = (req, res, next) => {
	try {
		const slackSignature = req.headers['x-slack-signature'];
		const slackRequestTimestamp = req.headers['x-slack-request-timestamp'];

		// Use raw body that was saved by the verify function
		const body = req.rawBody;

		// Check if signature and timestamp are present
		if (!slackSignature || !slackRequestTimestamp) {
			logger.warn('Missing Slack signature or timestamp headers');
			return res.status(401).json({ error: 'Unauthorized' });
		}

		// Check if raw body was captured
		if (!body) {
			logger.error('Raw body not available for signature verification');
			return res.status(500).json({ error: 'Internal server error' });
		}

		// Prevent replay attacks (timestamp should be within 5 minutes)
		const currentTime = Math.floor(Date.now() / 1000);
		if (Math.abs(currentTime - slackRequestTimestamp) > 60 * 5) {
			logger.warn('Slack request timestamp too old', {
				requestTimestamp: slackRequestTimestamp,
				currentTime,
			});
			return res.status(401).json({ error: 'Request timestamp expired' });
		}

		// Compute signature using the raw body
		const sigBasestring = `v0:${slackRequestTimestamp}:${body}`;
		const mySignature = `v0=${crypto
			.createHmac('sha256', config.slack.signingSecret)
			.update(sigBasestring)
			.digest('hex')}`;

		// Compare signatures using timing-safe comparison
		const isValid = crypto.timingSafeEqual(
			Buffer.from(mySignature),
			Buffer.from(slackSignature),
		);

		if (!isValid) {
			logger.warn('Invalid Slack signature', {
				expected: mySignature,
				received: slackSignature,
			});
			return res.status(401).json({ error: 'Invalid signature' });
		}

		logger.debug('Slack signature verified successfully');
		next();
	} catch (error) {
		logger.error('Error verifying Slack request', {
			error: error.message,
			stack: error.stack,
		});
		return res.status(500).json({ error: 'Internal server error' });
	}
};
