import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Groq from "groq-sdk";
import rateLimit from "express-rate-limit";

// Middleware
import authMiddleware from "./middleware/authMiddleware.js";
import errorHandler from "./middleware/errorHandler.js";

// Models
import User from "./models/User.js";
import HealthProfile from "./models/HealthProfile.js";
import HealthReport from "./models/HealthReport.js";

dotenv.config();

const app = express();

/* ================== MIDDLEWARE ================== */
app.use(cors({
    origin: ["http://localhost:5173", "https://your-frontend-url.vercel.app"], // ← apna frontend URL add kar dena
    credentials: true
}));

app.use(express.json());

// Rate Limiter for AI calls
const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 8,
    message: { success: false, message: "Too many AI requests, please try again later." }
});

/* ================== DATABASE ================== */
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

/* ================== GROQ AI ================== */
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/* ================== ROUTES ================== */

// Home Route
app.get("/", (req, res) => {
    res.send("VitalAI Backend is Running 🚀");
});

// SIGNUP
app.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        if (await User.findOne({ email })) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({ name, email, password: hashedPassword });

        res.status(201).json({ success: true, message: "Account created successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// LOGIN
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ success: false, message: "Invalid email or password" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        const safeUser = await User.findById(user._id).select("-password");

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: safeUser
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// AI HEALTH ANALYSIS
app.post("/ai-health", authMiddleware, aiLimiter, async (req, res) => {
    try {
        const { symptoms } = req.body;
        if (!symptoms) return res.status(400).json({ success: false, message: "Symptoms are required" });

        const chatCompletion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{
                role: "user",
                content: `You are a helpful medical AI assistant. Analyze these symptoms: ${symptoms}. Give possible risks, suggestions, and when to see a doctor. Keep it short and practical.`
            }]
        });

        const aiReply = chatCompletion.choices[0].message.content;

        const report = await HealthReport.create({
            userId: req.user.id,
            symptoms,
            aiResponse: aiReply
        });

        res.json({ success: true, reply: aiReply, reportId: report._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "AI service error" });
    }
});

// SAVE / UPDATE HEALTH PROFILE
app.post("/health-profile", authMiddleware, async (req, res) => {
    try {
        await HealthProfile.findOneAndUpdate(
            { userId: req.user.id },
            { ...req.body, userId: req.user.id },
            { upsert: true, new: true }
        );
        res.json({ success: true, message: "Health profile saved" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET HEALTH HISTORY
app.get("/health-history", authMiddleware, async (req, res) => {
    try {
        const reports = await HealthReport.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(15);

        res.json({ success: true, reports });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/* ================== ERROR HANDLER ================== */
app.use(errorHandler);

/* ================== SERVER ================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 VitalAI Server running on http://localhost:${PORT}`);
});