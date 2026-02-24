import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { MongoClient, ObjectId } from "mongodb";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "jobflow-secret-key";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "TheSecurePass2025!";

// Initialize MongoDB
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "jobapp0";
let db: any;
let mongoClient: MongoClient | null = null;

async function connectDB() {
  try {
    // Reuse existing connection if already connected
    if (db) {
      return db;
    }
    
    mongoClient = new MongoClient(mongoUrl, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    
    await mongoClient.connect();
    db = mongoClient.db(dbName);
    console.log("✓ Connected to MongoDB");
    return db;
  } catch (err) {
    console.log("⚠ MongoDB connection warning:", err instanceof Error ? err.message : err);
    console.log("💡 Running with mock data mode - features requiring DB will show demo content");
    db = null;
    mongoClient = null;
    return null;
  }
}

app.use(express.json());
app.use(cookieParser());

// Health Check
app.get("/api/health", async (req, res) => {
  try {
    if (!db) {
      await connectDB();
    }
    res.json({ 
      status: "ok", 
      dbConnected: !!db,
      env: {
        hasMongoUrl: !!process.env.MONGO_URL,
        hasDbName: !!process.env.DB_NAME,
        hasAdminPassword: !!process.env.ADMIN_PASSWORD,
        hasGeminiKey: !!process.env.GEMINI_API_KEY
      }
    });
  } catch (err) {
    console.error("Health check error:", err);
    res.status(500).json({ 
      status: "error", 
      message: "Database connection failed",
      dbConnected: false 
    });
  }
});

// Auth Middleware
const authenticateAdmin = (req: any, res: any, next: any) => {
  const token = req.cookies.admin_token || req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Auth Routes
app.post("/api/auth/login", async (req, res) => {
  if (!db) await connectDB();
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
    res.cookie("admin_token", token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000 
    });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("admin_token");
  res.json({ success: true });
});

app.get("/api/auth/check", (req, res) => {
  const token = req.cookies.admin_token;
  if (!token) return res.json({ authenticated: false });
  try {
    jwt.verify(token, JWT_SECRET);
    res.json({ authenticated: true });
  } catch {
    res.json({ authenticated: false });
  }
});

// Job Routes
app.get("/api/jobs", async (req, res) => {
  if (!db) {
    const connected = await connectDB();
    if (!connected) {
      return res.json([]); // Return empty array in mock mode
    }
  }
  try {
    const jobs = await db.collection("applications").find({}).sort({ created_at: -1 }).toArray();
    res.json(jobs.map((j: any) => ({ ...j, id: j._id.toString() })));
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/jobs", authenticateAdmin, async (req, res) => {
  if (!db) {
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ error: "Database not available" });
    }
  }
  const job = {
    ...req.body,
    created_at: new Date().toISOString(),
  };
  try {
    const result = await db.collection("applications").insertOne(job);
    res.json({ ...job, id: result.insertedId.toString() });
  } catch (err) {
    res.status(500).json({ error: "Failed to save job" });
  }
});

app.put("/api/jobs/:id", authenticateAdmin, async (req, res) => {
  if (!db) {
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ error: "Database not available" });
    }
  }
  const { id } = req.params;
  const { id: _, _id: __, ...updates } = req.body;
  try {
    await db.collection("applications").updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update job" });
  }
});

app.delete("/api/jobs/:id", authenticateAdmin, async (req, res) => {
  if (!db) await connectDB();
  const { id } = req.params;
  try {
    await db.collection("applications").deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete job" });
  }
});

// Portfolio Routes
app.get("/api/portfolio", async (req, res) => {
  if (!db) await connectDB();
  try {
    const portfolio = await db.collection("portfolio").findOne({ type: "main" });
    if (portfolio) {
      res.json(portfolio);
    } else {
      res.json({
        type: "main",
        name: "Syvester Nsansi",
        title: "Cloud Solution Architect",
        about: "Cloud Solution Architect with a passion for designing scalable AWS infrastructure and automating CI/CD pipelines.",
        skills: ["AWS", "Terraform", "Docker", "Python", "CI/CD"],
        certifications: ["AWS Cloud Engineer"],
        languages: [{ name: "English", level: "Native" }, { name: "German", level: "B2" }]
      });
    }
  } catch (err) {
    res.json({ name: "Syvester Nsansi", title: "Cloud Solution Architect" });
  }
});

