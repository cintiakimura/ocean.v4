# kyn - The Ultimate SaaS Starter Kit

A production-ready starter kit for building architecture-focused applications with Next.js, Supabase, GitHub OAuth, and Vercel.

## 🚀 Features
- **VETR Loop**: Advanced self-debugging AI generation loop (requires Grok API).
- **GitHub OAuth**: Secure, encrypted token storage with auto-refresh.
- **Supabase Integration**: Auth, Database (Postgres), and Storage.
- **Vercel Deployment**: One-click deployment triggers via webhooks.
- **Security**: AES-256 token encryption, JWT validation, and CSRF protection.

---

## 🛠️ Setup Guide

This project is a template. You must provide your own environment variables to make it functional.

### 1. Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com).
2. Go to **Project Settings** -> **API**.
3. Copy your **Project URL** (`SUPABASE_URL`), **anon public** key (`SUPABASE_ANON_KEY`), and **service_role** key (`SUPABASE_SERVICE_ROLE_KEY`).
4. Copy your **JWT Secret** (`JWT_SECRET`) from the same page.
5. Run the SQL schema provided in the "Database Schema" section below in the **SQL Editor**.

### 2. GitHub OAuth Setup
1. Go to your [GitHub Developer Settings](https://github.com/settings/developers).
2. Click **New OAuth App**.
3. **Homepage URL**: Your app's URL (e.g., `https://your-app.run.app`).
4. **Authorization callback URL**: `https://your-app.run.app/api/github/callback`.
5. Click **Register application**.
6. Copy your **Client ID** (`GITHUB_CLIENT_ID`) and generate a **Client Secret** (`GITHUB_CLIENT_SECRET`).
7. **Important**: These keys are set in the environment variables. Users will connect their GitHub accounts via a one-time OAuth flow in the app.

### 3. Vercel Deploy Hook
1. Push your code to a GitHub repository.
2. Import the project into [Vercel](https://vercel.com).
3. Go to **Settings** -> **Git**.
4. Under **Deploy Hooks**, create a new hook (e.g., name it "kyn-deploy").
5. Copy the generated URL (`VERCEL_DEPLOY_HOOK`).

### 4. Environment Variables
Create a `.env` file in the root directory and fill in the following using placeholders from `.env.example`:

```env
# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
JWT_SECRET="your-jwt-secret"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Security
# Generate a 32-byte hex key: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY="your-32-byte-hex-key"

# App Configuration
APP_URL="https://your-app.run.app"
GROK_KEY="your-grok-api-key"
```

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

-- User Platform Keys (Encrypted)
create table user_platform_keys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  encrypted_data text not null,
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
