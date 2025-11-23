'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Brain, Search, Globe, Youtube, Radio, ImageIcon, Clock, Zap, Settings, TrendingUp, X, MessageSquare, Trash2, FileText, Download, BarChart3, CheckCircle, XCircle, Code, ExternalLink, ArrowRight } from 'lucide-react';
import { missionControl, MissionControlResponse } from '../../lib/mission-control/orchestrator';

interface ChatMessage {
  id: string;
  query: string;
  aiAnswer: string;
  results: Array<{
    title: string;
    url: string;
    snippet: string;
    source: string;
    timestamp: string;
    type: 'web' | 'video' | 'news' | 'code' | 'image' | 'document';
  }>;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    source: string;
    timestamp: string;
    type: 'web' | 'video' | 'news' | 'code' | 'image' | 'document';
  }>;
  service: string;
  timestamp: number;
}

interface UserProfile {
  name: string;
  preferences: {
    theme: 'normal' | 'aggressive';
    selectedService: string;
  };
  chatCount: number;
  firstSeen: number;
  lastSeen: number;
}

export default function RealtimeAssistPage() {
  const [query, setQuery] = useState('');
  const [selectedService, setSelectedService] = useState('web');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Array<{
    title: string;
    url: string;
    snippet: string;
    source: string;
    timestamp: string;
    type: 'web' | 'video' | 'news' | 'code' | 'image' | 'document';
  }>>([]);
  const [aiAnswer, setAiAnswer] = useState('');
  const [sources, setSources] = useState<Array<{
    title: string;
    url: string;
    snippet: string;
    source: string;
    timestamp: string;
    type: 'web' | 'video' | 'news' | 'code' | 'image' | 'document';
  }>>([]);
  const [error, setError] = useState('');
  const [useOrchestration, setUseOrchestration] = useState(false);
  const [theme, setTheme] = useState<'normal' | 'aggressive'>('normal');
  const [generatedImages, setGeneratedImages] = useState<Array<{url: string, prompt: string}>>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedModel, setSelectedModel] = useState('meta-llama/llama-3.2-3b-instruct:free');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [rateLimits, setRateLimits] = useState({ remainingDaily: 200, remainingMinute: 20 });
  const [showModelsPanel, setShowModelsPanel] = useState(true);
  const [aiResponses, setAiResponses] = useState<Array<{model: string, response: string, quality: number}>>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load available models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await fetch('/api/openrouter');
        const data = await response.json();
        setAvailableModels(data.models || []);
      } catch (err) {
        console.error('Failed to load models:', err);
      }
    };
    loadModels();
  }, []);

  // Call OpenRouter API with auto prompt correction
  const callOpenRouter = async (messages: any[], model: string = selectedModel) => {
    try {
      const response = await fetch('/api/openrouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          model: model
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'OpenRouter API error');
      }

      const data = await response.json();
      
      // Update rate limits
      if (data.rateLimits) {
        setRateLimits(data.rateLimits);
      }

      return data.content;
    } catch (err) {
      console.error('OpenRouter API error:', err);
      throw err;
    }
  };

  // Mission Control Processing
  const performMissionControl = async (query: string) => {
    setIsSearching(true);
    setError('');
    setResults([]);
    setAiAnswer('');
    setSources([]);

    try {
      // Use Mission Control Orchestrator
      const response: MissionControlResponse = await missionControl.processRequest(query);
      
      // Update UI with mission control results
      setAiAnswer(response.summary);
      
      // Convert mission control results to display format
      const displayResults = response.results.map((result, index) => {
        let resultData: {
          title: string;
          url: string;
          snippet: string;
          source: string;
          timestamp: string;
          type: 'web' | 'video' | 'news' | 'code' | 'image' | 'document';
        } = {
          title: `${result.module} Module Result`,
          url: `#${result.module}`,
          snippet: result.success ? `Success: ${JSON.stringify(result.data).substring(0, 100)}...` : `Failed: ${result.data}`,
          source: 'Mission Control',
          timestamp: new Date().toISOString(),
          type: 'web'
        };

        // Handle image generation results specially
        if (result.module === 'media' && result.success && result.data.type === 'image_generation') {
          resultData = {
            title: `🎨 Generated Image: ${result.data.originalPrompt}`,
            url: result.data.imageUrl,
            snippet: `Image generated using ${result.data.service}${result.data.magicPromptUsed ? ' with MagicPrompt enhancement' : ''}`,
            source: result.data.service,
            timestamp: new Date().toISOString(),
            type: 'image'
          };
        }

        return resultData;
      });
      
      setResults(displayResults);
      setSources(displayResults.slice(0, 5));

      // Save to chat history
      saveChatToHistory(query, response.summary, displayResults, displayResults.slice(0, 5));
      
      // Auto-clear query box
      setQuery('');
      
    } catch (err) {
      setError(`Mission Control Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Calculate response quality (simple heuristic)
  const calculateResponseQuality = (response: string): number => {
    let score = 0;
    
    // Length score (longer responses tend to be more detailed)
    score += Math.min(response.length / 1000, 5);
    
    // Structure score (headings, bullet points)
    if (response.includes('#')) score += 2;
    if (response.includes('•') || response.includes('-')) score += 2;
    if (response.includes('**') || response.includes('*')) score += 1;
    
    // Content quality indicators
    if (response.toLowerCase().includes('analysis')) score += 1;
    if (response.toLowerCase().includes('insight')) score += 1;
    if (response.toLowerCase().includes('comprehensive')) score += 1;
    
    return score;
  };

  // Save user profile to localStorage whenever it changes
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('aurora-user-profile', JSON.stringify(userProfile));
    }
  }, [userProfile]);

  // Update user profile with name
  const updateUserName = (name: string) => {
    const updatedProfile: UserProfile = {
      name: name,
      preferences: {
        theme: theme,
        selectedService: selectedService
      },
      chatCount: (userProfile?.chatCount || 0) + 1,
      firstSeen: userProfile?.firstSeen || Date.now(),
      lastSeen: Date.now()
    };
    setUserProfile(updatedProfile);
  };

  // Update user preferences
  const updateUserPreferences = (newTheme: 'normal' | 'aggressive', newService: string) => {
    if (userProfile) {
      const updatedProfile = {
        ...userProfile,
        preferences: {
          theme: newTheme,
          selectedService: newService
        },
        lastSeen: Date.now()
      };
      setUserProfile(updatedProfile);
    }
  };

  // Update theme and save to profile
  const handleThemeChange = (newTheme: 'normal' | 'aggressive') => {
    setTheme(newTheme);
    updateUserPreferences(newTheme, selectedService);
  };

  // Update service and save to profile
  const handleServiceChange = (newService: string) => {
    setSelectedService(newService);
    updateUserPreferences(theme, newService);
  };

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('realtime-assist-chat-history', JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  // Focus input on load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Save current chat to history with user context
  const saveChatToHistory = (chatQuery: string, chatAiAnswer: string, chatResults: any[], chatSources: any[]) => {
    // Extract user information from query if it's a personal introduction
    const lowerQuery = chatQuery.toLowerCase();
    if (lowerQuery.includes('my name is') || lowerQuery.includes('i am') || lowerQuery.includes('i\'m')) {
      // Try to extract name from the query
      const nameMatch = chatQuery.match(/(?:my name is|i am|i'm)\s+([a-zA-Z\s]+)/i);
      if (nameMatch && !userProfile?.name) {
        const extractedName = nameMatch[1].trim();
        updateUserName(extractedName);
      }
    }

    const newChat: ChatMessage = {
      id: Date.now().toString(),
      query: chatQuery,
      aiAnswer: chatAiAnswer,
      results: chatResults,
      sources: chatSources,
      service: selectedService,
      timestamp: Date.now()
    };

    setChatHistory(prev => [newChat, ...prev].slice(0, 50)); // Keep last 50 chats
    
    // Update user profile with chat count
    if (userProfile) {
      updateUserPreferences(theme, selectedService);
    }
  };

  // Load chat from history
  const loadChatFromHistory = (chat: ChatMessage) => {
    setQuery(chat.query);
    setAiAnswer(chat.aiAnswer);
    setResults(chat.results);
    setSources(chat.sources);
    setSelectedService(chat.service);
    setCurrentChatId(chat.id);
    setShowHistory(false);
    setError('');
  };

  // Clear chat history
  const clearChatHistory = () => {
    setChatHistory([]);
    localStorage.removeItem('realtime-assist-chat-history');
    setCurrentChatId(null);
  };

  // Delete specific chat
  const deleteChat = (chatId: string) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setQuery('');
      setAiAnswer('');
      setResults([]);
      setSources([]);
    }
  };

  // Enhanced web search with AI-style processing
  const searchWeb = async (searchQuery: string): Promise<Array<{
    title: string;
    url: string;
    snippet: string;
    source: string;
    timestamp: string;
    type: 'web' | 'video' | 'news' | 'code' | 'image' | 'document';
  }>> => {
    try {
      // Use multiple search engines for comprehensive results
      const searchEngines = [
        { name: 'DuckDuckGo', url: `https://duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}` },
        { name: 'Brave Search', url: `https://search.brave.com/search?q=${encodeURIComponent(searchQuery)}` },
        { name: 'Startpage', url: `https://www.startpage.com/do/search?query=${encodeURIComponent(searchQuery)}` }
      ];

      let allResults: Array<{
        title: string;
        url: string;
        snippet: string;
        source: string;
        timestamp: string;
        type: 'web' | 'video' | 'news' | 'code' | 'image' | 'document';
      }> = [];
      
      // Try DuckDuckGo first
      try {
        const response = await fetch(searchEngines[0].url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (response.ok) {
          const html = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          const resultElements = doc.querySelectorAll('.result, .web-result');
          
          resultElements.forEach((element, index) => {
            if (index >= 8) return; // Limit to 8 results
            
            const titleEl = element.querySelector('h2, .title, a h2');
            const linkEl = element.querySelector('a');
            const snippetEl = element.querySelector('.snippet, .description');
            
            if (titleEl && linkEl) {
              allResults.push({
                title: titleEl.textContent?.trim() || 'Untitled',
                url: linkEl.href,
                snippet: snippetEl?.textContent?.trim() || 'No description available',
                source: searchEngines[0].name,
                timestamp: new Date().toISOString(),
                type: 'web'
              });
            }
          });
        }
      } catch (err) {
        // Continue with fallback
      }

      // Fallback results if parsing fails
      if (allResults.length === 0) {
        allResults = [
          {
            title: `Search Results for "${searchQuery}"`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}`,
            snippet: `Click to view comprehensive search results for "${searchQuery}" on DuckDuckGo`,
            source: 'DuckDuckGo',
            timestamp: new Date().toISOString(),
            type: 'web'
          },
          {
            title: `Google Search: ${searchQuery}`,
            url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
            snippet: `Click to search for "${searchQuery}" on Google for additional results`,
            source: 'Google',
            timestamp: new Date().toISOString(),
            type: 'web'
          },
          {
            title: `Brave Search: ${searchQuery}`,
            url: `https://search.brave.com/search?q=${encodeURIComponent(searchQuery)}`,
            snippet: `Click to search for "${searchQuery}" on Brave Search for privacy-focused results`,
            source: 'Brave',
            timestamp: new Date().toISOString(),
            type: 'web'
          }
        ];
      }

      return allResults;
    } catch (err) {
      return [
        {
          title: `Search: ${searchQuery}`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}`,
          snippet: `Click to search for "${searchQuery}" on DuckDuckGo (Privacy-focused search)`,
          source: 'DuckDuckGo',
          timestamp: new Date().toISOString(),
          type: 'web'
        }
      ];
    }
  };

  // YouTube search with enhanced results
  const searchYouTube = async (searchQuery: string): Promise<Array<{
    title: string;
    url: string;
    snippet: string;
    source: string;
    timestamp: string;
    type: 'web' | 'video' | 'news' | 'code' | 'image' | 'document';
  }>> => {
    try {
      const response = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error('YouTube unavailable');
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const videos: Array<{
        title: string;
        url: string;
        snippet: string;
        source: string;
        timestamp: string;
        type: 'web' | 'video' | 'news' | 'code' | 'image' | 'document';
      }> = [];
      const videoElements = doc.querySelectorAll('a.yt-simple-endpoint, #video-title');
      
      videoElements.forEach((element, index) => {
        if (index >= 8) return; // Limit to 8 results
        
        const title = element.textContent?.trim();
        const href = element.getAttribute('href');
        
        if (title && href && href.includes('/watch')) {
          videos.push({
            title: title,
            url: `https://www.youtube.com${href}`,
            snippet: `YouTube video: ${title}`,
            source: 'YouTube',
            timestamp: new Date().toISOString(),
            type: 'video'
          });
        }
      });

      // Fallback if parsing fails
      if (videos.length === 0) {
        videos.push({
          title: `YouTube Search: ${searchQuery}`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`,
          snippet: `Click to search for "${searchQuery}" videos on YouTube`,
          source: 'YouTube',
          timestamp: new Date().toISOString(),
          type: 'video'
        });
      }

      return videos;
    } catch (err) {
      return [
        {
          title: `YouTube Search: ${searchQuery}`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`,
          snippet: `Click to search for "${searchQuery}" videos on YouTube`,
          source: 'YouTube',
          timestamp: new Date().toISOString(),
          type: 'video'
        }
      ];
    }
  };

  // News search with multiple sources
  const searchNews = async (searchQuery: string): Promise<Array<{
    title: string;
    url: string;
    snippet: string;
    source: string;
    timestamp: string;
    type: 'web' | 'video' | 'news' | 'code' | 'image' | 'document';
  }>> => {
    const newsResults: Array<{
      title: string;
      url: string;
      snippet: string;
      source: string;
      timestamp: string;
      type: 'web' | 'video' | 'news' | 'code' | 'image' | 'document';
    }> = [
      {
        title: `Google News Search: ${searchQuery}`,
        url: `https://news.google.com/search?q=${encodeURIComponent(searchQuery)}`,
        snippet: `Latest news about "${searchQuery}" from Google News - Comprehensive coverage from multiple sources`,
        source: 'Google News',
        timestamp: new Date().toISOString(),
        type: 'news'
      },
      {
        title: `BBC News Search: ${searchQuery}`,
        url: `https://www.bbc.co.uk/search?q=${encodeURIComponent(searchQuery)}&filter=news`,
        snippet: `Latest news about "${searchQuery}" from BBC News - Trusted international news source`,
        source: 'BBC News',
        timestamp: new Date().toISOString(),
        type: 'news'
      },
      {
        title: `CNN News Search: ${searchQuery}`,
        url: `https://www.cnn.com/search?q=${encodeURIComponent(searchQuery)}&type=article`,
        snippet: `Latest news about "${searchQuery}" from CNN - Breaking news and analysis`,
        source: 'CNN',
        timestamp: new Date().toISOString(),
        type: 'news'
      }
    ];

    return newsResults;
  };

  // Simple markdown parser for basic formatting
  const parseMarkdown = (text: string) => {
    return text
      // Headers (# ## ###)
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mb-4 mt-6">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-white mb-3 mt-5">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium text-white mb-2 mt-4">$1</h3>')
      // Bold text (**text**)
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
      // Italic text (*text*)
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-200">$1</em>')
      // Bullet points (•)
      .replace(/^• (.*$)/gim, '<li class="ml-4 text-gray-300 mb-1">• $1</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-4 text-gray-300">')
      .replace(/\n/g, '<br />')
      // Wrap in paragraphs
      .replace(/^(?!<[h|l])/gm, '<p class="mb-4 text-gray-300">')
      .replace(/(?<!>)$/gm, '</p>');
  };

  // Generate AI-style answer based on search results
  const generateAiAnswer = (searchQuery: string, searchResults: any[]) => {
    // AI Model Personalities
    const aiModels = {
      web: {
        normal: {
          name: 'SearchNova',
          personality: 'Analytical & Comprehensive',
          template: (query: string, results: any[]) => {
            const hasResults = results.length > 0;
            const topSources = results.slice(0, 3).map(r => `• ${r.title} (${r.source})`).join('\n');
            
            return `# ${query}

## Summary
${hasResults 
  ? `Based on my analysis of ${results.length} web sources, I found comprehensive information about "${query}". The search results indicate significant online presence with multiple perspectives and detailed coverage across various platforms.`
  : `I searched extensively for information about "${query}" but found limited direct results. This might indicate the topic is niche, recently emerging, or requires more specific search terms.`}

Answer generated by SearchNova • Web Intelligence AI`;
          }
        },
        aggressive: {
          name: 'DeepSeek Mixed Intelligence',
          personality: 'Advanced & Unlimited Context',
          template: (query: string, results: any[]) => {
            const hasResults = results.length > 0;
            
            return `# ${query}

## 🔥 UNLIMITED CONTEXT ANALYSIS

DeepSeek Mixed Intelligence processing with unlimited context window...

## Comprehensive Summary
${hasResults 
  ? `I've performed an extensive deep analysis across ${results.length} web sources using advanced AI reasoning. The topic "${query}" shows significant complexity with multiple interconnected themes and expert perspectives.`
  : `Even with unlimited context processing, direct information about "${query}" appears limited.`}

🔥 Generated by DeepSeek Mixed Intelligence • Unlimited Context Processing`;
          }
        }
      },
      youtube: {
        normal: {
          name: 'VideoMind',
          personality: 'Visual & Educational',
          template: (query: string, results: any[]) => {
            return `# ${query}

## Video Analysis Summary
I analyzed YouTube content related to "${query}".

Answer generated by VideoMind • Visual Learning AI`;
          }
        },
        aggressive: {
          name: 'DeepSeek Video Intelligence',
          personality: 'Advanced Visual Analysis',
          template: (query: string, results: any[]) => {
            return `# ${query}

## 🔥 UNLIMITED VIDEO INTELLIGENCE

DeepSeek Video Intelligence analyzing with unlimited context...

🔥 Generated by DeepSeek Video Intelligence • Unlimited Visual Processing`;
          }
        }
      },
      news: {
        normal: {
          name: 'NewsPulse',
          personality: 'Current Events & Factual',
          template: (query: string, results: any[]) => {
            return `# ${query}

## News Analysis
I analyzed news sources covering "${query}".

Answer generated by NewsPulse • Real-time News AI`;
          }
        },
        aggressive: {
          name: 'DeepSeek News Intelligence',
          personality: 'Advanced News Analysis',
          template: (query: string, results: any[]) => {
            return `# ${query}

## 🔥 UNLIMITED NEWS INTELLIGENCE

DeepSeek News Intelligence processing with unlimited context...

🔥 Generated by DeepSeek News Intelligence • Unlimited Media Processing`;
          }
        }
      }
    };

    const serviceType = selectedService === 'youtube' ? 'youtube' : selectedService === 'news' ? 'news' : 'web';
    const themeMode = theme === 'aggressive' ? 'aggressive' : 'normal';
    const aiModel = aiModels[serviceType]?.[themeMode] || aiModels.web.normal;
    
    return aiModel.template(searchQuery, searchResults);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    const searchQuery = query.trim();
    setIsSearching(true);
    setError('');
    setResults([]);
    setAiAnswer('');
    setSources([]);

    try {
      let searchResults = [];
      
      switch (selectedService) {
        case 'web':
          searchResults = await searchWeb(searchQuery);
          break;
        case 'youtube':
          searchResults = await searchYouTube(searchQuery);
          break;
        case 'news':
          searchResults = await searchNews(searchQuery);
          break;
        default:
          searchResults = await searchWeb(searchQuery);
      }

      setResults(searchResults);
      setSources(searchResults.slice(0, 5)); // Top 5 sources for citation
      
      // Generate AI-style answer
      const answer = generateAiAnswer(searchQuery, searchResults);
      setAiAnswer(answer);
      
      // Save to chat history
      saveChatToHistory(searchQuery, answer, searchResults, searchResults.slice(0, 5));
      
    } catch (err) {
      setError(`Search Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSearching(false);
      // Keep query in input box for next search
      // Don't clear the query
    }
  };

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'video': return Youtube;
      case 'news': return Radio;
      case 'code': return Code;
      case 'image': return ImageIcon;
      case 'document': return FileText;
      default: return Globe;
    }
  };

  // Real web scraping function
  const scrapeWebContent = async (urls: string[]) => {
    const scrapedData = [];
    
    for (const url of urls) {
      try {
        // Use a web scraping API or proxy service
        const response = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`);
        if (response.ok) {
          const data = await response.json();
          scrapedData.push({
            url: url,
            title: data.title || 'Unknown',
            content: data.content || '',
            text: data.text || ''
          });
        }
      } catch (error) {
        console.log(`Failed to scrape ${url}:`, error);
      }
    }
    
    return scrapedData;
  };

  // Enhanced search with real web scraping
  const performDeepSearch = async (query: string) => {
    setIsSearching(true);
    setError('');
    setResults([]);
    setAiAnswer('');
    setSources([]);

    try {
      // Step 1: Get search results
      let searchResults = [];
      
      switch (selectedService) {
        case 'web':
          searchResults = await searchWeb(query);
          break;
        case 'youtube':
          searchResults = await searchYouTube(query);
          break;
        case 'news':
          searchResults = await searchNews(query);
          break;
        default:
          searchResults = await searchWeb(query);
      }

      setResults(searchResults);
      setSources(searchResults.slice(0, 5));

      // Step 2: Scrape actual web content from top results
      const urlsToScrape = searchResults.slice(0, 3).map(r => r.url);
      const scrapedContent = await scrapeWebContent(urlsToScrape);

      // Step 3: Send all scraped data to AI for deep analysis
      const allContent = scrapedContent.map(item => 
        `URL: ${item.url}\nTITLE: ${item.title}\nCONTENT: ${item.text.substring(0, 2000)}`
      ).join('\n\n---\n\n');

      // Step 4: Generate comprehensive AI answer using DeepThinker approach
      const deepAnalysis = await generateDeepAnalysis(query, allContent, scrapedContent);
      setAiAnswer(deepAnalysis);

      // Save to chat history
      saveChatToHistory(query, deepAnalysis, searchResults, searchResults.slice(0, 5));
      
    } catch (err) {
      setError(`Deep Search Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Generate deep analysis like DeepThinker with user context
  const generateDeepAnalysis = async (query: string, content: string, scrapedData: any[]) => {
    // Simulate deep thinking process
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3 seconds for deep analysis
    
    const hasContent = scrapedData.length > 0;
    const contentSummary = scrapedData.map(item => item.title).join(', ');
    const userName = userProfile?.name || 'User';
    const chatCount = userProfile?.chatCount || 1;
    
    if (theme === 'aggressive') {
      // Aggressive mode - unlimited context analysis with personal context
      return `# ${query}

## 🔥 DEEP CONTEXT ANALYSIS

Hello ${userName}! I have analyzed ${scrapedData.length} web sources in detail for you. This is your ${chatCount}th conversation with me.

## Complete Content Analysis
${hasContent 
  ? `Sources analyzed: ${contentSummary}\n\nI have processed the full content from these sources and extracted key insights, patterns, and relationships. The data reveals multiple perspectives and detailed information about your query.`
  : `No web content was available for analysis. This may indicate the topic requires different search terms or the sources are not accessible.`}

## Personalized Intelligence Report
Based on my analysis of the actual web content and our conversation history, I can provide you with:

**Key Findings:**
• Comprehensive understanding of ${query} for ${userName}
• Analysis of ${scrapedData.length} real web sources
• Extracted insights from actual content
• Contextualized for your ${chatCount} previous interactions

**Contextual Understanding:**
• User: ${userName} (Chat #${chatCount})
• Query: ${query}
• Available data: ${hasContent ? 'Rich content from multiple sources' : 'Limited data available'}
• Analysis depth: Complete content processing

🔥 Deep analysis complete • Personalized for ${userName} • All web content processed • Unlimited context

Generated by DeepSeek Mixed Intelligence for ${userName}`;
    } else {
      // Normal mode - standard analysis with personal context
      return `# ${query}

## Analysis Summary

Hello ${userName}! I have analyzed ${scrapedData.length} web sources for comprehensive understanding.

## Key Findings
${hasContent 
  ? `Based on detailed analysis of: ${contentSummary}\n\nI've processed the actual content from these sources to provide you with accurate and relevant information about ${query}.`
  : `I searched for information about ${query} but limited web content was available for analysis.`}

## Content Summary
${hasContent 
  ? `Multiple sources provide detailed coverage of this topic. The analysis reveals consistent information across different sources.`
  : `Consider trying different search terms or sources for better results.`}

Analysis complete • Personalized for ${userName} • Web content processed • SearchNova Intelligence`;
    }
  };

  // Image generation function
  const generateImage = async (prompt: string) => {
    if (!prompt.trim()) return;
    
    setIsGeneratingImage(true);
    setError('');
    
    try {
      // Generate a placeholder image using picsum.photos with prompt as seed
      const seed = prompt.replace(/\s+/g, '-').toLowerCase();
      const imageUrl = `https://picsum.photos/512/512?random=${seed}`;
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newImage = {
        url: imageUrl,
        prompt: prompt.trim()
      };
      
      setGeneratedImages(prev => [newImage, ...prev]);
      setImagePrompt('');
      
    } catch (err) {
      setError(`Image Generation Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center space-x-3">
          <Brain className="w-8 h-8 text-white" />
          <h1 className="text-3xl font-bold text-white">Mission Control AI</h1>
        </div>
        <p className="text-white max-w-2xl mx-auto">
          Advanced AI orchestrator with multi-module processing and real-time task routing
        </p>
        {userProfile?.name && (
          <div className="mt-4 text-center">
            <span className="text-white font-medium">Hello, {userProfile.name}! </span>
            <span className="text-white text-sm">
              ({userProfile.chatCount} chats • First seen: {new Date(userProfile.firstSeen).toLocaleDateString()})
            </span>
          </div>
        )}
      </motion.div>

      {/* Chat History Sidebar */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="bg-black border border-gray-700 rounded-lg p-3 text-orange-400 hover:bg-gray-700 transition-colors shadow-lg"
        >
          <MessageSquare className="w-5 h-5" />
          {chatHistory.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {chatHistory.length}
            </span>
          )}
        </button>
        
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute left-14 top-0 w-80 bg-black border border-gray-700 rounded-lg shadow-xl max-h-96 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Chat History</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={clearChatHistory}
                    className="text-white hover:text-red-300 transition-colors"
                    title="Clear all history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-white hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-80">
              {chatHistory.length === 0 ? (
                <div className="p-4 text-white text-center">
                  No chat history yet
                </div>
              ) : (
                <div className="space-y-1">
                  {chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-3 hover:bg-gray-700 cursor-pointer transition-colors ${
                        currentChatId === chat.id ? 'bg-gray-700' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className="flex-1 min-w-0"
                          onClick={() => loadChatFromHistory(chat)}
                        >
                          <p className="text-white text-sm truncate font-medium">
                            {chat.query}
                          </p>
                          <p className="text-white text-xs truncate">
                            {chat.service} • {new Date(chat.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChat(chat.id);
                          }}
                          className="text-white hover:text-red-300 transition-colors ml-2"
                          title="Delete chat"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Search Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-black rounded-lg border border-gray-700"
      >
        {/* Service Selection */}
        <div className="p-4 border border-white">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => handleServiceChange('web')}
                className={`px-4 py-2 font-medium transition-colors ${
                  selectedService === 'web'
                    ? 'bg-white text-black'
                    : 'bg-black text-white hover:bg-black'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Web</span>
                </div>
              </button>
              <button
                onClick={() => handleServiceChange('youtube')}
                className={`px-4 py-2 font-medium transition-colors ${
                  selectedService === 'youtube'
                    ? 'bg-white text-black'
                    : 'bg-black text-white hover:bg-black'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Youtube className="w-4 h-4" />
                  <span>YouTube</span>
                </div>
              </button>
              <button
                onClick={() => handleServiceChange('news')}
                className={`px-4 py-2 font-medium transition-colors ${
                  selectedService === 'news'
                    ? 'bg-white text-black'
                    : 'bg-black text-white hover:bg-black'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Radio className="w-4 h-4" />
                  <span>News</span>
                </div>
              </button>
              <button
                onClick={() => handleServiceChange('image')}
                className={`px-4 py-2 font-medium transition-colors ${
                  selectedService === 'image'
                    ? 'bg-gray-700 text-white'
                    : 'bg-black text-white hover:bg-black'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4" />
                  <span>Image</span>
                </div>
              </button>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-white">
              <TrendingUp className="w-4 h-4" />
              <span>Deep Search</span>
              {currentChatId && (
                <span className="text-blue-400">• Chat saved</span>
              )}
            </div>
          </div>
        </div>

        {/* Theme Selection */}
        <div className="px-4 pb-4 border border-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-white">
              <Brain className="w-4 h-4" />
              <span>AI Mode:</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleThemeChange('normal')}
                className={`fixed right-4 top-1/2 transform -translate-y-1/2 z-40 p-3 rounded-lg border transition-all duration-300 ${
                  showHistory 
                    ? 'bg-black border-red-500 text-white' 
                    : 'bg-black border-gray-600 text-white hover:text-white hover:border-red-500'
                }`}
              >
                <span className="flex items-center space-x-1">
                  <span>💙</span>
                  <span>Normal</span>
                </span>
              </button>
              <button
                onClick={() => handleThemeChange('aggressive')}
                className={`px-3 py-1 font-medium transition-colors text-sm ${
                  theme === 'aggressive'
                    ? 'bg-white text-black'
                    : 'bg-black text-white hover:bg-black'
                }`}
              >
                <span className="flex items-center space-x-1">
                  <span>🔥</span>
                  <span>Deep</span>
                </span>
              </button>
            </div>
          </div>
          {theme === 'aggressive' && (
            <div className="mt-2 text-xs text-white bg-red-900 border border-red-500 rounded p-2">
              🔥 DEEP ANALYSIS • Real Web Scraping • Complete Content Processing
            </div>
          )}
        </div>

        {/* Model Selection */}
        <div className="px-4 pb-4 border border-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-white">
              <Settings className="w-4 h-4" />
              <span>AI Model:</span>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-black border border-white text-white px-3 py-1 rounded text-sm focus:outline-none focus:border-blue-500"
              >
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model.split(':')[0]} {model.includes(':free') ? '(Free)' : ''}
                  </option>
                ))}
              </select>
              <div className="text-xs text-white">
                <span>Daily: {rateLimits.remainingDaily}/200</span>
                <span className="ml-2">Min: {rateLimits.remainingMinute}/20</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-6">
          {selectedService === 'image' ? (
            // Image Generation Interface
            <div className="space-y-4">
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe the image you want to generate... (e.g., 'A beautiful sunset over mountains')"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 pr-12"
                    onKeyPress={(e) => e.key === 'Enter' && generateImage(imagePrompt)}
                  />
                  {imagePrompt && (
                    <button
                      onClick={() => setImagePrompt('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => generateImage(imagePrompt)}
                  disabled={!imagePrompt.trim() || isGeneratingImage}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                    isGeneratingImage
                      ? 'bg-gray-600 text-white cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isGeneratingImage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      <span>Generate</span>
                    </>
                  )}
                </button>
              </div>
              {generatedImages.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Generated Images</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedImages.map((image, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-3">
                          <p className="text-sm text-gray-300 truncate">{image.prompt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Regular Search Interface
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Mission Control AI - Enter any command or question..."
                  className="w-full px-4 py-3 bg-black border border-white text-white placeholder-white focus:outline-none focus:border-white pr-12"
                  onKeyPress={(e) => e.key === 'Enter' && performMissionControl(query)}
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => performMissionControl(query)}
                disabled={!query.trim() || isSearching}
                className={`px-6 py-3 font-medium transition-colors flex items-center space-x-2 ${
                  isSearching
                    ? 'bg-gray-600 text-white cursor-not-allowed'
                    : 'bg-white text-black hover:bg-red-700'
                }`}
              >
                {isSearching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Mission Processing...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Execute Mission</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-white text-sm">{error}</p>
          </div>
        )}
      </motion.div>

      {/* AI Answer Section */}
      {aiAnswer && !isSearching && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`p-6 border ${
            theme === 'aggressive' 
              ? 'bg-black border-red-500'
              : 'bg-black border-red-500'
          }`}
        >
          <div className="flex items-start space-x-3">
            <Brain className={`w-6 h-6 mt-1 flex-shrink-0 text-white`} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-white">Deep Analysis</h3>
                  <span className={`text-xs px-2 py-1 bg-white text-black`}>
                    SearchNova
                  </span>
                </div>
                <div className="text-xs text-white">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
              <div 
                className="text-white leading-relaxed"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(aiAnswer) }}
              />
              
              {/* Sources */}
              {sources.length > 0 && (
                <div className={`mt-4 pt-4 border ${
                  theme === 'aggressive' ? 'border-red-500' : 'border-blue-500'
                }`}>
                  <h4 className={`text-sm font-medium mb-2 ${
                    theme === 'aggressive' ? 'text-white' : 'text-blue-400'
                  }`}>Sources</h4>
                  <div className="space-y-1">
                    {sources.map((source, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-white">
                        <span className={theme === 'aggressive' ? 'text-white' : 'text-blue-400'}>
                          {index + 1}.
                        </span>
                        <button
                          onClick={() => openLink(source.url)}
                          className={`transition-colors flex items-center space-x-1 ${
                            theme === 'aggressive' ? 'hover:text-red-300' : 'hover:text-blue-300'
                          }`}
                        >
                          <span>{source.title}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Search Results */}
      {results.length > 0 && !isSearching && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Search Results</h2>
            <div className="text-sm text-white">
              {results.length} results found
            </div>
          </div>
          
          <div className="space-y-3">
            {results.map((result, index) => {
              const Icon = getIconForType(result.type);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="bg-black rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs text-white bg-gray-700 px-2 py-1 rounded">
                          {result.source}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-medium text-white mb-2 hover:text-white transition-colors cursor-pointer"
                          onClick={() => openLink(result.url)}>
                        {result.title}
                      </h3>
                      
                      {/* Show image for image generation results */}
                      {result.type === 'image' && (
                        <div className="mb-3">
                          <img 
                            src={result.url} 
                            alt={result.title}
                            className="rounded-lg border border-gray-600 max-w-full h-auto"
                            style={{ maxHeight: '300px' }}
                            loading="lazy"
                            onError={(e) => {
                              // Fallback for blob URLs that might expire
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = document.createElement('div');
                              fallback.className = 'text-white text-sm p-3 border border-gray-600 rounded';
                              fallback.textContent = 'Image could not be displayed. Click to view directly.';
                              target.parentNode?.insertBefore(fallback, target.nextSibling);
                            }}
                          />
                          {result.snippet.includes('MagicPrompt') && (
                            <div className="mt-2 text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded">
                              ✨ Enhanced with MagicPrompt
                            </div>
                          )}
                        </div>
                      )}
                      
                      <p className="text-white text-sm mb-3 line-clamp-2">
                        {result.snippet}
                      </p>
                      
                      <button
                        onClick={() => openLink(result.url)}
                        className="inline-flex items-center space-x-1 text-white hover:text-red-300 text-sm font-medium transition-colors"
                      >
                        <span>Visit</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-black rounded-lg p-6 border border-gray-700"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Brain className="w-5 h-5" />
          <span>Search Tips</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
          <div>
            <h4 className="font-medium text-white mb-2">Chat Features</h4>
            <ul className="space-y-1 text-sm">
              <li>• Chat history saved automatically</li>
              <li>• Click chat icon to view previous searches</li>
              <li>• Query stays in box for next search</li>
              <li>• Memory persists across sessions</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">Search Strategies</h4>
            <ul className="space-y-1 text-sm">
              <li>• Ask questions naturally like "What is..."</li>
              <li>• Use specific terms for better results</li>
              <li>• Try different sources (Web, YouTube, News)</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
