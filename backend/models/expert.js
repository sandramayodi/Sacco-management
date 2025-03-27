// models/ExpertModels.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Expert Profile Schema
 * Additional information specific to agricultural experts
 */
const expertProfileSchema = new Schema({
    memberId: {
        type: Schema.Types.ObjectId,
        ref: 'Member',
        required: true,
        unique: true
    },
    specializations: [{
        type: String,
        enum: [
            'crop_farming', 'livestock', 'poultry', 'aquaculture', 
            'irrigation', 'soil_management', 'pest_control', 
            'organic_farming', 'agroforestry', 'machinery', 
            'post_harvest', 'market_analysis', 'agribusiness',
            'dairy', 'horticulture', 'climate_smart_agriculture'
        ]
    }],
    qualifications: [{
        degree: String,
        institution: String,
        year: Number,
        documentUrl: String
    }],
    certifications: [{
        name: String,
        issuingBody: String,
        issueDate: Date,
        expiryDate: Date,
        documentUrl: String
    }],
    experience: {
        years: Number,
        details: String
    },
    availability: {
        schedule: [{
            day: {
                type: String,
                enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            },
            startTime: String,
            endTime: String
        }],
        isAvailableForFieldVisits: {
            type: Boolean,
            default: false
        },
        preferredConsultationMethods: [{
            type: String,
            enum: ['in_person', 'phone_call', 'video_call', 'chat']
        }]
    },
    biography: String,
    areasOfExpertise: [String],
    languages: [String],
    profilePicture: String,
    averageRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    totalConsultations: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationDate: Date,
    verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Member'
    }
}, { timestamps: true });

// Create indices for efficient queries
expertProfileSchema.index({ specializations: 1 });
expertProfileSchema.index({ 'availability.schedule.day': 1 });

/**
 * Expert Consultation Schema
 * Records of consultations between experts and members
 */
const expertConsultationSchema = new Schema({
    consultationId: {
        type: String,
        required: true,
        unique: true
    },
    expertId: {
        type: Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    memberId: {
        type: Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['crop_issue', 'livestock_health', 'equipment_advice', 
               'soil_analysis', 'pest_management', 'business_planning',
               'market_access', 'general_advice', 'loan_related'],
        required: true
    },
    scheduledDateTime: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // in minutes
        default: 30
    },
    consultationMethod: {
        type: String,
        enum: ['in_person', 'phone_call', 'video_call', 'chat'],
        required: true
    },
    location: {
        address: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    contactDetails: {
        phoneNumber: String,
        email: String,
        meetingLink: String
    },
    attachments: [{
        name: String,
        fileType: String,
        fileUrl: String,
        uploadedBy: Schema.Types.ObjectId,
        uploadedAt: Date
    }],
    status: {
        type: String,
        enum: ['requested', 'confirmed', 'rescheduled', 'cancelled', 'completed', 'no_show'],
        default: 'requested'
    },
    statusHistory: [{
        status: String,
        changedBy: Schema.Types.ObjectId,
        changedAt: {
            type: Date,
            default: Date.now
        },
        notes: String
    }],
    consultationNotes: {
        privateNotes: String, // Visible only to the expert
        sharedNotes: String,  // Visible to both expert and member
        recommendations: [String],
        followUpActions: [String]
    },
    feedback: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comments: String,
        submittedAt: Date
    },
    relatedEntities: {
        loanApplicationId: Schema.Types.ObjectId,
        forumPostId: Schema.Types.ObjectId,
        marketplaceListingId: Schema.Types.ObjectId
    },
    reminders: [{
        reminderType: {
            type: String,
            enum: ['expert', 'member', 'both']
        },
        scheduledFor: Date,
        sentAt: Date,
        status: {
            type: String,
            enum: ['pending', 'sent', 'failed']
        }
    }]
}, { timestamps: true });

// Create indices for efficient queries
expertConsultationSchema.index({ expertId: 1, scheduledDateTime: 1 });
expertConsultationSchema.index({ memberId: 1, scheduledDateTime: 1 });
expertConsultationSchema.index({ status: 1 });

/**
 * Knowledge Base Article Schema
 * Expert-created educational content
 */
