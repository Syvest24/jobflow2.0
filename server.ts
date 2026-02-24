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

// Security Headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

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
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        hasJSearchKey: !!process.env.JSEARCH_API_KEY,
        hasAdzunaId: !!process.env.ADZUNA_APP_ID,
        hasAdzunaKey: !!process.env.ADZUNA_API_KEY
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

// Export Jobs as CSV
app.get("/api/jobs/export/csv", async (req, res) => {
  if (!db) {
    const connected = await connectDB();
    if (!connected) {
      // Return mock data CSV for demo
      const headers = "Company,Position,Status,Location,Salary,Date Applied,Notes,Link\n";
      const mockData = "Google,Senior Engineer,Applied,Mountain View,200000,2024-01-15,Great opportunity,https://google.com\n";
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=jobs.csv");
      return res.send(headers + mockData);
    }
  }
  try {
    const jobs = await db.collection("applications").find({}).sort({ created_at: -1 }).toArray();
    
    // Convert jobs to CSV
    const headers = "Company,Position,Status,Location,Salary,Date Applied,Notes,Link\n";
    const csvRows = jobs.map((job: any) => {
      const escapeField = (field: string) => {
        if (!field) return "";
        if (field.includes(",") || field.includes('"') || field.includes("\n")) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };
      
      return [
        escapeField(job.company || ""),
        escapeField(job.position || ""),
        escapeField(job.status || ""),
        escapeField(job.location || ""),
        escapeField(job.salary || ""),
        escapeField(job.date_applied || ""),
        escapeField(job.notes || ""),
        escapeField(job.link || "")
      ].join(",");
    }).join("\n");
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=jobs.csv");
    res.send(headers + csvRows);
  } catch (err) {
    res.status(500).json({ error: "Failed to export jobs" });
  }
});

// Import Jobs from CSV
app.post("/api/jobs/import/csv", authenticateAdmin, async (req, res) => {
  if (!db) {
    const connected = await connectDB();
    if (!connected) {
      return res.status(500).json({ error: "Database not available" });
    }
  }
  
  const { csvData } = req.body;
  if (!csvData || typeof csvData !== 'string') {
    return res.status(400).json({ error: "Invalid CSV data" });
  }

  try {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      return res.status(400).json({ error: "CSV must have headers and at least one data row" });
    }

    // Parse CSV - simple parser that handles quoted fields
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let insideQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (insideQuotes && nextChar === '"') {
            current += '"';
            i++;
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (char === ',' && !insideQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }

      result.push(current.trim());
      return result;
    };

    // Parse header
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
    const requiredFields = ['company', 'position', 'status'];
    
    // Validate headers
    for (const field of requiredFields) {
      if (!headers.includes(field)) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Parse and insert jobs
    const jobs = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = parseCSVLine(lines[i]);
      const job: any = {
        created_at: new Date().toISOString(),
      };

      headers.forEach((header, idx) => {
        const value = values[idx] || '';
        if (header === 'date applied') {
          job.date_applied = value;
        } else if (header === 'date_applied') {
          job.date_applied = value;
        } else {
          job[header] = value;
        }
      });

      // Validate required fields
      if (!job.company || !job.position || !job.status) {
        continue;
      }

      // Validate status
      const validStatuses = ['Wishlist', 'Applied', 'Interviewing', 'Offer', 'Rejected'];
      if (!validStatuses.includes(job.status)) {
        job.status = 'Applied';
      }

      if (!job.date_applied) {
        job.date_applied = new Date().toISOString().split('T')[0];
      }

      jobs.push(job);
    }

    if (jobs.length === 0) {
      return res.status(400).json({ error: "No valid jobs to import" });
    }

    // Insert all jobs
    const result = await db.collection("applications").insertMany(jobs);
    res.json({ 
      success: true, 
      imported: result.insertedCount,
      totalRows: lines.length - 1
    });
  } catch (err) {
    console.error("Import error:", err);
    res.status(500).json({ error: "Failed to import jobs" });
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
// Enhanced Interview Prep with structured questions
app.post("/api/ai/interview-prep", async (req, res) => {
  const { company, position, description, skill_level } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Gemini API key not configured" });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = "gemini-2.0-flash";

  const skillContext = skill_level ? ` for a ${skill_level} level` : '';
  const prompt = `Generate 12 interview questions for a ${position} role${skillContext} at ${company}. 
  
  Job Description: ${description || 'General role'}
  
  Include:
  - 4 technical questions (specific to the tech stack/role)
  - 4 behavioral questions (company culture fit, problem-solving)
  - 4 situational questions (real-world scenarios)
  
  For EACH question, provide:
  1. The question
  2. Key points the interviewer is looking for
  3. A sample answer approach
  
  Format as JSON array with objects: { "type": "technical|behavioral|situational", "question": "", "keyPoints": "", "answerTip": "" }`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    
    const text = response.text;
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const questions = jsonMatch ? JSON.parse(jsonMatch[0]) : { questions: text };
    
    res.json({ questions });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to generate interview questions. Please try again." });
  }
});

// AI-powered Job Search
app.post("/api/ai/search-jobs", async (req, res) => {
  const { skills, company_preference, job_type, experience_level } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(200).json([]);
  }

  const prompt = `Based on these job search criteria, suggest 5 relevant job opportunities:
  - Skills: ${skills || "not specified"}
  - Preferred Companies or Location: ${company_preference || "any"}
  - Job Type: ${job_type || "any"}
  - Experience Level: ${experience_level || "intermediate"}
  
  Respond ONLY with a JSON array, no other text. Each object should have: company, title, match, salary, remote
  Example format: [{"company":"Google","title":"Backend Engineer","match":"90%","salary":"$150k-$200k","remote":"Yes"}]`;

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();
      console.log("Gemini API error:", errorData);
      return res.status(200).json([]);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    try {
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      const jobs = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      res.json(jobs);
    } catch (parseError) {
      console.log("JSON parse error:", parseError);
      res.status(200).json([]);
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log("AI search timeout");
    } else {
      console.error("Job search AI error:", error);
    }
    res.status(200).json([]);
  }
});

