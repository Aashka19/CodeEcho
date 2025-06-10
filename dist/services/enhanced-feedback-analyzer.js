"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedFeedbackAnalyzer = void 0;
const teams_ai_1 = require("@microsoft/teams-ai");
const openai_1 = require("@azure/openai");
const openai_2 = __importDefault(require("openai"));
class EnhancedFeedbackAnalyzer {
    constructor() {
        this.retryAttempts = 3;
        this.retryDelay = 1000; // ms
        console.log('EnhancedFeedbackAnalyzer: Initializing...');
        // Initialize AI clients based on available credentials
        this.useAzure = !!process.env.AZURE_OPENAI_KEY;
        if (this.useAzure) {
            this.initializeAzureAI();
        }
        else {
            this.initializeOpenAI();
        }
        // Initialize Teams AI Application with enhanced configuration
        this.app = new teams_ai_1.Application({
            storage: this.createStorage(),
            ai: {
                planner: {
                    model: process.env.AI_MODEL || 'gpt-4',
                    defaultPrompt: this.createDefaultPrompt()
                }
            }
        });
        this.setupTeamsHandlers();
    }
    initializeAzureAI() {
        try {
            const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
            const key = process.env.AZURE_OPENAI_KEY;
            if (!endpoint || !key) {
                throw new Error('Azure OpenAI credentials not properly configured');
            }
            this.azureAIClient = new openai_1.OpenAIClient(endpoint, new openai_1.AzureKeyCredential(key));
            console.log('Azure OpenAI client initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize Azure OpenAI client:', error);
            throw error;
        }
    }
    initializeOpenAI() {
        try {
            if (!process.env.OPENAI_API_KEY) {
                throw new Error('OpenAI API key not configured');
            }
            this.openAIClient = new openai_2.default({
                apiKey: process.env.OPENAI_API_KEY
            });
            console.log('OpenAI client initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize OpenAI client:', error);
            throw error;
        }
    }
    createStorage() {
        return {
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
        };
    }
    createDefaultPrompt() {
        return {
            systemMessage: `You are an advanced feedback analysis system for Microsoft Teams development.
Your task is to analyze developer feedback and extract detailed insights using the following framework:

1. PROBLEM IDENTIFICATION
- Identify core issues/requests
- Categorize feedback type
- Assess severity and impact

2. TECHNICAL ANALYSIS
- Identify affected components
- Analyze technical dependencies
- Evaluate implementation complexity

3. USER IMPACT
- Assess user experience impact
- Identify affected user segments
- Evaluate business impact

4. ACTIONABLE INSIGHTS
- Provide specific recommendations
- Suggest implementation approaches
- Identify potential risks

Provide your analysis in a structured JSON format that includes confidence scores and metadata.`,
            userMessageTemplate: `Analyze the following feedback with high attention to detail:

FEEDBACK SOURCE: {{source}}
TITLE: {{title}}
DESCRIPTION: {{body}}

Provide a comprehensive analysis including:
1. Main problem/request identification
2. Technical impact assessment
3. User experience implications
4. Actionable recommendations
5. Priority and severity assessment`
        };
    }
    setupTeamsHandlers() {
        // Handle feedback analysis requests
        this.app.message('/analyze', async (context, state) => {
            const feedbackText = context.activity.text;
            const analysis = await this.analyzeFeedback({
                title: 'Teams Message Feedback',
                body: feedbackText,
                source: 'teams'
            });
            await context.sendActivity({
                type: 'message',
                text: `Analysis Results:\n${JSON.stringify(analysis, null, 2)}`
            });
        });
    }
    async analyzeFeedback(feedback, type = 'general') {
        const startTime = Date.now();
        try {
            const result = await this.retryOperation(async () => {
                if (this.useAzure) {
                    return await this.analyzeWithAzure(feedback, type);
                }
                else {
                    return await this.analyzeWithOpenAI(feedback, type);
                }
            });
            return {
                ...result,
                metadata: {
                    ...result.metadata,
                    processingTime: Date.now() - startTime
                }
            };
        }
        catch (error) {
            console.error('Error analyzing feedback:', error);
            throw error;
        }
    }
    async retryOperation(operation) {
        let lastError;
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (attempt < this.retryAttempts) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
                }
            }
        }
        throw lastError;
    }
    async analyzeWithAzure(feedback, type) {
        if (!this.azureAIClient) {
            throw new Error('Azure OpenAI client not initialized');
        }
        const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';
        const prompt = this.createAnalysisPrompt(feedback, type);
        const response = await this.azureAIClient.getCompletions(deploymentName, [prompt], {
            maxTokens: 800,
            temperature: 0.3,
            topP: 0.95,
            frequencyPenalty: 0.5,
            presencePenalty: 0.5,
            stop: ['```']
        });
        return this.parseAnalysisResponse(response.choices[0].text, type, feedback.source);
    }
    async analyzeWithOpenAI(feedback, type) {
        if (!this.openAIClient) {
            throw new Error('OpenAI client not initialized');
        }
        const prompt = this.createAnalysisPrompt(feedback, type);
        const response = await this.openAIClient.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4',
            messages: [
                { role: 'system', content: this.createDefaultPrompt().systemMessage },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 800,
            top_p: 0.95,
            frequency_penalty: 0.5,
            presence_penalty: 0.5
        });
        return this.parseAnalysisResponse(response.choices[0].message.content || '', type, feedback.source, {
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0
        });
    }
    createAnalysisPrompt(feedback, type) {
        const template = this.createDefaultPrompt().userMessageTemplate;
        return template
            .replace('{{source}}', feedback.source)
            .replace('{{title}}', feedback.title)
            .replace('{{body}}', feedback.body);
    }
    parseAnalysisResponse(response, type, source, usage) {
        try {
            const parsedResponse = JSON.parse(response);
            return {
                type: type,
                source,
                confidence: parsedResponse.confidence || 0.8,
                analysis: {
                    mainPoints: parsedResponse.mainPoints || [],
                    technicalAreas: parsedResponse.technicalAreas || [],
                    severity: parsedResponse.severity || 'medium',
                    actionItems: parsedResponse.actionItems || [],
                    ...parsedResponse
                },
                metadata: {
                    processingTime: 0, // Will be set by the calling function
                    modelUsed: this.useAzure ? 'azure' : 'openai',
                    promptTokens: usage?.promptTokens || 0,
                    completionTokens: usage?.completionTokens || 0
                }
            };
        }
        catch (error) {
            console.error('Error parsing analysis response:', error);
            throw new Error('Failed to parse analysis response');
        }
    }
    async batchAnalyzeFeedback(feedbackItems, type = 'general') {
        return Promise.all(feedbackItems.map(item => this.analyzeFeedback(item, type)));
    }
}
exports.EnhancedFeedbackAnalyzer = EnhancedFeedbackAnalyzer;
