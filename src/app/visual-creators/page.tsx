'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, Download, Loader2, Zap, Image, Sparkles, Settings, Wand2 } from 'lucide-react';

const puterModels = [
  { id: 'dall-e-3', name: 'DALL-E 3', description: 'OpenAI\'s best image model' },
  { id: 'gpt-image-1', name: 'GPT Image', description: 'OpenAI GPT image generation' },
  { id: 'black-forest-labs/FLUX.1-pro', name: 'Flux.1 Pro', description: 'High quality FLUX model' },
  { id: 'stabilityai/stable-diffusion-3-medium', name: 'Stable Diffusion 3', description: 'Latest SD model' },
  { id: 'gemini-2.5-flash-image-preview', name: 'Gemini 2.5 Flash', description: 'Google\'s fast image model' },
];

const freepikModels = [
  { id: 'mystic', name: 'Mystic', description: 'FreePik\'s AI image generator' },
];

const existingModels = [
  { id: 'visionary', name: 'Visionary', description: 'High-resolution, photorealistic images' },
  { id: 'artforge', name: 'ArtForge', description: 'Stylized artistic creations' },
  { id: 'pixeldream', name: 'PixelDream', description: 'Experimental and animated content' },
];

export default function VisualCreatorsPage() {
  const [prompt, setPrompt] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('puter');
  const [selectedModel, setSelectedModel] = useState('dall-e-3');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Array<{url: string, model: string, provider: string}>>([]);
  const [error, setError] = useState('');
  const [useOrchestration, setUseOrchestration] = useState(false);

  const generateWithPuter = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError('');

    try {
      // Load Puter.js dynamically with authentication handling
      if (!window.puter) {
        const script = document.createElement('script');
        script.src = 'https://js.puter.com/v2/';
        script.async = true;
        document.head.appendChild(script);
        
        // Wait for Puter to load
        await new Promise<void>((resolve) => {
          script.onload = () => resolve();
        });
      }

      // Check if Puter is available and handle authentication
      if (!window.puter?.ai?.txt2img) {
        // Try to initialize Puter without redirect
        try {
          // Set Puter configuration to avoid redirects
          if (window.puter) {
            // Configure Puter to stay embedded
            (window.puter as any).setOptions?.({
              stay_embedded: true,
              no_redirect: true,
              embedded_mode: true
            });
          }
        } catch (configErr) {
          // Continue even if config fails
        }

        // Check again after configuration
        if (!window.puter?.ai?.txt2img) {
          throw new Error('Puter.js requires authentication. Please try again or use FreePik/AuroraAI providers instead.');
        }
      }

      // Generate image with Puter
      const imageElement = await window.puter.ai.txt2img(prompt, {
        model: selectedModel,
        quality: "hd"
      });

      // Convert element to data URL
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = imageElement.naturalWidth || 512;
      canvas.height = imageElement.naturalHeight || 512;
      ctx?.drawImage(imageElement, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/png');
      
      setGeneratedImages(prev => [{
        url: dataUrl,
        model: puterModels.find(m => m.id === selectedModel)?.name || selectedModel,
        provider: 'Puter.js (Free)'
      }, ...prev].slice(0, 6)); // Keep only last 6 images

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Check if it's an authentication error
      if (errorMessage.includes('auth') || errorMessage.includes('login') || errorMessage.includes('request_auth')) {
        setError(`Puter.js Authentication Required: Please use FreePik or AuroraAI providers instead. Puter.js requires account setup.`);
        
        // Auto-switch to FreePik for better user experience
        setSelectedProvider('freepik');
        setSelectedModel('mystic');
      } else {
        setError(`Puter.js Error: ${errorMessage}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWithFreepik = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('https://api.freepik.com/v1/ai/mystic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-freepik-api-key': 'FPSX6e12fd00eee50216bf53e9db161500d0'
        },
        body: JSON.stringify({
          prompt: prompt,
          aspect_ratio: 'widescreen_16_9'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.image_url) {
        setGeneratedImages(prev => [{
          url: data.image_url,
          model: 'Mystic',
          provider: 'FreePik'
        }, ...prev].slice(0, 6));
      } else {
        throw new Error('No image URL in response');
      }

    } catch (err) {
      setError(`FreePik Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWithExisting = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/ai/visual-creators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user',
        },
        body: JSON.stringify({
          prompt: prompt,
          modelId: selectedModel === 'auto' ? undefined : selectedModel,
          options: {
            numImages: 1,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (data.success && data.response?.images) {
        setGeneratedImages(prev => [{
          url: data.response.images[0],
          model: existingModels.find(m => m.id === selectedModel)?.name || selectedModel,
          provider: 'AuroraAI Pro'
        }, ...prev].slice(0, 6));
      } else {
        throw new Error(data.error || 'Request failed');
      }

    } catch (err) {
      setError(`AuroraAI Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => {
    if (selectedProvider === 'puter') {
      generateWithPuter();
    } else if (selectedProvider === 'freepik') {
      generateWithFreepik();
    } else {
      generateWithExisting();
    }
  };

  const getCurrentModels = () => {
    switch (selectedProvider) {
      case 'puter': return puterModels;
      case 'freepik': return freepikModels;
      case 'aurora': return existingModels;
      default: return puterModels;
    }
  };

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
            <h1 className="text-4xl font-bold text-white mb-2">Visual Creators</h1>
            <p className="text-white/60">Generate stunning images with multiple AI models</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm text-white font-medium">Models Ready</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Provider Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-black border border-white/10 rounded-xl p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Provider</h2>
            <p className="text-sm text-white/60">Choose your image generation service</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setSelectedProvider('puter')}
            className={`relative p-4 rounded-xl font-medium transition-all duration-300 border-2 ${
              selectedProvider === 'puter'
                ? 'bg-white text-black border-white shadow-lg'
                : 'bg-black text-white border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                selectedProvider === 'puter' ? 'bg-black/10' : 'bg-white/10'
              }`}>
                <Sparkles className={`w-6 h-6 ${
                  selectedProvider === 'puter' ? 'text-black' : 'text-white'
                }`} />
              </div>
              <div className="text-center">
                <div className="font-bold">Puter.js</div>
                <div className={`text-xs mt-1 ${
                  selectedProvider === 'puter' ? 'text-black/60' : 'text-white/60'
                }`}>
                  Free • Account Required
                </div>
                <div className={`text-xs ${
                  selectedProvider === 'puter' ? 'text-black/40' : 'text-white/40'
                }`}>
                  DALL-E, Flux, SD3+
                </div>
              </div>
            </div>
            <div className="absolute top-2 right-2">
              <div className={`w-2 h-2 rounded-full ${
                selectedProvider === 'puter' ? 'bg-black' : 'bg-white'
              }`}></div>
            </div>
          </button>

          <button
            onClick={() => setSelectedProvider('freepik')}
            className={`relative p-4 rounded-xl font-medium transition-all duration-300 border-2 ${
              selectedProvider === 'freepik'
                ? 'bg-white text-black border-white shadow-lg'
                : 'bg-black text-white border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                selectedProvider === 'freepik' ? 'bg-black/10' : 'bg-white/10'
              }`}>
                <Image className={`w-6 h-6 ${
                  selectedProvider === 'freepik' ? 'text-black' : 'text-white'
                }`} />
              </div>
              <div className="text-center">
                <div className="font-bold">FreePik</div>
                <div className={`text-xs mt-1 ${
                  selectedProvider === 'freepik' ? 'text-black/60' : 'text-white/60'
                }`}>
                  API Key • Working
                </div>
                <div className={`text-xs ${
                  selectedProvider === 'freepik' ? 'text-black/40' : 'text-white/40'
                }`}>
                  Mystic Model
                </div>
              </div>
            </div>
            <div className="absolute top-2 right-2">
              <div className={`w-2 h-2 rounded-full ${
                selectedProvider === 'freepik' ? 'bg-black' : 'bg-white'
              }`}></div>
            </div>
          </button>

          <button
            onClick={() => setSelectedProvider('aurora')}
            className={`relative p-4 rounded-xl font-medium transition-all duration-300 border-2 ${
              selectedProvider === 'aurora'
                ? 'bg-white text-black border-white shadow-lg'
                : 'bg-black text-white border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                selectedProvider === 'aurora' ? 'bg-black/10' : 'bg-white/10'
              }`}>
                <Wand2 className={`w-6 h-6 ${
                  selectedProvider === 'aurora' ? 'text-black' : 'text-white'
                }`} />
              </div>
              <div className="text-center">
                <div className="font-bold">Aurora Models</div>
                <div className={`text-xs mt-1 ${
                  selectedProvider === 'aurora' ? 'text-black/60' : 'text-white/60'
                }`}>
                  Built-in • Ready
                </div>
                <div className={`text-xs ${
                  selectedProvider === 'aurora' ? 'text-black/40' : 'text-white/40'
                }`}>
                  Visionary, ArtForge
                </div>
              </div>
            </div>
            <div className="absolute top-2 right-2">
              <div className={`w-2 h-2 rounded-full ${
                selectedProvider === 'aurora' ? 'bg-black' : 'bg-white'
              }`}></div>
            </div>
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm text-white font-medium">
                {getCurrentModels().length} models available
              </span>
            </div>
            <div className="text-xs text-white/60">
              {selectedProvider === 'puter' && '⚠️ Authentication required'}
              {selectedProvider === 'freepik' && '✅ Recommended'}
              {selectedProvider === 'aurora' && '🚀 Built-in'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Simple Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-black border border-white/10 rounded-xl p-6"
      >
        <h2 className="text-xl font-bold text-white mb-4">Generate Image</h2>
        <div className="space-y-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && prompt.trim()) {
                handleGenerate();
              }
            }}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40 transition-all duration-300"
          >
            {isGenerating ? 'Generating...' : 'Generate Image'}
          </button>
        </div>
        
        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        {generatedImages.length > 0 && (
          <div className="mt-6">
            <h3 className="text-white font-semibold mb-4">Generated Images</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedImages.map((image, index) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <img 
                    src={image.url} 
                    alt={`Generated image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white/60">
                      {image.model} • {image.provider}
                    </div>
                    <button
                      onClick={() => downloadImage(image.url, `image-${index + 1}.png`)}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );

  function downloadImage(imageUrl: string, filename: string) {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    link.click();
  }
}
                                                                
// Add Puter.js types
declare global {
  interface Window {
    puter?: {
      ai: {
        txt2img: (prompt: string, options?: { model?: string, quality?: string }) => Promise<HTMLImageElement>;
      };
    };
  }
}
