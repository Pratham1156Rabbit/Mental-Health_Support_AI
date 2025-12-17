# Gmail OTP Setup Guide

This guide will help you configure Gmail to send OTP emails for email verification and password reset.

## Step 1: Enable 2-Step Verification

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Under "Signing in to Google", find **2-Step Verification**
4. Click on it and follow the prompts to enable 2-Step Verification

## Step 2: Generate App Password

1. After enabling 2-Step Verification, go back to **Security**
2. Look for **App passwords** (you may need to search for it)
3. Click on **App passwords**
4. Select **Mail** as the app
5. Select **Other (Custom name)** as the device
6. Enter "Mental Health AI" as the name
7. Click **Generate**
8. **Copy the 16-character password** (you'll need this!)

## Step 3: Configure Environment Variables

1. Open `server/.env` file (create it from `env.example` if it doesn't exist)
2. Add your Gmail credentials:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

**Important Notes:**
- Use your full Gmail address for `GMAIL_USER`
- Use the **App Password** (16 characters), NOT your regular Gmail password
- The App Password will look like: `abcd efgh ijkl mnop` (remove spaces when adding to .env)

## Step 4: Restart Server

After adding the credentials, restart your server:

```bash
cd server
npm run dev
```

## Testing

1. Try registering a new account - you should receive an OTP email
2. Try the "Forgot Password" feature - you should receive a password reset OTP

## Troubleshooting

### "Invalid login" error
- Make sure you're using the App Password, not your regular password
- Verify 2-Step Verification is enabled
- Check that the App Password was copied correctly (no extra spaces)

### "Connection timeout" error
- Check your internet connection
- Verify Gmail credentials are correct
- Make sure firewall isn't blocking SMTP connections

### Emails not received
- Check spam/junk folder
- Verify email address is correct
- Wait a few minutes (Gmail can sometimes delay emails)

## Security Note

**Never commit your `.env` file to version control!** It contains sensitive credentials.



