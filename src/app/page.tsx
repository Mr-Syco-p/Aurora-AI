'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Brain, Palette, Radio, Zap, ArrowRight, BarChart3, Activity, Cpu, Globe, TrendingUp, Users, Clock, Star } from 'lucide-react';

const modules = [
  {
    href: '/deep-thinkers',
    icon: Brain,
    title: 'Deep Thinkers',
    description: 'Advanced reasoning models for complex problem-solving',
    stats: { models: 5, tasks: '2.3K', accuracy: '98%' },
    features: ['Logic Analysis', 'Complex Reasoning', 'Problem Solving'],
    status: 'active',
    gradient: 'from-white/20 to-white/5'
  },
  {
    href: '/visual-creators',
    icon: Palette,
    title: 'Visual Creators',
    description: 'AI models specialized in image generation and artistic content',
    stats: { models: 4, tasks: '8.7K', accuracy: '95%' },
    features: ['Image Generation', 'Art Creation', 'Visual Design'],
    status: 'active',
    gradient: 'from-white/20 to-white/5'
  },
  {
    href: '/realtime-assist',
    icon: Radio,
    title: 'Mission Control',
    description: 'Intelligent task orchestration with multi-module processing',
    stats: { models: 6, tasks: '15.2K', accuracy: '99%' },
    features: ['Task Routing', 'Real-time Processing', 'Smart Selection'],
    status: 'active',
    gradient: 'from-white/20 to-white/5'
  },
  {
    href: '/mixed-hub',
    icon: Zap,
    title: 'Mixed Hub',
    description: 'Auto-selecting the best AI model for optimal responses',
    stats: { models: 'auto', tasks: '22.1K', accuracy: '97%' },
    features: ['Smart Selection', 'Optimization', 'Adaptive Routing'],
    status: 'active',
    gradient: 'from-white/20 to-white/5'
  },
];

const systemStats = [
  { label: 'Total Models', value: '15+', icon: Cpu, change: '+2', trend: 'up' },
  { label: 'Tasks Today', value: '3,847', icon: Activity, change: '+12%', trend: 'up' },
  { label: 'Avg Response', value: '0.8s', icon: Clock, change: '-0.2s', trend: 'down' },
  { label: 'Success Rate', value: '98.7%', icon: TrendingUp, change: '+0.3%', trend: 'up' },
];

const recentActivity = [
  { module: 'Mission Control', task: 'Web search analysis', time: '2 min ago', status: 'completed' },
  { module: 'Visual Creators', task: 'Image generation', time: '5 min ago', status: 'completed' },
  { module: 'Deep Thinkers', task: 'Logic reasoning', time: '8 min ago', status: 'completed' },
  { module: 'Mixed Hub', task: 'Auto-optimized response', time: '12 min ago', status: 'completed' },
];

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-white/60">AI Orchestration Platform Overview</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm text-white font-medium">All Systems Online</span>
              </div>
            </div>
            
            <Link href="/realtime-assist">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all duration-300 flex items-center space-x-2"
              >
                <Radio className="w-4 h-4" />
                <span>Launch Mission Control</span>
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* System Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {systemStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="bg-black border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className={`flex items-center space-x-1 text-xs ${
                  stat.trend === 'up' ? 'text-white/60' : 'text-white/60'
                }`}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <ArrowRight className="w-3 h-3 rotate-45" />
                  )}
                  <span>{stat.change}</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-white/50">{stat.label}</div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Modules Section */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between"
          >
            <h2 className="text-2xl font-bold text-white">AI Modules</h2>
            <Link href="/mixed-hub" className="text-white/60 hover:text-white text-sm transition-colors">
              View all →
            </Link>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((module, index) => {
              const Icon = module.icon;
              return (
                <Link key={module.href} href={module.href}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="bg-black border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all duration-300 cursor-pointer group"
                  >
                    <div className={`bg-gradient-to-br ${module.gradient} rounded-xl p-4 mb-4`}>
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-6 h-6 text-black" />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white/90 transition-colors">
                      {module.title}
                    </h3>
                    
                    <p className="text-white/60 text-sm mb-4 line-clamp-2">
                      {module.description}
                    </p>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{module.stats.models}</div>
                        <div className="text-xs text-white/50">Models</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{module.stats.tasks}</div>
                        <div className="text-xs text-white/50">Tasks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{module.stats.accuracy}</div>
                        <div className="text-xs text-white/50">Accuracy</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {module.features.map((feature, idx) => (
                        <span key={idx} className="bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-xs text-white/60">
                          {feature}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        <span className="text-xs text-white/50 capitalize">{module.status}</span>
                      </div>
                      <div className="flex items-center text-white/60 group-hover:text-white transition-colors">
                        <span className="text-sm font-medium">Launch</span>
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Activity Sidebar */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-black border border-white/10 rounded-xl p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="flex items-start space-x-3"
                >
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white mb-1">
                      {activity.module}
                    </div>
                    <div className="text-xs text-white/60 mb-1">
                      {activity.task}
                    </div>
                    <div className="text-xs text-white/40">
                      {activity.time}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/10">
              <Link href="/logs" className="flex items-center justify-center w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300">
                <span className="text-sm font-medium">View All Activity</span>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-black border border-white/10 rounded-xl p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/realtime-assist">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <Radio className="w-5 h-5 text-white" />
                    <div>
                      <div className="font-medium text-white">New Task</div>
                      <div className="text-xs text-white/60">Start a new mission</div>
                    </div>
                  </div>
                </motion.div>
              </Link>
              
              <Link href="/visual-creators">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <Palette className="w-5 h-5 text-white" />
                    <div>
                      <div className="font-medium text-white">Generate Image</div>
                      <div className="text-xs text-white/60">Create visual content</div>
                    </div>
                  </div>
                </motion.div>
              </Link>
              
              <Link href="/logs">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-5 h-5 text-white" />
                    <div>
                      <div className="font-medium text-white">View Analytics</div>
                      <div className="text-xs text-white/60">Performance metrics</div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        {[
          { label: 'AI Models', value: '9+', color: 'text-[#39FF14]' },
          { label: 'Providers', value: '7', color: 'text-blue-400' },
          { label: 'Orchestration', value: 'Auto', color: 'text-orange-400' },
          { label: 'Tiers', value: '2', color: 'text-purple-400' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="text-center p-4 bg-[#0A0F1C] border border-[#1A2332] rounded-lg"
          >
            <div className={`text-2xl font-bold ${stat.color} neon-glow`}>
              {stat.value}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Access */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center p-8 bg-gradient-to-r from-[#39FF14] to-[#FF2052] bg-opacity-10 border border-[#39FF14] rounded-lg"
      >
        <h2 className="text-2xl font-bold neon-glow mb-4">
          Ready to Experience AI Orchestration?
        </h2>
        <p className="text-gray-300 mb-6">
          Try the Mixed Hub to see OptiBrain in action - it automatically selects the best AI model for your request.
        </p>
        <Link href="/mixed-hub">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-gradient-to-r from-[#39FF14] to-[#FF2052] text-black font-bold rounded-lg hover:shadow-[0_0_30px_rgba(57,255,20,0.7)] transition-all duration-300"
          >
            Launch Mixed Hub
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}
