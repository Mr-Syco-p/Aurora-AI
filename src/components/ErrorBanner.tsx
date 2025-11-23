'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';

interface ErrorBannerProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  showDismiss?: boolean;
}

export default function ErrorBanner({
  error,
  onRetry,
  onDismiss,
  showRetry = true,
  showDismiss = true,
}: ErrorBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleRetry = () => {
    setIsVisible(false);
    onRetry?.();
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="p-4 bg-[#0A0F1C] border border-[#FF2052] rounded-lg shadow-[0_0_20px_rgba(255,32,82,0.3)]">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-[#FF2052] flex-shrink-0 mt-0.5" />
          
          <div className="flex-1 min-w-0">
            <h3 className="text-[#FF2052] font-medium mb-1">Error Occurred</h3>
            <p className="text-gray-300 text-sm">{error}</p>
            
            <div className="flex items-center space-x-3 mt-3">
              {showRetry && onRetry && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRetry}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-[#FF2052] bg-opacity-20 border border-[#FF2052] rounded-lg text-[#FF2052] text-sm hover:bg-opacity-30 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry</span>
                </motion.button>
              )}
              
              {showDismiss && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDismiss}
                  className="px-3 py-1.5 bg-gray-700 rounded-lg text-gray-400 text-sm hover:bg-gray-600 transition-colors"
                >
                  Dismiss
                </motion.button>
              )}
            </div>
          </div>
          
          {showDismiss && (
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
