"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMCPConfig = createMCPConfig;
function createMCPConfig() {
    return {
        githubToken: process.env.GITHUB_TOKEN,
        stackOverflowKey: process.env.STACKOVERFLOW_KEY,
        openaiKey: process.env.OPENAI_API_KEY
    };
}
