# AI Job Search Feature 🎯

## Overview
The **AI Job Search** panel enables users to discover job opportunities tailored to their skills, experience level, and preferences using Google Gemini AI.

## Features

### 🔍 Smart Search Filters
1. **Skills** - Multi-tag input (e.g., "React", "Python", "DevOps")
2. **Job Title** - Position keywords (e.g., "Senior Frontend Engineer")
3. **Location** - Geographic or company preference (e.g., "Remote", "San Francisco")
4. **Experience Level** - Junior (0-2), Mid-level (2-5), Senior (5+)

### 📊 AI-Powered Results
- **Match Score** - Percentage match between your profile and job recommendations
- **Company & Title** - Clear job position details
- **Work Location** - Remote/on-site information
- **Salary Range** - Compensation details
- **One-Click Save** - Add jobs directly to your Wishlist tracker

### ✨ User Experience
- Beautiful card-based results display
- Loading states with smooth animations
- Empty state messaging for no results
- Error handling with user-friendly messages
- Fully responsive design (mobile, tablet, desktop)
- Shine effects on card hover

## How to Use

### 1. **Access AI Search**
   - Click "AI Search" in the main navigation (top-left area)
   - Available on both desktop and mobile

### 2. **Enter Search Criteria**
   - Add 1+ skills from your expertise
   - (Optional) Specify job title preference
   - (Optional) Add location or company preference
   - Select your experience level

### 3. **Find Jobs**
   - Click "Find Jobs" button
   - AI generates 5-7 recommendations based on your profile
   - Results shown with match percentages

### 4. **Save to Tracker** (Admin only)
   - Click "Save to Wishlist" on any job card
   - Job automatically added to your Job Tracker
   - Pre-populated with:
     - Company name
     - Job title
     - Location
     - Salary information
     - Match percentage in notes

## Technical Details

### Frontend Component
- **File**: `src/components/AIJobSearch.tsx`
- **Framework**: React + TypeScript
- **Styling**: Tailwind CSS with custom card components
- **Animation**: Framer Motion
- **State Management**: React hooks (useState)

### Backend Integration
- **Endpoint**: `POST /api/ai/search-jobs` (server.ts:524-570)
- **Parameters**:
  - `skills` - Comma-separated skill list
  - `company_preference` - Location or company name
  - `job_type` - Employment type (default: "Full-time")
  - `experience_level` - Career level (junior/mid/senior)

### API Response Format
```json
[
  {
    "company": "Google",
    "title": "Senior Frontend Engineer",
    "match": "95",
    "salary": "$180k - $250k",
    "remote": "Remote (SF Bay Area)"
  },
  ...
]
```

## Design System
Uses JobFlow's professional design system:
- **Colors**: Indigo for primary actions, slate for neutral
- **Cards**: `card-elegant` class with shadows
- **Buttons**: Primary (indigo) and secondary (slate) styles
- **Typography**: System font stack with font-black for headings
- **Spacing**: Tailwind 3.4.0 with custom scale

## Navigation Integration
- **Desktop Nav**: "AI Search" button in tab bar (position: 1st)
- **Mobile Nav**: Responsive hamburger menu with AI Search option
- **Active State**: Highlighted when selected with white background

## Future Enhancements
1. Save search queries for quick access later
2. Filter by salary range
3. Integrate real job boards (JSearch API, Adzuna)
4. Advanced filtering (remote-only, specific industries)
5. Job match explanations (why this job was recommended)
6. Email notifications for new matches
7. Compare multiple job opportunities

## Troubleshooting

### "Search failed" error
- Check that MongoDB is connected (admin can see status)
- Verify Google Gemini API key is configured
- Try with fewer filters initially

### No results returned
- AI might not have found matches for this combination
- Try adjusting filters or using broader keywords
- Ensure at least one search criterion is provided

### Can't save jobs
- Must be logged in (admin mode) to save jobs
- Click the lock icon to authenticate

## Files Modified
- `src/App.tsx` - Added AI Search view, navigation buttons, save handler
- `src/components/AIJobSearch.tsx` - Main component (new file)
- Build status: ✅ 2244 modules, 2.60s build time, zero TypeScript errors

---

**Status**: ✅ Production Ready | **Last Updated**: Today | **Version**: 1.0.0
