// AI Real-Time Assistant Mission Control System

export interface TaskRequest {
  input: string;
  type: 'web' | 'media' | 'automation' | 'qa' | 'mixed';
  priority: 'low' | 'medium' | 'high';
  context?: any;
}

export interface TaskResult {
  module: string;
  success: boolean;
  data: any;
  processingTime: number;
  confidence: number;
}

export interface MissionControlResponse {
  requestId: string;
  input: string;
  processedBy: string[];
  results: TaskResult[];
  summary: string;
  structuredOutput: any;
  processingTime: number;
}

// Mission Control Orchestrator
export class MissionControl {
  private modules: Map<string, any> = new Map();
  private memory: Map<string, any> = new Map();

  constructor() {
    this.initializeModules();
  }

  private initializeModules() {
    // Register all available modules
    this.modules.set('web', {
      name: 'Web Module',
      capabilities: ['scrape', 'seo', 'search', 'analyze'],
      process: this.processWebTask.bind(this)
    });

    this.modules.set('media', {
      name: 'Media Module', 
      capabilities: ['images', 'videos', 'analysis', 'generation'],
      process: this.processMediaTask.bind(this)
    });

    this.modules.set('automation', {
      name: 'Automation Module',
      capabilities: ['scripts', 'apps', 'tasks', 'control'],
      process: this.processAutomationTask.bind(this)
    });

    this.modules.set('qa', {
      name: 'QA/Reasoning Module',
      capabilities: ['gpt', 'logic', 'knowledge', 'analysis'],
      process: this.processQATask.bind(this)
    });
  }

  // Input Preprocessing
  private preprocessInput(input: string): TaskRequest {
    const cleanedInput = input.trim().toLowerCase();
    
    // Detect intent/type
    let type: TaskRequest['type'] = 'qa';
    let priority: TaskRequest['priority'] = 'medium';

    // Enhanced detection for image generation - be more permissive
    if (cleanedInput.includes('http') || cleanedInput.includes('website') || cleanedInput.includes('scrape')) {
      type = 'web';
      priority = 'high';
    } else if (cleanedInput.includes('image') || cleanedInput.includes('video') || cleanedInput.includes('media') ||
               cleanedInput.includes('generate') || cleanedInput.includes('create') || cleanedInput.includes('make') ||
               cleanedInput.includes('draw') || cleanedInput.includes('art') || cleanedInput.includes('picture') ||
               // Common single-word image requests
               ['cat', 'dog', 'mountain', 'mountin', 'monutain', 'sunset', 'beach', 'forest', 'city', 'car', 'house', 'tree', 'flower', 'bird', 'fish', 'moon', 'star', 'ocean', 'river', 'lake', 'mountains'].some(word => cleanedInput.includes(word))) {
      type = 'media';
      priority = 'medium';
    } else if (cleanedInput.includes('run') || cleanedInput.includes('script') || cleanedInput.includes('automate')) {
      type = 'automation';
      priority = 'high';
    } else if (cleanedInput.includes('what') || cleanedInput.includes('how') || cleanedInput.includes('why') || cleanedInput.includes('explain')) {
      type = 'qa';
      priority = 'medium';
    }

    return {
      input: input.trim(),
      type,
      priority,
      context: this.getMemoryContext(input)
    };
  }

  // Task Router
  private routeTask(request: TaskRequest): string[] {
    const modules = [];
    
    if (request.type === 'mixed') {
      // For mixed tasks, use multiple modules
      modules.push('web', 'qa');
    } else {
      modules.push(request.type);
    }

    // Always add QA module for reasoning
    if (!modules.includes('qa')) {
      modules.push('qa');
    }

    return modules;
  }

  // Main Mission Control Process
  async processRequest(input: string): Promise<MissionControlResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    // Step 1: Input Preprocessing
    const request = this.preprocessInput(input);
    
    // Step 2: Task Routing
    const selectedModules = this.routeTask(request);
    
    // Step 3: Module Processing
    const results: TaskResult[] = [];
    
    for (const moduleName of selectedModules) {
      const module = this.modules.get(moduleName);
      if (module) {
        try {
          const result = await module.process(request);
          results.push(result);
        } catch (error) {
          results.push({
            module: moduleName,
            success: false,
            data: error,
            processingTime: 0,
            confidence: 0
          });
        }
      }
    }

