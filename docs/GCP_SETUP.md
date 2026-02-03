# Google Cloud Platform Setup Guide

This guide will walk you through setting up Google Cloud Platform (GCP) to enable the MeasureHero Slack app to access Google Sheets via a service account.

## Overview

We'll use a **Service Account** instead of OAuth because:

- No user interaction needed for authentication
- Perfect for server-to-server communication
- Simpler to manage in production
- No token refresh logic required

## Prerequisites

- A Google Cloud Platform account
- Admin access to create projects and service accounts
- Google Sheets that you want the app to access

---

## Step 1: Create a GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)

2. Click on the project dropdown at the top of the page

3. Click **"New Project"**

4. Enter project details:
   - **Project name**: `measurehero-slack-app` (or your preferred name)
   - **Organization**: Select your organization (if applicable)
   - **Location**: Choose appropriate location

5. Click **"Create"**

6. Wait for the project to be created (usually takes a few seconds)

7. Select your newly created project from the project dropdown

---

## Step 2: Enable Google Sheets API

1. In the Google Cloud Console, navigate to **"APIs & Services" → "Library"**
   - Or use the search bar and type "API Library"

2. Search for **"Google Sheets API"**

3. Click on **"Google Sheets API"** in the search results

4. Click the **"Enable"** button

5. Wait for the API to be enabled (takes a few seconds)

---

## Step 3: Create a Service Account

1. Navigate to **"APIs & Services" → "Credentials"**

2. Click **"Create Credentials"** at the top

3. Select **"Service Account"** from the dropdown

4. Fill in the service account details:
   - **Service account name**: `measurehero-sheets-access`
   - **Service account ID**: Auto-generated (e.g., `measurehero-sheets-access@your-project.iam.gserviceaccount.com`)
   - **Service account description**: `Service account for MeasureHero Slack app to access Google Sheets`

5. Click **"Create and Continue"**

6. **Grant this service account access to project** (optional):
   - You can skip this step by clicking **"Continue"**
   - We'll grant access directly on the sheets instead

7. **Grant users access to this service account** (optional):
   - Skip this step by clicking **"Done"**

---

## Step 4: Create and Download Service Account Key

1. On the **"Credentials"** page, find your newly created service account under **"Service Accounts"**

2. Click on the service account email to open its details

3. Go to the **"Keys"** tab

4. Click **"Add Key" → "Create new key"**

5. Select **"JSON"** as the key type

6. Click **"Create"**

7. A JSON file will be downloaded automatically to your computer
   - **⚠️ IMPORTANT**: Keep this file secure! It contains credentials.
   - Name it something like `measurehero-service-account.json`

8. The JSON file contains:
   ```json
   {
     "type": "service_account",
     "project_id": "your-project-id",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "measurehero-sheets-access@your-project.iam.gserviceaccount.com",
     "client_id": "...",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     ...
   }
   ```

---

## Step 5: Extract Credentials for .env File

From the downloaded JSON file, you need two values for your `.env` file:

### 1. Service Account Email

```json
"client_email": "measurehero-sheets-access@your-project.iam.gserviceaccount.com"
```

👉 Copy this to `GOOGLE_SERVICE_ACCOUNT_EMAIL` in your `.env` file

### 2. Private Key

```json
"private_key": "-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

👉 Copy this **entire value** (including `\n` characters) to `GOOGLE_PRIVATE_KEY` in your `.env` file

**Example .env entry:**

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=measurehero-sheets-access@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**⚠️ Important Notes:**

- Keep the quotes around the private key
- Keep all `\n` characters - they're important!
- Never commit this file to version control

---

## Step 6: Share Google Sheets with Service Account

For each Google Sheet you want the app to access:

1. Open the Google Sheet in your browser

2. Click the **"Share"** button (top right)

3. In the "Add people and groups" field, paste your service account email:

   ```
   measurehero-sheets-access@your-project.iam.gserviceaccount.com
   ```

4. Set permission level:
   - Choose **"Editor"** (app needs to write data)

5. **UNCHECK** "Notify people" (service accounts don't need notifications)

6. Click **"Share"** or **"Send"**

7. The service account now has access to this sheet

**Repeat this for every client's Google Sheet.**

---

## Step 7: Get Sheet IDs for Configuration

For each Google Sheet, you need its Sheet ID to add to `src/config/clients.js`:

1. Open the Google Sheet

2. Look at the URL in your browser:

   ```
   https://docs.google.com/spreadsheets/d/1HvY-jq1Y-pmE1AQJSEeviTUTpGxUtbpSImbaXaYfisU/edit
   ```

3. The Sheet ID is the long string between `/d/` and `/edit`:

   ```
   1HvY-jq1Y-pmE1AQJSEeviTUTpGxUtbpSImbaXaYfisU
   ```

4. Copy this ID to your client configuration in `src/config/clients.js`

---

## Verification

To verify your setup works:

1. Ensure your `.env` file has the correct values:

   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

2. Make sure you've shared each Google Sheet with the service account email

3. Run the app and check the logs:

   ```bash
   pnpm dev
   ```

4. You should see:

   ```
   Server started on port 3000
   ```

5. The app will verify sheet access when you submit a task

---

## Security Best Practices

### ✅ DO:

- Store the service account JSON file securely
- Add `*.json` to `.gitignore` to prevent committing credentials
- Use environment variables for credentials
- Rotate service account keys periodically (every 90 days recommended)
- Only share sheets with the service account that need access
- Use different service accounts for different environments (dev/prod)

### ❌ DON'T:

- Commit service account credentials to version control
- Share service account keys via email or Slack
- Grant service account more permissions than needed
- Use the same service account across multiple unrelated projects

---

## Troubleshooting

### Error: "The caller does not have permission"

**Solution**: Make sure you've shared the Google Sheet with your service account email

### Error: "Invalid grant" or "Invalid private key"

**Solution**:

- Check that `GOOGLE_PRIVATE_KEY` includes all `\n` characters
- Ensure the private key is wrapped in quotes in `.env`
- Verify you copied the entire private key including BEGIN/END markers

### Error: "API has not been used in project"

**Solution**: Make sure you enabled the Google Sheets API in Step 2

### Error: "Service account does not exist"

**Solution**: Verify the service account email is correct and the service account wasn't deleted

---

## Next Steps

After completing this setup:

1. ✅ Google Sheets API enabled
2. ✅ Service account created
3. ✅ Credentials extracted to `.env`
4. ✅ Sheets shared with service account
5. ✅ Sheet IDs added to `clients.js`

You're now ready to proceed with the [Slack App Setup](./SLACK_SETUP.md)!

---

## Additional Resources

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Service Account Documentation](https://cloud.google.com/iam/docs/service-accounts)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API Library](https://console.cloud.google.com/apis/library)
