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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let TicketsService = class TicketsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, customerId) {
        const ticket = await this.prisma.ticket.create({
            data: {
                title: dto.title,
                description: dto.description,
                imageUrls: dto.imageUrls ?? [],
                customerId,
            },
            include: {
                customer: { select: { id: true, name: true, email: true, avatar: true } },
            },
        });
        return ticket;
    }
    async findAll(filter) {
        const where = {};
        if (filter.status)
            where.status = filter.status;
        if (filter.priority)
            where.priority = filter.priority;
        if (filter.category)
            where.category = filter.category;
        if (filter.agentId)
            where.agentId = filter.agentId;
        if (filter.search) {
            where.OR = [
                { title: { contains: filter.search, mode: 'insensitive' } },
                { description: { contains: filter.search, mode: 'insensitive' } },
            ];
        }
        return this.prisma.ticket.findMany({
            where,
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' },
            ],
            include: {
                customer: { select: { id: true, name: true, email: true, avatar: true } },
                agent: { select: { id: true, name: true, email: true, avatar: true } },
                _count: { select: { messages: true } },
            },
        });
    }
    async findMy(customerId) {
        return this.prisma.ticket.findMany({
            where: { customerId },
            orderBy: { createdAt: 'desc' },
            include: {
                agent: { select: { id: true, name: true, avatar: true } },
                _count: { select: { messages: true } },
            },
        });
    }
    async findOne(id, user) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id },
            include: {
                customer: { select: { id: true, name: true, email: true, avatar: true, createdAt: true } },
                agent: { select: { id: true, name: true, email: true, avatar: true } },
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        sender: { select: { id: true, name: true, avatar: true, role: true } },
                    },
                },
            },
        });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        if (user.role === client_1.Role.CUSTOMER && ticket.customerId !== user.id) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return ticket;
    }
    async update(id, dto) {
        const ticket = await this.prisma.ticket.findUnique({ where: { id } });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        return this.prisma.ticket.update({
            where: { id },
            data: dto,
            include: {
                customer: { select: { id: true, name: true, email: true, avatar: true } },
                agent: { select: { id: true, name: true, email: true, avatar: true } },
            },
        });
    }
    async updateAiInsights(id, data) {
        return this.prisma.ticket.update({
            where: { id },
            data: {
                category: data.category,
                sentiment: data.sentiment,
                priority: data.priority,
            },
        });
    }
    async getStats() {
        const [total, open, inProgress, resolved, urgent] = await Promise.all([
            this.prisma.ticket.count(),
            this.prisma.ticket.count({ where: { status: client_1.TicketStatus.OPEN } }),
            this.prisma.ticket.count({ where: { status: client_1.TicketStatus.IN_PROGRESS } }),
            this.prisma.ticket.count({ where: { status: client_1.TicketStatus.RESOLVED } }),
            this.prisma.ticket.count({ where: { priority: 'URGENT' } }),
        ]);
        return { total, open, inProgress, resolved, urgent };
    }
};
exports.TicketsService = TicketsService;
exports.TicketsService = TicketsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TicketsService);
//# sourceMappingURL=tickets.service.js.map