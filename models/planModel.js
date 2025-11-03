import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
    name: { type: String, required: true },  // e.g. "Free 30 Min", "1GB Day Pass"
    dataLimitMB: { type: Number, required: true }, // MB limit, e.g. 500, 1024
    timeLimitMinutes: { type: Number, required: true }, // e.g. 30, 1440
    price: { type: Number, default: 0 }, // 0 for free plans
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Plan", planSchema);
