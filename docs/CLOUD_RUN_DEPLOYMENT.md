# Cloud Run Deployment Guide

This guide will walk you through deploying the MeasureHero Slack app to Google Cloud Run.

## Overview

Google Cloud Run is a fully managed serverless platform that automatically scales your containerized application. We'll use:

- **Docker** for containerization (using your existing Dockerfile)
- **Cloud Build** to build the container image
- **Cloud Run** to host and run the application
- **Artifact Registry** to store the container image

---

## Prerequisites

### 1. Google Cloud SDK (gcloud CLI)

Install the gcloud CLI if you haven't already:

- **macOS**: `brew install google-cloud-sdk`
- **Windows**: Download from [cloud.google.com/sdk](https://cloud.google.com/sdk/docs/install)
- **Linux**: Follow instructions at [cloud.google.com/sdk](https://cloud.google.com/sdk/docs/install)

Verify installation:

```bash
gcloud --version
```

### 2. Authentication

Log in to your Google Cloud account:

```bash
gcloud auth login
```

### 3. Project Setup

Set your project ID and region:

```bash
gcloud config set project measurehero-slack-app
gcloud config set run/region europe-west1
```

Verify configuration:

```bash
gcloud config list
```

---

## Step 1: Enable Required APIs

Enable the necessary Google Cloud APIs:

```bash
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Cloud Build API (for building containers)
gcloud services enable cloudbuild.googleapis.com

# Enable Artifact Registry API (for storing container images)
gcloud services enable artifactregistry.googleapis.com

# Enable Container Registry API (legacy, but still useful)
gcloud services enable containerregistry.googleapis.com
```

**⏱️ This takes 1-2 minutes.**

---

## Step 2: Create Artifact Registry Repository

Create a Docker repository to store your container images:

```bash
gcloud artifacts repositories create measurehero-repo \
  --repository-format=docker \
  --location=europe-west1 \
  --description="MeasureHero Slack App container images"
```

Verify the repository was created:

```bash
gcloud artifacts repositories list --location=europe-west1
```

Configure Docker authentication:

```bash
gcloud auth configure-docker europe-west1-docker.pkg.dev
```

---

## Step 3: Build and Push Container Image

### Build the Container Image

From your project root directory:

```bash
gcloud builds submit \
  --tag europe-west1-docker.pkg.dev/measurehero-slack-app/measurehero-repo/measurehero-slack-app:latest
```

**What this does:**

- Uploads your code to Cloud Build
- Builds the Docker image using your Dockerfile
- Pushes the image to Artifact Registry
- Tags it as `latest`

**⏱️ First build takes 3-5 minutes. Subsequent builds are faster (~1-2 minutes).**

**Troubleshooting:**

- If you get "permission denied", run: `gcloud auth application-default login`
- If build fails, check your Dockerfile syntax and ensure all files exist

---

## Step 4: Deploy to Cloud Run

### Initial Deployment

Deploy your application with environment variables:

```bash
gcloud run deploy measurehero-slack-app \
  --image europe-west1-docker.pkg.dev/measurehero-slack-app/measurehero-repo/measurehero-slack-app:latest \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 60 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars TASKS_AT_A_TIME=3 \
  --set-env-vars CLOCKIFY_MAX_RETRIES=3 \
  --set-env-vars CLOCKIFY_RETRY_DELAY_MS=2000
```

**⚠️ IMPORTANT:** You'll be prompted to set additional environment variables. See Step 5 below.

**Command Explanation:**

- `--image`: Container image to deploy
- `--platform managed`: Use fully managed Cloud Run (serverless)
- `--region`: Deploy to europe-west1
- `--allow-unauthenticated`: Allow public access (Slack needs to reach your endpoints)
- `--port 3000`: Container listens on port 3000
- `--memory 512Mi`: Allocate 512MB RAM (adjust if needed)
- `--cpu 1`: Allocate 1 vCPU
- `--min-instances 0`: Scale to zero when idle (saves costs)
- `--max-instances 10`: Scale up to 10 instances under load
- `--timeout 60`: Request timeout of 60 seconds
- `--set-env-vars`: Set environment variables

**⏱️ Deployment takes 1-2 minutes.**

---

## Step 5: Set Sensitive Environment Variables

After initial deployment, set the sensitive credentials:

```bash
gcloud run services update measurehero-slack-app \
  --region europe-west1 \
  --update-env-vars \
SLACK_BOT_TOKEN="xoxb-your-slack-bot-token",\
SLACK_SIGNING_SECRET="your-slack-signing-secret",\
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@measurehero-slack-app.iam.gserviceaccount.com",\
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n",\
CLOCKIFY_API_KEY="your-clockify-api-key",\
CLOCKIFY_WORKSPACE_ID="your-clockify-workspace-id"
```

**⚠️ Replace the placeholder values with your actual credentials!**

**Important Notes:**

- Wrap values with spaces/special characters in quotes
- For `GOOGLE_PRIVATE_KEY`, keep the `\n` characters exactly as shown
- Don't commit these values to Git

**Alternative Method - Setting Env Vars via Console:**

If you prefer using the GCP Console:

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click on `measurehero-slack-app`
3. Click **"Edit & Deploy New Revision"**
4. Scroll to **"Variables & Secrets"** → **"Variables"**
5. Click **"Add Variable"** for each:
   - `SLACK_BOT_TOKEN`
   - `SLACK_SIGNING_SECRET`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `CLOCKIFY_API_KEY`
   - `CLOCKIFY_WORKSPACE_ID`
6. Click **"Deploy"**

---

## Step 6: Get Your Cloud Run URL

After deployment, get your service URL:

```bash
gcloud run services describe measurehero-slack-app \
  --region europe-west1 \
  --format='value(status.url)'
```

Your URL will look like:

```
https://measurehero-slack-app-<random-id>-ew.a.run.app
```

**Save this URL - you'll need it for Slack configuration!**

---

## Step 7: Test Your Deployment

### Test the Health Endpoint

```bash
curl https://measurehero-slack-app-<your-id>-ew.a.run.app/health
```

Expected response:

```json
{
	"status": "healthy",
	"timestamp": "2024-02-03T10:30:00.000Z",
	"environment": "production"
}
```

### Test the Root Endpoint

```bash
curl https://measurehero-slack-app-<your-id>-ew.a.run.app/
```

Expected response:

```json
{
	"message": "MeasureHero Slack App",
	"version": "1.0.0"
}
```

---

## Step 8: Update Slack App URLs

Now update your Slack app to use the Cloud Run URL instead of ngrok:

### Update Slash Command URL

1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Select your **MeasureHero** app
3. Go to **"Slash Commands"**
4. Edit `/measurehero-new-task`
5. Update **Request URL** to:
   ```
   https://measurehero-slack-app-<your-id>-ew.a.run.app/slack/commands
   ```
6. Click **"Save"**

### Update Interactivity URL

1. Go to **"Interactivity & Shortcuts"**
2. Update **Request URL** to:
   ```
   https://measurehero-slack-app-<your-id>-ew.a.run.app/slack/interactions
   ```
3. Click **"Save Changes"**

**✅ No need to reinstall the app - URL changes take effect immediately.**

---

## Step 9: Test End-to-End

1. Go to a configured client channel in Slack
2. Type: `/measurehero-new-task`
3. Fill out the modal form
4. Submit
5. Verify:
   - ✅ Task appears in Google Sheets
   - ✅ Task created in Clockify
   - ✅ Confirmation message in Slack thread

---

## Updating Your App (Redeployment)

When you make code changes and want to redeploy:

### Option 1: Rebuild and Deploy in One Command

```bash
# Build new image
gcloud builds submit \
  --tag europe-west1-docker.pkg.dev/measurehero-slack-app/measurehero-repo/measurehero-slack-app:latest

# Deploy new version
gcloud run deploy measurehero-slack-app \
  --image europe-west1-docker.pkg.dev/measurehero-slack-app/measurehero-repo/measurehero-slack-app:latest \
  --region europe-west1
```

**⏱️ Takes 2-4 minutes total.**

### Option 2: Deploy with Automatic Build

```bash
gcloud run deploy measurehero-slack-app \
  --source . \
  --region europe-west1
```

**This builds and deploys in one command but is slower (~5 minutes).**

---

## Viewing Logs

### View Recent Logs

```bash
gcloud run services logs read measurehero-slack-app \
  --region europe-west1 \
  --limit 50
```

### Stream Live Logs

```bash
gcloud run services logs tail measurehero-slack-app \
  --region europe-west1
```

### View Logs in Console

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click on `measurehero-slack-app`
3. Click **"Logs"** tab
4. Use the log explorer to filter by severity, time, etc.

---

## Managing Environment Variables

### View Current Environment Variables

```bash
gcloud run services describe measurehero-slack-app \
  --region europe-west1 \
  --format='table(spec.template.spec.containers[0].env[].name, spec.template.spec.containers[0].env[].value)'
```

### Update Single Environment Variable

```bash
gcloud run services update measurehero-slack-app \
  --region europe-west1 \
  --update-env-vars TASKS_AT_A_TIME=5
```

### Remove Environment Variable

```bash
gcloud run services update measurehero-slack-app \
  --region europe-west1 \
  --remove-env-vars SOME_VAR
```

---

## Cost Optimization

Cloud Run pricing is based on:

- **vCPU**: Per second while handling requests
- **Memory**: Per second while handling requests
- **Requests**: Number of requests
- **Networking**: Egress traffic

**Tips to reduce costs:**

1. **Scale to zero**: Already configured with `--min-instances 0`
2. **Right-size resources**: Monitor usage and adjust:
   ```bash
   gcloud run services update measurehero-slack-app \
     --region europe-west1 \
     --memory 256Mi \
     --cpu 0.5
   ```
3. **Set request timeout**: Already set to 60 seconds
4. **Monitor free tier**: Cloud Run provides generous free tier:
   - 2 million requests/month
   - 360,000 GB-seconds of memory
   - 180,000 vCPU-seconds

### View Current Cost

Check [Cloud Billing Console](https://console.cloud.google.com/billing) → **Reports**

---

## Custom Domain Setup (Future)

When you're ready to add a custom domain:

### 1. Verify Domain Ownership

```bash
gcloud domains verify measurehero.com
```

### 2. Map Domain to Service

```bash
gcloud run domain-mappings create \
  --service measurehero-slack-app \
  --domain app.measurehero.com \
  --region europe-west1
```

### 3. Update DNS Records

You'll receive DNS records to add to your domain provider:

- **Type**: CNAME or A
- **Name**: app
- **Value**: ghs.googlehosted.com (or provided IP)

### 4. Update Slack URLs

Update your Slack app URLs to use your custom domain:

```
https://app.measurehero.com/slack/commands
https://app.measurehero.com/slack/interactions
```

**📚 More details:** [Cloud Run Custom Domains Guide](https://cloud.google.com/run/docs/mapping-custom-domains)

---

## Security Best Practices

### ✅ DO:

- Keep environment variables secure (never commit to Git)
- Use Cloud Run's built-in HTTPS (automatic SSL certificates)
- Monitor logs regularly for suspicious activity
- Set up uptime monitoring (Cloud Monitoring)
- Enable Cloud Armor for DDoS protection (if needed)
- Rotate credentials periodically
- Use least-privilege IAM roles

### ❌ DON'T:

- Disable `--allow-unauthenticated` (Slack needs public access)
- Commit `.env` files with production credentials
- Use the same credentials across dev/staging/production
- Ignore failed deployment warnings

---

## Monitoring & Alerting

### Set Up Uptime Check

1. Go to [Cloud Monitoring](https://console.cloud.google.com/monitoring)
2. Click **"Uptime Checks"** → **"Create Uptime Check"**
3. Configure:
   - **Title**: MeasureHero Health Check
   - **Protocol**: HTTPS
   - **Resource Type**: URL
   - **Hostname**: Your Cloud Run URL
   - **Path**: `/health`
   - **Check frequency**: 1 minute
4. Set up alert notifications (email, Slack, etc.)

### View Service Metrics

```bash
# Open metrics in browser
gcloud run services describe measurehero-slack-app \
  --region europe-west1 \
  --format='value(status.url)' | xargs -I {} open "https://console.cloud.google.com/run/detail/europe-west1/measurehero-slack-app/metrics"
```

**Key metrics to monitor:**

- Request count
- Request latency
- Error rate
- Instance count
- CPU utilization
- Memory utilization

---

## Troubleshooting

### Problem: Deployment fails with "permission denied"

**Solution:**

```bash
# Re-authenticate
gcloud auth login
gcloud auth application-default login

# Verify project
gcloud config get-value project
```

### Problem: Service crashes immediately after deployment

**Solution:**

1. Check logs:

   ```bash
   gcloud run services logs read measurehero-slack-app --region europe-west1
   ```

2. Common issues:
   - Missing environment variables
   - Invalid `GOOGLE_PRIVATE_KEY` format
   - Wrong port (should be 3000)

3. Verify environment variables are set:
   ```bash
   gcloud run services describe measurehero-slack-app \
     --region europe-west1 \
     --format=json | grep -A 5 env
   ```

### Problem: "dispatch_failed" in Slack

**Solution:**

1. Verify service is running:

   ```bash
   curl https://your-cloud-run-url.run.app/health
   ```

2. Check Slack URLs are updated correctly

3. Check logs for signature verification errors

### Problem: Signature verification fails

**Solution:**

1. Verify `SLACK_SIGNING_SECRET` is correct
2. Check system time is synchronized
3. Ensure raw body is captured (already implemented in code)

### Problem: Google Sheets API returns 403

**Solution:**

1. Verify service account email is correct
2. Check sheets are shared with service account
3. Verify `GOOGLE_PRIVATE_KEY` has all `\n` characters

### Problem: Clockify API fails

**Solution:**

1. Verify `CLOCKIFY_API_KEY` is valid
2. Check `CLOCKIFY_WORKSPACE_ID` is correct
3. Verify project IDs in `src/config/clients.js`

### Problem: High latency or timeouts

**Solution:**

1. Increase memory/CPU:

   ```bash
   gcloud run services update measurehero-slack-app \
     --region europe-west1 \
     --memory 1Gi \
     --cpu 2
   ```

2. Increase timeout:

   ```bash
   gcloud run services update measurehero-slack-app \
     --region europe-west1 \
     --timeout 300
   ```

3. Set min instances to reduce cold starts:
   ```bash
   gcloud run services update measurehero-slack-app \
     --region europe-west1 \
     --min-instances 1
   ```

---

## Rollback to Previous Version

If a deployment causes issues, rollback to the previous version:

### List Recent Revisions

```bash
gcloud run revisions list \
  --service measurehero-slack-app \
  --region europe-west1
```

### Rollback to Specific Revision

```bash
gcloud run services update-traffic measurehero-slack-app \
  --region europe-west1 \
  --to-revisions REVISION-NAME=100
```

**Replace `REVISION-NAME` with the revision you want to rollback to.**

---

## Deleting the Service (If Needed)

To completely remove the Cloud Run service:

```bash
gcloud run services delete measurehero-slack-app \
  --region europe-west1
```

To also delete the container images:

```bash
gcloud artifacts repositories delete measurehero-repo \
  --location europe-west1
```

---

## Production Deployment Checklist

Before going live:

- [ ] All environment variables configured correctly
- [ ] Google Sheets shared with service account
- [ ] Clockify projects set up for all clients
- [ ] Slack app URLs updated to Cloud Run URL
- [ ] Health endpoint returns 200 OK
- [ ] End-to-end test successful in each client channel
- [ ] Logs configured and accessible
- [ ] Uptime monitoring enabled
- [ ] Alert notifications configured
- [ ] Cost budget alerts set up
- [ ] Documentation updated with production URL
- [ ] Team notified of new production URL

---

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [gcloud run commands](https://cloud.google.com/sdk/gcloud/reference/run)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Cloud Run Best Practices](https://cloud.google.com/run/docs/best-practices)
- [Troubleshooting Guide](https://cloud.google.com/run/docs/troubleshooting)

---

## Getting Help

If you encounter issues:

1. Check logs first: `gcloud run services logs read measurehero-slack-app --region europe-west1`
2. Review this troubleshooting section
3. Check [Stack Overflow - Cloud Run tag](https://stackoverflow.com/questions/tagged/google-cloud-run)
4. Ask in [Google Cloud Community](https://www.googlecloudcommunity.com/)

---

**🎉 You're all set! Your MeasureHero Slack app is now running on Cloud Run.**

For ongoing maintenance, remember to:

- Monitor logs regularly
- Check cost reports monthly
- Update dependencies periodically
- Rotate credentials every 90 days
