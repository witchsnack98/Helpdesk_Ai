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
var HelpdeskGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelpdeskGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let HelpdeskGateway = HelpdeskGateway_1 = class HelpdeskGateway {
    server;
    logger = new common_1.Logger(HelpdeskGateway_1.name);
    afterInit() {
        this.logger.log('WebSocket Gateway initialized');
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleJoinTicket(data, client) {
        client.join(`ticket:${data.ticketId}`);
        this.logger.log(`Client ${client.id} joined ticket room: ${data.ticketId}`);
    }
    handleLeaveTicket(data, client) {
        client.leave(`ticket:${data.ticketId}`);
    }
    handleJoinAgents(client) {
        client.join('agents');
        this.logger.log(`Agent client ${client.id} joined agents room`);
    }
    handleTyping(data, client) {
        client.to(`ticket:${data.ticketId}`).emit('message:typing', {
            userId: data.userId,
            userName: data.userName,
        });
    }
    emitToRoom(ticketId, event, data) {
        this.server.to(`ticket:${ticketId}`).emit(event, data);
    }
    emitToAgents(event, data) {
        this.server.to('agents').emit(event, data);
    }
    emitToAll(event, data) {
        this.server.emit(event, data);
    }
};
exports.HelpdeskGateway = HelpdeskGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], HelpdeskGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join:ticket'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], HelpdeskGateway.prototype, "handleJoinTicket", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave:ticket'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], HelpdeskGateway.prototype, "handleLeaveTicket", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join:agents'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], HelpdeskGateway.prototype, "handleJoinAgents", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('message:typing'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], HelpdeskGateway.prototype, "handleTyping", null);
exports.HelpdeskGateway = HelpdeskGateway = HelpdeskGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
        namespace: '/',
    })
], HelpdeskGateway);
//# sourceMappingURL=gateway.js.map