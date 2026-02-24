# JobFlow Feature Testing Guide

## 📱 Quick Start

### Start the Development Server
```bash
cd /Users/nsansi.s.n/Desktop/jobflow2.0
npm run dev
```

**Expected Output**:
```
⚠ MongoDB connection warning: connect ECONNREFUSED...
💡 Running with mock data mode - features requiring DB will show demo content
Server running on http://localhost:3000
```

✅ Server is running and accessible at `http://localhost:3000`

---

## 🧪 Local Testing Scenarios

### Test 1: Navigation & View Switching

**Steps**:
1. Open browser to `http://localhost:3000`
2. Look at the top navigation bar
3. You should see buttons: `Discover | Tracker | Portfolio | Analytics | Interview Prep | Templates`

**Expected Results**:
- ✅ Page loads without errors
- ✅ Navigation buttons are visible and clickable
- ✅ Current view button is highlighted in indigo
- ✅ Hovering over buttons shows visual feedback

**To Test Each Button**:
```
Click: Discover        → Shows job discovery interface
Click: Tracker         → Shows application tracker board
Click: Portfolio       → Shows user portfolio (initially empty)
Click: Analytics       → Shows Analytics Dashboard ✨
Click: Interview Prep  → Shows Interview Preparation tool ✨
Click: Templates       → Shows Cover Letter Templates manager ✨
```

---

### Test 2: Analytics Dashboard

**Purpose**: Verify analytics view renders and calculates metrics

**Starting State**:
- No jobs in tracker yet (mock mode, no database)
- Should show empty state or zero metrics

**Expected UI Elements**:
- [ ] Title: "Analytics Dashboard" or similar
- [ ] Stats cards showing:
  - [ ] Total applications: 0
  - [ ] Interviews: 0
  - [ ] Offers: 0
  - [ ] Response rate: 0%
  - [ ] Offer rate: 0%
- [ ] Status distribution section
- [ ] Timeline chart section

**To Add Test Data** (in Tracker):
1. Click "Tracker" button
2. Click "New Entry" button
3. Fill in job details:
   - Company: "Google"
   - Position: "Software Engineer"
   - Status: "Applied"
4. Save the entry
5. Return to Analytics

**After Adding Jobs**:
- [ ] Analytics should update with new totals
- [ ] Charts should show distribution of statuses
- [ ] Timeline should show when jobs were added

**Visual Verification**:
- [ ] Responsive layout (works on mobile/tablet)
- [ ] Color scheme matches app (indigo primary)
- [ ] Numbers are formatted clearly
- [ ] No console errors (check dev tools)

---

### Test 3: Interview Preparation Tool

**Purpose**: Verify interview prep tool renders and can generate questions

**Initial View**:
1. Click "Interview Prep" button
2. You should see a form or empty state

**Expected UI**:
- [ ] Section for entering company name
- [ ] Section for entering job position
- [ ] "Generate Questions" button
- [ ] Information that this uses AI (Gemini)

**Test Case A: With Mock Company/Position**
```
Company: Google
Position: Senior Software Engineer
```

1. Enter company and position
2. Click "Generate Questions"
3. Expected behavior:
   - [ ] Button shows "Generating..." state
   - [ ] After ~2-3 seconds, questions appear
   - [ ] Each question has a category (Technical/Behavioral)

**Expected Question Cards**:
- [ ] Question text displayed
- [ ] "Expand" or "Details" button
- [ ] Copy button with clipboard icon
- [ ] "Listen" button (text-to-speech placeholder)
- [ ] Suggested answer section when expanded

**Tab Filtering**:
- [ ] "All" tab shows all questions
- [ ] "Technical" tab shows only technical questions
- [ ] "Behavioral" tab shows only behavioral questions

**Re-generation**:
- [ ] "Regenerate Questions" button works
- [ ] Clicking it fetches new questions

**Error Scenarios** (if Gemini API key not set):
- [ ] Should show helpful error message
- [ ] Interface remains functional
- [ ] No console errors that crash the app

---

### Test 4: Cover Letter Templates Manager

**Purpose**: Verify template CRUD operations work

**Initial View**:
1. Click "Templates" button
2. You should see an empty template list or existing templates

**Expected UI**:
- [ ] "Create New Template" or "+" button
- [ ] Empty state message if no templates
- [ ] List of templates (if any exist)

**Test Case A: Create a New Template**
```
Name: "Google SWE Template"
Description: "Template for Google software engineer roles"
Content: "Dear Hiring Manager,
I am excited to apply for the Software Engineer position at Google..."
```

**Steps**:
1. Click "Create New Template" button
2. Modal/form appears with fields:
   - [ ] Template name input
   - [ ] Description input
   - [ ] Content textarea
3. Fill in the fields
4. Click "Save" button

**Expected Results**:
- [ ] Modal closes
- [ ] New template appears in list
- [ ] Template shows name, description, and created date
- [ ] No console errors

**Test Case B: Edit a Template**
1. Click "Edit" or pencil icon on a template
2. Form populates with existing data
3. Change the content slightly
4. Click "Save"

**Expected Results**:
- [ ] Updated timestamp reflected
- [ ] Changes saved to template
- [ ] Modal closes

**Test Case C: Preview Template**
1. Click "Preview" or eye icon on a template
2. Modal shows full template content

