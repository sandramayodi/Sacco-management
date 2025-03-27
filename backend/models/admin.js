// models/AdminLog.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Admin Log Schema
 * Tracks all administrative actions for audit purposes
 */
const adminLogSchema = new Schema({
    logId: {
        type: String,
        required: true,
        unique: true
    },
    adminId: {
        type: Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    action: {
        type: String,
        required: true
    },
    entityType: {
        type: String,
        enum: ['member', 'loan', 'savings', 'share_capital', 'marketplace', 'forum', 'resource', 'system'],
        required: true
    },
    entityId: Schema.Types.ObjectId,
    description: {
        type: String,
        required: true
    },
    previousState: Schema.Types.Mixed,
    newState: Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Create index for efficient queries
adminLogSchema.index({ adminId: 1, timestamp: -1 });
adminLogSchema.index({ entityType: 1, entityId: 1 });

/**
 * System Settings Schema
 * Stores configuration settings for the Sacco system
 */
const systemSettingsSchema = new Schema({
    settingId: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: String,
        required: true,
        enum: ['general', 'financial', 'notifications', 'security', 'agricultural']
    },
    name: {
        type: String,
        required: true
    },
    value: {
        type: Schema.Types.Mixed,
        required: true
    },
    dataType: {
        type: String,
        enum: ['string', 'number', 'boolean', 'date', 'object', 'array'],
        required: true
    },
    description: String,
    isVisible: {
        type: Boolean,
        default: true
    },
    isEditable: {
        type: Boolean,
        default: true
    },
    lastModifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Member'
    },
    lastModifiedDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Create compound index for efficient retrieval
systemSettingsSchema.index({ category: 1, name: 1 }, { unique: true });

/**
 * Backup Schema
 * Stores information about system backups
 */
const backupSchema = new Schema({
    backupId: {
        type: String,
        required: true,
        unique: true
    },
    filename: {
        type: String,
        required: true
    },
    description: String,
    size: {
        type: Number,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    status: {
        type: String,
        enum: ['in_progress', 'completed', 'failed'],
        default: 'in_progress'
    },
    error: String,
    backupType: {
        type: String,
        enum: ['full', 'incremental', 'differential', 'data_only'],
        default: 'full'
    },
    includedCollections: [String],
    completedAt: Date
}, { timestamps: true });

/**
 * Report Template Schema
 * Defines templates for different types of reports
 */
const reportTemplateSchema = new Schema({
    templateId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    category: {
        type: String,
        enum: ['financial', 'member', 'loan', 'savings', 'agricultural', 'custom'],
        required: true
    },
    format: {
        type: String,
        enum: ['pdf', 'excel', 'csv', 'html'],
        default: 'pdf'
    },
    fields: [{
        name: String,
        label: String,
        type: String,
        isRequired: Boolean,
        order: Number
    }],
    query: Schema.Types.Mixed,
    sortBy: Schema.Types.Mixed,
    groupBy: [String],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Member'
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    lastModifiedDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

/**
 * Generated Report Schema
 * Stores information about generated reports
 */
const generatedReportSchema = new Schema({
    reportId: {
        type: String,
        required: true,
        unique: true
    },
    templateId: {
        type: Schema.Types.ObjectId,
        ref: 'ReportTemplate'
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    parameters: Schema.Types.Mixed,
    format: {
        type: String,
        enum: ['pdf', 'excel', 'csv', 'html'],
        required: true
    },
    filePath: String,
    fileSize: Number,
    generatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    processingTime: Number,
    error: String,
    accessCount: {
        type: Number,
        default: 0
    },
    expiryDate: Date
}, { timestamps: true });

/**
 * Notification Template Schema
 * Templates for system notifications
 */
const notificationTemplateSchema = new Schema({
    templateId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['email', 'sms', 'in_app'],
        required: true
    },
    event: {
        type: String,
        required: true
    },
    subject: String,
    body: {
        type: String,
        required: true
    },
    variables: [String],
    isActive: {
        type: Boolean,
        default: true
    },
    lastModifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Member'
    }
}, { timestamps: true });

/**
 * Dividend Processing Schema
 * Records of dividend processing runs
 */
const dividendProcessingSchema = new Schema({
    processId: {
        type: String,
        required: true,
        unique: true
    },
    period: {
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        }
    },
    rate: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    memberCount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'reversed'],
        default: 'pending'
    },
    processedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Member'
    },
    notes: String,
    details: [{
        memberId: {
            type: Schema.Types.ObjectId,
            ref: 'Member'
        },
        savingsBalance: Number,
        shareCapital: Number,
        dividendAmount: Number,
        status: {
            type: String,
            enum: ['pending', 'processed', 'failed']
        }
    }],
    processingDate: Date,
    completionDate: Date
}, { timestamps: true });

// Export all models
module.exports = {
    AdminLog: mongoose.model('AdminLog', adminLogSchema),
    SystemSettings: mongoose.model('SystemSettings', systemSettingsSchema),
    Backup: mongoose.model('Backup', backupSchema),
    ReportTemplate: mongoose.model('ReportTemplate', reportTemplateSchema),
    GeneratedReport: mongoose.model('GeneratedReport', generatedReportSchema),
    NotificationTemplate: mongoose.model('NotificationTemplate', notificationTemplateSchema),
    DividendProcessing: mongoose.model('DividendProcessing', dividendProcessingSchema)
};