import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import Groq from "groq-sdk"

import User from "./models/User.js"
import HealthReport from "./models/HealthReport.js"

dotenv.config()

const app = express()

/* ---------------- MIDDLEWARE ---------------- */

app.use(cors({ origin: "*" }))
app.use(express.json())

/* ---------------- DB CONNECT ---------------- */

mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("MongoDB Connected 🚀"))
.catch(err => console.log("DB Error:", err))

/* ---------------- GROQ SETUP ---------------- */

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
})

/* ---------------- AUTH MIDDLEWARE ---------------- */

const authMiddleware = (req, res, next) => {

    try {

        const token = req.headers.authorization?.split(" ")[1]

        if (!token) {
            return res.status(401).json({ message: "No token provided" })
        }

        const verified = jwt.verify(token, process.env.JWT_SECRET)
        req.user = verified

        next()

    } catch (error) {
        return res.status(401).json({ message: "Invalid token" })
    }
}

/* ---------------- HOME ---------------- */

app.get("/", (req, res) => {
    res.send("Backend Running 🚀")
})

/* ---------------- SIGNUP ---------------- */

app.post("/signup", async (req, res) => {

    try {

        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields required" })
        }

        const existing = await User.findOne({ email })

        if (existing) {
            return res.status(400).json({ message: "User already exists" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        await User.create({
            name,
            email,
            password: hashedPassword
        })

        res.json({ message: "User created successfully" })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/* ---------------- LOGIN ---------------- */

app.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(400).json({ message: "User not found" })
        }

        const match = await bcrypt.compare(password, user.password)

        if (!match) {
            return res.status(400).json({ message: "Invalid password" })
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        )

        const safeUser = await User.findById(user._id).select("-password")

        res.json({
            message: "Login success",
            token,
            user: safeUser
        })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/* ---------------- DASHBOARD ---------------- */

app.get("/dashboard", authMiddleware, async (req, res) => {

    const user = await User.findById(req.user.id).select("-password")

    res.json({
        message: "Welcome dashboard 🚀",
        user
    })
})




/* ---------------- AI HEALTH ---------------- */

app.post("/ai-health", authMiddleware, async (req, res) => {

    try {

        const { symptoms } = req.body

        if (!symptoms) {
            return res.status(400).json({ error: "Symptoms required" })
        }

        const user = await User.findById(req.user.id)

        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        let aiReply = ""

        try {

            const chat = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "user",
                        content: `
Act like a senior medical AI assistant.

User: ${user.name}
Symptoms: ${symptoms}

Give:
- Possible Disease
- Risk Level (0-100)
- Stress Level
- Suggestions
- When to see doctor
Keep response short and simple.
                        `
                    }
                ]
            })

            aiReply = chat.choices[0].message.content

        } catch (aiError) {
            console.log("AI ERROR:", aiError)
            return res.status(500).json({ error: "AI service failed" })
        }

        const saved = await HealthReport.create({
            userId: req.user.id,
            symptoms,
            aiResponse: aiReply
        })

        res.json({
            reply: aiReply,
            reportId: saved._id
        })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/* ---------------- HEALTH HISTORY ---------------- */

app.get("/health-history", authMiddleware, async (req, res) => {

    try {

        const reports = await HealthReport.find({
            userId: req.user.id
        })
        .sort({ createdAt: -1 })
        .limit(20)

        res.json({
            total: reports.length,
            reports
        })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})


app.post("/health-profile", authMiddleware, async (req, res) => {
    try {
        const existing = await HealthProfile.findOne({
            userId: req.user.id
        })

        if (existing) {
            await HealthProfile.updateOne(
                { userId: req.user.id },
                { $set: req.body }
            )
        } else {
            await HealthProfile.create({
                userId: req.user.id,
                ...req.body
            })
        }

        res.json({ message: "Profile saved" })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/* ---------------- SERVER START ---------------- */

app.listen(5000, () => {
    console.log("Server running on port 5000 🚀")
})