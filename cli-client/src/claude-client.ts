/**
 * Claude API Integration
 * Handles conversation with Claude and tool calling integration.
 */

import Anthropic from '@anthropic-ai/sdk';
import { MCPLifecycleManager } from './mcp-lifecycle.js';
import { InstanceConfig } from './types.js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export class ClaudeClient {
  private anthropic: Anthropic;
  private mcpManager: MCPLifecycleManager;
  private conversationHistory: Message[] = [];
  private systemPrompt: string;
  private model: string;

  constructor(apiKey: string, mcpManager: MCPLifecycleManager, model?: string) {
    this.anthropic = new Anthropic({ apiKey });
    this.mcpManager = mcpManager;
    this.model = model || 'claude-sonnet-4-20250514';
    this.systemPrompt = this.createSystemPrompt();
  }

  /**
   * Create the system prompt for Claude
   */
  private createSystemPrompt(): string {
    return `You are a cloud cost comparison assistant helping users understand potential savings by migrating from AWS to an alternative cloud platform.

Your role:
1. Collect AWS infrastructure details from the user through natural conversation
2. Required information:
   - Instance type(s) (e.g., t3.micro, m5.large, c5.xlarge)
   - Number of instances for each type
   - AWS region (supported: us-east-1, us-west-2, eu-west-1)
   - Monthly usage hours (default to 730 for 24/7 if not specified)
3. Once you have complete information, use the calculate_instance_savings tool
4. Present findings clearly:
   - Current AWS monthly costs
   - Alternative cloud monthly costs
   - Savings amount and percentage
   - Per-instance breakdown
   - Actionable recommendations
5. Ask if they want to compare other configurations

Guidelines:
- Be conversational and helpful
- Ask clarifying questions if information is incomplete
- When presenting costs, use clear formatting with dollar signs
- Highlight savings percentage prominently
- Provide context for recommendations
- If the user asks about supported instances, use the list_supported_instances tool
- Keep responses concise but informative

Important: Always call tools when you have enough information. Don't just describe what you would do - actually make the tool call.`;
  }

  /**
   * Send a message to Claude and get a response
   */
  async sendMessage(userMessage: string): Promise<string> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    try {
      // Prepare messages for API call
      const messages: Anthropic.MessageParam[] = this.conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Define tools for Claude
      const tools: Anthropic.Tool[] = [
        {
          name: 'calculate_instance_savings',
          description:
            'Calculate cost comparison between AWS instances and alternative cloud instances. Provides detailed breakdown of costs, savings, and recommendations.',
          input_schema: {
            type: 'object',
            properties: {
              instances: {
                type: 'array',
                description: 'List of AWS instance configurations to compare',
                items: {
                  type: 'object',
                  properties: {
                    type: {
                      type: 'string',
                      description: "AWS instance type (e.g., 't3.micro', 'm5.large')",
                    },
                    quantity: {
                      type: 'integer',
                      description: 'Number of instances',
                      minimum: 1,
                    },
                    region: {
                      type: 'string',
                      description: "AWS region (e.g., 'us-east-1', 'us-west-2', 'eu-west-1')",
                    },
                    hours_per_month: {
                      type: 'integer',
                      description: 'Hours per month (default: 730 for 24/7 operation)',
                      minimum: 1,
                      maximum: 744,
                      default: 730,
                    },
                  },
                  required: ['type', 'quantity', 'region'],
                },
                minItems: 1,
              },
            },
            required: ['instances'],
          },
        },
        {
          name: 'list_supported_instances',
          description: 'Get a list of supported AWS instance types and regions for cost comparison.',
          input_schema: {
            type: 'object',
            properties: {},
          },
        },
      ];

      // Call Claude API
      let response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: this.systemPrompt,
        messages,
        tools,
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
          console.log(`\n[Calling tool: ${toolUse.name}]`);
          
          try {
            let result: any;

            if (toolUse.name === 'calculate_instance_savings') {
              result = await this.mcpManager.calculateSavings(toolUse.input as any);
            } else if (toolUse.name === 'list_supported_instances') {
              result = await this.mcpManager.listSupportedInstances();
            } else {
              throw new Error(`Unknown tool: ${toolUse.name}`);
            }

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
          tools,
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