// Real Job Search - JSearch API (Tier 2)
app.post("/api/jobs/jsearch", async (req, res) => {
  const { keywords, location, salary_min, salary_max, job_type, employment_type, page = 1 } = req.body;
  
  if (!process.env.JSEARCH_API_KEY) {
    return res.status(200).json({ jobs: [], source: "jsearch", error: "JSearch API key not configured" });
  }

  try {
    const { searchText: normalizedLocation } = normalizeLocation(location || 'remote');
    
    // Build query with location included in keywords for better filtering
    let finalQuery = keywords || "job";
    if (location && location.toLowerCase() !== 'remote') {
      // Include location in the query for better filtering
      finalQuery = `${finalQuery} ${location}`;
    }
    
    const params = new URLSearchParams();
    if (finalQuery) params.append("query", finalQuery);
    if (normalizedLocation) params.append("location", normalizedLocation);
    params.append("page", page.toString());
    params.append("num_pages", "1");
    params.append("date_posted", "month");
    if (employment_type) params.append("employment_type", employment_type);

    const response = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
        'x-rapidapi-key': process.env.JSEARCH_API_KEY || '',
      }
    });

    const data = await response.json();
    
    if (!response.ok || !data.data) {
      throw new Error('JSearch API error');
    }

    const allJobs = data.data.map((job: any) => ({
      id: job.job_id,
      title: job.job_title,
      company: job.employer_name,
      location: job.job_location || "Remote",
      salary: job.job_salary_currency && job.job_salary_min 
        ? `${job.job_salary_currency} ${job.job_salary_min}-${job.job_salary_max}` 
        : "Salary not listed",
      description: job.job_description?.substring(0, 300) || "",
      url: job.job_apply_link,
      remote: job.job_is_remote ? "Remote" : "On-site",
      type: job.job_employment_type || "Full-time",
      posted: job.job_posted_at_datetime_utc,
      source: "JSearch"
    }));

    // Filter results to match requested location
    const filteredJobs = location && location.toLowerCase() !== 'remote' 
      ? allJobs.filter(job => isLocationMatch(job.location, location))
      : allJobs;

    // If filtering removed all results, show all results instead
    if (filteredJobs.length === 0 && allJobs.length > 0) {
      console.log("Location filtering removed all results, returning unfiltered results");
      filteredJobs.push(...allJobs);
    }

    res.json({ jobs: filteredJobs, source: "jsearch", total: filteredJobs.length, filtered: filteredJobs.length < allJobs.length && filteredJobs.length > 0 });
  } catch (error) {
    console.error("JSearch error:", error);
    res.status(500).json({ jobs: [], source: "jsearch", error: "Failed to fetch from JSearch" });
  }
});

