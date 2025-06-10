# Community Insights API

A powerful feedback analysis system for Microsoft Teams development that leverages AI to extract insights from GitHub issues and Stack Overflow questions.

## Features

- AI-driven feedback analysis using Teams AI Library
- Support for both OpenAI and Azure OpenAI models
- Real-time feedback ingestion from GitHub and Stack Overflow
- Detailed technical analysis and actionable insights
- Sentiment analysis and priority assessment
- Batch processing capabilities

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- OpenAI API key or Azure OpenAI subscription
- GitHub access token (for GitHub integration)
- Stack Overflow API key (for Stack Overflow integration)

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd community-insights-api
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
# Create .env file from template
cp .env.template .env

# Edit .env file with your credentials:
# - OPENAI_API_KEY or Azure OpenAI credentials
# - GitHub token
# - Stack Overflow API key
# - Teams bot credentials (if using Teams integration)
```

4. Build the project:
```bash
npm run build
```

5. Start the server:
```bash
npm start
```

The server will start on port 3000 (configurable via PORT environment variable).

## API Documentation

### Base URL
```
http://localhost:3000/api/feedback
```

### Endpoints

#### 1. Analyze Text
Analyze specific text for insights.

```http
GET /analyze/text
```

Query Parameters:
- `text` (required): The text to analyze
- `type` (optional): Analysis type ('bug', 'feature', 'sentiment', 'general')

Example:
```bash
curl "http://localhost:3000/api/feedback/analyze/text?text=Users%20are%20experiencing%20authentication%20issues&type=bug"
```

#### 2. Analyze Feedback from Sources
Fetch and analyze feedback from GitHub and/or Stack Overflow.

```http
GET /analyze
```

Query Parameters:
- `type` (optional): Analysis type ('bug', 'feature', 'sentiment', 'general')
- `source` (optional): Source to analyze ('github', 'stackoverflow', 'all')
- `limit` (optional): Number of items to fetch (default: 5)

Example:
```bash
curl "http://localhost:3000/api/feedback/analyze?source=github&type=bug&limit=10"
```

#### 3. View Stored Analyses
Retrieve recently stored analyses.

```http
GET /analyses/view
```

Example:
```bash
curl "http://localhost:3000/api/feedback/analyses/view"
```

### Response Format

All endpoints return responses in the following format:

```json
{
  "success": true,
  "message": "Operation description",
  "data": {
    // Response data specific to each endpoint
  }
}
```

#### Analysis Result Structure
```json
{
  "type": "bug | feature | sentiment | general",
  "source": "github | stackoverflow | user",
  "confidence": 0.95,
  "analysis": {
    "mainPoints": ["point1", "point2"],
    "technicalAreas": ["area1", "area2"],
    "severity": "high | medium | low",
    "actionItems": ["action1", "action2"]
  },
  "metadata": {
    "processingTime": 1234,
    "modelUsed": "openai | azure",
    "promptTokens": 100,
    "completionTokens": 150
  }
}
```

## Environment Variables

Required variables in `.env` file:

```env
# Server Configuration
PORT=3000

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4  # or gpt-3.5-turbo

# Azure OpenAI Configuration (Optional)
AZURE_OPENAI_KEY=your_azure_openai_key_here
AZURE_OPENAI_ENDPOINT=your_azure_endpoint_here
AZURE_OPENAI_DEPLOYMENT=your_deployment_name_here

# Teams Configuration
TEAMS_BOT_ID=your_bot_id_here
TEAMS_BOT_PASSWORD=your_bot_password_here
TEAMS_TENANT_ID=your_tenant_id_here

# Stack Overflow Configuration
STACK_OVERFLOW_KEY=your_stackoverflow_key_here

# GitHub Configuration
GITHUB_TOKEN=your_github_token_here
```

## Testing the API

1. Start the server:
```bash
npm start
```

2. Test basic connectivity:
```bash
curl http://localhost:3000/
# Should return: {"message": "Welcome to Community Insights API"}
```

3. Test text analysis:
```bash
curl "http://localhost:3000/api/feedback/analyze/text?text=Users%20are%20experiencing%20authentication%20issues%20in%20Teams%20tab&type=bug"
```

4. Test GitHub feedback analysis:
```bash
curl "http://localhost:3000/api/feedback/analyze?source=github&type=bug&limit=5"
```

5. Test Stack Overflow feedback analysis:
```bash
curl "http://localhost:3000/api/feedback/analyze?source=stackoverflow&type=general&limit=5"
```

6. View stored analyses:
```bash
curl "http://localhost:3000/api/feedback/analyses/view"
```

## Error Handling

The API returns appropriate HTTP status codes:
- 200: Success
- 400: Bad Request (missing parameters, invalid input)
- 404: Not Found (no feedback found)
- 500: Internal Server Error

Error responses include detailed messages to help diagnose issues:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Troubleshooting

1. OpenAI API Issues:
   - Ensure OPENAI_API_KEY is set correctly
   - Check API quota and billing status
   - Verify model availability

2. Azure OpenAI Issues:
   - Verify Azure credentials and endpoint
   - Check deployment name matches configuration
   - Ensure service is provisioned correctly

3. Rate Limiting:
   - The system implements retry logic for API calls
   - Adjust retryAttempts and retryDelay in configuration if needed

4. Memory Issues:
   - The system stores last 10 analyses in memory
   - For production, implement persistent storage

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 