# Supabase Documentation Needed

## Implementation Questions

Based on your answers, here are the specific Supabase docs/features I may need:

### 1. Password Migration
- **Question**: How to migrate existing bcrypt password hashes to Supabase Auth?
- **Docs Needed**: 
  - Supabase Admin API for creating users with pre-hashed passwords
  - Or direct database insert into `auth.users` table
  - Password hash format compatibility

### 2. Storage RLS with Custom User Metadata
- **Question**: How to use RLS policies that check custom User table (role, companyId) instead of Supabase Auth metadata?
- **Docs Needed**:
  - RLS policies that join with custom tables
  - Using `auth.uid()` to look up User table by `supabaseUserId`
  - Storage policies with custom table joins

### 3. Supabase Auth with Next.js App Router
- **Question**: Best practices for Supabase Auth with Next.js 16 App Router?
- **Docs Needed**:
  - `@supabase/ssr` usage patterns
  - Server/client component patterns
  - Middleware integration
  - Session management

### 4. Custom User Metadata Pattern
- **Question**: Best way to store role/companyId - in User table vs Supabase Auth metadata?
- **Docs Needed**:
  - User metadata vs custom table patterns
  - Performance implications
  - Query patterns

## What I Can Use

If you have access to these Supabase docs, they would be helpful:
1. **Supabase Auth Admin API** - for password migration
2. **Supabase Storage RLS** - for custom table joins in policies
3. **Supabase SSR Guide** - for Next.js App Router integration
4. **Supabase Auth Custom Data** - for role/companyId storage patterns

## Alternative Approach

If docs aren't available, I can:
- Use web search for Supabase implementation patterns
- Reference Supabase's public documentation
- Use best practices from Supabase community examples

Let me know if you want to provide specific docs, or if I should proceed with web search!
