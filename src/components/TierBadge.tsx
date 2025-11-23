'use client';

import { motion } from 'framer-motion';
import { Crown, Zap } from 'lucide-react';
import { Tier } from '@/lib/ai/types';

interface TierBadgeProps {
  tier: Tier;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  interactive?: boolean;
}

export default function TierBadge({
  tier,
  size = 'md',
  showIcon = true,
  interactive = false,
}: TierBadgeProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1.5 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'lg':
        return 'w-5 h-5';
      default:
        return 'w-4 h-4';
    }
  };

  const getTierStyles = () => {
    switch (tier) {
      case 'paid':
        return {
          bg: 'bg-gradient-to-r from-[#FF2052] to-[#FF6B35]',
          text: 'text-white',
          border: 'border-[#FF2052]',
          glow: 'shadow-[0_0_20px_rgba(255,32,82,0.4)]',
          icon: Crown,
        };
      case 'free':
      default:
        return {
          bg: 'bg-[#39FF14] bg-opacity-20',
          text: 'text-[#39FF14]',
          border: 'border-[#39FF14]',
          glow: 'shadow-[0_0_10px_rgba(57,255,20,0.2)]',
          icon: Zap,
        };
    }
  };

  const styles = getTierStyles();
  const Icon = styles.icon;

  const badge = (
    <div
      className={`inline-flex items-center space-x-2 ${getSizeClasses()} ${styles.bg} ${styles.border} border rounded-full font-medium ${styles.text} ${
        interactive ? 'cursor-pointer hover:scale-105' : ''
      } transition-all duration-300 ${styles.glow}`}
    >
      {showIcon && <Icon className={getIconSize()} />}
      <span className="capitalize">{tier}</span>
    </div>
  );

  if (interactive) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {badge}
      </motion.div>
    );
  }

  return badge;
}
