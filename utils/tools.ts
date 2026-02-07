import { ToolDefinition } from "../types";
import { MemoryManager } from "./memory";

export const TOOLS: ToolDefinition[] = [
  {
    name: "get_current_time",
    description: "Get the current local time and date.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "system_diagnostic",
    description: "Run a full system diagnostic scan on the mobile device infrastructure.",
    parameters: {
      type: "object",
      properties: {
        scan_type: { type: "string", enum: ["quick", "full", "network"] },
      },
    },
  },
  {
    name: "calculator",
    description: "Perform mathematical calculations.",
    parameters: {
      type: "object",
      properties: {
        expression: { type: "string", description: "The mathematical expression to evaluate" },
      },
      required: ["expression"],
    },
  },
  {
    name: "search_knowledge_base",
    description: "Search the internal encrypted knowledge base for data.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    },
  },
  {
    name: "memorize",
    description: "Store a piece of information in long-term memory.",
    parameters: {
      type: "object",
      properties: {
        key: { type: "string", description: "The concept or topic to remember (e.g., 'user_name', 'favorite_color')" },
        value: { type: "string", description: "The detail to store" }
      },
      required: ["key", "value"]
    }
  },
  {
    name: "recall",
    description: "Retrieve information from long-term memory.",
    parameters: {
      type: "object",
      properties: {
        key: { type: "string", description: "The concept or topic to recall" }
      },
      required: ["key"]
    }
  },
  {
    name: "system_sleep",
    description: "Enter low-power sleep mode. Use this when the user says 'shutdown' or 'sleep'.",
    parameters: {
      type: "object",
      properties: {},
    }
  }
];

export const executeTool = async (name: string, args: any): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 500)); 

  switch (name) {
    case "get_current_time":
      return new Date().toLocaleString();
    
    case "system_diagnostic":
      return JSON.stringify({
        status: "OPTIMAL",
        cpu_load: "12%",
        memory: "4.2GB / 8GB",
        battery: "88%",
        network: "SECURE_TUNNEL_ACTIVE",
        threats_detected: 0
      });

    case "calculator":
      try {
        return String(Function('"use strict";return (' + args.expression + ')')());
      } catch (e) {
        return "Error evaluating expression";
      }

    case "search_knowledge_base":
      return `[FOUND RECORD]: Johan is the Supreme Architect and Creator of the Nexus System. Access Level: OMNI.`;

    case "memorize":
      return MemoryManager.set(args.key, args.value);

    case "recall":
      return MemoryManager.get(args.key);

    case "system_sleep":
      return "SLEEP_PROTOCOL_INITIATED";

    default:
      return "Tool execution failed: Unknown tool.";
  }
};