import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({

    // User Reference
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true,
        index: true
    },

    // Session Identification
    sessionId: { 
        type: String, 
        required: true, 
        unique: true,
        index: true 
    }, // Mikrotik session-id / Radius session-id

    // Plan Information
    plan: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Plan",
        required: true
    },

    // Device Information
    deviceId: { type: String, required: true },
    deviceMacAddress: { 
        type: String, 
        required: true,
        index: true 
    },
    deviceIp: { type: String, required: true },
    deviceType: { type: String },
    deviceModel: { type: String },
    deviceOs: { type: String },
    deviceBrowser: { type: String },

    // Network Information
    apMacAddress: { type: String }, // Connected access point MAC address
    gatewayIp: { type: String },
    
    // Session Timing
    sessionStartTime: { 
        type: Date, 
        required: true,
        default: Date.now 
    },
    sessionEndTime: { type: Date },
    
    // Plan Timing
    planStartTime: { type: Date },
    planExpiryTime: { type: Date },

    // Usage Tracking
    dataUsedMB: { type: Number, default: 0 },
    timeUsedMinutes: { type: Number, default: 0 },
    dataLimitMB: { type: Number }, // From plan
    timeLimitMinutes: { type: Number }, // From plan

    // Free Trial Tracking (if applicable)
    freeMinutesAllowed: { type: Number, default: 0 },
    freeDataAllowed: { type: Number, default: 0 },
    freeMinutesUsed: { type: Number, default: 0 },
    freeDataUsed: { type: Number, default: 0 },

    // Session Status
    isActive: { type: Boolean, default: true, index: true },
    isExpired: { type: Boolean, default: false },
    
    // Termination Reasons
    terminationReason: { type: String }, // 'expired', 'data_exceeded', 'time_exceeded', 'manual', 'system'
    terminatedBy: { type: String }, // 'system', 'admin', 'user'

    // Last Activity Tracking
    lastActivityTime: { type: Date, default: Date.now },
    lastDataUpdateTime: { type: Date },
    
    // Network Statistics (optional)
    packetsUploaded: { type: Number, default: 0 },
    packetsDownloaded: { type: Number, default: 0 },
    bytesUploaded: { type: Number, default: 0 },
    bytesDownloaded: { type: Number, default: 0 },

}, { timestamps: true });

// Indexes for better query performance
sessionSchema.index({ user: 1, isActive: 1 });
sessionSchema.index({ sessionId: 1 });
sessionSchema.index({ deviceMacAddress: 1, isActive: 1 });
sessionSchema.index({ sessionStartTime: -1 });
sessionSchema.index({ isActive: 1, planExpiryTime: 1 }); // For finding expired active sessions

// Method to check if session is expired
sessionSchema.methods.isSessionExpired = function() {
    if (this.planExpiryTime && new Date() > this.planExpiryTime) {
        return true;
    }
    if (this.dataLimitMB && this.dataUsedMB >= this.dataLimitMB) {
        return true;
    }
    if (this.timeLimitMinutes && this.timeUsedMinutes >= this.timeLimitMinutes) {
        return true;
    }
    return false;
};

// Method to get remaining data
sessionSchema.methods.getRemainingData = function() {
    if (!this.dataLimitMB) return null;
    return Math.max(0, this.dataLimitMB - this.dataUsedMB);
};

// Method to get remaining time
sessionSchema.methods.getRemainingTime = function() {
    if (this.planExpiryTime) {
        const remaining = this.planExpiryTime - new Date();
        return Math.max(0, Math.floor(remaining / 1000 / 60)); // in minutes
    }
    if (this.timeLimitMinutes) {
        return Math.max(0, this.timeLimitMinutes - this.timeUsedMinutes);
    }
    return null;
};

export default mongoose.model("Session", sessionSchema);

