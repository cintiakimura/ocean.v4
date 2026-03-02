import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, Github, Loader2, CheckCircle2 } from 'lucide-react';
import { Logo } from '../components/Logo';

interface AuthPageProps {
  mode: 'login' | 'signup';
}

export default function AuthPage({ mode }: AuthPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate auth
    setTimeout(() => {
      setIsLoading(false);
      // In a real app, we'd handle session here. For now, just navigate to builder.
      navigate('/builder');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row">
      {/* Left Side: Branding/Info */}
      <div className="hidden md:flex flex-1 bg-emerald-500/5 border-r border-white/5 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-emerald-500/10 blur-[120px] rounded-full" />
        </div>

        <Link to="/" className="flex items-center group relative z-10">
          <Logo className="h-10 w-auto" />
        </Link>

        <div className="relative z-10">
          <h2 className="text-5xl font-bold tracking-tighter leading-tight mb-6">
            Architect your vision <br />
            <span className="text-emerald-500">without the grind.</span>
          </h2>
          <div className="space-y-4">
            <FeatureItem text="Next.js 14+ App Router boilerplate" />
            <FeatureItem text="Supabase Auth & Database integration" />
            <FeatureItem text="VETR Loop self-debugging agent" />
            <FeatureItem text="One-click Vercel deployment" />
          </div>
        </div>

        <div className="text-white/30 text-sm relative z-10">
          © 2026 kyn. Built with Grok.
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-10">
            <h1 className="text-3xl font-bold mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create an account'}
            </h1>
            <p className="text-white/40">
              {mode === 'login' 
                ? "Don't have an account? " 
                : "Already have an account? "}
              <Link 
                to={mode === 'login' ? '/signup' : '/login'} 
                className="text-emerald-500 hover:text-emerald-400 font-medium"
              >
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500/50 focus:bg-emerald-500/5 transition-all"
                />
              </div>
            </div>

            {mode === 'login' && (
              <div className="flex justify-end">
                <a href="#" className="text-sm text-white/40 hover:text-white transition-colors">
                  Forgot password?
                </a>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 text-black font-bold py-4 rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Log in' : 'Create Account'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-[#050505] px-4 text-white/20">Or continue with</span>
              </div>
            </div>

            <button 
              type="button"
              className="w-full bg-white/5 border border-white/10 text-white font-bold py-4 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-3"
            >
              <Github className="w-5 h-5" />
              GitHub
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-white/60">
      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}
