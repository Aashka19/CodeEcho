import axios from 'axios';
import { Application, TurnState } from '@microsoft/teams-ai';
import { MCPConfig } from '../config/mcp.config';

interface StackOverflowQuestion {
  title: string;
  body?: string;
  tags: string[];
  link: string;
  score: number;
  view_count: number;
  answer_count: number;
  creation_date: number;
  question_id: number;
}

interface GitHubIssue {
  title: string;
  body: string | null;
  number: number;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  labels: Array<{ name: string }>;
}

interface FeedbackAnalysis {
  source: 'github' | 'stackoverflow';
  title: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  summary: string;
  engagement_score: number;
  created_at: string;
}

interface MCPState extends TurnState {
  feedback: {
    github: GitHubIssue[];
    stackoverflow: StackOverflowQuestion[];
    analysis: FeedbackAnalysis[];
  };
}

export class MCPService {
  private stackOverflowKey?: string;
  private openaiKey?: string;
  private app: Application<MCPState>;

  constructor(config: MCPConfig) {
    this.stackOverflowKey = config.stackOverflowKey;
    this.openaiKey = config.openaiKey;

    // Initialize Teams AI Application
    this.app = new Application<MCPState>({
      storage: {
        read: async (keys: string[]) => {
          const items: { [key: string]: any } = {};
          for (const key of keys) {
            items[key] = {
              feedback: {
                github: [],
                stackoverflow: [],
                analysis: []
              }
            };
          }
          return items;
        },
        write: async (changes: { [key: string]: any }) => {
          // Store feedback data (could be extended to use a real database)
          console.log('Storing feedback changes:', Object.keys(changes).length);
        },
        delete: async (keys: string[]) => {
          console.log('Deleting feedback for keys:', keys);
        }
      }
    });

    // Add Teams-specific handlers
    this.setupTeamsHandlers();
  }

  private setupTeamsHandlers() {
    // Handle feedback analysis requests
    this.app.message('/analyze', async (context, state) => {
      const analysis = await this.analyzeRecentFeedback();
      state.feedback.analysis = analysis.analysis;
      await context.sendActivity({
        type: 'message',
        text: `Analyzed ${analysis.total_items} feedback items:\n` +
              `- ${analysis.github_items} from GitHub\n` +
              `- ${analysis.stackoverflow_items} from Stack Overflow`
      });
    });

    // Handle feedback ingestion requests
    this.app.message('/ingest', async (context, state) => {
      const githubIssues = await this.ingestGitHubFeedback();
      const stackoverflowQuestions = await this.ingestStackOverflowFeedback(['microsoft-teams', 'teams-apps', 'teams-development']);
      
      state.feedback.github = githubIssues;
      state.feedback.stackoverflow = stackoverflowQuestions;

      await context.sendActivity({
        type: 'message',
        text: `Ingested feedback:\n` +
              `- ${githubIssues.length} GitHub issues\n` +
              `- ${stackoverflowQuestions.length} Stack Overflow questions`
      });
    });
  }

