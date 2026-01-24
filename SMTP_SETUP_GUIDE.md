# SMTP Email Setup Guide

## What is SMTP?

SMTP (Simple Mail Transfer Protocol) is used to send emails from your application. You'll need SMTP credentials to send:
- Proposal emails to customers
- Signature request notifications
- Finance approval notifications

---

## Option 1: Gmail (Easiest for Testing)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com
2. Click **Security** in the left sidebar
3. Enable **2-Step Verification** if not already enabled

### Step 2: Generate App Password
1. Still in Security settings, scroll to **2-Step Verification**
2. Click **App passwords** (you may need to search for it)
3. Select **Mail** as the app
4. Select **Other (Custom name)** as device
5. Enter "HVAC Proposal Builder" as the name
6. Click **Generate**
7. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Use These Settings
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop  (the app password from step 2)
SMTP_FROM=your-email@gmail.com
```

**Note**: Use the App Password, NOT your regular Gmail password!

---

## Option 2: SendGrid (Recommended for Production)

### Step 1: Create SendGrid Account
1. Go to https://sendgrid.com
2. Sign up for a free account (100 emails/day free)
3. Verify your email address

### Step 2: Create API Key
1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name it "HVAC Proposal Builder"
4. Select **Full Access** or **Restricted Access** (Mail Send permission)
5. Click **Create & View**
6. **Copy the API key immediately** (you won't see it again!)

### Step 3: Verify Sender Identity
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in your email details
4. Check your email and click the verification link

### Step 4: Use These Settings
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-api-key-here  (the API key from step 2)
SMTP_FROM=your-verified-email@example.com
```

**Important**: 
- `SMTP_USER` is always `apikey` (literally the word "apikey")
- `SMTP_PASSWORD` is your SendGrid API key

---

## Option 3: Other Email Providers

### Outlook/Office 365
```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
SMTP_FROM=your-email@outlook.com
```

### Yahoo
```
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASSWORD=your-app-password  (need to generate app password)
SMTP_FROM=your-email@yahoo.com
```

### Custom SMTP Server
If you have your own email server or use a hosting provider:
```
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587  (or 465 for SSL)
SMTP_SECURE=true  (if using port 465)
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-password
SMTP_FROM=your-email@yourdomain.com
```

---

## Quick Decision Guide

**For Testing/Development:**
- ✅ Use **Gmail** (easiest, free, quick setup)

**For Production:**
- ✅ Use **SendGrid** (more reliable, better deliverability, free tier available)
- ✅ Or use your **company email server** (if you have one)

---

## What You Need to Provide

Once you choose a provider, I'll need these 6 values:

1. **SMTP_HOST** - The SMTP server address
2. **SMTP_PORT** - Usually 587 (or 465 for SSL)
3. **SMTP_SECURE** - `false` for port 587, `true` for port 465
4. **SMTP_USER** - Your email address (or "apikey" for SendGrid)
5. **SMTP_PASSWORD** - Your password or API key
6. **SMTP_FROM** - The "from" email address

---

## Security Notes

⚠️ **Never commit SMTP passwords to git!**
- They're stored securely in Vercel environment variables
- They're encrypted and only accessible at runtime

---

## Testing After Setup

Once configured, you can test by:
1. Creating a proposal
2. Clicking "Send to Customer"
3. Checking if the email arrives

The email will contain a link to view the proposal.
