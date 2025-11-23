'use client';

import { motion } from 'framer-motion';
import { Loader2, Brain, Zap } from 'lucide-react';

interface LoadingIndicatorProps {
  message?: string;
  type?: 'text' | 'image' | 'realtime' | 'mixed';
  showProgress?: boolean;
  progress?: number;
}

export default function LoadingIndicator({
  message = "Processing...",
  type = 'text',
  showProgress = false,
  progress = 0,
}: LoadingIndicatorProps) {
  const getIcon = () => {
    switch (type) {
      case 'text':
        return <Brain className="w-5 h-5" />;
      case 'image':
        return <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded" />;
      case 'realtime':
        return <Zap className="w-5 h-5" />;
      case 'mixed':
        return <div className="w-5 h-5 bg-gradient-to-r from-[#39FF14] to-[#FF2052] rounded-full" />;
      default:
        return <Loader2 className="w-5 h-5" />;
    }
  };

  const getColorClass = () => {
    switch (type) {
      case 'text':
        return 'text-[#39FF14]';
      case 'image':
        return 'text-blue-400';
      case 'realtime':
        return 'text-orange-400';
      case 'mixed':
        return 'text-transparent bg-clip-text bg-gradient-to-r from-[#39FF14] to-[#FF2052]';
      default:
        return 'text-[#39FF14]';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-8 space-y-4"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className={`p-3 rounded-full bg-[#0A0F1C] border border-[#1A2332] ${getColorClass()}`}
      >
        {getIcon()}
      </motion.div>
      
      <div className="text-center space-y-2">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`font-medium ${getColorClass()}`}
        >
          {message}
        </motion.p>
        
        {showProgress && (
          <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#39FF14] to-[#FF2052]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
        
        <div className="flex items-center justify-center space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-[#39FF14] rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
