import mongoose from "mongoose";

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
        min: [1, "Age must be positive"]
    },
    weight: Number,      // in kg
    height: Number,      // in cm
    sleep: Number,       // hours per day
    water: Number,       // liters per day
    exercise: Number,    // days per week
    stress: {
        type: Number,
        min: 1,
        max: 10
    },
    sugar: Number,       // blood sugar level
    bp: Number           // blood pressure (systolic)
}, {
    timestamps: true
});

export default mongoose.model("HealthProfile", healthProfileSchema);