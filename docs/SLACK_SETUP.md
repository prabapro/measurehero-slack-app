# docs/SLACK_SETUP.md

# Slack App Setup

Quick guide for configuring Slack app.

## 1. Create Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. **Create New App → From scratch**
3. Name: `MeasureHero`
4. Select workspace

## 2. Configure Slash Command

**Slash Commands → Create New Command**

```
Command: /measurehero-new-task
Request URL: https://measurehero-slack-app-133390045585.europe-west1.run.app/slack/commands
Short Description: Submit a new analytics implementation task
Usage Hint: [opens task submission form]
```

## 3. Enable Interactivity

**Interactivity & Shortcuts → Toggle ON**

```
Request URL: https://measurehero-slack-app-133390045585.europe-west1.run.app/slack/interactions
```

## 4. Add Bot Token Scopes

**OAuth & Permissions → Bot Token Scopes**

Add these:

- `chat:write` - Post messages
- `commands` - Slash commands
- `users:read` - Get user info

## 5. Install App to Workspace

**OAuth & Permissions → Install to Workspace**

1. Click **Install to Workspace**
2. Review permissions → **Allow**
3. Copy **Bot User OAuth Token** (starts with `xoxb-`)

## 6. Get Signing Secret

**Basic Information → App Credentials**

1. Find **Signing Secret**
2. Click **Show** → Copy

## 7. Update .env

```env
SLACK_BOT_TOKEN=xoxb-your-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
```

## 8. Get Channel IDs

For each client channel:

**Method 1: Desktop/Web App**

1. Right-click channel name
2. **View channel details**
3. Copy Channel ID (bottom of popup)

**Method 2: URL**

```
https://yourworkspace.slack.com/archives/C06EXAMPLE001
                                          ↑ This is the Channel ID
```

Add to `src/config/clients.js`:

```javascript
{
  channelId: 'C06EXAMPLE001',
  clientName: 'Client Name',
  googleSheetId: '...',
  clockifyProjectId: '...',
}
```

## 9. Test Setup

1. Start app: `pnpm dev`
2. In configured channel: `/measurehero-new-task`
3. Fill form → Submit
4. Verify:
   - ✅ Task in Google Sheet
   - ✅ Task in Clockify
   - ✅ Confirmation in Slack

## App Permissions Summary

✅ Can:

- Read slash commands
- Post messages in invited channels
- Read user profiles

❌ Cannot:

- Read message history
- Access private channels (unless invited)
- Act on behalf of users

## Troubleshooting

**"dispatch_failed"**: App can't reach URL

- Check Cloud Run service is running
- Verify Request URLs are correct

**Modal doesn't open**: Interactivity not enabled

- Check Request URL in Interactivity settings

**"Invalid signature"**: Wrong signing secret

- Verify `SLACK_SIGNING_SECRET` in `.env`
- Restart app after changing `.env`

**"Only in MeasureHero channels"**: Channel not configured

- Add channel ID to `src/config/clients.js`

**Bot messages not appearing**: Missing scope or bot not in channel

- Add `chat:write` scope
- Invite bot: `/invite @MeasureHero`

## Production Checklist

- [ ] Request URLs point to Cloud Run (not ngrok)
- [ ] Production tokens in Cloud Run env vars
- [ ] All client channels configured
- [ ] Bot invited to all channels
- [ ] End-to-end test in each channel
