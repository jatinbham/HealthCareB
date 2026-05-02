import mongoose from "mongoose";

const healthReportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    symptoms: {
        type: String,
        required: true
    },
    aiResponse: {
        type: String,
        required: true
    },
    score: Number,           // Optional: Health score
    riskLevel: String        // Optional: Low/Medium/High
}, {
    timestamps: true
});

export default mongoose.model("HealthReport", healthReportSchema);