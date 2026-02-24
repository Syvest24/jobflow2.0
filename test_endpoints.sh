#!/bin/bash

echo "=== Testing Enhanced API Endpoints ==="
echo ""

echo "1. Interview Prep Endpoint:"
curl -s -X POST http://localhost:3000/api/ai/interview-prep \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Google",
    "position": "Senior Software Engineer",
    "description": "React, Node.js, TypeScript",
    "skill_level": "Senior"
  }' | head -100

echo ""
echo ""
echo "2. Job Search Endpoint:"
curl -s -X POST http://localhost:3000/api/ai/search-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "skills": ["React", "TypeScript", "Node.js"],
    "company_preference": "Tech companies",
    "job_type": "Full-time",
    "experience_level": "Senior"
  }' | head -100

echo ""
echo "=== Endpoint Test Complete ==="
