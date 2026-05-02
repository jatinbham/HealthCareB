import mongoose from "mongoose"

const healthProfileSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    name: String,

    age: {
        type: Number,
        min: 1,
        max: 120
    },

    weight: {
        type: Number,
        min: 1
    },

    height: {
        type: Number,
        min: 1
    },

    sleep: Number,
    water: Number,
    exercise: Number,

    stress: {
        type: Number,
        min: 0,
        max: 10
    },

    sugar: {
        type: Number,
        min: 0
    },

    bp: {
        type: Number,
        min: 0
    }

}, { timestamps: true })

export default mongoose.model("HealthProfile", healthProfileSchema)