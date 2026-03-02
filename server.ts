import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import { Octokit } from 'octokit';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import CryptoJS from 'crypto-js';
import { fileURLToPath } from 'url';

dotenv.config();

// --- Environment Validation ---
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'ENCRYPTION_KEY',
  'APP_URL',
  'VERCEL_DEPLOY_HOOK'
];

const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error('CRITICAL: Missing environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// --- Encryption Utils ---
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; 
const IV_LENGTH = 16;

function encrypt(text: string) {
  if (!ENCRYPTION_KEY) {
    throw new Error('Missing or invalid ENCRYPTION_KEY—add it to .env');
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string) {
  if (!ENCRYPTION_KEY) {
    throw new Error('Missing or invalid ENCRYPTION_KEY—add it to .env');
  }
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// --- User Secrets Utils ---
async function getUserSecrets(userId: string) {
  const { data, error } = await supabase
    .from('user_platform_keys')
    .select('encrypted_data, user_encryption_key')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('Setup incomplete—go to Secrets tab NOW.');
  }

  try {
    const userEncryptionKey = decrypt(data.user_encryption_key);
    const bytes = CryptoJS.AES.decrypt(data.encrypted_data, userEncryptionKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (e) {
    throw new Error('Failed to decrypt secrets. Please re-configure in Secrets tab.');
  }
}

// --- GitHub Utils ---
async function getValidGitHubToken(userId: string) {
  const { data, error } = await supabase
    .from('user_github_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) throw new Error('GitHub not connected—go to Onboarding.');

  const accessToken = decrypt(data.access_token);
  const refreshToken = data.refresh_token ? decrypt(data.refresh_token) : null;
  const expiresAt = data.expires_at ? new Date(data.expires_at) : null;

  // If token is expired (or expires in less than 5 mins) and we have a refresh token, refresh it
  if (expiresAt && expiresAt.getTime() - Date.now() < 5 * 60 * 1000 && refreshToken) {
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      throw new Error('Platform GitHub App not configured.');
    }

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    const tokenData = await response.json();
    if (tokenData.error) {
      console.error('GitHub token refresh failed:', tokenData.error_description);
      throw new Error('GitHub session expired. Please reconnect.');
    }

    const newExpiresAt = tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    await supabase
      .from('user_github_tokens')
      .update({
        access_token: encrypt(tokenData.access_token),
        refresh_token: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
        expires_at: newExpiresAt
      })
      .eq('user_id', userId);

    return tokenData.access_token;
  }

  return accessToken;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Supabase Client (Service Role for admin tasks)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

app.use(express.json({ limit: '100mb' }));
app.use(cookieParser());

// Middleware: JWT Validation
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.cookies.sb_access_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized - Missing session' });

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ error: 'Missing JWT_SECRET—add it to .env' });
  }

  jwt.verify(token, jwtSecret, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden - Invalid session' });
    req.user = user;
    next();
  });
};

// --- API Endpoints ---