const knowledgeBaseArticleSchema = new Schema({
    articleId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    summary: String,
    authorId: {
        type: Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    category: {
        type: String,
        enum: ['crop_farming', 'livestock', 'equipment', 'soil_management',
               'pest_control', 'market_information', 'climate_smart',
               'post_harvest', 'financing', 'general'],
        required: true
    },
    tags: [String],
    coverImage: String,
    attachments: [{
        name: String,
        fileType: String,
        fileUrl: String,
        description: String
    }],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    publishedDate: Date,
    lastModifiedDate: Date,
    viewCount: {
        type: Number,
        default: 0
    },
    rating: {
        averageScore: {
            type: Number,
            default: 0
        },
        totalRatings: {
            type: Number,
            default: 0
        }
    },
    relatedArticles: [{
        type: Schema.Types.ObjectId,
        ref: 'KnowledgeBaseArticle'
    }],
    comments: [{
        memberId: {
            type: Schema.Types.ObjectId,
            ref: 'Member'
        },
        content: String,
        postedAt: {
            type: Date,
            default: Date.now
        },
        isVisible: {
            type: Boolean,
            default: true
        }
    }],
    isFeature: {
        type: Boolean,
        default: false
    },
    readTime: Number, // Estimated read time in minutes
}, { timestamps: true });

// Create indices for efficient queries
knowledgeBaseArticleSchema.index({ category: 1, status: 1 });
knowledgeBaseArticleSchema.index({ tags: 1 });
knowledgeBaseArticleSchema.index({ 
    title: 'text', 
    content: 'text', 
    summary: 'text', 
    tags: 'text' 
}, {
    weights: {
        title: 10,
        summary: 5,
        tags: 3,
        content: 1
    }
});

/**
 * Expert Review Schema
 * Expert assessments of loan applications and agricultural projects
 */
const expertReviewSchema = new Schema({
    reviewId: {
        type: String,
        required: true,
        unique: true
    },
    expertId: {
        type: Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    entityType: {
        type: String,
        enum: ['loan_application', 'marketplace_listing', 'resource_sharing', 'success_story'],
        required: true
    },
    entityId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    requestedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    requestDate: {
        type: Date,
        default: Date.now
    },
    dueDate: Date,
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'declined'],
        default: 'pending'
    },
    technicalAssessment: {
        isViable: {
            type: Boolean,
            required: function() { return this.status === 'completed'; }
        },
        viabilityScore: {
            type: Number,
            min: 0,
            max: 100
        },
        strengths: [String],
        weaknesses: [String],
        risks: [String],
        recommendations: [String]
    },
    details: {
        loanPurposeAnalysis: String,
        technicalFeasibility: String,
        marketPotential: String,
        environmentalImpact: String,
        sustainabilityAssessment: String,
        resourceRequirements: String,
        alternativeSuggestions: String
    },
    attachments: [{
        name: String,
        fileType: String,
        fileUrl: String,
        description: String
    }],
    completionDate: Date,
    reviewNotes: String,
    adminFeedback: {
        feedback: String,
        providedBy: Schema.Types.ObjectId,
        providedAt: Date
    }
}, { timestamps: true });

// Create indices for efficient queries
expertReviewSchema.index({ expertId: 1, status: 1 });
expertReviewSchema.index({ entityType: 1, entityId: 1 });
expertReviewSchema.index({ dueDate: 1, status: 1 });

/**
 * Agricultural Season Schema
 * Information about agricultural seasons for expert guidance
 */
const agriculturalSeasonSchema = new Schema({
    seasonId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        enum: ['rainy', 'dry', 'planting', 'harvest', 'other'],
        required: true
    },
    region: {
        type: String,
        required: true
    },
    description: String,
    expectedRainfall: {
        amount: Number, // in mm
        pattern: String
    },
    recommendedActivities: [{
        activity: String,
        startDate: Date,
        endDate: Date,
        crops: [String],
        details: String
    }],
    alerts: [{
        title: String,
        description: String,
        severity: {
            type: String,
            enum: ['info', 'warning', 'critical']
        },
        date: Date,
        isActive: Boolean
    }],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Member'
    },
    lastUpdatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Member'
    }
}, { timestamps: true });

// Create indices for efficient queries
agriculturalSeasonSchema.index({ year: 1, region: 1 });
agriculturalSeasonSchema.index({ startDate: 1, endDate: 1 });

// Export all models
module.exports = {
    ExpertProfile: mongoose.model('ExpertProfile', expertProfileSchema),
    ExpertConsultation: mongoose.model('ExpertConsultation', expertConsultationSchema),
    KnowledgeBaseArticle: mongoose.model('KnowledgeBaseArticle', knowledgeBaseArticleSchema),
    ExpertReview: mongoose.model('ExpertReview', expertReviewSchema),
    AgriculturalSeason: mongoose.model('AgriculturalSeason', agriculturalSeasonSchema)
};