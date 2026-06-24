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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const rag_service_1 = require("./rag.service");
const triage_service_1 = require("./triage.service");
const prisma_service_1 = require("../prisma/prisma.service");
const class_validator_1 = require("class-validator");
class ChatDto {
    message;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChatDto.prototype, "message", void 0);
class SuggestReplyDto {
    ticketId;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SuggestReplyDto.prototype, "ticketId", void 0);
let AiController = class AiController {
    ragService;
    triageService;
    prisma;
    constructor(ragService, triageService, prisma) {
        this.ragService = ragService;
        this.triageService = triageService;
        this.prisma = prisma;
    }
    async chat(dto) {
        const answer = await this.ragService.query(dto.message);
        return { answer };
    }
    async suggestReply(dto) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: dto.ticketId },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 4,
                    include: {
                        sender: { select: { name: true, role: true } },
                    },
                },
            },
        });
        if (!ticket)
            return { reply: '' };
        const recentMessages = ticket.messages
            .reverse()
            .map((m) => `${m.sender.name} (${m.sender.role}): ${m.content}`);
        const reply = await this.triageService.generateSuggestedReply(ticket.title, ticket.description, recentMessages, ticket.category || 'General', ticket.sentiment ?? 0);
        return { reply };
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('chat'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ChatDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "chat", null);
__decorate([
    (0, common_1.Post)('suggest-reply'),
    (0, roles_decorator_1.Roles)(client_1.Role.AGENT, client_1.Role.ADMIN),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SuggestReplyDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "suggestReply", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [rag_service_1.RagService,
        triage_service_1.TriageService,
        prisma_service_1.PrismaService])
], AiController);
//# sourceMappingURL=ai.controller.js.map