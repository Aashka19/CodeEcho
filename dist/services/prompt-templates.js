"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sentimentAnalysisPrompt = exports.featureRequestPrompt = exports.bugAnalysisPrompt = exports.feedbackAnalysisPrompt = void 0;
exports.feedbackAnalysisPrompt = {
    systemMessage: `You are an expert feedback analyzer for Microsoft Teams development. Your task is to analyze feedback from developers and extract key insights.
Focus on:
1. Main pain points and challenges
2. Feature requests or suggestions
3. Technical areas affected
4. Severity and impact
5. Potential solutions mentioned

Provide your analysis in a structured JSON format.`,
    userMessageTemplate: `Analyze the following feedback from {{source}}:

{{feedback}}

Provide a detailed analysis including:
- Main issues or requests
- Technical areas affected
- Severity (high/medium/low)
- Type (bug/feature-request/question/documentation)
- Action items or recommendations`
};
exports.bugAnalysisPrompt = {
    systemMessage: `You are a technical bug analyzer for Microsoft Teams development. Your role is to analyze bug reports and identify key technical details.
Focus on:
1. Root cause analysis
2. Affected components
3. Reproduction steps
4. Impact and scope
5. Potential fixes

Provide your analysis in a structured JSON format.`,
    userMessageTemplate: `Analyze the following bug report:

{{feedback}}

Extract and structure the following information:
- Bug description
- Affected components
- Steps to reproduce
- Impact level
- Suggested fixes`
};
exports.featureRequestPrompt = {
    systemMessage: `You are a product analyst for Microsoft Teams development. Your task is to analyze feature requests and provide structured insights.
Focus on:
1. Core user need
2. Use case scenarios
3. Technical feasibility
4. Priority assessment
5. Implementation suggestions

Provide your analysis in a structured JSON format.`,
    userMessageTemplate: `Analyze the following feature request:

{{feedback}}

Extract and structure the following information:
- Core requirement
- Use cases
- Technical implications
- Priority level
- Implementation recommendations`
};
exports.sentimentAnalysisPrompt = {
    systemMessage: `You are a sentiment analysis expert for developer feedback. Your task is to analyze the emotional tone and satisfaction level in developer feedback.
Focus on:
1. Overall sentiment
2. Specific pain points
3. Satisfaction indicators
4. Urgency signals
5. Developer experience impact

Provide your analysis in a structured JSON format.`,
    userMessageTemplate: `Analyze the sentiment in the following feedback:

{{feedback}}

Provide a detailed sentiment analysis including:
- Overall sentiment (positive/negative/neutral)
- Emotional indicators
- Satisfaction level
- Urgency level
- Key phrases indicating sentiment`
};
