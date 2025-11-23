'use client';

import { motion } from 'framer-motion';
import { Copy, CheckCircle, AlertCircle, Clock, Zap, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface OutputPanelProps {
  response: any;
  loading?: boolean;
  error?: string;
  showMetadata?: boolean;
  colorScheme?: 'green' | 'blue' | 'orange' | 'mixed';
}

export default function OutputPanel({
  response,
  loading = false,
  error,
  showMetadata = true,
  colorScheme = 'green',
}: OutputPanelProps) {
  const [copied, setCopied] = useState(false);
  const [showUnusedOutputs, setShowUnusedOutputs] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getColorClasses = () => {
    switch (colorScheme) {
      case 'blue':
        return {
          border: 'border-blue-500',
          glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
          text: 'text-blue-400',
          bg: 'bg-blue-500 bg-opacity-10',
        };
      case 'orange':
        return {
          border: 'border-orange-500',
          glow: 'shadow-[0_0_20px_rgba(251,146,60,0.3)]',
          text: 'text-orange-400',
          bg: 'bg-orange-500 bg-opacity-10',
        };
      case 'mixed':
        return {
          border: 'border-gradient-to-r from-[#39FF14] to-[#FF2052]',
          glow: 'shadow-[0_0_20px_rgba(57,255,20,0.3)]',
          text: 'text-transparent bg-clip-text bg-gradient-to-r from-[#39FF14] to-[#FF2052]',
          bg: 'bg-gradient-to-r from-[#39FF14] to-[#FF2052] bg-opacity-10',
        };
      default:
        return {
          border: 'border-[#39FF14]',
          glow: 'shadow-[0_0_20px_rgba(57,255,20,0.3)]',
          text: 'text-[#39FF14]',
          bg: 'bg-[#39FF14] bg-opacity-10',
        };
    }
  };

  const colors = getColorClasses();

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto"
      >
        <div className={`p-6 bg-[#0A0F1C] border ${colors.border} rounded-lg ${colors.glow}`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-5 h-5 border-2 border-[#39FF14] border-t-transparent rounded-full animate-spin"></div>
            <span className={`${colors.text} font-medium`}>Processing your request...</span>
          </div>
          
          <div className="space-y-2">
            <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded animate-pulse w-1/2"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto"
      >
        <div className="p-6 bg-[#0A0F1C] border border-[#FF2052] rounded-lg shadow-[0_0_20px_rgba(255,32,82,0.3)]">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-[#FF2052]" />
            <span className="text-[#FF2052] font-medium">Error</span>
          </div>
          <p className="mt-3 text-gray-300">{error}</p>
        </div>
      </motion.div>
    );
  }

  if (!response) {
    return null;
  }

  const renderContent = () => {
    if (response.type === 'image') {
      return (
        <div className="space-y-4">
          {response.imageUrl && (
            <img
              src={response.imageUrl}
              alt="Generated image"
              className="max-w-full h-auto rounded-lg border border-gray-700"
            />
          )}
          {response.metadata && (
            <div className="text-sm text-gray-400">
              Dimensions: {response.metadata.width}x{response.metadata.height} • 
              Format: {response.metadata.format}
            </div>
          )}
        </div>
      );
    }

    if (response.type === 'realtime') {
      return (
        <div className="space-y-4">
          <div className="prose prose-invert max-w-none">
            <p className="content-text whitespace-pre-wrap">{response.summary}</p>
          </div>
          
          {response.sources && response.sources.length > 0 && (
            <div className="border-t border-gray-700 pt-4">
              <h4 className={`${colors.text} font-medium mb-3`}>Sources</h4>
              <div className="space-y-2">
                {response.sources.map((source: any, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-800 rounded-lg">
                    <span className="text-xs text-gray-500 mt-1">{index + 1}</span>
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-gray-300">{source.title}</h5>
                      <p className="text-xs text-gray-500 mt-1">{source.snippet}</p>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-neon-bright hover:underline mt-1 inline-block"
                      >
                        View Source
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Default text rendering
    return (
      <div className="prose prose-invert max-w-none">
        <p className="ai-response whitespace-pre-wrap">{response.content}</p>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto space-y-4"
    >
      {/* Main Response */}
      <div className={`p-6 bg-[#0A0F1C] border ${colors.border} rounded-lg ${colors.glow}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${colors.bg} ${colors.text}`}>
              <CheckCircle className="w-3 h-3" />
            </div>
            <div>
              <h3 className={`${colors.text} font-medium`}>
                {response.modelName || 'AI Response'}
              </h3>
              {showMetadata && (
                <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{response.latency}ms</span>
                  </span>
                  {response.tokensUsed && (
                    <span className="flex items-center space-x-1">
                      <Zap className="w-3 h-3" />
                      <span>{response.tokensUsed} tokens</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => copyToClipboard(response.content || response.summary)}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4 text-[#39FF14]" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </motion.button>
        </div>
        
        {renderContent()}
      </div>

      {/* Unused Outputs (for orchestration results) */}
      {response.unusedOutputs && response.unusedOutputs.length > 0 && (
        <div className="border-t border-gray-700 pt-4">
          <button
            onClick={() => setShowUnusedOutputs(!showUnusedOutputs)}
            className="flex items-center space-x-2 text-sm text-gray-400 hover:text-[#39FF14] transition-colors"
          >
            {showUnusedOutputs ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>Alternative Responses ({response.unusedOutputs.length})</span>
          </button>
          
          {showUnusedOutputs && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-3"
            >
              {response.unusedOutputs.map((output: any, index: number) => (
                <div
                  key={index}
                  className="p-4 bg-gray-800 border border-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-300">
                      {output.modelName}
                    </h4>
                    <div className="text-xs text-gray-500">
                      Score: {output.score?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-3">
                    {output.content || output.summary}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
