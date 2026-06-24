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
var GeminiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const generative_ai_1 = require("@google/generative-ai");
let GeminiService = GeminiService_1 = class GeminiService {
    config;
    genAI;
    logger = new common_1.Logger(GeminiService_1.name);
    constructor(config) {
        this.config = config;
        this.genAI = new generative_ai_1.GoogleGenerativeAI(this.config.get('GEMINI_API_KEY') || '');
    }
    async generateText(prompt) {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent(prompt);
            return result.response.text();
        }
        catch (error) {
            this.logger.error('Gemini generateText failed', error);
            throw error;
        }
    }
    async generateEmbedding(text) {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
            const result = await model.embedContent(text);
            return result.embedding.values;
        }
        catch (error) {
            this.logger.error('Gemini generateEmbedding failed', error);
            throw error;
        }
    }
};
exports.GeminiService = GeminiService;
exports.GeminiService = GeminiService = GeminiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GeminiService);
//# sourceMappingURL=gemini.service.js.map