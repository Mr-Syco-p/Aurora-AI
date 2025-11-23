'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ChatInterface from "../../components/Chat/ChatInterface";
import { Brain, Settings, Zap, Target, BarChart3 } from 'lucide-react';

const MODELS = [
  { id: 'logicflow', name: 'LogicFlow', description: 'Analytical reasoning', icon: Brain },
  { id: 'cognitia', name: 'Cognitia', description: 'Cognitive processing', icon: Zap },
  { id: 'neuromind', name: 'NeuroMind', description: 'Advanced reasoning', icon: Target },
];

export default function DeepThinkersPage() {
  const [selectedModel, setSelectedModel] = useState('logicflow');
  const [useOrchestration, setUseOrchestration] = useState(false);
  const [theme, setTheme] = useState<'normal' | 'aggressive'>('normal');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (message: string, options?: any) => {
    setLoading(true);
    
    try {
      const maxTokens = options?.theme === 'aggressive' ? 16000 : (options?.maxTokens || 4000);
      
      const payload = options?.useOrchestration 
        ? {
            input: message,
            modelTypes: ['text'],
          }
        : {
            prompt: message,
            modelId: selectedModel,
            options: {
              maxTokens: maxTokens,
              temperature: options?.temperature || 0.7,
            },
          };

      const endpoint = options?.useOrchestration ? '/api/ai/mixed-hub' : '/api/ai/deep-thinkers';
      
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-' + Date.now(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DeepThinkers API Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Deep Thinkers</h1>
            <p className="text-white/60">Advanced AI models for intelligent conversations and analysis</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm text-white font-medium">Models Ready</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-black border border-white/10 rounded-xl p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Configuration</h2>
            <p className="text-sm text-white/60">Choose your AI processing mode</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-3">Processing Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setUseOrchestration(false)}
                className={`p-3 rounded-xl font-medium transition-all duration-300 border-2 ${
                  !useOrchestration
                    ? 'bg-white text-black border-white shadow-lg'
                    : 'bg-black text-white border-white/10 hover:border-white/20'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold">Direct Model</div>
                  <div className={`text-xs mt-1 ${!useOrchestration ? 'text-black/60' : 'text-white/60'}`}>
                    Single AI model
                  </div>
                </div>
              </button>
              <button
                onClick={() => setUseOrchestration(true)}
                className={`p-3 rounded-xl font-medium transition-all duration-300 border-2 ${
                  useOrchestration
                    ? 'bg-white text-black border-white shadow-lg'
                    : 'bg-black text-white border-white/10 hover:border-white/20'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold">Smart Selection</div>
                  <div className={`text-xs mt-1 ${useOrchestration ? 'text-black/60' : 'text-white/60'}`}>
                    Auto-optimized
                  </div>
                </div>
              </button>
            </div>
          </div>

          {!useOrchestration && (
            <div>
              <label className="block text-sm font-medium text-white mb-3">AI Model</label>
              <div className="grid grid-cols-1 gap-3">
                {MODELS.map((model) => {
                  const Icon = model.icon;
                  return (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`p-3 rounded-xl font-medium transition-all duration-300 border-2 text-left ${
                        selectedModel === model.id
                          ? 'bg-white text-black border-white shadow-lg'
                          : 'bg-black text-white border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          selectedModel === model.id ? 'bg-black/10' : 'bg-white/10'
                        }`}>
                          <Icon className={`w-4 h-4 ${
                            selectedModel === model.id ? 'text-black' : 'text-white'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{model.name}</div>
                          <div className={`text-xs ${
                            selectedModel === model.id ? 'text-black/60' : 'text-white/60'
                          }`}>
                            {model.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {useOrchestration && (
          <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-5 h-5 text-white" />
              <div>
                <div className="text-sm font-medium text-white">Smart Selection Active</div>
                <div className="text-xs text-white/60">System will automatically choose the best model</div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Chat Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="h-[calc(100vh-280px)]"
      >
        <ChatInterface
          onSendMessage={sendMessage}
          placeholder="Ask Deep Thinkers anything..."
          disabled={loading}
          theme={theme}
        />
      </motion.div>
    </div>
  );
}
            
