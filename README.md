# README.md

# MeasureHero Slack App

Node.js app for managing task submissions via Slack → Google Sheets → Clockify.

**Production URL**: https://measurehero-slack-app-133390045585.europe-west1.run.app

## Quick Start

```bash
# Install
pnpm install

# Configure
cp .env.example .env
# Fill in: SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, GOOGLE_*, CLOCKIFY_*

# Add clients to src/config/clients.js

# Run locally
pnpm dev

# Deploy to Cloud Run
gcloud builds submit --tag europe-west1-docker.pkg.dev/measurehero-slack-app/measurehero-repo/measurehero-slack-app:latest
gcloud run deploy measurehero-slack-app --image europe-west1-docker.pkg.dev/measurehero-slack-app/measurehero-repo/measurehero-slack-app:latest --region europe-west1
```

## Environment Variables

Required in `.env`:

```env
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
GOOGLE_SERVICE_ACCOUNT_EMAIL=...@....iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
CLOCKIFY_API_KEY=...
CLOCKIFY_WORKSPACE_ID=...
```

Optional:

- `PORT` (default: 3000)
- `NODE_ENV` (default: development)
- `TASKS_AT_A_TIME` (default: 3)
- `CLOCKIFY_MAX_RETRIES` (default: 3)
- `CLOCKIFY_RETRY_DELAY_MS` (default: 2000)

## Adding New Clients

1. Create Slack channel, get channel ID
2. Create Google Sheet, share with service account email
3. Create Clockify project, get project ID
4. Add to `src/config/clients.js`:

```javascript
{
  clientName: 'Client Name',
  channelId: 'C123456789',
  googleSheetId: 'sheet-id-here',
  clockifyProjectId: 'project-id-here',
}
```

5. Invite bot to channel: `/invite @MeasureHero`

## Slack App Setup

**Required scopes**: `chat:write`, `commands`, `users:read`

**URLs to configure**:

- Slash command: `https://measurehero-slack-app-133390045585.europe-west1.run.app/slack/commands`
- Interactivity: `https://measurehero-slack-app-133390045585.europe-west1.run.app/slack/interactions`

See [docs/SLACK_SETUP.md](docs/SLACK_SETUP.md) for details.

## Google Sheets Setup

Required columns (A-K):

- A: Unix Timestamp
- B: UTC Date & Time
- C: Title
- D: Detailed requirement
- E: Website URL
- F: System access
- G: Screen Recording
- H: Created By
- I: Task ID
- J: Status
- K: Notes

Sheet name must be: `submissions`

See [docs/GCP_SETUP.md](docs/GCP_SETUP.md) for service account setup.

## Project Structure

```
src/
├── index.js                    # Express server
├── config/
│   ├── index.js                # Environment config
│   └── clients.js              # Client configurations
├── controllers/
│   └── slackController.js      # Slack handlers
├── services/
│   ├── slackService.js         # Slack API
│   ├── googleSheetsService.js  # Google Sheets API
│   ├── clockifyService.js      # Clockify API
│   └── taskService.js          # Task orchestration
├── views/
│   └── taskModal.js            # Slack modal
├── middleware/
│   ├── slackAuth.js            # Signature verification
│   └── errorHandler.js         # Error handling
└── utils/
    └── logger.js               # Winston logger
```

## Common Commands

```bash
# Local development
pnpm dev

# Logs (Cloud Run)
gcloud run services logs tail measurehero-slack-app --region europe-west1

# Redeploy
gcloud builds submit --tag europe-west1-docker.pkg.dev/measurehero-slack-app/measurehero-repo/measurehero-slack-app:latest
gcloud run deploy measurehero-slack-app --image europe-west1-docker.pkg.dev/measurehero-slack-app/measurehero-repo/measurehero-slack-app:latest --region europe-west1

# Update env vars
gcloud run services update measurehero-slack-app --region europe-west1 --update-env-vars KEY=value
```

## Troubleshooting

**Slack signature fails**: Check `SLACK_SIGNING_SECRET` in env vars

**Google Sheets 403**: Verify sheet is shared with service account email

**Clockify fails**: Check API key and project ID exist

**Logs**: `gcloud run services logs read measurehero-slack-app --region europe-west1`

## Documentation

- [GCP Setup](docs/GCP_SETUP.md) - Google Cloud & service account
- [Slack Setup](docs/SLACK_SETUP.md) - Slack app configuration
- [Cloud Run Deployment](docs/CLOUD_RUN_DEPLOYMENT.md) - Deploy & manage
