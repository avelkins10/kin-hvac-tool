# Vercel CLI Commands - Set Environment Variables

## Step 1: Login to Vercel

```bash
vercel login
```

This will open your browser to authenticate.

## Step 2: Link Your Project (if not already linked)

```bash
cd /Users/austinelkins/Downloads/hvacp-roposal-builder-interface2
vercel link
```

Follow the prompts to select your project (or create a new one).

## Step 3: Set Environment Variables

Run these commands one by one. When prompted, paste the value and press Enter.

### Set DATABASE_URL
```bash
echo "postgresql://neondb_owner:npg_W3HUwEXPZ0eC@ep-late-rice-aervqfab-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require" | vercel env add DATABASE_URL production preview development
```

### Set NEXTAUTH_SECRET
```bash
echo "YTlRW8PLwFVqMD/XZw5NAZDs6vdkQlZHA0EHa+IGDas=" | vercel env add NEXTAUTH_SECRET production preview development
```

### Set NEXTAUTH_URL
```bash
# Replace 'your-app-name' with your actual Vercel URL
# You can find it in: Vercel Dashboard → Your Project → Settings → Domains
echo "https://your-app-name.vercel.app" | vercel env add NEXTAUTH_URL production preview development
```

**Or run interactively:**
```bash
vercel env add NEXTAUTH_URL production preview development
# Then paste: https://your-app-name.vercel.app
```

## Alternative: All-in-One Script

After logging in, you can run:

```bash
./set-vercel-env.sh
```

## Verify Variables Are Set

```bash
vercel env ls
```

## After Setting Variables

Vercel will automatically redeploy your project. You can check the deployment status:

```bash
vercel ls
```
