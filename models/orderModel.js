import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
    amount: { type: Number, required: true },
    status: { type: String, required: true },
    paymentMethod: { type: String, required: true },
});

export default mongoose.model("Order", orderSchema);