**Expected Results**:
- [ ] Modal displays full content
- [ ] Readable formatting
- [ ] "Close" button to dismiss

**Test Case D: Delete Template**
1. Click "Delete" or trash icon on a template
2. Confirmation dialog appears (optional)
3. Click "Confirm delete"

**Expected Results**:
- [ ] Template removed from list
- [ ] No console errors
- [ ] Other templates remain

---

## 🔍 Console & Network Testing

### Browser DevTools Checks

**In Chrome/Firefox DevTools (F12)**:

#### Console Tab
- [ ] No red errors
- [ ] No warnings about missing props
- [ ] No network errors
- [ ] No React warnings about keys or re-renders

#### Network Tab
```
Expected successful requests:
- GET http://localhost:3000/         → 200 OK (HTML)
- GET http://localhost:3000/api/jobs → 200 OK ([])
- GET http://localhost:3000/api/templates → 200 OK ([])
- POST /api/ai/interview-prep        → 200 OK (if API key configured)
```

#### Performance
- [ ] Page loads in under 2 seconds
- [ ] View switching is smooth (no UI freezing)
- [ ] No missed frame rate drops

---

## 🛠️ Troubleshooting

### Issue: "Cannot find module" errors

**Cause**: Dependencies not installed  
**Solution**:
```bash
cd /Users/nsansi.s.n/Desktop/jobflow2.0
npm install
npm run dev
```

### Issue: Dev server crashes on startup

**Solution**:
1. Check MongoDB is not interfering:
   ```bash
   # Server should still start with graceful fallback
   # Check for "Running with mock data mode" message
   ```
2. Restart dev server:
   ```bash
   npm run dev
   ```

### Issue: Templates not persisting

**Expected in local dev**: Templates stored in memory, cleared on server restart  
**Solution**: This is expected behavior without database connection

### Issue: Interview Prep shows "error generating questions"

**Cause**: Gemini API key not configured  
**Solution**: This is expected in local dev mode
- Feature will show error but won't crash app
- To enable: Set `GEMINI_API_KEY` environment variable

### Issue: Analytics shows only zeros

**Expected**: No jobs added yet or mock mode  
**Solution**: 
1. Add jobs through Tracker interface
2. Analytics should update automatically
3. If still blank, add test data manually

---

## ✅ Verification Checklist

Before considering testing complete, verify:

- [ ] **Navigation**: All 6 navigation buttons present and clickable
- [ ] **View Switching**: Can navigate between all views without errors
- [ ] **Analytics View**: Renders without crashing
- [ ] **Interview Prep**: Renders without crashing
- [ ] **Templates View**: Renders without crashing
- [ ] **No Console Errors**: F12 console is clean
- [ ] **No Network Errors**: Network tab shows all requests 200 OK
- [ ] **Responsive Design**: Works on different screen sizes
- [ ] **State Management**: Views maintain state when switching
- [ ] **Feature Integration**: All components integrated into main app

---

## 📊 Feature Testing Matrix

| Feature | View Renders | Buttons Work | Data Shows | No Errors |
|---------|-------------|--------------|-----------|-----------|
| Analytics Dashboard | [ ] | [ ] | [ ] | [ ] |
| Interview Prep | [ ] | [ ] | [ ] | [ ] |
| Templates Manager | [ ] | [ ] | [ ] | [ ] |
| Navigation | [ ] | [ ] | [ ] | [ ] |
| View Routing | [ ] | [ ] | [ ] | [ ] |

---

## 🚀 Production Readiness

### Before Deployment:
1. ✅ All features working locally
2. ✅ No TypeScript errors: `npm run lint`
3. ✅ No console warnings
4. ✅ Commit pushed to git: `git push origin main`

### Deployment Command:
```bash
git push origin main
# Vercel automatically deploys on push to main branch
```

### Post-Deployment Verification:
1. Visit `https://jobflow-seven.vercel.app` (or your deployed URL)
2. Verify all 6 navigation buttons present
3. Click through each view
4. Test one feature (e.g., Analytics)
5. Check staging/production environment variables are set

---

## 📝 Notes for Manual Testing

- **Mock Mode Indicator**: Check server console for `💡 Running with mock data mode...`
- **Expected DB Connection Error**: This is normal in local dev (not connected to MongoDB Atlas)
- **Templates Persistence**: In local dev, templates are lost on server restart (use cloud DB for persistence)
- **API Integration**: All endpoints at `/api/...` are available but may return empty results without real data

---

## 💡 Tips for Comprehensive Testing

1. **Test Mobile View**: Resize browser to 375px width to test on mobile
2. **Test Slow Network**: Open DevTools → Network tab, set throttling to "Slow 3G"
3. **Test Offline**: Toggle offline in DevTools and verify graceful degradation
4. **Test Long Lists**: If templates feature works, try creating 10+ templates to test scrolling
5. **Test Responsive Images**: Assets should scale properly on all sizes

---

## 🎯 Success Criteria

✅ **Testing is Complete When**:
- All navigation buttons accessible
- All three new views render without crashing
- No TypeScript or runtime errors
- Responsive design working
- Feature state persists during view switching
- Ready for production deployment

---

**Last Updated**: After feature implementation
**Status**: Ready for Local Testing ✅
**Next Step**: Execute test scenarios above → Deploy to Vercel
