# kyn - The Ultimate SaaS Starter Kit

A production-ready starter kit for building architecture-focused applications.

## 🚀 Two-Tier Security Architecture

This template uses a two-tier secret management system:

1.  **Platform Level (Environment Variables)**:
    *   Used by the platform owner to manage the infrastructure (Supabase DB, GitHub OAuth App).
    *   Configured via `.env` using `process.env` placeholders.
2.  **User Level (Encrypted Database)**:
    *   Used by individual developers (users) to store their own app secrets (Supabase, Grok, Vercel).
    *   Encrypted with AES-256 using a master `ENCRYPTION_KEY` before storage.
    *   Fetched and decrypted on-the-fly per request.

---

## 🛠️ Platform Setup Guide (For Owners)

1.  **Supabase (Platform DB)**:
    *   Create a project at [supabase.com](https://supabase.com).
    *   Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET` in `.env`.
    *   Run the SQL schema provided below in the SQL Editor.
2.  **GitHub OAuth (Platform App)**:
    *   Create an OAuth App in GitHub Developer Settings.
    *   Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env`.
    *   Callback URL: `https://your-app.run.app/api/github/callback`.
3.  **Netlify OAuth (Platform App)**:
    *   Create an OAuth App in Netlify Developer Settings.
    *   Set `NETLIFY_CLIENT_ID` and `NETLIFY_CLIENT_SECRET` in `.env`.
    *   Callback URL: `https://your-app.run.app/api/netlify/callback`.
4.  **Security**:
    *   Generate a 32-byte hex key for `ENCRYPTION_KEY`.
    *   Set `APP_URL` to your deployment origin.

---

## 🛠️ User Setup Guide (For Developers)

1.  **Connect GitHub**: Click "Connect GitHub" in the Onboarding flow. This is a one-time authorization.
2.  **Connect Netlify**: Connect via OAuth or provide a PAT. Select your site to auto-create a build hook.
3.  **Configure Secrets**: Provide your own:
    *   **Supabase**: Project URL, Anon Key, Service Role, JWT Secret.
    *   **AI**: Grok API Key.
    *   **Vercel/Netlify**: Deploy Hook URL (auto-filled if using Netlify step).
4.  **Build**: Once setup is complete, you can use the Wizard to generate and deploy apps.

---

## 🗄️ Database Schema

Run this in your Supabase SQL Editor:

```sql
-- Apps Table
create table apps (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  specs jsonb,
  generated_code jsonb,
  created_at timestamptz default now()
);

-- User GitHub Tokens
create table user_github_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id)
);

-- User Netlify Tokens
create table user_netlify_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  access_token text not null,
  refresh_token text,
  created_at timestamptz default now(),
  unique(user_id)
);

-- User Platform Keys (Encrypted)
create table user_platform_keys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  encrypted_data text not null,
  user_encryption_key text not null,
  created_at timestamptz default now(),
  unique(user_id)
);

-- Logs Table
create table logs (
  id bigserial primary key,
  user_id uuid references auth.users(id),
  action text not null,
  metadata jsonb,
  created_at timestamptz default now()
);
```

---

## 🛡️ Security Note
This template uses **AES-256-CBC** encryption for third-party tokens. Ensure your `ENCRYPTION_KEY` is kept secret and never committed to version control.
