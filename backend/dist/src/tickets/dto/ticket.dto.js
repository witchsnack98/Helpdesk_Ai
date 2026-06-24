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
exports.FilterTicketsDto = exports.UpdateTicketDto = exports.CreateTicketDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateTicketDto {
    title;
    description;
    imageUrls;
}
exports.CreateTicketDto = CreateTicketDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateTicketDto.prototype, "imageUrls", void 0);
class UpdateTicketDto {
    status;
    priority;
    agentId;
    category;
}
exports.UpdateTicketDto = UpdateTicketDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.TicketStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTicketDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.Priority),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTicketDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTicketDto.prototype, "agentId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateTicketDto.prototype, "category", void 0);
class FilterTicketsDto {
    status;
    priority;
    category;
    search;
    agentId;
}
exports.FilterTicketsDto = FilterTicketsDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.TicketStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterTicketsDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.Priority),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterTicketsDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterTicketsDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterTicketsDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterTicketsDto.prototype, "agentId", void 0);
//# sourceMappingURL=ticket.dto.js.map