'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Copy, CheckCircle, User, Bot, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  latency?: number;
  tokensUsed?: number;
  error?: string;
}

interface ChatInterfaceProps {
  onSendMessage: (message: string, options?: any) => Promise<any>;
  placeholder?: string;
  disabled?: boolean;
  theme?: 'normal' | 'aggressive';
}

export default function ChatInterface({ 
  onSendMessage, 
  placeholder = "Type your message...",
  disabled = false,
  theme = 'normal'
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || disabled) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await onSendMessage(input.trim(), { theme });
      
      // Handle different response structures
      let responseData = response;
      if (response.response) {
        responseData = response.response;
      } else if (response.result && response.result.selectedResponse) {
        responseData = response.result.selectedResponse;
      }
      
      // Check for API errors and provide fallback
      let content = 'No response received';
      let error = null;
      
      if (responseData?.error) {
        error = responseData.error;
        content = `API Error: ${responseData.error}`;
      } else if (responseData?.content) {
        content = responseData.content;
      } else if (typeof response === 'string' && response.includes('Error')) {
        error = response;
        content = response;
      } else if (!responseData?.content && !responseData?.error) {
        content = "I'm having trouble connecting to my AI services right now. Please try again in a moment. The team has been notified.";
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: content,
        timestamp: new Date(),
        model: responseData?.modelName || responseData?.modelId || response.modelId || 'unknown',
        latency: responseData?.latency || response.latency,
        tokensUsed: responseData?.tokensUsed || response.tokensUsed,
        error: error,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'An error occurred',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getAIAvatar = (modelId?: string) => {
    const avatars: Record<string, { icon: string; color: string; bgColor: string }> = {
      'logicflow': { icon: '🧠', color: 'text-blue-600', bgColor: 'bg-blue-100' },
      'cognitia': { icon: '🎯', color: 'text-purple-600', bgColor: 'bg-purple-100' },
      'neuromind': { icon: '⚡', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      'deepseek': { icon: '🔥', color: 'text-red-600', bgColor: 'bg-red-100' },
      'optibrain': { icon: '🌟', color: 'text-green-600', bgColor: 'bg-green-100' },
      'default': { icon: '🤖', color: 'text-gray-600', bgColor: 'bg-gray-100' }
    };
    
    return avatars[modelId || 'default'] || avatars.default;
  };

  const getAIName = (modelId?: string) => {
    const aiNames: Record<string, { name: string; style: string; author: string }> = {
      'logicflow': { 
        name: 'LogicFlow', 
        style: '💙 Logical & Analytical',
        author: 'Mistral AI Team'
      },
      'cognitia': { 
        name: 'Cognitia', 
        style: '🧠 Cognitive & Deep Thinking',
        author: 'Mistral Small Team'
      },
      'neuromind': { 
        name: 'NeuroMind', 
        style: '⚡ Neural & Advanced Reasoning',
        author: 'OpenRouter Collective'
      },
      'deepseek': { 
        name: 'DeepSeek', 
        style: '🔥 Advanced & Powerful',
        author: 'DeepSeek AI Team'
      },
      'optibrain': { 
        name: 'OptiBrain', 
        style: '🎯 Optimized & Orchestrated',
        author: 'AuroraAI Systems'
      },
      'default': { 
        name: 'AI Assistant', 
        style: '✨ Intelligent & Responsive',
        author: 'AuroraAI Platform'
      }
    };
    
    return aiNames[modelId || 'default'] || aiNames.default;
  };

  const getThemeClasses = () => {
    if (theme === 'normal') {
      return {
        userBg: 'bg-blue-600',
        userText: 'text-white',
        assistantBg: 'bg-gray-800',
        assistantText: 'text-white',
        assistantBorder: 'border-blue-500/30',
        buttonBg: 'bg-blue-600 hover:bg-blue-700',
        inputBg: 'bg-gray-800 border-gray-700',
        inputFocus: 'focus:border-blue-500 focus:ring-blue-500/20',
        // Normal mode: Black, White, Blue theme
        userBubble: 'bg-blue-600 text-white shadow-lg shadow-blue-600/30',
        assistantBubble: 'bg-white text-black border-2 border-blue-500',
        metadataText: 'text-blue-600',
        copyButton: 'hover:bg-blue-100 text-blue-600',
      };
    } else {
      return {
        userBg: 'bg-red-600',
        userText: 'text-white',
        assistantBg: 'bg-gray-800',
        assistantText: 'text-white',
        assistantBorder: 'border-red-500/30',
        buttonBg: 'bg-red-600 hover:bg-red-700',
        inputBg: 'bg-gray-800 border-gray-700',
        inputFocus: 'focus:border-red-500 focus:ring-red-500/20',
        // Aggressive mode: Black, White, Red theme
        userBubble: 'bg-red-600 text-white shadow-lg shadow-red-600/30',
        assistantBubble: 'bg-white text-black border-2 border-red-500',
        metadataText: 'text-red-600',
        copyButton: 'hover:bg-red-100 text-red-600',
      };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div className="flex flex-col h-full chat-container mobile-full-height ios-height-fix pwa-fullscreen bg-gray-900 rounded-lg border border-gray-800">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto ios-scroll p-3 sm:p-4 space-y-3 sm:space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 sm:space-x-3 max-w-[90%] sm:max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 small-phone-avatar ${
                  message.role === 'user' ? themeClasses.userBg : getAIAvatar(message.model).bgColor
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  ) : (
                    <span className={`text-lg sm:text-xl ${getAIAvatar(message.model).color}`}>
                      {getAIAvatar(message.model).icon}
                    </span>
                  )}
                </div>

                {/* Message Content */}
                <div className={`rounded-lg px-3 py-2 sm:px-4 sm:py-3 ${
                  message.role === 'user' 
                    ? themeClasses.userBubble
                    : 'bg-white text-black border-2 border-gray-300'
                }`}>
                  {message.error ? (
                    <div className="text-red-500 text-xs sm:text-sm mobile-text-xs font-medium">{message.error}</div>
                  ) : (
                    <div className={`whitespace-pre-wrap text-xs sm:text-sm mobile-text-sm leading-relaxed ${
                      message.role === 'user' ? 'text-white font-medium' : 'text-black font-normal'
                    }`}>
                      {message.content || 'No response received'}
                    </div>
                  )}
                  
                  {/* Message Metadata */}
                  {message.role === 'assistant' && (message.model || message.latency) && (
                    <div className="mt-2 pt-2 border-t border-gray-300 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs space-y-2 sm:space-y-0">
                      <div className="flex flex-col space-y-1">
                        {/* AI Name and Style */}
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-gray-800">
                            {getAIName(message.model).name}
                          </span>
                          <span className="text-gray-600 text-xs">
                            {getAIName(message.model).style}
                          </span>
                        </div>
                        
                        {/* Performance Metrics */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                          {message.latency && <span className="text-gray-600">⚡ {message.latency}ms</span>}
                          {message.tokensUsed && <span className="text-gray-600">📝 {message.tokensUsed} tokens</span>}
                          <span className="text-gray-500">• {getAIName(message.model).author}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="p-1 rounded transition-colors self-start sm:self-auto ios-button-fix hover:bg-gray-100 text-gray-600"
                      >
                        {copiedId === message.id ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center small-phone-avatar">
                <span className="text-lg sm:text-xl text-gray-600">🤖</span>
              </div>
              <div className="rounded-lg px-3 py-2 sm:px-4 sm:py-3 bg-white text-black border-2 border-gray-300">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-gray-600" />
                  <span className="text-gray-600 text-xs sm:text-sm mobile-text-xs">AI is thinking...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t border-gray-800 p-3 sm:p-4 safe-area-inset-bottom">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={`flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-lg border ${themeClasses.inputBg} ${themeClasses.inputFocus} text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors text-sm sm:text-base mobile-text-sm ios-input-fix`}
          />
          <button
            type="submit"
            disabled={disabled || isLoading || !input.trim()}
            className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium text-white transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base mobile-text-sm ios-button-fix ${
              themeClasses.buttonBg
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <Send className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
            <span className="hidden sm:inline">{isLoading ? 'Sending...' : 'Send'}</span>
            <span className="sm:hidden">{isLoading ? '...' : '→'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
