import React, { useState, useRef } from 'react';
import { 
  Panel, 
  PanelGroup, 
  PanelResizeHandle 
} from 'react-resizable-panels';
import { 
  FileCode, 
  Play, 
  Settings, 
  ChevronRight, 
  ChevronLeft, 
  Layout, 
  Database, 
  Users, 
  ShieldAlert, 
  Palette, 
  Globe, 
  CheckCircle2,
  Terminal as TerminalIcon,
  MessageSquare,
  Search,
  Files,
  Github,
  ExternalLink,
  Loader2,
  Code2,
  LogOut,
  Wand2,
  Upload,
  Key,
  Info,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { Logo } from '../components/Logo';
import Editor from '@monaco-editor/react';
import CryptoJS from 'crypto-js';
import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackPreview 
} from '@codesandbox/sandpack-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { AppSpecs, INITIAL_SPECS, GeneratedApp, FileContent } from '../types';
import { generateWithGrok } from '../services/grokService';
import { Link, useNavigate } from 'react-router-dom';

const STEPS = [
  { id: 'objective', title: 'Objective', icon: Layout, description: "What's the app really for? Who wins?" },
  { id: 'roles', title: 'Users & Roles', icon: Users, description: "List every person: Student, Teacher, Admin..." },
  { id: 'dataModels', title: 'Data & Models', icon: Database, description: "What things exist? Tables, Relations?" },
  { id: 'constraints', title: 'Constraints', icon: ShieldAlert, description: "Any killers? Offline, GDPR, Budget?" },
  { id: 'branding', title: 'Branding', icon: Palette, description: "Colors, fonts, tone, logo variants." },
  { id: 'pages', title: 'Pages & Nav', icon: Globe, description: "Core screens: Login, Dashboard, Reports..." },
  { id: 'integrations', title: 'Integrations', icon: Code2, description: "Need Stripe? Google Calendar? APIs?" },
  { id: 'doneState', title: 'Done State', icon: CheckCircle2, description: "What proves it's shipped? Live URL?" },
];

