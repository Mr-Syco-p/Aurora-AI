'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Brain, Palette, Radio, Zap, FileText, Settings } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Brain },
  { href: '/deep-thinkers', label: 'Deep Thinkers', icon: Brain },
  { href: '/visual-creators', label: 'Visual Creators', icon: Palette },
  { href: '/realtime-assist', label: 'Realtime Assist', icon: Radio },
  { href: '/mixed-hub', label: 'Mixed Hub', icon: Zap },
  { href: '/logs', label: 'Logs', icon: FileText },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="bg-[#0A0F1C] border-b border-[#1A2332] px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-2"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-[#39FF14] to-[#FF2052] rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-2xl font-bold heading-neon">AuroraAI</h1>
        </motion.div>

        <div className="flex items-center space-x-6">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-[#39FF14] bg-opacity-20 neon-border'
                      : 'hover:bg-[#39FF14] hover:bg-opacity-10'
                  }`}
                >
                  <Icon 
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#39FF14]' : 'text-gray-400'
                    }`} 
                  />
                  <span 
                    className={`text-sm font-medium ${
                      isActive ? 'text-neon-bright' : 'text-gray-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-4"
        >
          <div className="px-3 py-1 rounded-full border border-[#39FF14] text-[#39FF14] text-xs font-medium neon-border">
            Free Tier
          </div>
          <button className="p-2 rounded-lg hover:bg-[#39FF14] hover:bg-opacity-10 transition-colors">
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </motion.div>
      </div>
    </nav>
  );
}
