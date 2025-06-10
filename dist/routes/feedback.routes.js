"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mcp_service_1 = require("../services/mcp.service");
const mcp_config_1 = require("../config/mcp.config");
const enhanced_feedback_analyzer_1 = require("../services/enhanced-feedback-analyzer");
const router = express_1.default.Router();
const mcpService = new mcp_service_1.MCPService((0, mcp_config_1.createMCPConfig)());
const feedbackAnalyzer = new enhanced_feedback_analyzer_1.EnhancedFeedbackAnalyzer();
// In-memory store for analyses
const storedAnalyses = [];
// View stored analyses endpoint
router.get('/analyses/view', (req, res) => {
    try {
        const analyses = storedAnalyses.slice(-10); // Get last 10 analyses
        res.json({
            success: true,
            message: 'Stored analyses retrieved successfully',
            data: {
                total: analyses.length,
                analyses: analyses
            }
        });
    }
    catch (error) {
        console.error('Error retrieving stored analyses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve stored analyses',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// GET endpoint for analyzing specific feedback text
router.get('/analyze/text', async (req, res) => {
    try {
        const { text, type = 'general' } = req.query;
        if (!text) {
            throw new Error('Text parameter is required for analysis');
        }
        // Validate type parameter
        const feedbackType = (type === 'bug' || type === 'feature' || type === 'sentiment')
            ? type
            : 'general';
        const analysis = await feedbackAnalyzer.analyzeFeedback({
            title: "User Provided Feedback",
            body: text,
            source: 'user'
        }, feedbackType);
        // Store the analysis
        storedAnalyses.push(analysis);
        res.status(200).json({
            success: true,
            message: 'Feedback analyzed successfully',
            type: feedbackType,
            data: analysis
        });
    }
    catch (error) {
        console.error('Error analyzing feedback:', error);
        res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// GET endpoint for analyzing feedback from sources
router.get('/analyze', async (req, res) => {
    try {
        const type = req.query.type || 'general';
        const source = req.query.source || 'all';
        const limit = parseInt(req.query.limit) || 5;
        console.log(`Fetching real feedback for analysis - Type: ${type}, Source: ${source}, Limit: ${limit}`);
        let feedbackToAnalyze = [];
        if (source === 'github' || source === 'all') {
            const githubFeedback = await mcpService.ingestGitHubFeedback(limit);
            console.log(`Fetched ${githubFeedback.length} GitHub items`);
            feedbackToAnalyze.push(...githubFeedback.map((item) => ({
                title: item.title,
                body: item.body || '',
                source: 'github',
                number: item.number,
                state: item.state,
                url: item.url,
                created_at: item.created_at,
                updated_at: item.updated_at,
                labels: item.labels
            })));
        }
        if (source === 'stackoverflow' || source === 'all') {
            const stackoverflowFeedback = await mcpService.ingestStackOverflowFeedback(['microsoft-teams', 'teams-apps', 'teams-development'], limit);
            console.log(`Fetched ${stackoverflowFeedback.length} Stack Overflow items`);
            feedbackToAnalyze.push(...stackoverflowFeedback.map((item) => ({
                title: item.title,
                body: item.body || '',
                source: 'stackoverflow',
                tags: item.tags,
                link: item.link,
                score: item.score,
                view_count: item.view_count,
                answer_count: item.answer_count,
                creation_date: item.creation_date,
                question_id: item.question_id
            })));
        }
        if (feedbackToAnalyze.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No feedback found from specified sources',
                data: {
                    type,
                    source,
                    total_items: 0,
                    analysis: []
                }
            });
        }
        console.log(`Analyzing ${feedbackToAnalyze.length} feedback items...`);
        const analysisResults = await feedbackAnalyzer.batchAnalyzeFeedback(feedbackToAnalyze, type);
        // Store the successful analyses
        storedAnalyses.push(...analysisResults);
        res.json({
            success: true,
            message: 'Feedback analyzed successfully',
            data: {
                type,
                source,
                total_items: analysisResults.length,
                github_items: feedbackToAnalyze.filter(item => item.source === 'github').length,
                stackoverflow_items: feedbackToAnalyze.filter(item => item.source === 'stackoverflow').length,
                analysis: analysisResults
            }
        });
    }
    catch (error) {
        console.error('Error in feedback analysis endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze feedback',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
