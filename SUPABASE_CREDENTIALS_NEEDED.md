# Supabase Credentials Needed

## ✅ What We Have

- **Project Reference**: `cvhomuxlhinmviwfkkyh`
- **Database Password**: `@Mambamentality10`
- **Database Connection**: `postgresql://postgres.cvhomuxlhinmviwfkkyh:@Mambamentality10@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
- **Project URL**: `https://cvhomuxlhinmviwfkkyh.supabase.co`

## ⏳ What We Still Need

### API Keys (Required)

Go to: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/settings/api

Copy these two keys:

1. **anon public key**
   - Look for "Project API keys" section
   - Copy the `anon` `public` key (starts with `eyJ`)
   - This is safe to expose in client-side code

2. **service_role key**
   - Same section, copy the `service_role` `secret` key (starts with `eyJ`)
   - ⚠️ **Keep this secret!** Never expose in client-side code
   - Used for server-side operations that bypass RLS

## Once You Have the Keys

I'll:
1. ✅ Add them to Vercel environment variables
2. ✅ Set up storage buckets
3. ✅ Migrate your database from Neon to Supabase
4. ✅ Update code to use Supabase Storage
5. ✅ Test everything

## Quick Access

- **Dashboard**: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh
- **API Settings**: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/settings/api
- **SQL Editor**: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/sql/new
- **Storage**: https://supabase.com/dashboard/project/cvhomuxlhinmviwfkkyh/storage/buckets
