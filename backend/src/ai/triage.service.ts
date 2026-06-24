import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from './gemini.service';
import { Priority } from '@prisma/client';

interface TriageResult {
  category: string;
  sentiment: number;
  priority: Priority;
  reasoning: string;
}

@Injectable()
export class TriageService {
  private readonly logger = new Logger(TriageService.name);

  constructor(
    private gemini: GeminiService,
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async analyzeAndUpdate(ticket: {
    id: string;
    title: string;
    description: string;
  }): Promise<{ priority: Priority; category: string; sentiment: number } | null> {
    try {
      const result = await this.analyze(ticket.title, ticket.description);

      await this.prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          category: result.category,
          sentiment: result.sentiment,
          priority: result.priority,
        },
      });

      this.logger.log(
        `Triage complete for ticket ${ticket.id}: ${result.category}, ${result.priority}, sentiment: ${result.sentiment}`,
      );

      return {
        priority: result.priority,
        category: result.category,
        sentiment: result.sentiment,
      };
    } catch (err) {
      this.logger.error(`Triage failed for ticket ${ticket.id}`, err);
      return null;
    }
  }

  async analyze(title: string, description: string): Promise<TriageResult> {
    const prompt = `You are a support ticket triage AI. Analyze the following support ticket and respond ONLY with a valid JSON object.

Ticket Title: "${title}"
Ticket Description: "${description}"

Respond with this exact JSON structure:
{
  "category": "<one of: Technical, Billing, Account, General, Feature Request, Bug Report>",
  "sentiment": <float from -1.0 (very negative/angry) to 1.0 (very positive/happy)>,
  "priority": "<one of: LOW, MEDIUM, HIGH, URGENT>",
  "reasoning": "<brief explanation in 1-2 sentences>"
}

Priority rules:
- URGENT: sentiment < -0.6 OR words like "broken", "down", "urgent", "critical", "data loss", "cannot access"
- HIGH: sentiment < -0.3 OR significant business impact
- MEDIUM: neutral tone, moderate issue
- LOW: positive tone, minor request or question

Respond ONLY with the JSON, no markdown, no explanation.`;

    const raw = await this.gemini.generateText(prompt);
    
    // Parse JSON — strip markdown code blocks if present
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned) as TriageResult;

    // Validate and enforce sentiment-based priority escalation
    if (parsed.sentiment < -0.6 && parsed.priority !== Priority.URGENT) {
      parsed.priority = Priority.URGENT;
    }

    return parsed;
  }

  async generateSuggestedReply(
    ticketTitle: string,
    ticketDescription: string,
    recentMessages: string[],
    category: string,
    sentiment: number,
  ): Promise<string> {
    const toneGuide =
      sentiment < -0.4
        ? 'The customer is upset. Be extra empathetic, apologize sincerely, and prioritize urgency.'
        : 'The customer is neutral or positive. Be professional and helpful.';

    const prompt = `You are a customer support agent. Draft a professional reply for this ticket.

Category: ${category}
Customer Sentiment: ${sentiment > 0 ? 'Positive' : sentiment > -0.3 ? 'Neutral' : 'Negative'}
Tone Guide: ${toneGuide}

Ticket: "${ticketTitle}"
Description: "${ticketDescription}"

${recentMessages.length > 0 ? `Recent conversation:\n${recentMessages.slice(-4).join('\n')}` : ''}

Write a helpful, empathetic reply (2-4 sentences). Do not include a greeting or sign-off. Just the body text.`;

    return this.gemini.generateText(prompt);
  }
}
