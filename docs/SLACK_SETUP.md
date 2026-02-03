# Slack App Setup Guide

This guide will walk you through creating and configuring a Slack app for the MeasureHero task submission system.

## Overview

You'll create a custom Slack app that:

- Responds to the `/new-measurehero-task` slash command
- Opens an interactive modal for task submission
- Posts confirmation messages to channels
- Uses OAuth for secure authentication

---

## Prerequisites

- Admin access to your Slack workspace (or ability to request app installations)
- Your MeasureHero app running and accessible (we'll use ngrok for local development)
- A public URL for your app (for local dev, see Step 1)

---

## Step 1: Expose Your Local Server (Development Only)

If you're developing locally, you need to expose your local server to the internet so Slack can send requests to it.

### Option A: Using ngrok (Recommended)

1. Download ngrok from [ngrok.com](https://ngrok.com)

2. Install and authenticate ngrok:

   ```bash
   ngrok authtoken YOUR_AUTH_TOKEN
   ```

3. Start your Node.js app:

   ```bash
   pnpm dev
   ```

4. In a new terminal, expose port 3000:

   ```bash
   ngrok http 3000
   ```

5. You'll see output like:

   ```
   Forwarding    https://abc123.ngrok.io -> http://localhost:3000
   ```

6. Copy the `https://` URL (e.g., `https://abc123.ngrok.io`)
   - **Note**: This URL changes each time you restart ngrok
   - You can get a persistent URL with a paid ngrok plan

### Option B: Using Cloudflare Tunnel

```bash
cloudflared tunnel --url http://localhost:3000
```

### Option C: Production Deployment

If deploying to Cloud Run or another hosting service, use that public URL instead.

---

## Step 2: Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)

2. Click **"Create New App"**

3. Choose **"From scratch"**

4. Fill in the app details:
   - **App Name**: `MeasureHero` (or your preferred name)
   - **Pick a workspace**: Select your workspace
5. Click **"Create App"**

You'll be redirected to your app's **Basic Information** page.

---

## Step 3: Configure Basic Information

### App Display Information

1. Scroll down to **"Display Information"**

2. Fill in the details:
   - **App name**: `MeasureHero`
   - **Short description**: `Submit and track web analytics implementation tasks`
   - **Long description**:
     ```
     MeasureHero helps you submit, track, and manage web analytics implementation tasks.
     Submit tasks with detailed requirements, and automatically sync with Google Sheets and Clockify.
     ```
   - **App icon**: Upload a logo (optional, 512x512px recommended)
   - **Background color**: Choose your brand color

3. Click **"Save Changes"**

---

## Step 4: Set Up Slash Commands

1. In the left sidebar, click **"Slash Commands"** under "Features"

2. Click **"Create New Command"**

3. Fill in the command details:
   - **Command**: `/new-measurehero-task`
   - **Request URL**: `https://your-ngrok-url.ngrok.io/slack/commands`
     - Replace `your-ngrok-url.ngrok.io` with your actual ngrok URL
     - Or your production URL if deployed
   - **Short Description**: `Submit a new analytics implementation task`
   - **Usage Hint**: `[opens task submission form]`
   - **Escape channels, users, and links**: Leave unchecked

4. Click **"Save"**

**⚠️ Important**: If your ngrok URL changes, you'll need to update this Request URL.

---

## Step 5: Enable Interactivity

This allows Slack to send modal submissions to your app.

1. In the left sidebar, click **"Interactivity & Shortcuts"** under "Features"

2. Toggle **"Interactivity"** to **ON**

3. Set the **Request URL**:

   ```
   https://your-ngrok-url.ngrok.io/slack/interactions
   ```

   - Replace with your actual ngrok or production URL

4. Click **"Save Changes"**

**⚠️ Important**: This URL must also be updated if your ngrok URL changes.

---

## Step 6: Configure OAuth & Permissions

### Add OAuth Scopes

1. In the left sidebar, click **"OAuth & Permissions"** under "Features"

2. Scroll down to **"Scopes" → "Bot Token Scopes"**

3. Click **"Add an OAuth Scope"** and add these scopes:

   | Scope        | Description              | Why We Need It                  |
   | ------------ | ------------------------ | ------------------------------- |
   | `chat:write` | Send messages as the bot | Post task confirmations         |
   | `commands`   | Add slash commands       | `/new-measurehero-task` command |
   | `users:read` | View user information    | Get user's display name         |

4. The scopes section should look like:
   ```
   Bot Token Scopes:
   - chat:write
   - commands
   - users:read
   ```

### Redirect URLs (Optional)

If you plan to use OAuth for user authentication in the future:

- Skip this for now (not needed for current implementation)

---

## Step 7: Install App to Workspace

1. Still on the **"OAuth & Permissions"** page, scroll to the top

2. Click **"Install to Workspace"** (or "Reinstall to Workspace" if updating)

3. Review the permissions and click **"Allow"**

4. You'll be redirected back to the OAuth page

5. You should now see a **"Bot User OAuth Token"** that starts with `xoxb-`

6. Copy this token - you'll need it for your `.env` file

---

## Step 8: Get Your Signing Secret

Slack uses this to verify requests are actually from Slack.

1. In the left sidebar, click **"Basic Information"** under "Settings"

2. Scroll down to **"App Credentials"**

3. Find the **"Signing Secret"**

4. Click **"Show"** to reveal it

5. Copy the signing secret - you'll need it for your `.env` file

---

## Step 9: Configure Environment Variables

Update your `.env` file with the credentials from Slack:

**Security Notes:**

- Never commit these to version control
- Keep `.env` in your `.gitignore`
- Use different tokens for dev/staging/production

---

## Step 10: Get Channel IDs for Client Configuration

For each client channel, you need its Channel ID:

### Method 1: From Slack Desktop/Web App

1. Open Slack in desktop app or web browser

2. Navigate to the client's channel

3. Right-click on the channel name

4. Select **"View channel details"** (or "Open channel details")

5. At the bottom of the details popup, you'll see the Channel ID:

   ```
   Channel ID: C06EXAMPLE001
   ```

6. Click to copy it

### Method 2: From URL

1. Open the channel in Slack web app

2. Look at the URL:

   ```
   https://yourworkspace.slack.com/archives/C06EXAMPLE001
   ```

3. The Channel ID is the part after `/archives/`

### Add to Configuration

Add the channel ID to `src/config/clients.js`:

```javascript
{
  channelId: 'C06EXAMPLE001',
  clientName: 'Acme Corp',
  googleSheetId: '1HvY-jq1Y-pmE1AQJSEeviTUTpGxUtbpSImbaXaYfisU',
  clockifyProjectId: '69808678bed1dd0a0311aa9a',
}
```

---

## Step 11: Test Your Setup

### 1. Start Your App

```bash
# Make sure ngrok is running
ngrok http 3000

# In another terminal
pnpm dev
```

### 2. Test the Health Endpoint

```bash
curl https://your-ngrok-url.ngrok.io/health
```

Should return:

```json
{
	"status": "healthy",
	"timestamp": "2024-02-03T10:30:00.000Z",
	"environment": "development"
}
```

### 3. Test in Slack

1. Go to a configured client channel in Slack

2. Type: `/new-measurehero-task`

3. Press Enter

4. You should see a modal popup with the task submission form

5. Fill out the form and click "Submit"

6. After ~15 seconds, you should see a confirmation message with the task ID

### 4. Verify Data Flow

Check that:

- ✅ Task appears in Google Sheet
- ✅ Task created in Clockify
- ✅ Task ID populated in Google Sheet
- ✅ Confirmation message posted to Slack

---

## Step 12: Handle URL Changes (Development)

Every time you restart ngrok, the URL changes. You need to update:

1. **Slash Command Request URL**:
   - Go to **Slash Commands**
   - Edit `/new-measurehero-task`
   - Update Request URL

2. **Interactivity Request URL**:
   - Go to **Interactivity & Shortcuts**
   - Update Request URL

**💡 Tip**: Consider using ngrok's paid plan for a persistent domain, or deploy to production early to avoid this.

---

## Advanced Configuration (Optional)

### App Home

1. Go to **"App Home"** in the left sidebar

2. Enable **"Home Tab"** if you want a dedicated app home page (optional)

3. Customize the home tab experience (optional)

### Event Subscriptions

Not needed for current implementation, but useful if you want to:

- React to messages in channels
- Listen to app mentions
- Track when users join channels

### App Distribution (Production)

When ready for production:

1. Go to **"Manage Distribution"** in the left sidebar

2. Remove hard-coded information (check all items)

3. Click **"Distribute App"**

4. You can now share the app or submit to Slack App Directory

---

## Security Best Practices

### ✅ DO:

- Verify Slack signatures on all requests (already implemented in middleware)
- Use HTTPS for all endpoints (ngrok provides this automatically)
- Keep bot token and signing secret secure
- Rotate tokens periodically
- Use environment variables for secrets
- Monitor logs for suspicious activity

### ❌ DON'T:

- Commit tokens to version control
- Share tokens via email or Slack
- Use the same tokens across dev/staging/production
- Disable signature verification
- Expose `.env` file publicly

---

## App Permissions Summary

Here's what your app can and cannot do:

### ✅ Your App CAN:

- Read slash commands in channels it's added to
- Post messages in channels where it's invited
- Read user profiles (name, email)
- Respond to interactions (modal submissions)

### ❌ Your App CANNOT:

- Read message history
- Access private channels it's not invited to
- Read or modify workspace settings
- Act on behalf of users
- Access files or uploads

---

## Troubleshooting

### "dispatch_failed" error when using slash command

**Problem**: Slack can't reach your app

**Solutions**:

- Verify ngrok is running
- Check Request URL in Slash Commands is correct
- Ensure your app is running on port 3000
- Check firewall settings

### Modal doesn't open

**Problem**: Interactivity endpoint not configured

**Solutions**:

- Verify Interactivity is enabled
- Check Request URL in Interactivity settings
- Look at app logs for errors
- Verify signature validation is working

### "Invalid signature" errors in logs

**Problem**: Wrong signing secret or signature verification issue

**Solutions**:

- Double-check `SLACK_SIGNING_SECRET` in `.env`
- Ensure you copied the entire secret
- Restart your app after updating `.env`
- Check system time is correct (for timestamp validation)

### "This app can only be run in MeasureHero channels"

**Problem**: Command used in unconfigured channel

**Solutions**:

- Add the channel ID to `src/config/clients.js`
- Verify channel ID is correct
- Restart your app after updating config

### Bot messages not appearing

**Problem**: Missing `chat:write` scope or bot not in channel

**Solutions**:

- Verify `chat:write` scope is added
- Reinstall the app to workspace
- Invite the bot to the channel: `/invite @MeasureHero`

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Update Request URLs to production domain (not ngrok)
- [ ] Use production Slack workspace (if different from dev)
- [ ] Configure separate production tokens
- [ ] Enable proper logging and monitoring
- [ ] Set up error alerting (e.g., Sentry)
- [ ] Test all features in production environment
- [ ] Document runbook for on-call team
- [ ] Set up backup/disaster recovery plan

---

## Next Steps

After completing this setup:

1. ✅ Slack app created and configured
2. ✅ Slash command working
3. ✅ Interactivity enabled
4. ✅ OAuth tokens configured
5. ✅ Channel IDs added to config
6. ✅ App tested end-to-end

You're ready to onboard clients! 🎉

For each new client:

1. Create a dedicated Slack channel
2. Get the channel ID
3. Create Google Sheet and share with service account
4. Create Clockify project
5. Add configuration to `src/config/clients.js`
6. Invite bot to the channel: `/invite @MeasureHero`
7. Test with `/new-measurehero-task`

---

## Additional Resources

- [Slack API Documentation](https://api.slack.com/)
- [Slash Commands Guide](https://api.slack.com/interactivity/slash-commands)
- [Block Kit Builder](https://app.slack.com/block-kit-builder) (for customizing modals)
- [Bolt for JavaScript](https://slack.dev/bolt-js/concepts) (if you want to use Bolt SDK)
- [ngrok Documentation](https://ngrok.com/docs)
