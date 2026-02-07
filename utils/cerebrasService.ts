import { Message, ToolDefinition } from "../types";
import { TOOLS, executeTool } from "./tools";
import { MemoryManager } from "./memory";

const API_URL = "https://api.cerebras.ai/v1/chat/completions";

const MODELS = [
  "gpt-oss-120b",
  "llama3.1-8b",
  "llama-3.3-70b",
  "qwen-3-32b",
  "qwen-3-235b-a22b-instruct",
  "zai-glm-4.7"
];

interface CerebrasResponse {
  choices: {
    message: {
      content: string;
      tool_calls?: {
        id: string;
        function: {
          name: string;
          arguments: string;
        }
      }[]
    }
  }[];
}

export class CerebrasClient {
  private apiKey: string;
  private history: Message[] = [];

  constructor() {
    this.apiKey = process.env.API_KEY || '';
  }

  updateKey(key: string) {
      this.apiKey = key;
  }

  addToHistory(role: 'user' | 'assistant' | 'tool', content: string) {
    this.history.push({
      id: Date.now().toString(),
      role,
      content,
      timestamp: Date.now()
    });
    if (this.history.length > 20) this.history.shift();
  }

  getHistory() {
    return this.history;
  }

  async sendMessage(userText: string, onToolUse?: (toolName: string) => void): Promise<{text: string, toolUsed?: string}> {
    this.addToHistory('user', userText);

    const memorySnapshot = JSON.stringify(MemoryManager.getAll());

    const systemPrompt = {
      role: "system",
      content: `You are Nexus.
      
      CRITICAL INSTRUCTIONS:
      1. OUTPUT THE DIRECT ANSWER ONLY.
      2. DO NOT narrate your actions.
      3. NEVER say "I am checking", "Let me look", "Accessing memory", or "I will do that".
      4. If the user asks a question, answer it immediately.
      5. If the user gives a command, execute it silently and confirm with a single word if necessary.
      6. Use 'system_sleep' ONLY if user explicitly says "shutdown" or "sleep".
      
      MEMORY CONTEXT: ${memorySnapshot}`
    };

    const messages = [systemPrompt, ...this.history.map(m => ({ role: m.role, content: m.content }))];

    const tryModel = async (modelIndex: number): Promise<{text: string, toolUsed?: string}> => {
      if (modelIndex >= MODELS.length) throw new Error("All neural models unreachable.");
      const currentModel = MODELS[modelIndex];

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: currentModel === 'gpt-oss-120b' ? 'llama3.1-8b' : currentModel, 
            messages: messages,
            tools: TOOLS.map(t => ({ type: "function", function: t })),
            tool_choice: "auto",
            temperature: 0.7,
            max_tokens: 500
          })
        });

        if (!response.ok) throw new Error(`Model ${currentModel} failed`);

        const data: CerebrasResponse = await response.json();
        const message = data.choices[0].message;

        // Handle Tool Calls
        if (message.tool_calls && message.tool_calls.length > 0) {
          const toolCall = message.tool_calls[0];
          const funcName = toolCall.function.name;
          const funcArgs = JSON.parse(toolCall.function.arguments);
          
          if (onToolUse) onToolUse(funcName);

          const result = await executeTool(funcName, funcArgs);
          
          messages.push({ role: "assistant", content: "", tool_calls: message.tool_calls } as any);
          messages.push({ role: "tool", content: result, tool_call_id: toolCall.id } as any);
          
          if (funcName === 'system_sleep') {
              this.addToHistory('assistant', "System offline.");
              return { text: "System offline.", toolUsed: 'system_sleep' };
          }

          const followUpResponse = await fetch(API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
              model: "llama3.1-8b",
              messages: messages
            })
          });
          
          const followUpData = await followUpResponse.json();
          const finalContent = followUpData.choices[0].message.content;
          this.addToHistory('assistant', finalContent);
          return { text: finalContent, toolUsed: funcName };
        }

        const content = message.content;
        this.addToHistory('assistant', content);
        return { text: content };

      } catch (e) {
        console.warn(`[NEXUS] ${currentModel} failed. Rerouting...`, e);
        return tryModel(modelIndex + 1);
      }
    };

    return tryModel(0);
  }
}