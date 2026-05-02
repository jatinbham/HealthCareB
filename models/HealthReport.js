import mongoose from "mongoose"

const healthReportSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    symptoms: String,

    aiResponse: String

}, { timestamps: true })

export default mongoose.model("HealthReport", healthReportSchema)