// 1. Auth: Magic Link
app.post('/api/auth/magic-link', async (req, res) => {
  const { email } = req.body;
  if (!process.env.SUPABASE_URL) {
    return res.status(500).json({ error: 'Missing SUPABASE_URL—add it to .env' });
  }
  
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.APP_URL}/builder`,
    },
  });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Magic link sent' });
});

const VETR_SYSTEM_PROMPT = `You are an expert self-debugging coding agent. Your only goal is to solve the given programming task correctly, producing clean, efficient, well-tested code.

Follow this strict VETR loop for EVERY coding task or code modification. Never output final code until the loop completes successfully. Think step-by-step and be extremely disciplined.

Core rules you MUST obey:
• Assume your first version is wrong until proven correct by tests.
• Explanation before repair is mandatory — it dramatically improves quality.
• Make minimal, targeted changes (diff-style when possible).
• Prefer cheap/fast signals first: syntax → static types → unit tests → integration.
• Debugging power decays after 4–5 turns → detect stagnation and reset.
• Always try to generate new falsifying tests when coverage is weak.
• Output format is rigid — never skip or reorder sections.

Current task:
««TASK_DESCRIPTION»»

Existing code / previous version (if any):
««PREVIOUS_CODE»»

Existing tests / test feedback / error messages / coverage report:
««FEEDBACK»»

Now execute the VETR loop:

Phase 0 – Fast Filters (always first)
Run static analysis in your mind or describe what would fail (syntax, obvious type errors, linter issues). If any, list them immediately and jump to Phase 2.

Phase 1 – Verification Gate
Analyze all available feedback and tests.
If EVERY test passes, coverage looks reasonable (≥70–80% branches where applicable), no linter/static errors remain, and logic seems sound:
   → Output ONLY:
     FINAL ANSWER
     \`\`\`json
     { "summary": "...", "files": [...] }
     \`\`\`
Confidence: X/100
Remaining concerns: (list if any, or "none")
→ Then STOP.
Otherwise → continue to debugging.

Phase 2 – Structured Reflection & Explanation (critical — do this thoroughly)
Output exactly these labeled sections:
A. BUG HYPOTHESIS LIST
... (at least 3–5 concrete, specific hypotheses)
B. MOST LIKELY ROOT CAUSE
One-sentence summary + detailed reasoning referencing failing inputs/outputs/errors
C. WRONG CODE EXPLANATION
Go line-by-line or block-by-block through the current code.
Explain WHAT is wrong and WHY it fails (use variable tracing examples).
D. KEY PATH SIMULATION / DRY-RUN
Pick 1–3 important failing or edge-case inputs.
Simulate execution step-by-step, tracking 3–5 critical variables.
Show expected vs actual behavior.
E. PROPOSED FIX STRATEGY
Bullet-point plan of minimal changes (function names, logic flips, guards, etc.).
Do NOT write full code yet.

Phase 3 – Generate Repair
Output ONLY the repair in diff-like or block-replacement format:
diff
- old line
+ new line

—or—

// Replace lines 23–45 with:
new code block here
Add inline comments where assumptions are made or where verification is still needed.

Phase 4 – Self-Generated Test Ideas (when test suite is weak or no new coverage gained)
Propose 2–4 new unit/property/metamorphic test cases that try to BREAK the current code.
Format:
TEST NAME: should_...
GIVEN: ...
WHEN: ...
THEN: ...

Phase 5 – Next Validation
Describe exactly what needs to be re-executed (all tests + your new ones).
If this is iteration ≥4 and <20% improvement (fewer failures, new tests passing), or same error persists → TRIGGER RESET:
RESET SUMMARY:
Summarize all attempts so far (100–150 words).
Then say: "Strategic reset: restarting from clean context with refined understanding."

Phase 6 – Loop Control
After repair → go back to Phase 1 with updated code + new feedback.
You may only output one full VETR cycle per response unless the user explicitly asks for multi-step continuation.
Stay concise but thorough in explanations.
Prioritize correctness over speed.`;

// 2. Generate: Wizard -> Grok prompt -> code
app.post('/api/generate', authenticateToken, async (req: any, res: any) => {
  const { specs } = req.body;
  
  try {
    const userSecrets = await getUserSecrets(req.user.sub);
    const grokKey = userSecrets.grokKey;

    if (!grokKey) {
      return res.status(400).json({ error: 'Missing Grok API Key—go to Secrets tab.' });
    }

    // Log request
    await supabase.from('logs').insert({
      user_id: req.user.sub,
      action: 'generate_start',
      metadata: { specs }
    });

    // ... (VETR loop logic uses grokKey)
    res.json({ message: 'Generation started (Placeholder for full VETR logic)' });
  } catch (error: any) {
    res.status(error.message.includes('Setup incomplete') ? 400 : 500).json({ error: error.message });
  }
});

// 4. Deploy: Vercel webhook trigger
app.post('/api/deploy', authenticateToken, async (req: any, res: any) => {
  try {
    const userSecrets = await getUserSecrets(req.user.sub);
    const deployHook = userSecrets.vercelDeployHook;
    
    if (!deployHook) {
      return res.status(400).json({ error: 'Missing Vercel Deploy Hook—go to Secrets tab.' });
    }

    const response = await fetch(deployHook, { method: 'POST' });
    if (!response.ok) throw new Error('Vercel deploy failed');
    
    res.json({ status: 'triggered', message: 'Deployment started' });
  } catch (error: any) {
    res.status(error.message.includes('Setup incomplete') ? 400 : 500).json({ error: error.message });
  }
});

// --- GitHub OAuth Flow ---

// 6. GitHub: Start OAuth
app.get('/api/github/login', authenticateToken, (req: any, res: any) => {
  if (!process.env.GITHUB_CLIENT_ID) {
    return res.status(500).json({ error: 'Missing GITHUB_CLIENT_ID in environment' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('github_oauth_state', state, { httpOnly: true, secure: true, sameSite: 'none' });

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${process.env.APP_URL}/api/github/callback`,
    scope: 'repo,user',
    state: state
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

// 7. GitHub: OAuth Callback
app.get('/api/github/callback', async (req: any, res: any) => {
  const { code, state } = req.query;
  const savedState = req.cookies.github_oauth_state;

  if (!state || state !== savedState) {
    return res.status(400).json({ error: 'Invalid state (CSRF protection)' });
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: `${process.env.APP_URL}/api/github/callback`
      })
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) throw new Error(tokenData.error_description);

    const sessionToken = req.cookies.sb_access_token;
    if (!sessionToken) throw new Error('No session found');
    
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error('Missing JWT_SECRET—add it to .env');

    const decoded: any = jwt.verify(sessionToken, jwtSecret);
    const userId = decoded.sub;

    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    // Store encrypted tokens
    const { error } = await supabase
      .from('user_github_tokens')
      .upsert({
        user_id: userId,
        access_token: encrypt(tokenData.access_token),
        refresh_token: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;

    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS' }, '*');
            window.close();
          </script>
          <p>GitHub connected! Closing window...</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('GitHub OAuth error:', error);
    res.status(500).send(`Auth failed: ${error.message}`);
  }
});

// 9. Users: Save Platform Keys (Encrypted)
app.post('/api/onboarding/keys', authenticateToken, async (req: any, res: any) => {
  const { encrypted_data, user_encryption_key } = req.body;
  
  if (!encrypted_data || !user_encryption_key) {
    return res.status(400).json({ error: 'encrypted_data and user_encryption_key are required' });
  }

  try {
    const { error } = await supabase
      .from('user_platform_keys')
      .upsert({
        user_id: req.user.sub,
        encrypted_data: encrypted_data,
        user_encryption_key: encrypt(user_encryption_key),
        created_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;

    res.json({ message: 'Platform keys saved successfully' });
  } catch (error: any) {
    console.error('Save platform keys failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// 10. Users: Check connection status
app.get('/api/users/status', authenticateToken, async (req: any, res: any) => {
  try {
    const { data: github } = await supabase
      .from('user_github_tokens')
      .select('id')
      .eq('user_id', req.user.sub)
      .single();

    const { data: keys } = await supabase
      .from('user_platform_keys')
      .select('encrypted_data')
      .eq('user_id', req.user.sub)
      .single();

    res.json({
      githubConnected: !!github,
      keysConfigured: !!keys,
      encryptedData: keys?.encrypted_data || null
    });
  } catch (error) {
    res.json({ githubConnected: false, keysConfigured: false });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
