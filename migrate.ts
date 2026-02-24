import { MongoClient, ObjectId } from "mongodb";
import fetch from "node-fetch";

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || "jobapp0";
const OLD_API_URL = "https://job-application-tracker-7pst.onrender.com/api";

async function migrate() {
  if (!MONGO_URL) {
    console.error("MONGO_URL not set");
    return;
  }

  const client = await MongoClient.connect(MONGO_URL);
  const db = client.db(DB_NAME);

  console.log("Fetching old data...");

  // Migrate Applications
  try {
    const appRes = await fetch(`${OLD_API_URL}/applications?limit=100`);
    const appData = await appRes.json();
    const applications = appData.applications;

    if (applications && applications.length > 0) {
      const transformedApps = applications.map((app: any) => ({
        company: app.company_name,
        position: app.job_title,
        status: app.status,
        date_applied: app.application_date,
        notes: app.notes,
        created_at: app.created_at,
        location: "", // Not in old schema
        salary: "", // Not in old schema
        link: "" // Not in old schema
      }));

      await db.collection("applications").deleteMany({});
      await db.collection("applications").insertMany(transformedApps);
      console.log(`Migrated ${transformedApps.length} applications`);
    }
  } catch (err) {
    console.error("Failed to migrate applications:", err);
  }

  // Migrate Portfolio
  try {
    const portRes = await fetch(`${OLD_API_URL}/portfolio`);
    const portData = await portRes.json();

    if (portData) {
      const transformedPortfolio = {
        type: "main",
        name: portData.name,
        title: portData.title,
        about: portData.about_en || portData.about,
        skills: portData.skills,
        certifications: portData.certifications,
        languages: portData.languages,
        email: portData.email,
        linkedin: portData.linkedin,
        github: portData.github,
        location: portData.location
      };

      await db.collection("portfolio").updateOne(
        { type: "main" },
        { $set: transformedPortfolio },
        { upsert: true }
      );
      console.log("Migrated portfolio data");
    }
  } catch (err) {
    console.error("Failed to migrate portfolio:", err);
  }

  await client.close();
  console.log("Migration complete");
}

migrate();
