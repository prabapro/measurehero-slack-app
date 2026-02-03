// src/views/taskModal.js

/**
 * Generate Slack modal for task submission
 * @param {string} triggerId - Slack trigger ID for opening modal
 * @param {Object} client - Client configuration object
 * @returns {Object} Slack modal view definition
 */
export const createTaskModal = (client) => {
	return {
		type: 'modal',
		callback_id: 'task_submission_modal',
		title: {
			type: 'plain_text',
			text: 'Submit New Task',
		},
		submit: {
			type: 'plain_text',
			text: 'Submit',
		},
		close: {
			type: 'plain_text',
			text: 'Cancel',
		},
		private_metadata: JSON.stringify({
			clientName: client.clientName,
			channelId: client.channelId,
			googleSheetId: client.googleSheetId,
			clockifyProjectId: client.clockifyProjectId,
		}),
		blocks: [
			{
				type: 'input',
				block_id: 'task_title',
				element: {
					type: 'plain_text_input',
					action_id: 'title_input',
					placeholder: {
						type: 'plain_text',
						text: 'e.g., Track "Add to Cart" button clicks',
					},
					max_length: 200,
				},
				label: {
					type: 'plain_text',
					text: 'Title of the task',
				},
			},
			{
				type: 'input',
				block_id: 'detailed_requirement',
				element: {
					type: 'plain_text_input',
					action_id: 'requirement_input',
					multiline: true,
					placeholder: {
						type: 'plain_text',
						text: 'Provide detailed requirements, expected behavior, and any specific instructions...',
					},
					max_length: 3000,
				},
				label: {
					type: 'plain_text',
					text: 'Detailed requirement',
				},
			},
			{
				type: 'input',
				block_id: 'website_url',
				element: {
					type: 'plain_text_input',
					action_id: 'url_input',
					placeholder: {
						type: 'plain_text',
						text: 'https://example.com',
					},
				},
				label: {
					type: 'plain_text',
					text: 'Website URL',
				},
				optional: false,
			},
			{
				type: 'input',
				block_id: 'system_access',
				element: {
					type: 'plain_text_input',
					action_id: 'access_input',
					multiline: true,
					placeholder: {
						type: 'plain_text',
						text: 'GTM Container ID: GTM-XXXXXX\nGA4 Property: G-XXXXXXXXXX',
					},
				},
				label: {
					type: 'plain_text',
					text: 'System Access (GTM Container ID, GA4 Property, etc.)',
				},
				optional: false,
			},
			{
				type: 'input',
				block_id: 'screen_recording',
				element: {
					type: 'plain_text_input',
					action_id: 'recording_input',
					placeholder: {
						type: 'plain_text',
						text: 'https://loom.com/share/...',
					},
				},
				label: {
					type: 'plain_text',
					text: 'Link to Screen Recording',
				},
				optional: true,
			},
		],
	};
};

/**
 * Extract form values from modal submission
 * @param {Object} view - Slack modal view object
 * @returns {Object} Form values
 */
export const extractModalValues = (view) => {
	const values = view.state.values;

	return {
		title: values.task_title?.title_input?.value || '',
		requirement: values.detailed_requirement?.requirement_input?.value || '',
		websiteUrl: values.website_url?.url_input?.value || '',
		systemAccess: values.system_access?.access_input?.value || '',
		screenRecording: values.screen_recording?.recording_input?.value || '',
	};
};
