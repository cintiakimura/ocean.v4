import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Zap, Shield, Code, ArrowRight, Github, Globe, Database, Layout, Wand2 } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center group cursor-pointer">
            <Logo className="h-10 w-auto" />
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Log in
            </Link>
            <Link to="/signup" className="px-5 py-2.5 bg-white text-black rounded-full text-sm font-bold hover:bg-emerald-400 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-left max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8">
              <Zap className="w-3 h-3 fill-current" />
              Powered by Grok
            </div>
            
            <h1 className="text-8xl md:text-[10rem] font-bold tracking-tighter leading-[0.9] mb-6">
              <span className="text-emerald-500">kyn</span>
            </h1>
            
            <p className="text-2xl md:text-4xl text-white/80 max-w-3xl mb-12 leading-tight font-normal">
              the first architecture focused and self debugged, all in one app builder for developers
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-start gap-4">
              <Link to="/signup" className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-black rounded-2xl font-bold text-lg hover:bg-emerald-400 transition-all hover:scale-105 flex items-center justify-center gap-2 group">
                Start Building Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                <Github className="w-5 h-5" />
                View on GitHub
              </a>
            </div>
          </motion.div>

          {/* App Preview Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-24 relative"
          >
            <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] -z-10" />
            <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="h-12 bg-white/5 border-b border-white/10 flex items-center px-6 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="ml-4 px-3 py-1 bg-white/5 rounded-md text-[10px] text-white/30 font-mono">
                  kyn.app/builder
                </div>
              </div>
              <img 
                src="https://picsum.photos/seed/dashboard/1200/800" 
                alt="App Preview" 
                className="w-full opacity-80 grayscale hover:grayscale-0 transition-all duration-700"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={Wand2}
              title="VETR Loop Architect"
              description="Verify, Explain, Trace, Repair. Our agent doesn't just code; it self-debugs until it's perfect."
            />
            <FeatureCard 
              icon={Database}
              title="Supabase Native"
              description="Full-stack integration with Auth, Database, and Storage out of the box. No configuration needed."
            />
            <FeatureCard 
              icon={Globe}
              title="Next.js 14+ Ready"
              description="Leverage the latest App Router features, Server Components, and optimized performance."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center">
            <Logo className="h-8 w-auto" />
          </div>
          <p className="text-white/30 text-sm">
            © 2026 kyn. Built with Grok.
          </p>
          <div className="flex gap-6 text-white/40">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">Discord</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="group">
      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 transition-all duration-300">
        <Icon className="w-6 h-6 text-white group-hover:text-emerald-400 transition-colors" />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-white/40 leading-relaxed">{description}</p>
    </div>
  );
}
