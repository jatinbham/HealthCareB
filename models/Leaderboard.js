import mongoose from "mongoose";

const leaderboardSchema = new mongoose.Schema({
    alias: { type: String, required: true, unique: true }, // Unique handle
    score: { type: Number, required: true }, // Reaction time in ms
    aqi: { type: Number },
    location: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // Optional: link to account
}, { timestamps: true });

const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema);
export default Leaderboard;