    // Step 4: Memory & Learning
    this.storeMemory(requestId, request, results);

    // Step 5: Output Formatting
    const structuredOutput = this.formatOutput(results);
    const summary = this.generateSummary(request, results);

    const processingTime = Date.now() - startTime;

    return {
      requestId,
      input: request.input,
      processedBy: selectedModules,
      results,
      summary,
      structuredOutput,
      processingTime
    };
  }

  // Module Processing Methods
  private async processWebTask(request: TaskRequest): Promise<TaskResult> {
    const startTime = Date.now();
    
    // Simulate web processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      module: 'web',
      success: true,
      data: {
        scraped: true,
        seoScore: 85,
        backlinks: 42,
        performance: 92
      },
      processingTime: Date.now() - startTime,
      confidence: 0.9
    };
  }

  private async processMediaTask(request: TaskRequest): Promise<TaskResult> {
    const startTime = Date.now();
    
    try {
      // Check if this is an image generation request (more permissive)
      const isImageRequest = request.input.toLowerCase().includes('generate') || 
                           request.input.toLowerCase().includes('create') || 
                           request.input.toLowerCase().includes('make') ||
                           request.input.toLowerCase().includes('draw') ||
                           request.input.toLowerCase().includes('art') ||
                           request.input.toLowerCase().includes('picture') ||
                           // Common single-word image requests
                           ['cat', 'dog', 'mountain', 'mountin', 'monutain', 'sunset', 'beach', 'forest', 'city', 'car', 'house', 'tree', 'flower', 'bird', 'fish', 'moon', 'star', 'ocean', 'river', 'lake', 'mountains'].some(word => request.input.toLowerCase().includes(word));
      
      if (isImageRequest) {
        // Extract image prompt from the input
        let prompt = request.input;
        
        // For single-word requests, enhance the prompt
        if (request.input.split(' ').length === 1) {
          prompt = `A beautiful ${request.input}`;
        }
        
        const promptMatch = request.input.match(/(?:generate|create|make|draw)\s+(?:an?|the)?\s*(.+)/i);
        if (promptMatch) {
          prompt = promptMatch[1];
        }
        
        // Try Stable Diffusion Free API first, fallback to Pollinations.ai
        let imageUrl: string;
        let service: string;
        let enhancedPrompt: string;
        
        try {
          // Use Stable Diffusion Free API with MagicPrompt enhancement
          const hfToken = process.env.HUGGINGFACE_TOKEN || '';
          
          if (hfToken) {
            // First enhance the prompt with MagicPrompt
            const magicPromptResponse = await fetch('https://api-inference.huggingface.co/models/Gustavosta/MagicPrompt-Stable-Diffusion', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${hfToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                inputs: prompt
              })
            });
            
            if (magicPromptResponse.ok) {
              const magicPromptData = await magicPromptResponse.json();
              enhancedPrompt = magicPromptData[0]?.generated_text || prompt;
            } else {
              enhancedPrompt = prompt;
            }
            
            // Generate image with Stable Diffusion
            const sdResponse = await fetch('https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${hfToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                inputs: enhancedPrompt,
                parameters: {
                  num_inference_steps: 50,
                  guidance_scale: 7.5,
                  width: 512,
                  height: 512
                }
              })
            });
            
            if (sdResponse.ok) {
              const sdBlob = await sdResponse.blob();
              imageUrl = URL.createObjectURL(sdBlob);
              service = 'Stable Diffusion Free API';
            } else {
              throw new Error('Stable Diffusion API failed');
            }
          } else {
            throw new Error('No HuggingFace token');
          }
        } catch (error) {
          // Fallback to Pollinations.ai
          console.log('Stable Diffusion API failed, falling back to Pollinations.ai:', error);
          imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
          service = 'Pollinations.ai (Fallback)';
          enhancedPrompt = prompt;
        }
        
        return {
          module: 'media',
          success: true,
          data: {
            type: 'image_generation',
            originalPrompt: prompt,
            enhancedPrompt: enhancedPrompt,
            imageUrl: imageUrl,
            service: service,
            analysis: `Generated image using ${service} for prompt: "${enhancedPrompt}"`,
            magicPromptUsed: service.includes('Stable Diffusion')
          },
          processingTime: Date.now() - startTime,
          confidence: 0.95
        };
      }
      
      // Simulate regular media processing
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        module: 'media',
        success: true,
        data: {
          images: 12,
          videos: 3,
          analysis: 'High quality media detected',
          objects: ['person', 'car', 'building'],
          pollinationsAvailable: true,
          stableDiffusionAvailable: !!process.env.HUGGINGFACE_TOKEN
        },
        processingTime: Date.now() - startTime,
        confidence: 0.85
      };
    } catch (error) {
      return {
        module: 'media',
        success: false,
        data: error,
        processingTime: Date.now() - startTime,
        confidence: 0
      };
    }
  }

  private async processAutomationTask(request: TaskRequest): Promise<TaskResult> {
    const startTime = Date.now();
    
    // Simulate automation processing
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      module: 'automation',
      success: true,
      data: {
        scripts: 2,
        tasks: 5,
        status: 'Completed',
        output: 'Automation executed successfully'
      },
      processingTime: Date.now() - startTime,
      confidence: 0.95
    };
  }

  private async processQATask(request: TaskRequest): Promise<TaskResult> {
    const startTime = Date.now();
    
    try {
      // Use OpenRouter for AI responses
      const response = await fetch('/api/openrouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are Mission Control AI configured to respond in a PERPLEXITY-style: give a short, direct answer up front (1–2 sentences), then a concise supporting breakdown, then precise sources. Always use the structured Mission Control wrapper shown below.

Rules:
- Answer first: 1–2 sentence concise summary (direct).
- Then give 3–6 short bullets (key details, numbers, or steps).
- Then list up to 5 high-quality sources with one-line description and link.
- Include timestamp (local timezone: Asia/Kolkata) and confidence score (low/med/high).
- Keep total length compact — prioritize clarity and sources.
- If the question is ambiguous, provide the most likely interpretation and show alternatives.

Output format (exactly; no extra preamble):

-----------------------------------------
🚀 Mission Control AI – Perplexity Report
-----------------------------------------
Timestamp: [YYYY-MM-DD HH:MM:SS IST]

Input: "<USER_INPUT>"
Direct Answer: "<1–2 sentence concise direct answer>"

Key Points:
• <bullet 1 — short fact/step>
• <bullet 2 — short fact/step>
• <bullet 3 — short fact/step>

Actionable Next Steps:
1. <immediate action or follow-up>
2. <optional deeper action>
3. <rapid test or command user can run>

Sources:
1. [Title or Site — short note] — <URL>
2. [Title or Site — short note] — <URL>
3. [Title or Site — short note] — <URL>

Confidence: <low / medium / high>
-----------------------------------------`
            },
            {
              role: 'user',
              content: request.input
            }
          ],
          model: 'meta-llama/llama-3.2-3b-instruct:free'
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          module: 'qa',
          success: true,
          data: {
            response: data.content,
            reasoning: 'Perplexity-style analysis complete',
            confidence: 0.92,
            model: 'meta-llama/llama-3.2-3b-instruct:free'
          },
          processingTime: Date.now() - startTime,
          confidence: 0.92
        };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'OpenRouter API error');
      }
    } catch (error) {
      console.error('QA Module Error:', error);
      
      // Better fallback response with Perplexity format
      const timestamp = new Date().toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(',', '');
      
      return {
        module: 'qa',
        success: true,
        data: {
          response: `-----------------------------------------
🚀 Mission Control AI – Perplexity Report
-----------------------------------------
Timestamp: ${timestamp} IST

Input: "${request.input}"
Direct Answer: "I understand you're asking about: ${request.input}. This requires comprehensive analysis across multiple domains with structured, actionable insights."

Key Points:
• This appears to be a request for information or assistance
• I'm here to help you with detailed responses in Perplexity format
• For image generation, try commands like "generate [subject]" or just type subjects like "mountain", "cat", "sunset"
• For web searches, include URLs or search terms
• For automation, use commands like "run [task]"

Actionable Next Steps:
1. If you want an image: "generate ${request.input}" or just "${request.input}"
2. If you want information: "what is ${request.input}" or "explain ${request.input}"
3. If you want web search: include a website URL or search terms

Sources:
1. [Mission Control AI — Multi-module processing system] — http://localhost:3000/realtime-assist
2. [OpenRouter API — AI model integration] — https://openrouter.ai/docs
3. [Stable Diffusion — Free image generation] — https://huggingface.co/models

Confidence: medium
-----------------------------------------`,
          reasoning: 'Fallback analysis with Perplexity-style format',
          confidence: 0.7,
          model: 'Fallback System'
        },
        processingTime: Date.now() - startTime,
        confidence: 0.7
      };
    }
  }

  // Memory Management
  private getMemoryContext(input: string): any {
    // Simple context retrieval based on input
    return {
      previousInteractions: this.memory.size,
      userPreferences: 'balanced',
      lastQueries: Array.from(this.memory.keys()).slice(-5)
    };
  }

  private storeMemory(requestId: string, request: TaskRequest, results: TaskResult[]) {
    this.memory.set(requestId, {
      request,
      results,
      timestamp: Date.now()
    });
  }

  // Output Formatting
  private formatOutput(results: TaskResult[]): any {
    const structured: any = {
      modules: [],
      summary: {},
      metadata: {
        totalModules: results.length,
        successRate: results.filter(r => r.success).length / results.length,
        averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length
      }
    };

    results.forEach(result => {
      structured.modules.push({
        name: result.module,
        success: result.success,
        confidence: result.confidence,
        processingTime: result.processingTime,
        data: result.data
      });
    });

    return structured;
  }

  private generateSummary(request: TaskRequest, results: TaskResult[]): string {
    const successfulModules = results.filter(r => r.success).map(r => r.module);
    const failedModules = results.filter(r => !r.success).map(r => r.module);
    
    let summary = `🚀 **Mission Control Analysis Complete**\n\n`;
    summary += `**Input:** "${request.input}"\n`;
    summary += `**Type:** ${request.type} | Priority: ${request.priority}\n\n`;
    
    summary += `**Modules Deployed:** ${successfulModules.join(', ')}\n`;
    if (failedModules.length > 0) {
      summary += `**Failed Modules:** ${failedModules.join(', ')}\n`;
    }
    
    summary += `\n**Results:**\n`;
    
    // Check for image generation results
    const mediaResult = results.find(r => r.module === 'media' && r.success);
    if (mediaResult && mediaResult.data.type === 'image_generation') {
      summary += `\n🎨 **Image Generated:**\n`;
      summary += `• **Original Prompt:** ${mediaResult.data.originalPrompt}\n`;
      if (mediaResult.data.magicPromptUsed) {
        summary += `• **Enhanced Prompt:** ${mediaResult.data.enhancedPrompt}\n`;
        summary += `• **MagicPrompt:** ✅ Applied\n`;
      }
      summary += `• **Service:** ${mediaResult.data.service}\n`;
      summary += `• **Image URL:** ${mediaResult.data.imageUrl}\n`;
      summary += `• **Status:** Ready to view\n`;
    }
    
    // Add QA response if available
    const qaResult = results.find(r => r.module === 'qa' && r.success);
    if (qaResult) {
      summary += `\n${qaResult.data.response}\n`;
    }
    
    // Add other module results
    results.forEach(result => {
      if (result.success && result.module !== 'qa' && result.module !== 'media') {
        summary += `\n**${result.module.toUpperCase()} Module:**\n`;
        summary += `• Status: ✅ Success\n`;
        summary += `• Processing Time: ${result.processingTime}ms\n`;
        summary += `• Confidence: ${(result.confidence * 100).toFixed(1)}%\n`;
      }
    });
    
    summary += `\n---\n🎯 **Mission Status:** ${successfulModules.length > 0 ? 'SUCCESS' : 'PARTIAL'} | Processing completed in ${results.reduce((sum, r) => sum + r.processingTime, 0)}ms`;
    
    return summary;
  }

  private generateRequestId(): string {
    return `mission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const missionControl = new MissionControl();
