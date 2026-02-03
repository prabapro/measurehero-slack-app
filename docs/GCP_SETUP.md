# docs/GCP_SETUP.md

# Google Cloud Platform Setup

Quick guide for setting up GCP service account for Google Sheets access.

## Prerequisites

- Google Cloud account
- Admin access to create service accounts

## 1. Create GCP Project

```bash
# Or use console: https://console.cloud.google.com/
```

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: `measurehero-slack-app`
3. Select the project

## 2. Enable Google Sheets API

```bash
gcloud services enable sheets.googleapis.com
```

Or via console:

1. Go to **APIs & Services → Library**
2. Search "Google Sheets API"
3. Click **Enable**

## 3. Create Service Account

```bash
gcloud iam service-accounts create measurehero-sheets-access \
  --display-name="MeasureHero Sheets Access" \
  --description="Service account for MeasureHero Slack app"
```

Or via console:

1. **APIs & Services → Credentials → Create Credentials → Service Account**
2. Name: `measurehero-sheets-access`
3. Skip optional steps, click **Done**

## 4. Create & Download Key

```bash
gcloud iam service-accounts keys create measurehero-service-account.json \
  --iam-account=measurehero-sheets-access@measurehero-slack-app.iam.gserviceaccount.com
```

Or via console:

1. Click service account → **Keys** tab
2. **Add Key → Create new key → JSON**
3. Download and save as `measurehero-service-account.json`

**⚠️ Keep this file secure! Never commit to Git.**

## 5. Extract Credentials

From the downloaded JSON, copy these to `.env`:

```json
{
	"client_email": "measurehero-sheets-access@....iam.gserviceaccount.com",
	"private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

**Your .env should have:**

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=measurehero-sheets-access@measurehero-slack-app.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----\n"
```

**Important**: Keep quotes around private key, keep all `\n` characters.

## 6. Share Sheets with Service Account

For each Google Sheet:

1. Open the sheet
2. Click **Share**
3. Add email: `measurehero-sheets-access@measurehero-slack-app.iam.gserviceaccount.com`
4. Set permission: **Editor**
5. Uncheck "Notify people"
6. Click **Share**

## 7. Get Sheet IDs

From sheet URL:

```
https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
```

Copy the `SHEET_ID_HERE` part to `src/config/clients.js`

## Required Sheet Structure

Sheet name: `submissions`

Columns A-K:

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

## Troubleshooting

**"Permission denied"**: Sheet not shared with service account email

**"Invalid grant"**: Check `GOOGLE_PRIVATE_KEY` has all `\n` characters and quotes

**"API not enabled"**: Run `gcloud services enable sheets.googleapis.com`

## Security Notes

✅ Add `*.json` to `.gitignore`  
✅ Use environment variables  
✅ Rotate keys every 90 days  
❌ Never commit credentials  
❌ Don't share via email/Slack
