'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Settings, Brain, Palette, Radio, BarChart3, Sparkles, Target, Layers, ArrowRight } from 'lucide-react';

const MODEL_TYPES = [
  { id: 'text', name: 'Deep Thinkers', icon: Brain, description: 'Reasoning and analysis', color: 'from-white/20 to-white/5' },
  { id: 'image', name: 'Visual Creators', icon: Palette, description: 'Image generation', color: 'from-white/20 to-white/5' },
  { id: 'realtime', name: 'Mission Control', icon: Radio, description: 'Live web search', color: 'from-white/20 to-white/5' },
];

export default function MixedHubPage() {
  const [selectedModelTypes, setSelectedModelTypes] = useState<string[]>(['text', 'realtime']);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (inputPrompt: string) => {
    setPrompt(inputPrompt);
    setResponse(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/mixed-hub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user',
        },
        body: JSON.stringify({
          input: inputPrompt,
          modelTypes: selectedModelTypes as ('text' | 'image' | 'realtime')[],
          options: {
            threshold: 0.6,
            maxIterations: 2,
            includeUnusedOutputs: true,
          },
        }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getOptimalModelTypes = (promptText: string) => {
    const lowerPrompt = promptText.toLowerCase();
    const suggested = [];
    
    if (lowerPrompt.includes('image') || lowerPrompt.includes('picture') || lowerPrompt.includes('draw')) {
      suggested.push('image');
    }
    if (lowerPrompt.includes('search') || lowerPrompt.includes('news') || lowerPrompt.includes('latest')) {
      suggested.push('realtime');
    }
    if (suggested.length === 0) {
      suggested.push('text');
    }
    
    return suggested;
  };

  const suggestedTypes = getOptimalModelTypes(prompt);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Mixed Hub</h1>
            <p className="text-white/60">Smart AI model selection and orchestration</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm text-white font-medium">Auto-Selection Active</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Model Type Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-black border border-white/10 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Model Selection</h2>
              <p className="text-sm text-white/60">Choose which AI models to use</p>
            </div>
          </div>
          
          {suggestedTypes.length > 0 && (
            <div className="flex items-center space-x-2 bg-white/5 rounded-lg px-3 py-2">
              <Target className="w-4 h-4 text-white" />
              <span className="text-sm text-white/60">Suggested: {suggestedTypes.length}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {MODEL_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedModelTypes.includes(type.id);
            const isSuggested = suggestedTypes.includes(type.id);
            
            return (
              <motion.button
                key={type.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (isSelected) {
                    setSelectedModelTypes(selectedModelTypes.filter(id => id !== type.id));
                  } else {
                    setSelectedModelTypes([...selectedModelTypes, type.id]);
                  }
                }}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                  isSelected
                    ? 'bg-white text-black border-white shadow-lg'
                    : 'bg-black text-white border-white/10 hover:border-white/20'
                }`}
              >
                {isSuggested && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-black" />
                  </div>
                )}
                
                <div className={`bg-gradient-to-br ${type.color} rounded-lg p-3 mb-3 ${
                  isSelected ? 'bg-black/10' : ''
                }`}>
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-black' : 'text-black'}`} />
                  </div>
                </div>
                
                <h3 className={`font-semibold mb-1 ${isSelected ? 'text-black' : 'text-white'}`}>
                  {type.name}
                </h3>
                <p className={`text-sm ${isSelected ? 'text-black/60' : 'text-white/60'}`}>
                  {type.description}
                </p>
                
                {isSelected && (
                  <div className="mt-3 flex items-center text-black">
                    <div className="w-2 h-2 bg-black rounded-full mr-2"></div>
                    <span className="text-xs font-medium">Selected</span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {selectedModelTypes.length === 0 && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
            <p className="text-white/60 text-sm">Select at least one AI model to continue</p>
          </div>
        )}
        
        {selectedModelTypes.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-sm text-white font-medium">
                  {selectedModelTypes.length} model{selectedModelTypes.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <button
                onClick={() => setSelectedModelTypes(suggestedTypes)}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Use suggested selection
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Simple Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-black border border-white/10 rounded-xl p-6"
      >
        <h2 className="text-xl font-bold text-white mb-4">Test Smart Selection</h2>
        <div className="space-y-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && prompt.trim() && selectedModelTypes.length > 0) {
                handleSubmit(prompt);
              }
            }}
          />
          <button
            onClick={() => prompt.trim() && selectedModelTypes.length > 0 && handleSubmit(prompt)}
            disabled={loading || selectedModelTypes.length === 0}
            className="w-full bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40 transition-all duration-300"
          >
            {loading ? 'Processing...' : 'Generate Response'}
          </button>
        </div>
        
        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        {response && (
          <div className="mt-4 bg-white/5 border border-white/10 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">Response:</h3>
            <pre className="text-white/80 text-sm whitespace-pre-wrap">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </motion.div>
    </div>
  );
}
                                                    
                                                                          
