export enum AppMode {
  LIVE_DEMO = 'LIVE_DEMO',
  BLUEPRINT = 'BLUEPRINT'
}

export type ConnectionState = 'disconnected' | 'listening' | 'processing' | 'speaking' | 'error' | 'idle' | 'sleeping';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  metadata?: any;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}