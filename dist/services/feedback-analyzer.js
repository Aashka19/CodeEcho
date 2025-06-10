"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackAnalyzer = void 0;
const teams_ai_1 = require("@microsoft/teams-ai");
const openai_1 = __importDefault(require("openai"));
const prompt_templates_1 = require("./prompt-templates");
class FeedbackAnalyzer {
    constructor() {
        console.log('FeedbackAnalyzer constructor: Initializing...');
        // Initialize OpenAI client
        if (process.env.OPENAI_API_KEY) {
            try {
                console.log('FeedbackAnalyzer constructor: Attempting to initialize OpenAI client...');
                this.openAIClient = new openai_1.default({
                    apiKey: process.env.OPENAI_API_KEY
                });
                console.log('FeedbackAnalyzer constructor: OpenAI client initialized successfully.');
            }
            catch (e) {
                console.error('FeedbackAnalyzer constructor: FAILED to initialize OpenAI client.', e);
                throw new Error(`Failed to initialize OpenAI client: ${e.message}`);
            }
        }
        else {
            console.error('FeedbackAnalyzer constructor: OPENAI_API_KEY is missing.');
            throw new Error('OPENAI_API_KEY must be provided');
        }
        // Initialize Teams AI Application
        this.app = new teams_ai_1.Application({
            storage: {
                read: async (keys) => {
                    const items = {};
                    for (const key of keys) {
                        items[key] = {
                            conversation: {
                                feedback: { feedback: [] }
                            }
                        };
                    }
                    return items;
                },
                write: async () => { },
                delete: async () => { }
            }
        });
    }
    getPromptTemplate(type) {
        switch (type) {
            case 'bug':
                return prompt_templates_1.bugAnalysisPrompt;
            case 'feature':
                return prompt_templates_1.featureRequestPrompt;
            case 'sentiment':
                return prompt_templates_1.sentimentAnalysisPrompt;
            default:
                return prompt_templates_1.feedbackAnalysisPrompt;
        }
    }
    prepareFeedbackText(feedback) {
        if (typeof feedback === 'string') {
            return feedback;
        }
        // Handle different feedback formats
        const title = feedback.title || 'No Title Provided';
        const body = feedback.body && feedback.body.trim() ? feedback.body.trim() : 'No Body Content Provided';
        if (title !== 'No Title Provided' || body !== 'No Body Content Provided') {
            return `Title: ${title}\n\nDescription: ${body}`;
        }
        // If both title and body are essentially empty, try to use content or stringify
        if (feedback.content) {
            return feedback.content;
        }
        // Fallback if all else fails, ensuring it's not an empty object stringification
        const stringified = JSON.stringify(feedback, null, 2);
        return stringified === '{}' ? 'No meaningful content found in feedback item.' : stringified;
    }
    async analyzeFeedback(feedback, type = 'general', source = 'unknown') {
        try {
            // Select appropriate prompt template
            const promptTemplate = this.getPromptTemplate(type);
            // Prepare the feedback text
            const feedbackText = this.prepareFeedbackText(feedback);
            // Replace placeholders in template
            const userMessage = promptTemplate.userMessageTemplate
                .replace('{{feedback}}', feedbackText)
                .replace('{{source}}', source);
            console.log('---- Preparing to send to OpenAI ----');
            console.log('Feedback Item Received:', JSON.stringify(feedback, null, 2));
            console.log('Prepared Feedback Text:', feedbackText);
            console.log('Prompt Type:', type);
            console.log('Source:', source);
            console.log('System Message:', promptTemplate.systemMessage);
            console.log('User Message for OpenAI:', userMessage);
            console.log('-------------------------------------');
            if (!this.openAIClient) {
                throw new Error('OpenAI client not initialized');
            }
            // Use OpenAI API for analysis
            const response = await this.openAIClient.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: promptTemplate.systemMessage
                    },
                    {
                        role: "user",
                        content: userMessage
                    }
                ],
                temperature: 0.3,
                max_tokens: 1000
            });
            // Parse the analysis result
            const analysis = this.parseAnalysisResponse(response.choices[0].message.content || '');
            // Store the analysis result
            const result = {
                feedback: feedbackText,
                analysis,
                timestamp: new Date().toISOString(),
                type
            };
            return result;
        }
        catch (error) {
            console.error('Error analyzing feedback:', error);
            throw error;
        }
    }
    parseAnalysisResponse(content) {
        try {
            // Try to parse as JSON first
            return JSON.parse(content);
        }
        catch {
            // If not JSON, create a structured format
            const lines = content.split('\n');
            const analysis = {};
            let currentSection = '';
            for (const line of lines) {
                if (line.startsWith('-')) {
                    const [key, ...values] = line.substring(1).split(':').map(s => s.trim());
                    if (values.length > 0) {
                        analysis[key.toLowerCase().replace(/\s+/g, '_')] = values.join(':').trim();
                    }
                    else {
                        currentSection = key.toLowerCase().replace(/\s+/g, '_');
                        analysis[currentSection] = [];
                    }
                }
                else if (line.trim() && currentSection) {
                    analysis[currentSection].push(line.trim());
                }
            }
            return analysis;
        }
    }
    async batchAnalyzeFeedback(feedbackItems, type = 'general') {
        return Promise.all(feedbackItems.map(item => this.analyzeFeedback(item, type, item.source || 'unknown')));
    }
}
exports.FeedbackAnalyzer = FeedbackAnalyzer;
