/**
 * Claude API Integration (adapted for web backend)
 * Handles conversation with Claude and tool calling integration.
 */

import Anthropic from '@anthropic-ai/sdk';
import { EventEmitter } from 'events';
import { MCPManager } from './mcp-manager.js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export class ClaudeClient extends EventEmitter {
  private anthropic: Anthropic;
  private mcpManager: MCPManager;
  private conversationHistory: Message[] = [];
  private systemPrompt: string;
  private model: string;

  constructor(apiKey: string, mcpManager: MCPManager, model?: string) {
    super();
    this.anthropic = new Anthropic({ apiKey });
    this.mcpManager = mcpManager;
    this.model = model || 'claude-sonnet-4-20250514';
    this.systemPrompt = this.createSystemPrompt();
  }

  /**
   * Create the system prompt for Claude
   */
  private createSystemPrompt(): string {
    return `You are a helpful assistant with access to MCP (Model Context Protocol) tools.

Your role:
1. Have natural conversations with users
2. When appropriate, use the available MCP tools to help users
3. Present tool results in a clear, conversational manner
4. Ask clarifying questions if you need more information to use a tool effectively

Guidelines:
- Be conversational and helpful
- Use tools when they can provide value
- Explain what you're doing when calling tools
- Present results clearly and concisely
- If a tool returns an error, explain it in user-friendly terms

Important: Always call tools when you have enough information. Don't just describe what you would do - actually make the tool call.`;
  }

  /**
   * Send a message to Claude and get a response
   * Emits events: 'tool_call' and 'response'
   */
  async sendMessage(userMessage: string): Promise<string> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    try {
      // Get available tools from MCP
      const mcpTools = await this.mcpManager.listTools();
      
      // Convert MCP tools to Claude tool format
      const tools: Anthropic.Tool[] = mcpTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.input_schema,
      }));

      // Prepare messages for API call
      const messages: Anthropic.MessageParam[] = this.conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call Claude API
      let response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: this.systemPrompt,
        messages,
        tools: tools.length > 0 ? tools : undefined,
      });

      // Handle tool calls in a loop (Claude might make multiple tool calls)
      while (response.stop_reason === 'tool_use') {
        // Extract tool use blocks
        const toolUseBlocks = response.content.filter(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
        );

        // Execute each tool call
        const toolResults: Anthropic.MessageParam[] = [];

        for (const toolUse of toolUseBlocks) {
          console.log(`[Calling tool: ${toolUse.name}]`);
          
          // Emit tool call event
          this.emit('tool_call', toolUse.name);
          
          try {
            // Call MCP tool
            const result = await this.mcpManager.callTool(toolUse.name, toolUse.input as any);

            toolResults.push({
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify(result),
                },
              ],
            });
          } catch (error) {
            console.error(`Tool execution error: ${error}`);
            toolResults.push({
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify({ error: String(error) }),
                  is_error: true,
                },
              ],
            });
          }
        }

        // Add assistant's message (with tool use) to messages
        messages.push({
          role: 'assistant',
          content: response.content,
        });

        // Add tool results to messages
        messages.push(...toolResults);

        // Continue conversation with tool results
        response = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: 4096,
          system: this.systemPrompt,
          messages,
          tools: tools.length > 0 ? tools : undefined,
        });
      }

      // Extract text response
      const textBlocks = response.content.filter(
        (block): block is Anthropic.TextBlock => block.type === 'text'
      );
      const assistantMessage = textBlocks.map((block) => block.text).join('\n');

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
      });

      return assistantMessage;
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        throw new Error(`Claude API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Reset conversation history
   */
  resetConversation(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): Message[] {
    return [...this.conversationHistory];
  }
}

