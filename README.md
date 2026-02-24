# JobFlow Studio - Portfolio & Job Tracker

A modern, editorial-style Portfolio and Job Application Tracker built with React, Express, and MongoDB. Enhanced with Gemini AI for resume optimization and cover letter generation.

## Features

- **Editorial Portfolio**: A high-end, typography-focused portfolio showcasing your skills, certifications, and experience.
- **Job Tracker**: Manage your job applications with a Kanban board or List view.
- **AI Optimization**: Integrated Gemini AI to help you write cover letters and get resume tips based on job descriptions.
- **Admin Dashboard**: Securely manage your applications and portfolio content.
- **Multi-language CV**: Support for English and German CV uploads and downloads.
- **Modern UI**: Built with Tailwind CSS, Framer Motion, and Lucide icons for a premium feel.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion
- **Backend**: Express.js, Node.js
- **Database**: MongoDB
- **AI**: Google Gemini API (@google/genai)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (Local or Atlas)
- Gemini API Key (from Google AI Studio)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and fill in your credentials:
   ```env
   MONGO_URL=your_mongodb_url
   DB_NAME=jobapp0
   ADMIN_PASSWORD=your_secure_password
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Deploying to Vercel

This application is configured for easy deployment on Vercel.

1. Push your code to a GitHub repository.
2. Import the project in Vercel.
3. Add the following Environment Variables in the Vercel dashboard:
   - `MONGO_URL`
   - `DB_NAME`
   - `ADMIN_PASSWORD`
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
   - `NODE_ENV=production`
4. Vercel will automatically detect the configuration and deploy your app.

### Manual Deployment

To build the app for production:
```bash
npm run build
```
Then start the server:
```bash
npm start
```

## License

Apache-2.0
