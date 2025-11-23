'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Trash2, Filter, Search, BarChart3, Clock, Zap, CheckCircle, XCircle } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  tier: 'free' | 'paid';
  requestType: 'text' | 'image' | 'realtime' | 'mixed';
  input: string;
  selectedModel: string;
  allModels: string[];
  scores: Record<string, number>;
  tokensUsed: number;
  latency: number;
  success: boolean;
  error?: string;
}

interface LogStats {
  totalLogs: number;
  successRate: number;
  averageLatency: number;
  totalTokensUsed: number;
  modelUsage: Record<string, number>;
  tierUsage: Record<string, number>;
  requestTypeUsage: Record<string, number>;
}

export default function LogsViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showStats, setShowStats] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/logs');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch logs');
      }

      setLogs(data.logs || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/ai/logs', { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear logs');
      }

      setLogs([]);
      setStats(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear logs');
    }
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify({ logs, stats }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `aurora-ai-logs-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.input.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.selectedModel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === 'all' || log.tier === filterTier;
    const matchesType = filterType === 'all' || log.requestType === filterType;
    
    return matchesSearch && matchesTier && matchesType;
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39FF14]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[#0A0F1C] border border-[#FF2052] rounded-lg">
        <div className="flex items-center space-x-3">
          <XCircle className="w-5 h-5 text-[#FF2052]" />
          <span className="text-[#FF2052]">Error loading logs: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#39FF14] flex items-center space-x-2">
          <FileText className="w-6 h-6" />
          <span>System Logs</span>
        </h2>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-3 py-1.5 bg-[#0A0F1C] border border-[#39FF14] text-[#39FF14] rounded-lg hover:bg-[#39FF14] hover:bg-opacity-10 transition-colors flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>{showStats ? 'Hide' : 'Show'} Stats</span>
          </button>
          
          <button
            onClick={exportLogs}
            disabled={logs.length === 0}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <button
            onClick={clearLogs}
            disabled={logs.length === 0}
            className="px-3 py-1.5 bg-[#FF2052] text-white rounded-lg hover:bg-[#FF2052] transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Stats Section */}
      {showStats && stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0A0F1C] border border-[#1A2332] rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-[#39FF14] mb-4">System Statistics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-[#39FF14]">{stats.totalLogs}</div>
              <div className="text-xs text-gray-400">Total Requests</div>
            </div>
            <div className="text-center p-3 bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{stats.successRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-400">Success Rate</div>
            </div>
            <div className="text-center p-3 bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-orange-400">{stats.averageLatency.toFixed(0)}ms</div>
              <div className="text-xs text-gray-400">Avg Latency</div>
            </div>
            <div className="text-center p-3 bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{stats.totalTokensUsed.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Total Tokens</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Model Usage */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Model Usage</h4>
              <div className="space-y-1">
                {Object.entries(stats.modelUsage).map(([model, count]) => (
                  <div key={model} className="flex justify-between text-xs">
                    <span className="text-gray-300">{model}</span>
                    <span className="text-[#39FF14]">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tier Usage */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Tier Usage</h4>
              <div className="space-y-1">
                {Object.entries(stats.tierUsage).map(([tier, count]) => (
                  <div key={tier} className="flex justify-between text-xs">
                    <span className="text-gray-300 capitalize">{tier}</span>
                    <span className="text-[#39FF14]">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Request Type Usage */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Request Types</h4>
              <div className="space-y-1">
                {Object.entries(stats.requestTypeUsage).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-xs">
                    <span className="text-gray-300 capitalize">{type}</span>
                    <span className="text-[#39FF14]">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="bg-[#0A0F1C] border border-[#1A2332] rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#39FF14]"
            />
          </div>
          
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:border-[#39FF14]"
          >
            <option value="all">All Tiers</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:border-[#39FF14]"
          >
            <option value="all">All Types</option>
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="realtime">Realtime</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0A0F1C] border border-[#1A2332] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Model</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Input</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Latency</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tokens</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredLogs.map((log, index) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-800 transition-colors"
                >
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.requestType === 'text' ? 'bg-green-900 text-green-300' :
                      log.requestType === 'image' ? 'bg-blue-900 text-blue-300' :
                      log.requestType === 'realtime' ? 'bg-orange-900 text-orange-300' :
                      'bg-purple-900 text-purple-300'
                    }`}>
                      {log.requestType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-300">{log.selectedModel}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">
                    {log.input}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{log.latency}ms</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 flex items-center space-x-1">
                    <Zap className="w-3 h-3" />
                    <span>{log.tokensUsed}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {log.success ? (
                      <div className="flex items-center space-x-1 text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        <span>Success</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-[#FF2052]">
                        <XCircle className="w-3 h-3" />
                        <span>Error</span>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredLogs.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No logs found</p>
          </div>
        )}
      </div>
    </div>
  );
}
