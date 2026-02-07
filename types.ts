export enum AppMode {
  LIVE_DEMO = 'LIVE_DEMO',
  BLUEPRINT = 'BLUEPRINT'
}

export interface AudioStreamConfig {
  sampleRate: number;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';