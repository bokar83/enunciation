# Project: Enunciation Coach App

## Summary
A mobile-first enunciation training app that helps users improve their speech clarity, pacing, and confidence. Built using Next.js + Tailwind in Cursor AI, the app integrates speech recognition and GPT-powered feedback. Inspired by "Don't Say Um" by Michael Chad Hoeppner, it encourages mindful speaking through guided exercises and personalized AI coaching.

## Problem
People often speak too quickly, blur words, or overuse filler words. There's no fast, structured tool for evaluating and improving speech in real time. Coaching is expensive and inconsistent. Most existing tools only transcribe or analyze tone—they don't teach awareness or growth.

## Goal
- Build the **first mobile-first speech improvement app**
- Record → Review → Improve in under 10 seconds
- Launch MVP in 7 days via Cursor AI
- Create a habit loop around confident, clear speaking

## Success Metrics
- MVP deployed in ≤7 days
- Core flow in ≤3 clicks
- <3 bugs reported in v1
- AI feedback within <2s per recording
- Basic trend tracking (improving/stalling/regressing)

## Core Features
- 🎙️ Record voice via mic (mobile-first UX)
- 🧠 Analyze speech using OpenAI Whisper + GPT
- 🗣️ Return a transcript + structured scoring
- 💬 Coach-style GPT feedback (conversational)
- 🔁 Repeat-after-me and Slow Reading drills
- 📊 Track progression over time
- 🔐 User login with Airtable backend
- 🖼️ Visual scores: Pace, Clarity, Confidence

## Constraints
- Mobile-first (Chrome/Safari tested)
- Static frontend, backend via Airtable only
- Minimal dependencies (Next.js + Tailwind + Web APIs)
- All user data stored in Airtable + locally cached

## Tech Stack
- **Frontend:** Next.js, Tailwind CSS, Cursor AI
- **Voice Input:** Web Speech API
- **AI Backend:** OpenAI Whisper API + GPT-4
- **Auth & DB:** Airtable (email login)
- **Storage:** LocalStorage (short-term), Airtable (persisted)

## Layout & UX
- 3-click max: Record → View Feedback → Retry or Improve
- Gamified score UI (3 metrics + emoji/text encouragement)
- Clear mobile-first layout
- Responsive for web use on Chrome and Safari

## Folder Structure
- `/pages` - UI routes
- `/components` - UI modules
- `/utils` - speech logic, GPT prompts
- `/public` - assets and audio storage (if local)
- `README.md`, `features.md`, `deployment-strategies.md`

## MVP User Stories
- I want to log in and record myself speaking
- I want AI to tell me how I sounded and what to improve
- I want to practice drills that help me speak slower and clearer
- I want to see if I'm getting better over time

## Timeline (7 Days)

| Day | Task |
|-----|------|
| 1   | Finalize PRD, create repo and scaffold |
| 2   | Build recording UI + playback |
| 3   | Integrate Whisper + GPT feedback |
| 4   | Build scoring + coaching UI |
| 5   | Add drill modules |
| 6   | Implement user auth + Airtable backend |
| 7   | Test end-to-end + deploy to Vercel |

## Future Features (v2+)
- Multilingual drills (FR, ES)
- Long-form speech upload (e.g. presentations)
- Daily speaking challenges
- Leaderboards or peer feedback
- Personal voice coach avatars

## Risks
- Safari/iOS mic permission bugs
- Whisper API response time variability
- Airtable rate limits if usage spikes

## Notes
- PRD changes must be logged
- All commits tested + versioned
- Cursor AI will enforce minimal, structured dev flow 