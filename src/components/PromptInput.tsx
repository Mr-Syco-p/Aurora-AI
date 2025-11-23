'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  multiline?: boolean;
  maxLength?: number;
}

export default function PromptInput({
  onSubmit,
  placeholder = "Enter your prompt...",
  disabled = false,
  loading = false,
  multiline = true,
  maxLength = 4000,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !disabled && !loading) {
      onSubmit(prompt.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="relative group">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || loading}
          rows={multiline ? 4 : 1}
          className={`w-full px-4 py-3 bg-[#0A0F1C] border border-[#1A2332] rounded-lg text-[#39FF14] placeholder-gray-500 resize-none focus:outline-none focus:border-[#39FF14] focus:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all duration-300 ${
            disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
        
        <div className="absolute bottom-3 right-3 flex items-center space-x-2">
          {maxLength && (
            <span className="text-xs text-gray-500">
              {prompt.length}/{maxLength}
            </span>
          )}
          
          <motion.button
            type="submit"
            disabled={!prompt.trim() || disabled || loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-lg transition-all duration-300 ${
              prompt.trim() && !disabled && !loading
                ? 'bg-[#39FF14] text-black hover:bg-[#39FF14] hover:shadow-[0_0_20px_rgba(57,255,20,0.5)]'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>
      
      {prompt.length > maxLength * 0.9 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-xs text-[#FF2052] accent-glow"
        >
          Approaching character limit
        </motion.div>
      )}
    </motion.form>
  );
}