  async ingestGitHubFeedback(limit?: number) {
    try {
      console.log('Fetching GitHub issues from MicrosoftDocs/msteams-docs repository');

      const owner = 'MicrosoftDocs';
      const repo = 'msteams-docs';

      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        params: {
          state: 'all',
          per_page: limit || 30,
          sort: 'updated',
          direction: 'desc'
        },
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Community-Insights-API/1.0',
          'If-None-Match': ''
        }
      });

      console.log(`GitHub API Rate Limit Status:`, {
        remaining: response.headers['x-ratelimit-remaining'],
        limit: response.headers['x-ratelimit-limit'],
        reset: new Date(Number(response.headers['x-ratelimit-reset']) * 1000).toISOString()
      });

      console.log(`Found ${response.data.length} GitHub issues`);

      const processedIssues = response.data.map((issue: any) => ({
        title: issue.title,
        body: issue.body || 'No description',
        number: issue.number,
        state: issue.state,
        url: issue.html_url,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        labels: issue.labels?.map((label: any) => label.name) || []
      }));

      return processedIssues;
    } catch (error) {
      console.error('Error ingesting GitHub feedback:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      return [];
    }
  }

  async ingestStackOverflowFeedback(tags: string[], limit?: number) {
    try {
      console.log('Fetching Stack Overflow questions for tags:', tags);
      
      const primaryTag = tags[0];
      console.log('Using primary tag:', primaryTag);

      const params: any = {
        site: 'stackoverflow',
        tagged: primaryTag,
        sort: 'activity',
        order: 'desc',
        pagesize: limit || 30,
        filter: 'withbody'
      };

      if (this.stackOverflowKey) {
        params.key = this.stackOverflowKey;
      }

      const response = await axios.get('https://api.stackexchange.com/2.3/questions', {
        params
      });

      console.log('Stack Overflow API response:', {
        hasItems: !!response.data.items,
        itemCount: response.data.items?.length,
        quotaRemaining: response.data.quota_remaining,
        hasMore: response.data.has_more
      });

      if (!response.data.items || !Array.isArray(response.data.items)) {
        console.warn('No items found in Stack Overflow response');
        return [];
      }

      const questions = response.data.items.map((item: StackOverflowQuestion) => ({
        title: item.title || 'No Title',
        body: item.body || '',
        tags: item.tags || [],
        link: item.link || '',
        score: item.score || 0,
        view_count: item.view_count || 0,
        answer_count: item.answer_count || 0,
        creation_date: new Date(item.creation_date * 1000).toISOString(),
        question_id: item.question_id
      }));

      return questions;
    } catch (error) {
      console.error('Error ingesting Stack Overflow feedback:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      return [];
    }
  }

  private calculateEngagementScore(item: any): number {
    if ('view_count' in item) { // Stack Overflow
      return (item.score * 2) + (item.view_count * 0.01) + (item.answer_count * 3);
    } else { // GitHub
      const commentWeight = item.comments || 0;
      const reactionWeight = item.reactions || 0;
      return commentWeight * 2 + reactionWeight;
    }
  }

  private async analyzeFeedbackItem(item: any, source: 'github' | 'stackoverflow'): Promise<FeedbackAnalysis> {
    try {
      // Basic text analysis without OpenAI
      const text = source === 'github' 
        ? `${item.title || ''}\n${item.body || ''}`
        : `${item.title || ''}\n${item.body || ''}`;

      // If no text content, return neutral analysis
      if (!text.trim()) {
        return {
          source,
          title: item.title || 'Untitled',
          url: source === 'github' ? (item.url || '') : (item.link || ''),
          sentiment: 'neutral',
          topics: [],
          summary: 'No content available',
          engagement_score: this.calculateEngagementScore(item),
          created_at: source === 'github' ? item.created_at : item.creation_date
        };
      }

      // Simple sentiment analysis based on keywords
      const sentimentKeywords = {
        positive: ['great', 'awesome', 'good', 'thanks', 'helpful', 'works', 'solved', 'fixed'],
        negative: ['bug', 'issue', 'error', 'problem', 'fail', 'crash', 'broken', 'not working']
      };

      const lowerText = text.toLowerCase();
      const positiveCount = sentimentKeywords.positive.filter(word => lowerText.includes(word)).length;
      const negativeCount = sentimentKeywords.negative.filter(word => lowerText.includes(word)).length;

      let sentiment: 'positive' | 'negative' | 'neutral';
      if (positiveCount > negativeCount) {
        sentiment = 'positive';
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
      } else {
        sentiment = 'neutral';
      }

      // Extract topics from tags/labels and title keywords
      const explicitTopics = source === 'stackoverflow' ? (item.tags || []) : (item.labels || []);
      const titleWords = (item.title || '')
        .toLowerCase()
        .split(/[\s-]+/)
        .filter((word: string) => word.length > 3)
        .slice(0, 3);

      const topics = [...new Set([...explicitTopics, ...titleWords])];

      // Create a summary from the beginning of the content
      const summary = text
        .split('\n')
        .filter(line => line.trim())
        .slice(0, 2)
        .join(' ')
        .substring(0, 200);

      return {
        source,
        title: item.title || 'Untitled',
        url: source === 'github' ? (item.url || '') : (item.link || ''),
        sentiment,
        topics: topics.slice(0, 5), // Limit to top 5 topics
        summary: summary || 'No content available',
        engagement_score: this.calculateEngagementScore(item),
        created_at: source === 'github' ? item.created_at : item.creation_date
      };
    } catch (error) {
      console.error('Error analyzing feedback item:', error);
      // Return a neutral analysis on error
      return {
        source,
        title: item.title || 'Untitled',
        url: source === 'github' ? (item.url || '') : (item.link || ''),
        sentiment: 'neutral',
        topics: [],
        summary: 'Error analyzing content',
        engagement_score: 0,
        created_at: source === 'github' ? item.created_at : item.creation_date
      };
    }
  }

  async analyzeRecentFeedback(limit: number = 5) {
    try {
      console.log('Fetching recent feedback for analysis...');
      
      // Fetch recent feedback from both sources
      const githubIssues = await this.ingestGitHubFeedback(limit);
      const stackoverflowQuestions = await this.ingestStackOverflowFeedback(['microsoft-teams', 'teams-apps', 'teams-development'], limit);

      console.log(`Found ${githubIssues.length} GitHub issues and ${stackoverflowQuestions.length} Stack Overflow questions`);

      // Analyze each item
      const githubAnalysis = await Promise.all(
        githubIssues.map((issue: GitHubIssue) => this.analyzeFeedbackItem(issue, 'github'))
      );

      const stackoverflowAnalysis = await Promise.all(
        stackoverflowQuestions.map((question: StackOverflowQuestion) => this.analyzeFeedbackItem(question, 'stackoverflow'))
      );

      // Combine and sort by creation date
      const allAnalysis = [...githubAnalysis, ...stackoverflowAnalysis]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);

      console.log(`Successfully analyzed ${allAnalysis.length} feedback items`);

      return {
        total_items: allAnalysis.length,
        github_items: githubAnalysis.length,
        stackoverflow_items: stackoverflowAnalysis.length,
        analysis: allAnalysis
      };
    } catch (error) {
      console.error('Error analyzing recent feedback:', error);
      return {
        total_items: 0,
        github_items: 0,
        stackoverflow_items: 0,
        analysis: [],
        error: 'Failed to analyze recent feedback'
      };
    }
  }

  async processFeedback(feedback: any) {
    if (!feedback || (Array.isArray(feedback) && feedback.length === 0)) {
      console.log('No feedback to process');
      return {
        processed: true,
        timestamp: new Date(),
        data: [],
        message: 'No feedback data available to process'
      };
    }

    // TODO: Implement feedback processing logic
    // This could include:
    // - Sentiment analysis
    // - Topic categorization
    // - Priority scoring
    // - Duplicate detection
    return {
      processed: true,
      timestamp: new Date(),
      data: feedback,
      message: `Processed ${Array.isArray(feedback) ? feedback.length : 1} feedback items`
    };
  }
} 