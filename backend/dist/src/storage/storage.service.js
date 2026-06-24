"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
const uuid_1 = require("uuid");
const path = __importStar(require("path"));
let StorageService = StorageService_1 = class StorageService {
    config;
    supabase;
    bucket;
    logger = new common_1.Logger(StorageService_1.name);
    constructor(config) {
        this.config = config;
        this.supabase = (0, supabase_js_1.createClient)(this.config.get('SUPABASE_URL') || '', this.config.get('SUPABASE_SERVICE_KEY') || '');
        this.bucket = this.config.get('SUPABASE_BUCKET') || 'helpdesk-attachments';
    }
    async uploadFile(buffer, originalName, mimeType, folder = 'attachments') {
        const ext = path.extname(originalName);
        const filename = `${folder}/${(0, uuid_1.v4)()}${ext}`;
        const { error } = await this.supabase.storage
            .from(this.bucket)
            .upload(filename, buffer, {
            contentType: mimeType,
            upsert: false,
        });
        if (error) {
            this.logger.error('Upload failed', error);
            throw new Error(`File upload failed: ${error.message}`);
        }
        const { data } = this.supabase.storage
            .from(this.bucket)
            .getPublicUrl(filename);
        return data.publicUrl;
    }
    async deleteFile(fileUrl) {
        const urlParts = fileUrl.split(`/${this.bucket}/`);
        if (urlParts.length < 2)
            return;
        const filePath = urlParts[1];
        await this.supabase.storage.from(this.bucket).remove([filePath]);
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map