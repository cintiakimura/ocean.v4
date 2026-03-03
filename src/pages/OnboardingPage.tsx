import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Github, 
  Globe, 
  Database, 
  Key, 
  CheckCircle2, 
  ChevronRight, 
  Loader2, 
  ShieldAlert, 
  Info, 
  Eye, 
  EyeOff, 
  RefreshCw,
  ExternalLink,
  Wand2,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import { cn } from '../lib/utils';
import { Logo } from '../components/Logo';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState({
    githubConnected: false,
    netlifyConnected: false,
    keysConfigured: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Netlify Step State
  const [netlifyMode, setNetlifyMode] = useState<'oauth' | 'pat'>('oauth');
  const [netlifyPat, setNetlifyPat] = useState('');
  const [netlifySites, setNetlifySites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [isLoadingSites, setIsLoadingSites] = useState(false);
  const [buildHookUrl, setBuildHookUrl] = useState('');

  // Secrets Step State
  const [secrets, setSecrets] = useState({
    supabaseUrl: '',
    supabaseAnonKey: '',
    supabaseServiceKey: '',
    supabaseJwtSecret: '',
    grokKey: '',
    vercelDeployHook: '',
    encryptionKey: ''
  });
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/users/status');
        const data = await res.json();
        setStatus({
          githubConnected: data.githubConnected,
          netlifyConnected: data.netlifyConnected,
          keysConfigured: data.keysConfigured
        });

        if (!data.githubConnected) setStep(1);
        else if (!data.netlifyConnected && !data.keysConfigured) setStep(2);
        else if (!data.keysConfigured) setStep(3);
        else navigate('/builder');
      } catch (e) {
        console.error('Failed to check status');
      }
    };
    checkStatus();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        setStatus(prev => ({ ...prev, githubConnected: true }));
        setStep(2);
      }
      if (event.data?.type === 'NETLIFY_AUTH_SUCCESS') {
        setStatus(prev => ({ ...prev, netlifyConnected: true }));
        fetchNetlifySites();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  const fetchNetlifySites = async () => {
    setIsLoadingSites(true);
    try {
      const res = await fetch('/api/netlify/sites');
      if (!res.ok) throw new Error('Failed to fetch sites');
      const data = await res.json();
      setNetlifySites(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSites(false);
    }
  };

  const handleCreateNetlifyHook = async () => {
    if (!selectedSite) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/netlify/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: selectedSite })
      });
      if (!res.ok) throw new Error('Failed to create hook');
      const data = await res.json();
      setBuildHookUrl(data.url);
      setSecrets(prev => ({ ...prev, vercelDeployHook: data.url }));
      setStep(3);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectGithub = () => {
    const width = 600, height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    window.open('/api/github/login', 'github_auth', `width=${width},height=${height},top=${top},left=${left}`);
  };

  const handleConnectNetlify = () => {
    const width = 600, height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    window.open('/api/netlify/login', 'netlify_auth', `width=${width},height=${height},top=${top},left=${left}`);
  };

  const handleSaveSecrets = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    let finalEncryptionKey = secrets.encryptionKey;
    if (!finalEncryptionKey) {
      finalEncryptionKey = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
    }

    try {
      const dataToEncrypt = JSON.stringify(secrets);
      const encrypted = CryptoJS.AES.encrypt(dataToEncrypt, finalEncryptionKey).toString();

      const res = await fetch('/api/onboarding/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          encrypted_data: encrypted,
          user_encryption_key: finalEncryptionKey
        })
      });

      if (!res.ok) throw new Error('Failed to save keys');
      
      setMessage({ type: 'success', text: 'Setup complete! Redirecting...' });
      setTimeout(() => navigate('/builder'), 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-[#cccccc] font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center mb-12">
          <Logo className="h-12 w-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Get Started – Connect Your Tools</h1>
          <p className="text-[#858585] text-center">Complete these steps to configure your production environment.</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  step === s ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]" : 
                  step > s ? "bg-emerald-500/20 text-emerald-500" : "bg-white/5 text-[#858585]"
                )}>
                  {step > s ? <CheckCircle2 size={16} /> : s}
                </div>
                <span className={cn(
                  "text-[10px] mt-2 font-bold uppercase tracking-wider",
                  step >= s ? "text-emerald-500" : "text-[#858585]"
                )}>
                  {s === 1 ? 'GitHub' : s === 2 ? 'Netlify' : 'Secrets'}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-white/5 rounded-full relative overflow-hidden">
            <motion.div 
              className="absolute h-full bg-emerald-500"
              initial={{ width: '0%' }}
              animate={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-[#252526] rounded-xl border border-white/5 p-8 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Github size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Connect GitHub</h2>
                  <p className="text-sm text-[#858585]">Required for repository management and CI/CD.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-[#1e1e1e] rounded-lg p-4 border border-white/5">
                  <p className="text-xs leading-relaxed text-[#cccccc]">
                    We use OAuth to securely access your repositories. We'll store an encrypted access token to perform actions on your behalf.
                  </p>
                </div>
                
                <button
                  onClick={handleConnectGithub}
                  className="w-full flex items-center justify-center gap-3 bg-[#24292e] hover:bg-[#2c3137] text-white py-4 rounded-lg font-bold transition-all shadow-lg"
                >
                  <Github size={20} />
                  Connect GitHub Account
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-[#252526] rounded-xl border border-white/5 p-8 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Globe size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Connect Netlify</h2>
                  <p className="text-sm text-[#858585]">Configure your deployment target and build hooks.</p>
                </div>
              </div>

              <div className="space-y-6">
                {!status.netlifyConnected ? (
                  <div className="space-y-4">
                    <button
                      onClick={handleConnectNetlify}
                      className="w-full flex items-center justify-center gap-3 bg-[#00ad9f] hover:bg-[#00c4b5] text-white py-4 rounded-lg font-bold transition-all shadow-lg"
                    >
                      <Globe size={20} />
                      Connect via Netlify OAuth
                    </button>
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                      <span className="relative px-2 bg-[#252526] text-[10px] text-[#858585] uppercase font-bold">Or use PAT</span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-[#858585]">Personal Access Token</label>
                      <input 
                        type="password"
                        value={netlifyPat}
                        onChange={(e) => setNetlifyPat(e.target.value)}
                        placeholder="nfp_..."
                        className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none"
                      />
                      <button 
                        onClick={() => { setStatus(p => ({ ...p, netlifyConnected: true })); fetchNetlifySites(); }}
                        className="w-full py-2 text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                      >
                        Verify Token
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-[#858585]">Select Netlify Site</label>
                      <select 
                        value={selectedSite}
                        onChange={(e) => setSelectedSite(e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none appearance-none"
                      >
                        <option value="">Choose a site...</option>
                        {netlifySites.map(site => (
                          <option key={site.id} value={site.id}>{site.name} ({site.url})</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleCreateNetlifyHook}
                      disabled={!selectedSite || isSaving}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black py-4 rounded-lg font-bold transition-all shadow-lg disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
                      Create Auto-Deploy Hook
                    </button>
                    <button 
                      onClick={() => setStep(3)}
                      className="w-full py-2 text-xs text-[#858585] hover:text-[#cccccc]"
                    >
                      Skip and paste hook manually
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-[#252526] rounded-xl border border-white/5 p-8 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Database size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Platform Keys</h2>
                  <p className="text-sm text-[#858585]">Final configuration for Supabase and AI services.</p>
                </div>
              </div>

              <form onSubmit={handleSaveSecrets} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SecretField 
                    label="Supabase URL"
                    value={secrets.supabaseUrl}
                    onChange={(v) => setSecrets(p => ({ ...p, supabaseUrl: v }))}
                    placeholder="https://your-project.supabase.co"
                    tooltip="Your project's API URL. Find this in Supabase Dashboard → Settings → API."
                  />
                  <SecretField 
                    label="Supabase Service Role Key"
                    value={secrets.supabaseServiceKey}
                    onChange={(v) => setSecrets(p => ({ ...p, supabaseServiceKey: v }))}
                    placeholder="eyJ..."
                    type="password"
                    show={showSecrets.supabaseServiceKey}
                    onToggle={() => setShowSecrets(p => ({ ...p, supabaseServiceKey: !p.supabaseServiceKey }))}
                    tooltip="Your project's service_role secret. NEVER share this. Your GitHub Client ID is only for platform owner – do not enter it here."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SecretField 
                    label="JWT Secret"
                    value={secrets.supabaseJwtSecret}
                    onChange={(v) => setSecrets(p => ({ ...p, supabaseJwtSecret: v }))}
                    placeholder="Your JWT Secret"
                    type="password"
                    show={showSecrets.supabaseJwtSecret}
                    onToggle={() => setShowSecrets(p => ({ ...p, supabaseJwtSecret: !p.supabaseJwtSecret }))}
                    tooltip="Used to sign and verify JSON Web Tokens. Find this in Supabase Dashboard → Settings → API."
                  />
                  <SecretField 
                    label="Grok API Key"
                    value={secrets.grokKey}
                    onChange={(v) => setSecrets(p => ({ ...p, grokKey: v }))}
                    placeholder="xai-..."
                    type="password"
                    show={showSecrets.grokKey}
                    onToggle={() => setShowSecrets(p => ({ ...p, grokKey: !p.grokKey }))}
                    tooltip="Your x.ai API key. Get it from console.x.ai."
                  />
                </div>

                <SecretField 
                  label="Deploy Hook URL"
                  value={secrets.vercelDeployHook}
                  onChange={(v) => setSecrets(p => ({ ...p, vercelDeployHook: v }))}
                  placeholder="https://api.vercel.com/v1/integrations/deploy/..."
                  tooltip="The URL used to trigger a new deployment. Auto-filled if you connected Netlify."
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase text-[#858585]">Master Encryption Key</label>
                    <button 
                      type="button"
                      onClick={() => setSecrets(p => ({ ...p, encryptionKey: CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex) }))}
                      className="text-[10px] text-emerald-500 hover:text-emerald-400 font-bold flex items-center gap-1"
                    >
                      <RefreshCw size={10} />
                      Generate random key
                    </button>
                  </div>
                  <input 
                    type="text"
                    value={secrets.encryptionKey}
                    onChange={(e) => setSecrets(p => ({ ...p, encryptionKey: e.target.value }))}
                    placeholder="32-byte hex string"
                    className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none font-mono"
                  />
                </div>

                {message && (
                  <div className={cn(
                    "p-4 rounded-lg text-xs flex items-center gap-3",
                    message.type === 'success' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                  )}>
                    {message.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
                    <span>{message.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black py-4 rounded-lg font-bold transition-all shadow-lg disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                  Finish Setup
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-[#858585]">
          <div className="flex items-center gap-2">
            <ShieldAlert size={12} className="text-emerald-500" />
            <span>AES-256 Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <Key size={12} className="text-emerald-500" />
            <span>One-Time Setup</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecretField({ label, value, onChange, placeholder, type = 'text', show, onToggle, tooltip }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <label className="text-[10px] font-bold uppercase text-[#858585]">{label}</label>
        <div className="group relative">
          <Info size={10} className="text-[#858585] cursor-help" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded bg-[#333333] p-2 text-[9px] text-[#cccccc] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl border border-white/5">
            {tooltip}
          </div>
        </div>
      </div>
      <div className="relative">
        <input
          type={show === false ? 'password' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none pr-10"
        />
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#858585] hover:text-[#cccccc]"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
