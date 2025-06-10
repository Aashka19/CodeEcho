import { ConfigurationServiceClientCredentialFactory, MemoryStorage, TurnContext } from 'botbuilder';
import { Application } from '@microsoft/teams-ai';
import { MCPConfig } from './mcp.config';

export interface TeamsConfig {
  botId: string;
  botPassword: string;
  tenantId?: string;
}

export function createTeamsConfig(): TeamsConfig {
  return {
    botId: process.env.TEAMS_BOT_ID || '',
    botPassword: process.env.TEAMS_BOT_PASSWORD || '',
    tenantId: process.env.TEAMS_TENANT_ID
  };
}

export function createCredentialFactory(config: TeamsConfig) {
  return new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: config.botId,
    MicrosoftAppPassword: config.botPassword,
    MicrosoftAppTenantId: config.tenantId
  });
}

export function createStorage() {
  // For production, replace with persistent storage
  return new MemoryStorage();
}

export async function handleTeamsVerification(context: TurnContext) {
  // Handle Teams message verification
  if (context.activity.type === 'invoke' && context.activity.name === 'verify') {
    return {
      status: 200,
      body: {
        activity: {
          type: 'message',
          text: 'Teams MCP Bot verification successful'
        }
      }
    };
  }
  return undefined;
} 