// Real Job Search - Adzuna API (Tier 2 - Fallback)
app.post("/api/jobs/adzuna", async (req, res) => {
  const { keywords, location = "remote", salary_min, salary_max, page = 1 } = req.body;
  
  if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_API_KEY) {
    return res.status(200).json({ jobs: [], source: "adzuna", error: "Adzuna API keys not configured" });
  }

  try {
    const { searchText: normalizedLocation, adzunaCode } = normalizeLocation(location);
    const params = new URLSearchParams();
    params.append("app_id", process.env.ADZUNA_APP_ID || "");
    params.append("app_key", process.env.ADZUNA_API_KEY || "");
    params.append("results_per_page", "20");
    params.append("page", page.toString());
    if (keywords) params.append("what", keywords);
    if (normalizedLocation) params.append("where", normalizedLocation);
    if (salary_min) params.append("salary_min", salary_min.toString());
    if (salary_max) params.append("salary_max", salary_max.toString());
    params.append("sort_by", "date");

    const countryCode = adzunaCode; // Use normalized country code
    const response = await fetch(`https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1?${params}`);
    const data = await response.json();

    if (!response.ok || !data.results) {
      throw new Error('Adzuna API error');
    }

    const jobs = data.results.map((job: any) => ({
      id: job.id,
      title: job.title,
      company: job.company?.display_name || "Unknown",
      location: job.location?.display_name || "Remote",
      salary: job.salary_min && job.salary_max 
        ? `£${job.salary_min}-${job.salary_max}` 
        : "Salary not listed",
      description: job.description?.substring(0, 300) || "",
      url: job.redirect_url,
      remote: job.location?.display_name?.toLowerCase().includes("remote") ? "Remote" : "On-site",
      type: job.contract_type || "Full-time",
      posted: job.created,
      source: "Adzuna"
    }));

    res.json({ jobs, source: "adzuna", total: data.count, country: countryCode });
  } catch (error) {
    console.error("Adzuna error:", error);
    res.status(500).json({ jobs: [], source: "adzuna", error: "Failed to fetch from Adzuna" });
  }
});

// Location mapping for job APIs
const locationMap: Record<string, { countries: string[], adzunaCode: string }> = {
  'europe': { countries: ['uk', 'de', 'fr', 'nl', 'se'], adzunaCode: 'gb' },
  'uk': { countries: ['uk'], adzunaCode: 'gb' },
  'united kingdom': { countries: ['uk'], adzunaCode: 'gb' },
  'london': { countries: ['uk'], adzunaCode: 'gb' },
  'germany': { countries: ['de'], adzunaCode: 'de' },
  'deutsche': { countries: ['de'], adzunaCode: 'de' },
  'berlin': { countries: ['de'], adzunaCode: 'de' },
  'france': { countries: ['fr'], adzunaCode: 'fr' },
  'paris': { countries: ['fr'], adzunaCode: 'fr' },
  'netherlands': { countries: ['nl'], adzunaCode: 'nl' },
  'dutch': { countries: ['nl'], adzunaCode: 'nl' },
  'amsterdam': { countries: ['nl'], adzunaCode: 'nl' },
  'sweden': { countries: ['se'], adzunaCode: 'se' },
  'stockholm': { countries: ['se'], adzunaCode: 'se' },
  'usa': { countries: ['us'], adzunaCode: 'us' },
  'us': { countries: ['us'], adzunaCode: 'us' },
  'united states': { countries: ['us'], adzunaCode: 'us' },
  'america': { countries: ['us'], adzunaCode: 'us' },
  'canada': { countries: ['ca'], adzunaCode: 'ca' },
  'toronto': { countries: ['ca'], adzunaCode: 'ca' },
  'australia': { countries: ['au'], adzunaCode: 'au' },
  'sydney': { countries: ['au'], adzunaCode: 'au' },
  'india': { countries: ['in'], adzunaCode: 'in' },
  'delhi': { countries: ['in'], adzunaCode: 'in' },
  'mumbai': { countries: ['in'], adzunaCode: 'in' },
  'bangalore': { countries: ['in'], adzunaCode: 'in' },
  'remote': { countries: ['uk', 'us', 'ca', 'au'], adzunaCode: 'gb' }
};