app.put("/api/portfolio", authenticateAdmin, async (req, res) => {
  if (!db) await connectDB();
  const { _id, ...updates } = req.body;
  try {
    await db.collection("portfolio").updateOne(
      { type: "main" },
      { $set: updates },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update portfolio" });
  }
});

app.post("/api/portfolio/cv", authenticateAdmin, async (req, res) => {
  if (!db) await connectDB();
  const { base64, filename, contentType, lang } = req.body;
  if (!['en', 'de'].includes(lang)) {
    return res.status(400).json({ error: "Invalid language" });
  }
  
  try {
    const updateKey = `cvs.${lang}`;
    await db.collection("portfolio").updateOne(
      { type: "main" },
      { $set: { [updateKey]: { base64, filename, contentType, updatedAt: new Date().toISOString() } } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to upload CV" });
  }
});

app.get("/api/portfolio/cv/download/:lang", async (req, res) => {
  if (!db) await connectDB();
  const { lang } = req.params;
  try {
    const portfolio = await db.collection("portfolio").findOne({ type: "main" });
    const cv = portfolio?.cvs?.[lang];
    
    if (!cv) {
      return res.status(404).send("CV not found");
    }
    
    const buffer = Buffer.from(cv.base64, 'base64');
    res.setHeader('Content-Type', cv.contentType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cv.filename || `cv_${lang}.pdf`}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).send("Error downloading CV");
  }
});

// Gemini AI Route
app.post("/api/ai/optimize", async (req, res) => {
  const { type, jobDescription, resume } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Gemini API key not configured" });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = "gemini-3-flash-preview";

  let prompt = "";
  if (type === "cover-letter") {
    prompt = `Write a professional cover letter for the following job description using my resume details.
    Job Description: ${jobDescription}
    Resume: ${resume}`;
  } else if (type === "resume-tips") {
    prompt = `Analyze my resume against this job description and provide 5 specific tips to improve it for this role.
    Job Description: ${jobDescription}
    Resume: ${resume}`;
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    res.json({ result: response.text });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to generate AI content" });
  }
});

// Interview Preparation Route
app.post("/api/ai/interview-prep", async (req, res) => {
  const { company, position, description } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Gemini API key not configured" });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = "gemini-3-flash-preview";

  const prompt = `Generate 10 interview questions for a ${position} role at ${company}. Include both technical and behavioral questions.
  Job Description: ${description}
  
  Format as a numbered list, one question per line.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    res.json({ questions: response.text });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to generate interview questions" });
  }
});

// Cover Letter Templates Routes
app.get("/api/templates", async (req, res) => {
  if (!db) await connectDB();
  try {
    const templates = await db.collection("templates").find({}).toArray();
    res.json(templates.map((t: any) => ({ ...t, id: t._id.toString() })));
  } catch (err) {
    res.json([]);
  }
});

app.post("/api/templates", authenticateAdmin, async (req, res) => {
  if (!db) await connectDB();
  const { name, content, description } = req.body;
  
  try {
    const result = await db.collection("templates").insertOne({
      name,
      content,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    res.json({ ...req.body, id: result.insertedId.toString() });
  } catch (err) {
    res.status(500).json({ error: "Failed to save template" });
  }
});

app.put("/api/templates/:id", authenticateAdmin, async (req, res) => {
  if (!db) await connectDB();
  const { id } = req.params;
  const { name, content, description } = req.body;
  
  try {
    await db.collection("templates").updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, content, description, updated_at: new Date().toISOString() } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update template" });
  }
});

app.delete("/api/templates/:id", authenticateAdmin, async (req, res) => {
  if (!db) await connectDB();
  const { id } = req.params;
  
  try {
    await db.collection("templates").deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete template" });
  }
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

async function startServer() {
  try {
    await connectDB();
  } catch (err) {
    console.error("Failed to connect to MongoDB on startup:", err);
    // Continue anyway - connection will be retried on first request
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Only start the server if we're not in a serverless environment (like Vercel)
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  startServer();
}

export default app;
