"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTeamsConfig = createTeamsConfig;
exports.createCredentialFactory = createCredentialFactory;
exports.createStorage = createStorage;
exports.handleTeamsVerification = handleTeamsVerification;
const botbuilder_1 = require("botbuilder");
function createTeamsConfig() {
    return {
        botId: process.env.TEAMS_BOT_ID || '',
        botPassword: process.env.TEAMS_BOT_PASSWORD || '',
        tenantId: process.env.TEAMS_TENANT_ID
    };
}
function createCredentialFactory(config) {
    return new botbuilder_1.ConfigurationServiceClientCredentialFactory({
        MicrosoftAppId: config.botId,
        MicrosoftAppPassword: config.botPassword,
        MicrosoftAppTenantId: config.tenantId
    });
}
function createStorage() {
    // For production, replace with persistent storage
    return new botbuilder_1.MemoryStorage();
}
async function handleTeamsVerification(context) {
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