export default function BuilderPage() {
  const [specs, setSpecs] = useState<AppSpecs>(INITIAL_SPECS);
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedApp, setGeneratedApp] = useState<GeneratedApp | null>(null);
  const [activeFile, setActiveFile] = useState<FileContent | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'wizard' | 'explorer' | 'onboarding'>('wizard');
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['Welcome to kyn Builder v1.0.0', 'Ready to build your next SaaS...']);
  
  // Onboarding State
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [userStatus, setUserStatus] = useState({
    githubConnected: false,
    keysConfigured: false
  });
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
  const [isSavingSecrets, setIsSavingSecrets] = useState(false);
  const [secretsMessage, setSecretsMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isEditingKeys, setIsEditingKeys] = useState(false);

  // Check user status on load
  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/users/status');
        const data = await res.json();
        setUserStatus({
          githubConnected: data.githubConnected,
          keysConfigured: data.keysConfigured
        });
        
        if (!data.githubConnected) {
          setOnboardingStep(1);
          setActiveTab('onboarding');
        } else if (!data.keysConfigured) {
          setOnboardingStep(2);
          setActiveTab('onboarding');
        } else {
          setOnboardingStep(3);
        }
      } catch (e) {
        console.error('Failed to check user status');
      }
    };
    checkStatus();

    // Listen for GitHub success
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        setUserStatus(prev => ({ ...prev, githubConnected: true }));
        setOnboardingStep(2);
        setTerminalOutput(prev => [...prev, '> GitHub connected successfully!']);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleInputChange = (field: keyof AppSpecs, value: string) => {
    setSpecs(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setTerminalOutput(prev => [...prev, '> Initializing Grok architect...', '> Compiling specifications...', '> Sending request to x.ai...']);
    try {
      const result = await generateWithGrok(specs, (msg) => {
        setTerminalOutput(prev => [...prev, msg]);
      });
      setGeneratedApp(result);
      if (result.files.length > 0) {
        setActiveFile(result.files[0]);
      }
      setTerminalOutput(prev => [...prev, '> Generation successful!', `> Received ${result.files.length} files.`]);
      setActiveTab('explorer');
    } catch (error) {
      setTerminalOutput(prev => [...prev, `> Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_SIZE) {
      setTerminalOutput(prev => [...prev, `> Error: File "${file.name}" exceeds 100MB limit.`]);
      return;
    }

    setTerminalOutput(prev => [...prev, `> Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`]);
    
    // Simulate upload process
    setTimeout(() => {
      setTerminalOutput(prev => [...prev, `> Successfully uploaded ${file.name}.`]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 1500);
  };

  const generateEncryptionKey = () => {
    const key = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
    setSecrets(prev => ({ ...prev, encryptionKey: key }));
  };

  const handleSaveSecrets = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSecrets(true);
    setSecretsMessage(null);

    // Validation
    if (secrets.supabaseUrl && !secrets.supabaseUrl.startsWith('https://') || !secrets.supabaseUrl.includes('.supabase.co')) {
      setSecretsMessage({ type: 'error', text: 'Invalid Supabase URL. Must start with https:// and end with .supabase.co' });
      setIsSavingSecrets(false);
      return;
    }

    const jwtFields = ['supabaseAnonKey', 'supabaseServiceKey', 'supabaseJwtSecret'];
    for (const field of jwtFields) {
      const val = (secrets as any)[field];
      if (val && !val.startsWith('eyJ')) {
        setSecretsMessage({ type: 'error', text: `Invalid ${field}. Keys usually start with "eyJ..."` });
        setIsSavingSecrets(false);
        return;
      }
    }

    let finalEncryptionKey = secrets.encryptionKey;
    if (!finalEncryptionKey) {
      finalEncryptionKey = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
      setSecrets(prev => ({ ...prev, encryptionKey: finalEncryptionKey }));
    }

    try {
      // Encrypt data
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
      
      setSecretsMessage({ type: 'success', text: 'Platform keys saved and encrypted successfully!' });
      setUserStatus(prev => ({ ...prev, keysConfigured: true }));
      setIsEditingKeys(false);
      setTerminalOutput(prev => [...prev, '> Platform keys saved and encrypted.']);
    } catch (error: any) {
      setSecretsMessage({ type: 'error', text: error.message });
    } finally {
      setIsGenerating(false);
      setIsSavingSecrets(false);
    }
  };

  const handleConnectGithub = () => {
    const width = 600, height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    window.open('/api/github/login', 'github_auth', `width=${width},height=${height},top=${top},left=${left}`);
  };

  // Map generated files for Sandpack
  const sandpackFiles = React.useMemo(() => {
    if (!generatedApp) return {};
    const files: Record<string, string> = {};
    generatedApp.files.forEach(f => {
      files[`/${f.path}`] = f.content;
    });
    return files;
  }, [generatedApp]);

  return (
    <div className="flex h-screen w-screen flex-col bg-[#1e1e1e] overflow-hidden text-[#cccccc] font-sans">
      {/* Top Bar */}
      <header className="flex h-9 items-center justify-between border-b border-white/5 bg-[#252526] px-3 text-xs">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center group">
            <Logo className="h-6 w-auto" />
          </Link>
          <nav className="flex gap-3 text-[#858585]">
            <button className="hover:text-[#cccccc]">File</button>
            <button className="hover:text-[#cccccc]">Edit</button>
            <button className="hover:text-[#cccccc]">Selection</button>
            <button className="hover:text-[#cccccc]">View</button>
            <button className="hover:text-[#cccccc]">Go</button>
            <button className="hover:text-[#cccccc]">Run</button>
            <button className="hover:text-[#cccccc]">Terminal</button>
            <button className="hover:text-[#cccccc]">Help</button>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-[#858585]">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 hover:text-[#cccccc] bg-white/5 px-2 py-0.5 rounded border border-white/10 transition-colors"
          >
            <Upload size={12} />
            <span>Upload</span>
          </button>
          <div className="h-4 w-px bg-white/10" />
          <button 
            onClick={async () => {
              if (!generatedApp) return;
              setTerminalOutput(prev => [...prev, '> Triggering Vercel deployment...']);
              try {
                const res = await fetch('/api/deploy', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ appId: (generatedApp as any).appId })
                });
                const data = await res.json();
                setTerminalOutput(prev => [...prev, `> ${data.message || 'Deployment triggered'}`]);
              } catch (e) {
                setTerminalOutput(prev => [...prev, '> Error: Deployment failed']);
              }
            }}
            disabled={!generatedApp}
            className="flex items-center gap-1 hover:text-[#cccccc] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-emerald-500 transition-colors disabled:opacity-30"
          >
            <ExternalLink size={12} />
            <span>Deploy</span>
          </button>
          <div className="h-4 w-px bg-white/10" />
          <button className="flex items-center gap-1 hover:text-[#cccccc]">
            <Github size={14} />
            <span>GitHub</span>
          </button>
          <div className="h-4 w-px bg-white/10" />
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 hover:text-[#cccccc]"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <aside className="flex w-12 flex-col items-center gap-4 border-r border-white/5 bg-[#333333] py-4 text-[#858585]">
          <button 
            onClick={() => { setActiveTab('wizard'); setSidebarExpanded(true); }}
            className={cn("p-2 transition-colors hover:text-[#cccccc]", activeTab === 'wizard' && "text-emerald-500 border-l-2 border-emerald-500")}
          >
            <Wand2 size={24} />
          </button>
          <button 
            onClick={() => { setActiveTab('explorer'); setSidebarExpanded(true); }}
            className={cn("p-2 transition-colors hover:text-[#cccccc]", activeTab === 'explorer' && "text-emerald-500 border-l-2 border-emerald-500")}
          >
            <Files size={24} />
          </button>
          <button 
            onClick={() => { setActiveTab('onboarding'); setSidebarExpanded(true); }}
            className={cn("p-2 transition-colors hover:text-[#cccccc]", activeTab === 'onboarding' && "text-emerald-500 border-l-2 border-emerald-500")}
          >
            <Key size={24} />
          </button>
          <button className="p-2 transition-colors hover:text-[#cccccc]">
            <Search size={24} />
          </button>
          <button className="p-2 transition-colors hover:text-[#cccccc]">
            <Github size={24} />
          </button>
          <div className="mt-auto flex flex-col gap-4">
            <button className="p-2 transition-colors hover:text-[#cccccc]">
              <Users size={24} />
            </button>
            <button className="p-2 transition-colors hover:text-[#cccccc]">
              <Settings size={24} />
            </button>
          </div>
        </aside>

        <PanelGroup direction="horizontal">
          {/* Sidebar Panel */}
          {sidebarExpanded && (
            <>
              <Panel defaultSize={15} minSize={10} maxSize={30}>
                <div className="flex h-full flex-col bg-[#252526]">
                  <div className="flex h-9 items-center justify-between px-4 text-[11px] font-bold uppercase tracking-wider text-[#858585]">
                    <span>{activeTab === 'wizard' ? 'App Wizard' : activeTab === 'explorer' ? 'Explorer' : 'Onboarding'}</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {activeTab === 'wizard' ? (
                      <div className="p-4 space-y-4">
                        {STEPS.map((step, idx) => (
                          <button
                            key={step.id}
                            onClick={() => setCurrentStep(idx)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-md p-2 text-left text-xs transition-colors",
                              currentStep === idx ? "bg-emerald-500/10 text-emerald-500" : "hover:bg-[#2a2d2e] text-[#858585]"
                            )}
                          >
                            <step.icon size={16} />
                            <div className="flex-1 overflow-hidden">
                              <div className="font-medium truncate">{step.title}</div>
                              <div className="text-[10px] opacity-60 truncate">{step.description}</div>
                            </div>
                            {idx < currentStep && <CheckCircle2 size={14} className="text-emerald-500" />}
                          </button>
                        ))}
                      </div>
                    ) : activeTab === 'explorer' ? (
                      <div className="p-2">
                        {generatedApp ? (
                          <div className="space-y-1">
                            {generatedApp.files.map((file) => (
                              <button
                                key={file.path}
                                onClick={() => setActiveFile(file)}
                                className={cn(
                                  "flex w-full items-center gap-2 rounded px-2 py-1 text-xs transition-colors",
                                  activeFile?.path === file.path ? "bg-emerald-500/20 text-[#cccccc]" : "text-[#858585] hover:bg-[#2a2d2e] hover:text-[#cccccc]"
                                )}
                              >
                                <FileCode size={14} className="text-emerald-500" />
                                <span className="truncate">{file.path}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-20 text-center text-[#858585]">
                            <Code2 size={40} className="mb-4 opacity-20" />
                            <p className="text-xs">No files generated yet.</p>
                            <p className="text-[10px] opacity-60">Complete the wizard to start.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 space-y-6">
                        <div className="flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-wider">
                          <Key size={14} />
                          <span>Onboarding</span>
                        </div>
                        
                        {/* Step Progress */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                              onboardingStep >= 1 ? "bg-emerald-500 text-black" : "bg-white/10 text-[#858585]"
                            )}>1</div>
                            <span className={cn("text-[10px] font-bold uppercase", onboardingStep >= 1 ? "text-[#cccccc]" : "text-[#858585]")}>GitHub</span>
                            {userStatus.githubConnected && <CheckCircle2 size={12} className="ml-auto text-emerald-500" />}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                              onboardingStep >= 2 ? "bg-emerald-500 text-black" : "bg-white/10 text-[#858585]"
                            )}>2</div>
                            <span className={cn("text-[10px] font-bold uppercase", onboardingStep >= 2 ? "text-[#cccccc]" : "text-[#858585]")}>Vercel Hook</span>
                            {secrets.vercelDeployHook && userStatus.keysConfigured && <CheckCircle2 size={12} className="ml-auto text-emerald-500" />}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                              onboardingStep >= 3 ? "bg-emerald-500 text-black" : "bg-white/10 text-[#858585]"
                            )}>3</div>
                            <span className={cn("text-[10px] font-bold uppercase", onboardingStep >= 3 ? "text-[#cccccc]" : "text-[#858585]")}>Platform Keys</span>
                            {userStatus.keysConfigured && <CheckCircle2 size={12} className="ml-auto text-emerald-500" />}
                          </div>
                        </div>

                        <div className="h-px bg-white/5" />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-amber-500">
                            <ShieldAlert size={14} />
                            <span className="font-bold">Security</span>
                          </div>
                          <p className="text-[10px]">
                            Your keys are encrypted locally before storage. We never see your raw secrets.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
              <PanelResizeHandle className="w-px bg-white/5 hover:bg-emerald-500 transition-colors" />
            </>
          )}

          {/* Main Content Panel */}
          <Panel defaultSize={55} minSize={30}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={75} minSize={30}>
                <div className="flex h-full flex-col bg-[#1e1e1e]">
                  {/* Tabs */}
                  <div className="flex h-9 items-center bg-[#252526] overflow-x-auto custom-scrollbar">
                    {activeTab === 'wizard' ? (
                      <div className="flex h-full items-center border-t-2 border-emerald-500 bg-[#1e1e1e] px-4 text-xs">
                        <Wand2 size={14} className="mr-2 text-emerald-500" />
                        <span>Wizard.config</span>
                      </div>
                    ) : activeTab === 'explorer' ? (
                      activeFile && (
                        <div className="flex h-full items-center border-t-2 border-emerald-500 bg-[#1e1e1e] px-4 text-xs">
                          <FileCode size={14} className="mr-2 text-emerald-500" />
                          <span>{activeFile.path.split('/').pop()}</span>
                        </div>
                      )
                    ) : (
                      <div className="flex h-full items-center border-t-2 border-emerald-500 bg-[#1e1e1e] px-4 text-xs">
                        <Key size={14} className="mr-2 text-emerald-500" />
                        <span>Onboarding.env</span>
                      </div>
                    )}
                  </div>

                  {/* Editor Area */}
                  <div className="flex-1 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                      {activeTab === 'wizard' ? (
                        <motion.div 
                          key="wizard"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="h-full w-full p-8 max-w-2xl mx-auto overflow-y-auto custom-scrollbar"
                        >
                          <div className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                                {React.createElement(STEPS[currentStep].icon, { size: 24 })}
                              </div>
                              <div>
                                <h2 className="text-2xl font-bold text-[#cccccc]">{STEPS[currentStep].title}</h2>
                                <p className="text-sm text-[#858585]">{STEPS[currentStep].description}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="space-y-2">
                              <label className="text-xs font-semibold uppercase tracking-wider text-[#858585]">
                                Specification Details
                              </label>
                              <textarea
                                value={specs[STEPS[currentStep].id as keyof AppSpecs]}
                                onChange={(e) => handleInputChange(STEPS[currentStep].id as keyof AppSpecs, e.target.value)}
                                placeholder="Enter your requirements here..."
                                className="min-h-[200px] w-full rounded-md border border-white/10 bg-[#1e1e1e] p-4 text-sm text-[#cccccc] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                              />
                            </div>

                            <div className="flex items-center justify-between pt-4">
                              <button
                                onClick={handleBack}
                                disabled={currentStep === 0}
                                className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-[#858585] hover:text-[#cccccc] disabled:opacity-30"
                              >
                                <ChevronLeft size={18} />
                                Back
                              </button>
                              <button
                                onClick={handleNext}
                                disabled={isGenerating}
                                className="flex items-center gap-2 rounded-md bg-emerald-500 px-6 py-2 text-sm font-medium text-black hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                              >
                                {isGenerating ? (
                                  <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    {currentStep === STEPS.length - 1 ? 'Build SaaS' : 'Next Step'}
                                    <ChevronRight size={18} />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                          
                          {/* Progress Dots */}
                          <div className="mt-12 flex justify-center gap-2">
                            {STEPS.map((_, idx) => (
                              <div 
                                key={idx}
                                className={cn(
                                  "h-1.5 rounded-full transition-all",
                                  idx === currentStep ? "w-8 bg-emerald-500" : "w-1.5 bg-white/10"
                                )}
                              />
                            ))}
                          </div>
                        </motion.div>
                      ) : activeTab === 'explorer' ? (
                        <motion.div 
                          key="editor"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="h-full w-full"
                        >
                          <Editor
                            height="100%"
                            defaultLanguage={activeFile?.language || 'typescript'}
                            theme="vs-dark"
                            value={activeFile?.content || ''}
                            options={{
                              fontSize: 14,
                              fontFamily: "'Cascadia Code', 'Consolas', monospace",
                              minimap: { enabled: true },
                              scrollBeyondLastLine: false,
                              lineHeight: 1.5,
                              padding: { top: 20 },
                              readOnly: true,
                            }}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="onboarding"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="h-full w-full p-8 max-w-3xl mx-auto overflow-y-auto custom-scrollbar"
                        >
                          <div className="mb-8">
                            <h2 className="text-2xl font-bold text-[#cccccc] mb-2">Onboarding Wizard</h2>
                            <p className="text-sm text-[#858585]">Follow the steps below to configure your development environment.</p>
                          </div>

                          <div className="space-y-12 pb-20">
                            {/* Step 1: GitHub */}
                            <div className={cn("space-y-4 transition-opacity", onboardingStep !== 1 && "opacity-40 pointer-events-none")}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-wider text-xs">
                                  <Github size={14} />
                                  <span>Step 1: Connect GitHub</span>
                                </div>
                                {userStatus.githubConnected && <CheckCircle2 size={16} className="text-emerald-500" />}
                              </div>
                              
                              <div className="rounded-lg border border-white/5 bg-[#252526] p-6">
                                <p className="text-sm text-[#cccccc] mb-4">Link your GitHub account to enable one-click repository creation and management.</p>
                                <button
                                  onClick={handleConnectGithub}
                                  disabled={userStatus.githubConnected}
                                  className={cn(
                                    "inline-flex items-center gap-2 rounded-md px-6 py-2.5 text-sm font-bold transition-all shadow-lg",
                                    userStatus.githubConnected ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-[#24292e] text-white hover:bg-[#2c3137]"
                                  )}
                                >
                                  <Github size={18} />
                                  {userStatus.githubConnected ? 'GitHub Connected' : 'Connect GitHub Account'}
                                </button>
                              </div>
                            </div>

                            {/* Step 2: Vercel Deploy Hook */}
                            <div className={cn("space-y-4 transition-opacity", onboardingStep !== 2 && "opacity-40 pointer-events-none")}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-wider text-xs">
                                  <ExternalLink size={14} />
                                  <span>Step 2: Vercel Deploy Hook</span>
                                </div>
                              </div>
                              
                              <div className="rounded-lg border border-white/5 bg-[#252526] p-6 space-y-4">
                                <p className="text-sm text-[#cccccc]">Provide your Vercel Deploy Hook URL to enable automatic deployments.</p>
                                <SecretInput 
                                  label="Vercel Deploy Hook URL"
                                  value={secrets.vercelDeployHook}
                                  onChange={(v) => setSecrets(p => ({ ...p, vercelDeployHook: v }))}
                                  placeholder="https://api.vercel.com/v1/integrations/deploy/..."
                                  tooltip="Find this in Vercel → Settings → Git → Deploy Hooks"
                                />
                                <button
                                  onClick={() => setOnboardingStep(3)}
                                  className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-6 py-2.5 text-sm font-bold text-black hover:bg-emerald-400 transition-all shadow-lg"
                                >
                                  Next Step
                                  <ChevronRight size={18} />
                                </button>
                              </div>
                            </div>

                            {/* Step 3: Platform Keys */}
                            <div className={cn("space-y-4 transition-opacity", onboardingStep !== 3 && "opacity-40 pointer-events-none")}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-wider text-xs">
                                  <Database size={14} />
                                  <span>Step 3: Platform Keys</span>
                                </div>
                              </div>

                              <div className="rounded-lg border border-white/5 bg-[#252526] p-6">
                                <form onSubmit={handleSaveSecrets} className="space-y-8">
                                  {/* Supabase Section */}
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-[#858585] font-bold uppercase tracking-wider text-[10px]">
                                      <Database size={12} />
                                      <span>Supabase Configuration</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <SecretInput 
                                        label="Supabase Project URL"
                                        value={secrets.supabaseUrl}
                                        onChange={(v) => setSecrets(p => ({ ...p, supabaseUrl: v }))}
                                        placeholder="https://your-project.supabase.co"
                                        tooltip="Find this in Supabase Dashboard → Settings → API → Project URL"
                                      />
                                      <SecretInput 
                                        label="Supabase Service Role Key"
                                        value={secrets.supabaseServiceKey}
                                        onChange={(v) => setSecrets(p => ({ ...p, supabaseServiceKey: v }))}
                                        placeholder="eyJ..."
                                        type="password"
                                        show={showSecrets.supabaseServiceKey}
                                        onToggle={() => setShowSecrets(p => ({ ...p, supabaseServiceKey: !p.supabaseServiceKey }))}
                                        tooltip="Find this in Supabase Dashboard → Settings → API → service_role secret"
                                      />
                                    </div>
                                  </div>

                                  {/* AI Services Section */}
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-[#858585] font-bold uppercase tracking-wider text-[10px]">
                                      <Wand2 size={12} />
                                      <span>AI Services</span>
                                    </div>
                                    <SecretInput 
                                      label="Grok API Key"
                                      value={secrets.grokKey}
                                      onChange={(v) => setSecrets(p => ({ ...p, grokKey: v }))}
                                      placeholder="xai-..."
                                      type="password"
                                      show={showSecrets.grokKey}
                                      onToggle={() => setShowSecrets(p => ({ ...p, grokKey: !p.grokKey }))}
                                      tooltip="Find this in console.x.ai"
                                    />
                                  </div>

                                  {/* Encryption Key Section */}
                                  <div className="space-y-4">
                                    <div className="flex gap-2">
                                      <div className="flex-1">
                                        <SecretInput 
                                          label="Master Encryption Key"
                                          value={secrets.encryptionKey}
                                          onChange={(v) => setSecrets(p => ({ ...p, encryptionKey: v }))}
                                          placeholder="32-byte hex string"
                                          type="password"
                                          show={showSecrets.encryptionKey}
                                          onToggle={() => setShowSecrets(p => ({ ...p, encryptionKey: !p.encryptionKey }))}
                                          tooltip="Used to encrypt your secrets locally before saving to DB"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={generateEncryptionKey}
                                        className="mt-6 flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 text-xs hover:bg-white/10 transition-colors"
                                      >
                                        <RefreshCw size={14} />
                                        <span>Generate</span>
                                      </button>
                                    </div>
                                  </div>

                                  {secretsMessage && (
                                    <div className={cn(
                                      "p-4 rounded-md text-xs flex items-center gap-3",
                                      secretsMessage.type === 'success' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                                    )}>
                                      {secretsMessage.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
                                      <span>{secretsMessage.text}</span>
                                    </div>
                                  )}

                                  <div className="flex gap-3">
                                    {isEditingKeys && (
                                      <button
                                        type="button"
                                        onClick={() => setIsEditingKeys(false)}
                                        className="flex-1 rounded-md border border-white/10 bg-white/5 py-3 text-sm font-bold text-[#cccccc] hover:bg-white/10 transition-all"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                    <button
                                      type="submit"
                                      disabled={isSavingSecrets}
                                      className="flex-[2] flex items-center justify-center gap-2 rounded-md bg-emerald-500 py-3 text-sm font-bold text-black hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                    >
                                      {isSavingSecrets ? (
                                        <>
                                          <Loader2 size={18} className="animate-spin" />
                                          <span>Saving...</span>
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 size={18} />
                                          <span>Complete Setup</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </form>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </Panel>
              <PanelResizeHandle className="h-px bg-white/5 hover:bg-emerald-500 transition-colors" />
              
              {/* Terminal Panel */}
              <Panel defaultSize={25} minSize={10}>
                <div className="flex h-full flex-col bg-[#1e1e1e]">
                  <div className="flex h-9 items-center gap-4 border-b border-white/5 bg-[#252526] px-4 text-[11px] font-bold uppercase tracking-wider text-[#858585]">
                    <button className="text-[#cccccc] border-b border-emerald-500 pb-2 mt-2">Terminal</button>
                    <button className="pb-2 mt-2 hover:text-[#cccccc]">Output</button>
                    <button className="pb-2 mt-2 hover:text-[#cccccc]">Debug Console</button>
                    <button className="pb-2 mt-2 hover:text-[#cccccc]">Problems</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-[#cccccc] custom-scrollbar">
                    {terminalOutput.map((line, i) => (
                      <div key={i} className="mb-1">
                        <span className="text-emerald-500 mr-2">➜</span>
                        {line}
                      </div>
                    ))}
                    {isGenerating && (
                      <div className="flex items-center gap-2 text-emerald-500">
                        <Loader2 size={12} className="animate-spin" />
                        <span>Grok is thinking...</span>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-px bg-white/5 hover:bg-emerald-500 transition-colors" />

          {/* Right Panel (Chat & Preview) */}
          <Panel defaultSize={30} minSize={20}>
            <PanelGroup direction="vertical">
              {/* Chat Panel */}
              <Panel defaultSize={60} minSize={30}>
                <div className="flex h-full flex-col bg-[#252526]">
                  <div className="flex h-9 items-center justify-between px-4 text-[11px] font-bold uppercase tracking-wider text-[#858585]">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={14} />
                      <span>Architect Chat</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    <div className="rounded-lg bg-[#1e1e1e] p-3 text-xs">
                      <p className="font-bold text-emerald-500 mb-1">Grok Architect</p>
                      <p className="text-[#858585]">
                        I'm ready to help you build your SaaS. Complete the wizard on the left, and I'll generate a full Next.js + Supabase boilerplate for you.
                      </p>
                    </div>
                    {generatedApp && (
                      <div className="rounded-lg bg-[#1e1e1e] p-3 text-xs">
                        <p className="font-bold text-emerald-500 mb-1">Grok Architect</p>
                        <p className="text-[#858585]">{generatedApp.summary}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-white/5">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Ask the architect..."
                        className="w-full rounded-md bg-[#1e1e1e] border border-white/10 p-2 pl-3 pr-10 text-xs text-[#cccccc] focus:outline-none focus:border-emerald-500"
                      />
                      <button className="absolute right-2 top-1/2 -translate-y-1/2 text-[#858585] hover:text-emerald-500">
                        <Play size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </Panel>
              <PanelResizeHandle className="h-px bg-white/5 hover:bg-emerald-500 transition-colors" />
              
              {/* Preview Panel */}
              <Panel defaultSize={40} minSize={20}>
                <div className="flex h-full flex-col bg-[#1e1e1e]">
                  <div className="flex h-9 items-center justify-between px-4 text-[11px] font-bold uppercase tracking-wider text-[#858585] bg-[#252526]">
                    <div className="flex items-center gap-2">
                      <Play size={14} />
                      <span>Live Preview</span>
                    </div>
                    <button className="hover:text-[#cccccc]">
                      <ExternalLink size={14} />
                    </button>
                  </div>
                  <div className="flex-1 bg-white">
                    {generatedApp ? (
                      <SandpackProvider
                        template="nextjs"
                        theme="dark"
                        files={sandpackFiles}
                      >
                        <SandpackLayout style={{ height: '100%', border: 'none', borderRadius: 0 }}>
                          <SandpackPreview style={{ height: '100%' }} showNavigator={false} />
                        </SandpackLayout>
                      </SandpackProvider>
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-[#858585]">
                        <div className="text-center">
                          <Play size={40} className="mx-auto mb-4 opacity-20" />
                          <p className="text-xs">Preview will appear here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {/* Status Bar */}
      <footer className="flex h-6 items-center justify-between bg-[#007acc] px-3 text-[11px] text-white">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 hover:bg-white/10 px-1">
            <Github size={12} />
            <span>main*</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ShieldAlert size={12} /> 0
            </span>
            <span className="flex items-center gap-1">
              <Loader2 size={12} className={isGenerating ? "animate-spin" : "hidden"} />
              {isGenerating ? "Generating..." : "Ready"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>TypeScript JSX</span>
          <button className="flex items-center gap-1 hover:bg-white/10 px-1">
            <CheckCircle2 size={12} />
            <span>Prettier</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

function SecretInput({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = 'text', 
  show, 
  onToggle, 
  tooltip, 
  warning 
}: { 
  label: string, 
  value: string, 
  onChange: (v: string) => void, 
  placeholder: string, 
  type?: string, 
  show?: boolean, 
  onToggle?: () => void, 
  tooltip: string, 
  warning?: string 
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#858585]">{label}</label>
          <div className="group relative">
            <Info size={10} className="text-[#858585] cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded bg-[#333333] p-2 text-[9px] text-[#cccccc] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl border border-white/5">
              {tooltip}
            </div>
          </div>
        </div>
        {warning && (
          <span className="text-[9px] text-amber-500 font-medium italic">{warning}</span>
        )}
      </div>
      <div className="relative">
        <input
          type={show === false ? 'password' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border border-white/10 bg-[#1e1e1e] p-2 text-xs text-[#cccccc] focus:border-emerald-500 focus:outline-none transition-all pr-8"
        />
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#858585] hover:text-[#cccccc]"
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

function ActivityIcon({ icon: Icon, active, onClick, label }: { icon: any, active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      title={label}
      className={cn(
        "w-10 h-10 flex items-center justify-center rounded-xl transition-all relative group",
        active ? "bg-emerald-500/10 text-emerald-500" : "text-[#858585] hover:text-[#cccccc] hover:bg-white/5"
      )}
    >
      <Icon className="w-5 h-5" />
      {active && <div className="absolute left-0 w-0.5 h-4 bg-emerald-500 rounded-full" />}
      <div className="absolute left-full ml-2 px-2 py-1 bg-white/10 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
        {label}
      </div>
    </button>
  );
}
