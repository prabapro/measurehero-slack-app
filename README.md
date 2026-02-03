# MeasureHero Slack App

A Node.js application for managing MeasureHero task submissions via Slack, integrated with Google Sheets and Clockify.

## Features

- 📝 Task submission via `/measurehero-new-task` slash command
- 🔄 Automatic synchronization with Google Sheets
- ⏱️ Clockify task creation with retry logic
- 📊 Channel-based client routing
- 🔐 Slack signature verification

## Prerequisites

- Node.js 22+
- pnpm 10+
- Docker Desktop (optional, for containerized local development)
- Slack workspace with admin access
- Google Cloud project with Sheets API enabled
- Clockify workspace and API access

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:

- `SLACK_BOT_TOKEN`: Your Slack bot token (xoxb-...)
- `SLACK_SIGNING_SECRET`: Slack app signing secret
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Google service account email
- `GOOGLE_PRIVATE_KEY`: Google service account private key
- `CLOCKIFY_API_KEY`: Clockify API key
- `CLOCKIFY_WORKSPACE_ID`: Your Clockify workspace ID

### 3. Configure Clients

Edit `src/config/clients.js` to add your clients:

```javascript
{
  channelId: 'C123456789',
  clientName: 'Client Name',
  googleSheetId: 'your-sheet-id',
  clockifyProjectId: 'your-project-id'
}
```

### 4. Slack App Configuration

1. Create a new Slack app at https://api.slack.com/apps
2. Enable **Slash Commands**:
   - Command: `/measurehero-new-task`
   - Request URL: `https://your-domain.com/slack/commands`
3. Enable **Interactivity**:
   - Request URL: `https://your-domain.com/slack/interactions`
4. Add **Bot Token Scopes**:
   - `chat:write`
   - `commands`
   - `users:read`
5. Install app to workspace

### 5. Google Sheets Setup

1. Create a service account in Google Cloud Console
2. Enable Google Sheets API
3. Share your Google Sheets with the service account email
4. Ensure sheets have the following columns:
   - A: Unix Timestamp
   - B: UTC Date & Time
   - C: Title of the task
   - D: Detailed requirement
   - E: Website URL
   - F: System access
   - G: Link to Screen Recording
   - H: Created By
   - I: Task ID
   - J: Status
   - K: Notes

## Running Locally

### Option 1: Node.js

```bash
# Development with auto-reload
pnpm dev

# Production
pnpm start
```

### Option 2: Docker

```bash
# Build image
pnpm docker:build

# Run container
pnpm docker:run
```

The app will be available at `http://localhost:3000`

### Exposing Local Server to Slack

Use a tunneling service like ngrok:

```bash
ngrok http --url=innocent-weevil-terribly.ngrok-free.app 3000
```

Update your Slack app's request URLs with the ngrok URL.

## Deploying to Production

### Google Cloud Run Deployment

This app is designed to run on Google Cloud Run. For detailed deployment instructions, see:

**📚 [Cloud Run Deployment Guide](docs/CLOUD_RUN_DEPLOYMENT.md)**

Quick deploy command (after initial setup):

```bash
# Build and deploy
gcloud builds submit --tag europe-west1-docker.pkg.dev/measurehero-slack-app/measurehero-repo/measurehero-slack-app:latest

gcloud run deploy measurehero-slack-app \
  --image europe-west1-docker.pkg.dev/measurehero-slack-app/measurehero-repo/measurehero-slack-app:latest \
  --region europe-west1
```

**Important:** Remember to update your Slack app's request URLs to your Cloud Run URL after deployment.

## Project Structure

```
measurehero-slack-app/
├── src/
│   ├── index.js                    # Express server entry point
│   ├── config/
│   │   ├── index.js                # Environment configuration
│   │   └── clients.js              # Client configurations
│   ├── controllers/
│   │   └── slackController.js      # Slack command & interaction handlers
│   ├── services/
│   │   ├── slackService.js         # Slack API operations
│   │   ├── googleSheetsService.js  # Google Sheets operations
│   │   ├── clockifyService.js      # Clockify API operations
│   │   └── taskService.js          # Task orchestration logic
│   ├── views/
│   │   └── taskModal.js            # Slack modal definition
│   ├── middleware/
│   │   ├── slackAuth.js            # Slack signature verification
│   │   └── errorHandler.js         # Global error handling
│   └── utils/
│       └── logger.js               # Winston logger configuration
```

## Adding New Clients

1. Create a dedicated Slack channel for the client
2. Create a Google Sheet with the required columns
3. Share the sheet with your service account
4. Create a Clockify project for the client
5. Add client configuration to `src/config/clients.js`

## Environment Variables

| Variable                       | Description                          | Required           |
| ------------------------------ | ------------------------------------ | ------------------ |
| `PORT`                         | Server port                          | No (default: 3000) |
| `NODE_ENV`                     | Environment (development/production) | No                 |
| `SLACK_BOT_TOKEN`              | Slack bot OAuth token                | Yes                |
| `SLACK_SIGNING_SECRET`         | Slack request signing secret         | Yes                |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google service account email         | Yes                |
| `GOOGLE_PRIVATE_KEY`           | Google service account private key   | Yes                |
| `CLOCKIFY_API_KEY`             | Clockify API key                     | Yes                |
| `CLOCKIFY_WORKSPACE_ID`        | Clockify workspace ID                | Yes                |
| `CLOCKIFY_MAX_RETRIES`         | Max retry attempts for Clockify      | No (default: 3)    |
| `CLOCKIFY_RETRY_DELAY_MS`      | Delay between retries (ms)           | No (default: 2000) |

## Troubleshooting

### Slack signature verification fails

- Ensure `SLACK_SIGNING_SECRET` is correct
- Check system time is synchronized

### Google Sheets access denied

- Verify service account email has access to the sheet
- Check `GOOGLE_PRIVATE_KEY` format (should include `\n` characters)

### Clockify task creation fails

- Verify `CLOCKIFY_API_KEY` is valid
- Check project ID exists in the workspace
- Review logs for specific error messages
