"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TriageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const gemini_service_1 = require("./gemini.service");
const client_1 = require("@prisma/client");
let TriageService = TriageService_1 = class TriageService {
    gemini;
    prisma;
    config;
    logger = new common_1.Logger(TriageService_1.name);
    constructor(gemini, prisma, config) {
        this.gemini = gemini;
        this.prisma = prisma;
        this.config = config;
    }
    async analyzeAndUpdate(ticket) {
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
            this.logger.log(`Triage complete for ticket ${ticket.id}: ${result.category}, ${result.priority}, sentiment: ${result.sentiment}`);
            return {
                priority: result.priority,
                category: result.category,
                sentiment: result.sentiment,
            };
        }
        catch (err) {
            this.logger.error(`Triage failed for ticket ${ticket.id}`, err);
            return null;
        }
    }
    async analyze(title, description) {
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
        const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.sentiment < -0.6 && parsed.priority !== client_1.Priority.URGENT) {
            parsed.priority = client_1.Priority.URGENT;
        }
        return parsed;
    }
    async generateSuggestedReply(ticketTitle, ticketDescription, recentMessages, category, sentiment) {
        const toneGuide = sentiment < -0.4
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
};
exports.TriageService = TriageService;
exports.TriageService = TriageService = TriageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gemini_service_1.GeminiService,
        prisma_service_1.PrismaService,
        config_1.ConfigService])
], TriageService);
//# sourceMappingURL=triage.service.js.map