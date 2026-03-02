import React, { useState, useEffect } from 'react';
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
  Wand2, 
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
  Code2
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackPreview, 
  SandpackFileExplorer 
} from '@codesandbox/sandpack-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { AppSpecs, INITIAL_SPECS, GeneratedApp, FileContent } from './types';
import { generateWithGrok } from './services/grokService';

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

export default function App() {
  const [specs, setSpecs] = useState<AppSpecs>(INITIAL_SPECS);
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedApp, setGeneratedApp] = useState<GeneratedApp | null>(null);
  const [activeFile, setActiveFile] = useState<FileContent | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'wizard' | 'explorer'>('wizard');
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['Welcome to GrokSaaS Builder v1.0.0', 'Ready to build your next SaaS...']);

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
      const result = await generateWithGrok(specs);
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
    <div className="flex h-screen w-screen flex-col bg-vscode-bg overflow-hidden">
      {/* Top Bar */}
      <header className="flex h-9 items-center justify-between border-b border-white/5 bg-vscode-sidebar px-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-semibold text-vscode-accent">
            <Wand2 size={14} />
            <span>GrokSaaS Builder</span>
          </div>
          <nav className="flex gap-3 text-vscode-muted">
            <button className="hover:text-vscode-text">File</button>
            <button className="hover:text-vscode-text">Edit</button>
            <button className="hover:text-vscode-text">Selection</button>
            <button className="hover:text-vscode-text">View</button>
            <button className="hover:text-vscode-text">Go</button>
            <button className="hover:text-vscode-text">Run</button>
            <button className="hover:text-vscode-text">Terminal</button>
            <button className="hover:text-vscode-text">Help</button>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-vscode-muted">
          <button className="flex items-center gap-1 hover:text-vscode-text">
            <Github size={14} />
            <span>GitHub</span>
          </button>
          <div className="h-4 w-px bg-white/10" />
          <button className="rounded bg-vscode-accent px-2 py-0.5 text-white hover:bg-vscode-accent/80">
            Deploy to Vercel
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <aside className="flex w-12 flex-col items-center gap-4 border-r border-white/5 bg-vscode-sidebar py-4 text-vscode-muted">
          <button 
            onClick={() => { setActiveTab('wizard'); setSidebarExpanded(true); }}
            className={cn("p-2 transition-colors hover:text-vscode-text", activeTab === 'wizard' && "text-vscode-accent border-l-2 border-vscode-accent")}
          >
            <Wand2 size={24} />
          </button>
          <button 
            onClick={() => { setActiveTab('explorer'); setSidebarExpanded(true); }}
            className={cn("p-2 transition-colors hover:text-vscode-text", activeTab === 'explorer' && "text-vscode-accent border-l-2 border-vscode-accent")}
          >
            <Files size={24} />
          </button>
          <button className="p-2 transition-colors hover:text-vscode-text">
            <Search size={24} />
          </button>
          <button className="p-2 transition-colors hover:text-vscode-text">
            <Github size={24} />
          </button>
          <div className="mt-auto flex flex-col gap-4">
            <button className="p-2 transition-colors hover:text-vscode-text">
              <Users size={24} />
            </button>
            <button className="p-2 transition-colors hover:text-vscode-text">
              <Settings size={24} />
            </button>
          </div>
        </aside>

        <PanelGroup direction="horizontal">
          {/* Sidebar Panel */}
          {sidebarExpanded && (
            <>
              <Panel defaultSize={15} minSize={10} maxSize={30}>
                <div className="flex h-full flex-col bg-vscode-sidebar">
                  <div className="flex h-9 items-center justify-between px-4 text-[11px] font-bold uppercase tracking-wider text-vscode-muted">
                    <span>{activeTab === 'wizard' ? 'App Wizard' : 'Explorer'}</span>
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
                              currentStep === idx ? "bg-vscode-accent/10 text-vscode-accent" : "hover:bg-vscode-hover text-vscode-muted"
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
                    ) : (
                      <div className="p-2">
                        {generatedApp ? (
                          <div className="space-y-1">
                            {generatedApp.files.map((file) => (
                              <button
                                key={file.path}
                                onClick={() => setActiveFile(file)}
                                className={cn(
                                  "flex w-full items-center gap-2 rounded px-2 py-1 text-xs transition-colors",
                                  activeFile?.path === file.path ? "bg-vscode-accent/20 text-vscode-text" : "text-vscode-muted hover:bg-vscode-hover hover:text-vscode-text"
                                )}
                              >
                                <FileCode size={14} className="text-vscode-accent" />
                                <span className="truncate">{file.path}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-20 text-center text-vscode-muted">
                            <Code2 size={40} className="mb-4 opacity-20" />
                            <p className="text-xs">No files generated yet.</p>
                            <p className="text-[10px] opacity-60">Complete the wizard to start.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
              <PanelResizeHandle className="w-px bg-white/5 hover:bg-vscode-accent transition-colors" />
            </>
          )}

          {/* Main Content Panel */}
          <Panel defaultSize={55} minSize={30}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={75} minSize={30}>
                <div className="flex h-full flex-col bg-vscode-editor">
                  {/* Tabs */}
                  <div className="flex h-9 items-center bg-vscode-sidebar overflow-x-auto custom-scrollbar">
                    {activeTab === 'wizard' ? (
                      <div className="flex h-full items-center border-t-2 border-vscode-accent bg-vscode-editor px-4 text-xs">
                        <Wand2 size={14} className="mr-2 text-vscode-accent" />
                        <span>Wizard.config</span>
                      </div>
                    ) : (
                      activeFile && (
                        <div className="flex h-full items-center border-t-2 border-vscode-accent bg-vscode-editor px-4 text-xs">
                          <FileCode size={14} className="mr-2 text-vscode-accent" />
                          <span>{activeFile.path.split('/').pop()}</span>
                        </div>
                      )
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
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-vscode-accent/10 text-vscode-accent">
                                {React.createElement(STEPS[currentStep].icon, { size: 24 })}
                              </div>
                              <div>
                                <h2 className="text-2xl font-bold text-vscode-text">{STEPS[currentStep].title}</h2>
                                <p className="text-sm text-vscode-muted">{STEPS[currentStep].description}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="space-y-2">
                              <label className="text-xs font-semibold uppercase tracking-wider text-vscode-muted">
                                Specification Details
                              </label>
                              <textarea
                                value={specs[STEPS[currentStep].id as keyof AppSpecs]}
                                onChange={(e) => handleInputChange(STEPS[currentStep].id as keyof AppSpecs, e.target.value)}
                                placeholder="Enter your requirements here..."
                                className="min-h-[200px] w-full rounded-md border border-white/10 bg-vscode-bg p-4 text-sm text-vscode-text focus:border-vscode-accent focus:outline-none focus:ring-1 focus:ring-vscode-accent transition-all"
                              />
                            </div>

                            <div className="flex items-center justify-between pt-4">
                              <button
                                onClick={handleBack}
                                disabled={currentStep === 0}
                                className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-vscode-muted hover:text-vscode-text disabled:opacity-30"
                              >
                                <ChevronLeft size={18} />
                                Back
                              </button>
                              <button
                                onClick={handleNext}
                                disabled={isGenerating}
                                className="flex items-center gap-2 rounded-md bg-vscode-accent px-6 py-2 text-sm font-medium text-white hover:bg-vscode-accent/80 transition-all shadow-lg shadow-vscode-accent/20"
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
                                  idx === currentStep ? "w-8 bg-vscode-accent" : "w-1.5 bg-white/10"
                                )}
                              />
                            ))}
                          </div>
                        </motion.div>
                      ) : (
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
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </Panel>
              <PanelResizeHandle className="h-px bg-white/5 hover:bg-vscode-accent transition-colors" />
              
              {/* Terminal Panel */}
              <Panel defaultSize={25} minSize={10}>
                <div className="flex h-full flex-col bg-vscode-bg">
                  <div className="flex h-9 items-center gap-4 border-b border-white/5 bg-vscode-sidebar px-4 text-[11px] font-bold uppercase tracking-wider text-vscode-muted">
                    <button className="text-vscode-text border-b border-vscode-accent pb-2 mt-2">Terminal</button>
                    <button className="pb-2 mt-2 hover:text-vscode-text">Output</button>
                    <button className="pb-2 mt-2 hover:text-vscode-text">Debug Console</button>
                    <button className="pb-2 mt-2 hover:text-vscode-text">Problems</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-vscode-text custom-scrollbar">
                    {terminalOutput.map((line, i) => (
                      <div key={i} className="mb-1">
                        <span className="text-vscode-accent mr-2">➜</span>
                        {line}
                      </div>
                    ))}
                    {isGenerating && (
                      <div className="flex items-center gap-2 text-vscode-accent">
                        <Loader2 size={12} className="animate-spin" />
                        <span>Grok is thinking...</span>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-px bg-white/5 hover:bg-vscode-accent transition-colors" />

          {/* Right Panel (Chat & Preview) */}
          <Panel defaultSize={30} minSize={20}>
            <PanelGroup direction="vertical">
              {/* Chat Panel */}
              <Panel defaultSize={60} minSize={30}>
                <div className="flex h-full flex-col bg-vscode-sidebar">
                  <div className="flex h-9 items-center justify-between px-4 text-[11px] font-bold uppercase tracking-wider text-vscode-muted">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={14} />
                      <span>Architect Chat</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    <div className="rounded-lg bg-vscode-bg p-3 text-xs">
                      <p className="font-bold text-vscode-accent mb-1">Grok Architect</p>
                      <p className="text-vscode-muted">
                        I'm ready to help you build your SaaS. Complete the wizard on the left, and I'll generate a full Next.js + Supabase boilerplate for you.
                      </p>
                    </div>
                    {generatedApp && (
                      <div className="rounded-lg bg-vscode-bg p-3 text-xs">
                        <p className="font-bold text-vscode-accent mb-1">Grok Architect</p>
                        <p className="text-vscode-muted">{generatedApp.summary}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-white/5">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Ask the architect..."
                        className="w-full rounded-md bg-vscode-bg border border-white/10 p-2 pl-3 pr-10 text-xs text-vscode-text focus:outline-none focus:border-vscode-accent"
                      />
                      <button className="absolute right-2 top-1/2 -translate-y-1/2 text-vscode-muted hover:text-vscode-accent">
                        <Play size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </Panel>
              <PanelResizeHandle className="h-px bg-white/5 hover:bg-vscode-accent transition-colors" />
              
              {/* Preview Panel */}
              <Panel defaultSize={40} minSize={20}>
                <div className="flex h-full flex-col bg-vscode-bg">
                  <div className="flex h-9 items-center justify-between px-4 text-[11px] font-bold uppercase tracking-wider text-vscode-muted bg-vscode-sidebar">
                    <div className="flex items-center gap-2">
                      <Play size={14} />
                      <span>Live Preview</span>
                    </div>
                    <button className="hover:text-vscode-text">
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
                        <SandpackLayout>
                          <SandpackPreview style={{ height: '100%' }} showNavigator={false} />
                        </SandpackLayout>
                      </SandpackProvider>
                    ) : (
                      <div className="flex h-full items-center justify-center bg-vscode-bg text-vscode-muted">
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
      <footer className="flex h-6 items-center justify-between bg-vscode-status px-3 text-[11px] text-white">
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