function normalizeLocation(location: string): { searchText: string; adzunaCode: string } {
  const normalized = location.toLowerCase().trim();
  const mapping = locationMap[normalized];
  
  if (mapping) {
    return {
      searchText: normalized === 'europe' ? 'Europe OR Remote' : normalized,
      adzunaCode: mapping.adzunaCode
    };
  }
  
  // If not in map, return as-is for JSearch and default to GB for Adzuna
  return {
    searchText: location,
    adzunaCode: 'gb'
  };
}

// Helper function to check if a job location matches the requested region
function isLocationMatch(jobLocation: string, requestedLocation: string): boolean {
  if (!requestedLocation || requestedLocation.toLowerCase() === 'remote') {
    return true; // Accept any location for remote search
  }

  const jobLocationLower = jobLocation.toLowerCase();
  const requestedLower = requestedLocation.toLowerCase();
  
  // Direct match or contains
  if (jobLocationLower.includes(requestedLower)) return true;
  
  // Check for country matches based on location map
  const locationEntry = locationMap[requestedLower];
  if (locationEntry && locationEntry.countries) {
    const countryNames = locationEntry.countries.map(c => {
      const countryMap: Record<string, string[]> = {
        'de': ['germany', 'deutschland', 'berlin', 'munich', 'hamburg', 'cologne', 'frankfurt', 'düsseldorf', 'nuremberg', 'stuttgart'],
        'fr': ['france', 'paris', 'lyon', 'marseille', 'toulouse', 'nice', 'nantes'],
        'nl': ['netherlands', 'dutch', 'amsterdam', 'rotterdam', 'Utrecht', 'groningen', 'eindhoven'],
        'uk': ['uk', 'united kingdom', 'england', 'scotland', 'london', 'manchester', 'birmingham', 'bristol', 'leeds', 'edinburgh'],
        'se': ['sweden', 'stockholm', 'gothenburg', 'gothenburg', 'malmö', 'uppsala'],
        'us': ['usa', 'us', 'united states', 'america', 'new york', 'california', 'texas', 'florida', 'illinois', 'pennsylvania', 'washington', 'dc', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas', 'san jose'],
        'ca': ['canada', 'canadian', 'toronto', 'vancouver', 'calgary', 'ottawa', 'montreal', 'edmonton'],
        'au': ['australia', 'australian', 'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide'],
        'in': ['india', 'indian', 'delhi', 'mumbai', 'bangalore', 'henglegarh', 'hyderabad', 'pune', 'kolkata']
      };
      return countryMap[c] || [c];
    }).flat();
    
    // Check if any country name matches
    for (const country of countryNames) {
      if (jobLocationLower.includes(country)) return true;
    }
  }
  
  return false;
}

// Combined Real Job Search - Tier 2 with smart fallback
app.post("/api/jobs/search", async (req, res) => {
  const { keywords, location, salary_min, salary_max, job_type, limit = 10 } = req.body;

  try {
    // Normalize location
    const { searchText: normalizedLocation, adzunaCode } = normalizeLocation(location || 'remote');
    console.log(`Search normalized location: "${location}" → "${normalizedLocation}" (Adzuna: ${adzunaCode})`);

    // Determine which API to try first based on location
    const isEuropeanLocation = ['de', 'fr', 'nl', 'se'].includes(adzunaCode) || (location && location.toLowerCase().includes('europe'));
    const shouldTryAdzunaFirst = isEuropeanLocation && process.env.ADZUNA_APP_ID && process.env.ADZUNA_API_KEY;

    // Try Adzuna first for European locations
    if (shouldTryAdzunaFirst) {
      try {
        console.log("Trying Adzuna first for European location:", adzunaCode);
        const adzunaParams = new URLSearchParams();
        adzunaParams.append("app_id", process.env.ADZUNA_APP_ID!);
        adzunaParams.append("app_key", process.env.ADZUNA_API_KEY!);
        adzunaParams.append("results_per_page", "20");
        adzunaParams.append("what", keywords || "job");
        adzunaParams.append("where", normalizedLocation);
        adzunaParams.append("sort_by", "date");

        const adzunaResponse = await fetch(`https://api.adzuna.com/v1/api/jobs/${adzunaCode}/search/1?${adzunaParams}`);
        if (adzunaResponse.ok) {
          const adzunaData = await adzunaResponse.json();
          const jobCount = adzunaData.results?.length || 0;
          if (jobCount > 0) {
            console.log("Adzuna returned", jobCount, "jobs for", adzunaCode);
            const adzunaJobs = adzunaData.results.map((job: any) => ({
              id: job.id,
              title: job.title,
              company: job.company?.display_name || "Unknown",
              location: job.location?.display_name || "Remote",
              salary: job.salary_min ? `£${job.salary_min}-${job.salary_max}` : "Not listed",
              description: job.description?.substring(0, 300) || "",
              url: job.redirect_url,
              remote: job.location?.display_name?.toLowerCase().includes("remote") ? "Remote" : "On-site",
              type: job.contract_type || "Full-time",
              posted: job.created,
              source: "Adzuna",
              match: "85"
            }));
            return res.json({
              jobs: adzunaJobs.slice(0, limit),
              source: "Adzuna",
              total: adzunaJobs.length,
              country: adzunaCode
            });
          }
        }
      } catch (adzunaError) {
        console.error("Adzuna primary attempt failed:", adzunaError);
      }
    }

    // Try JSearch (fallback for European, primary for others)
    if (process.env.JSEARCH_API_KEY) {
      try {
        // Build query with location included in keywords if location seems to matter
        let finalQuery = keywords || "job";
        
        // Add location to query keywords if it seems location-specific
        if (location && location.toLowerCase() !== 'remote') {
          // Include location in the query for better filtering
          finalQuery = `${finalQuery} ${location}`;
        }
        
        console.log("Trying JSearch with query:", finalQuery, "location param:", normalizedLocation);
        const jSearchParams = new URLSearchParams();
        jSearchParams.append("query", finalQuery);
        jSearchParams.append("location", normalizedLocation);
        jSearchParams.append("num_pages", "1");
        jSearchParams.append("date_posted", "month");

        const jSearchResponse = await fetch(`https://jsearch.p.rapidapi.com/search?${jSearchParams}`, {
          method: 'GET',
          headers: {
            'x-rapidapi-host': 'jsearch.p.rapidapi.com',
            'x-rapidapi-key': process.env.JSEARCH_API_KEY,
          }
        });

        console.log("JSearch response status:", jSearchResponse.status);
        
        if (jSearchResponse.ok) {
          const jSearchData = await jSearchResponse.json();
          console.log("JSearch returned", jSearchData.data?.length || 0, "jobs");
          
          const jsearchJobs = jSearchData.data?.map((job: any) => ({
            id: job.job_id,
            title: job.job_title,
            company: job.employer_name,
            location: job.job_location || "Remote",
            salary: job.job_salary_min ? `${job.job_salary_currency} ${job.job_salary_min}-${job.job_salary_max}` : "Not listed",
            description: job.job_description?.substring(0, 300) || "",
            url: job.job_apply_link,
            remote: job.job_is_remote ? "Remote" : "On-site",
            type: job.job_employment_type || "Full-time",
            posted: job.job_posted_at_datetime_utc,
            source: "JSearch",
            match: "90"
          })) || [];

          // Filter results to match requested location
          let filteredJobs = location && location.toLowerCase() !== 'remote' 
            ? jsearchJobs.filter(job => isLocationMatch(job.location, location))
            : jsearchJobs;

          // If filtering removed all results, show all results instead
          if (filteredJobs.length === 0 && jsearchJobs.length > 0) {
            console.log("Location filtering removed all results, returning unfiltered results");
            filteredJobs = jsearchJobs;
          }

          return res.json({ 
            jobs: filteredJobs.slice(0, limit),
            source: "JSearch",
            total: filteredJobs.length,
            filtered: filteredJobs.length < jsearchJobs.length && filteredJobs.length > 0
          });
        } else {
          const errorData = await jSearchResponse.text();
          console.log("JSearch error response:", errorData);
        }
      } catch (jsearchError) {
        console.error("JSearch error:", jsearchError);
      }
    }

    // Final fallback: try Adzuna if JSearch didn't work
    if (!shouldTryAdzunaFirst && process.env.ADZUNA_APP_ID && process.env.ADZUNA_API_KEY) {
      try {
        console.log("Trying Adzuna fallback");
        const adzunaParams = new URLSearchParams();
        adzunaParams.append("app_id", process.env.ADZUNA_APP_ID);
        adzunaParams.append("app_key", process.env.ADZUNA_API_KEY);
        adzunaParams.append("results_per_page", "20");
        adzunaParams.append("what", keywords || "job");
        adzunaParams.append("where", normalizedLocation);
        adzunaParams.append("sort_by", "date");

        const adzunaResponse = await fetch(`https://api.adzuna.com/v1/api/jobs/${adzunaCode}/search/1?${adzunaParams}`);
        
        if (adzunaResponse.ok) {
          const adzunaData = await adzunaResponse.json();
          console.log("Adzuna fallback returned", adzunaData.results?.length || 0, "jobs");
          
          const adzunaJobs = adzunaData.results?.map((job: any) => ({
            id: job.id,
            title: job.title,
            company: job.company?.display_name || "Unknown",
            location: job.location?.display_name || "Remote",
            salary: job.salary_min ? `£${job.salary_min}-${job.salary_max}` : "Not listed",
            description: job.description?.substring(0, 300) || "",
            url: job.redirect_url,
            remote: job.location?.display_name?.toLowerCase().includes("remote") ? "Remote" : "On-site",
            type: job.contract_type || "Full-time",
            posted: job.created,
            source: "Adzuna",
            match: "80"
          })) || [];

          return res.json({
            jobs: adzunaJobs.slice(0, limit),
            source: "Adzuna",
            total: adzunaJobs.length,
            country: adzunaCode
          });
        }
      } catch (adzunaError) {
        console.error("Adzuna fallback error:", adzunaError);
      }
    }

    // If all APIs fail
    console.log("All job APIs failed or not configured");
    res.json({ 
      jobs: [], 
      source: "none", 
      error: "No jobs found or APIs unavailable. Try different keywords or location.",
      debugInfo: {
        hasJSearch: !!process.env.JSEARCH_API_KEY,
        hasAdzuna: !!process.env.ADZUNA_APP_ID && !!process.env.ADZUNA_API_KEY,
        normalizedLocation,
        adzunaCode,
        requestedLocation: location
      }
    });
  } catch (error) {
    console.error("Job search error:", error);
    res.status(500).json({ jobs: [], error: "Failed to search jobs", details: (error as any)?.message });
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

// Generate tailored cover letter
app.post("/api/generate-cover-letter", async (req, res) => {
  const { company, position, jobDescription, userSkills } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(400).json({ error: "Gemini API not configured" });
  }

  try {
    const prompt = `Write a professional, tailored cover letter for the following position:
Company: ${company}
Position: ${position}
Job Description: ${jobDescription || 'Not provided'}
My Key Skills: ${userSkills || 'Not provided'}

Return ONLY the cover letter text, formatted professionally with paragraphs. Include:
1. Opening paragraph introducing yourself and the position
2. Body paragraph highlighting relevant skills and experience
3. Closing paragraph with call to action
Do not include any markdown or formatting symbols.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1500
        }
      })
    });

    if (!response.ok) {
      return res.status(500).json({ error: "Failed to generate cover letter" });
    }

    const data = await response.json();
    const coverLetter = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ coverLetter });
  } catch (error) {
    console.error("Cover letter generation error:", error);
    res.status(500).json({ error: "Failed to generate cover letter" });
  }
});

// Generate resume tips for specific job
app.post("/api/generate-resume-tips", async (req, res) => {
  const { position, description, company, userBackground } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(400).json({ error: "Gemini API not configured" });
  }

  try {
    const prompt = `Provide 5-7 specific, actionable tips to tailor a resume for this position:
Position: ${position}
Company: ${company}
Job Description: ${description || 'Not provided'}
Candidate Background: ${userBackground || 'Not provided'}

Format as a JSON array of objects with "tip" and "example" keys.
Example format: [{"tip": "...", "example": "..."}, ...]
Return ONLY the JSON array, no other text.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800
        }
      })
    });

    if (!response.ok) {
      return res.status(500).json({ error: "Failed to generate tips" });
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      const tips = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      res.json({ tips });
    } catch (e) {
      res.json({ tips: [] });
    }
  } catch (error) {
    console.error("Resume tips generation error:", error);
    res.status(500).json({ error: "Failed to generate resume tips" });
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
