'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Settings, 
  MessageSquare, 
  Image, 
  Search, 
  Zap,
  Menu,
  X,
  Sun,
  Moon,
  ChevronRight,
  Grid3x3,
  Command
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'normal' | 'aggressive'>('normal');
  const [darkMode, setDarkMode] = useState(true);
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Grid3x3, description: 'Overview & Stats' },
    { href: '/deep-thinkers', label: 'Deep Thinkers', icon: Brain, description: 'Logic & Analysis' },
    { href: '/visual-creators', label: 'Visual Creators', icon: Image, description: 'Image Generation' },
    { href: '/realtime-assist', label: 'Mission Control', icon: Command, description: 'Task Orchestration' },
    { href: '/mixed-hub', label: 'Mixed Hub', icon: Zap, description: 'Smart Selection' },
    { href: '/logs', label: 'Analytics', icon: Settings, description: 'Performance Data' },
  ];

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar - Always Visible on Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-80 bg-black border-r border-white/10">
        {/* Logo Section */}
        <div className="p-8 border-b border-white/10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-400 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AuroraAI</h1>
              <p className="text-xs text-white/60 font-mono">v2.0.0</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6">
          <div className="space-y-2">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group relative px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-white text-black shadow-lg'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        isActive 
                          ? 'bg-black/10' 
                          : 'bg-white/10 group-hover:bg-white/20'
                      }`}>
                        <Icon className={`w-5 h-5 transition-all duration-300 ${
                          isActive ? 'text-black' : 'text-white'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className={`font-semibold transition-all duration-300 ${
                          isActive ? 'text-black' : 'text-white'
                        }`}>
                          {item.label}
                        </div>
                        <div className={`text-xs transition-all duration-300 ${
                          isActive ? 'text-black/60' : 'text-white/50'
                        }`}>
                          {item.description}
                        </div>
                      </div>
                      {isActive && (
                        <ChevronRight className="w-4 h-4 text-black" />
                      )}
                    </div>
                    
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Configuration Panel */}
        <div className="p-6 border-t border-white/10 space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Mode</h3>
            <div className="bg-white/5 rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setTheme('normal')}
                className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  theme === 'normal' 
                    ? 'bg-white text-black shadow-md' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Normal Mode
              </button>
              <button
                onClick={() => setTheme('aggressive')}
                className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 mt-1 ${
                  theme === 'aggressive' 
                    ? 'bg-white text-black shadow-md' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Deep Mode
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/60 block mb-2">Response Style</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-white/30 transition-colors">
                  <option value="professional">Professional</option>
                  <option value="creative">Creative</option>
                  <option value="technical">Technical</option>
                  <option value="casual">Casual</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs text-white/60 block mb-2">
                  Max Tokens: <span className="text-white font-mono">
                    {theme === 'normal' ? '4K' : '∞'}
                  </span>
                </label>
                {theme === 'normal' ? (
                  <div>
                    <input 
                      type="range" 
                      min="2000" 
                      max="8000" 
                      defaultValue="4000"
                      className="w-full accent-white"
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                      <span>2K</span>
                      <span>8K</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-lg p-3 text-center">
                    <span className="text-white text-xs font-bold">UNLIMITED • DEEP PROCESSING</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-2">Temperature: <span className="text-white font-mono">0.7</span></label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1"
                  defaultValue="0.7"
                  className="w-full accent-white"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>0.0</span>
                  <span>1.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-black border-b border-white/10 px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <div className="flex-1 lg:flex-none"></div>
            
            {/* Right Side Controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <div className="hidden sm:flex items-center bg-white/5 rounded-xl px-4 py-2 border border-white/10">
                <div className="w-2 h-2 bg-white rounded-full mr-3 animate-pulse"></div>
                <span className="text-sm text-white font-medium">System Online</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Mobile Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            
            {/* Mobile Sidebar */}
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed lg:hidden left-0 top-0 h-full w-80 bg-black border-r border-white/10 z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-white to-gray-400 rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5 text-black" />
                    </div>
                    <h1 className="text-xl font-bold text-white">AuroraAI</h1>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <nav className="space-y-2">
                  {navItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`px-4 py-3 rounded-xl transition-all duration-300 ${
                            isActive
                              ? 'bg-white text-black shadow-lg'
                              : 'text-white/70 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className={`w-5 h-5 ${
                              isActive ? 'text-black' : 'text-white'
                            }`} />
                            <span className={`font-semibold ${
                              isActive ? 'text-black' : 'text-white'
                            }`}>
                              {item.label}
                            </span>
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
