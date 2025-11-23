'use client';

import { motion } from 'framer-motion';
import LogsViewer from '../../components/LogsViewer';

export default function LogsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold neon-glow">System Logs</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Monitor AI model performance, usage statistics, and system activity
        </p>
      </motion.div>

      {/* Logs Viewer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <LogsViewer />
      </motion.div>
    </div>
  );
}
