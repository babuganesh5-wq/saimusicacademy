# Task List — Complete SaaS Upgrade (bMusician Grade)

## Phase 1: Types & Foundations
- [x] Add `DemoBooking` type to App.tsx
- [x] Extend `User.role` union to include `"teacher"`
- [x] Add `demoBookings` state + `createDemoBooking` factory in App component

## Phase 2: Auth & Role Routing
- [x] Add `teacher` to `fillCredentials` function in AuthPage
- [x] Add teacher provisioning block (teacher@saimusicacademy.com / teacher123) in AuthPage
- [x] Render 3-button quick demo access grid (Student, Guru, Admin) in AuthPage

## Phase 3: Schedule a Demo (ContactPage)
- [x] Rewrite ContactPage as ultra-premium 22-discipline Demo Booking widget
- [x] Add discipline selector (grouped by Vocals, Percussion, Melodic, Dance)
- [x] Add skill level picker (Beginner / Intermediate / Advanced / Super Advanced)
- [x] Add date picker and 4-slot time window selection
- [x] Wire ContactPage to receive `createDemoBooking` prop
- [x] Add live demo preview sidebar panel

## Phase 4: Teacher Guru Portal
- [x] Add teacher grading state hooks (selectedSubmissionId, teacherGrade, teacherFeedback)
- [x] Add `handleTeacherGrade` function
- [x] Build complete Guru Portal UI with stats + submission queue + grading workspace
- [x] Insert teacher role check before admin check in DashboardPage

## Phase 5: Admin Panel — Demo Bookings Tab
- [x] Update adminTab state union to include `"demo-bookings"` 
- [x] Add 🎯 Demo Bookings tab button to Admin navigation bar
- [x] Build Demo Bookings table rendering `demoBookings` state
- [x] Pass `demoBookings` prop from App through to DashboardPage

## Phase 6: Gemini AI Chatbot
- [x] Add `showSettings` and `apiKey` state hooks (stored in localStorage)
- [x] Build settings gear (⚙️) in chat header with secure API key input
- [x] Write `sendToGemini` fetch helper with Carnatic pre-prompting context
- [x] Write `offlineFallback` keyword router for offline use
- [x] Rebuild chat UI with scroll-to-bottom ref and typing indicator
- [x] Update quick replies (Pricing, Courses, Book Demo, Human Help)

## Phase 7: Verify & Deploy
- [x] Run TypeScript type check (`npx tsc --noEmit`)
- [x] Fix any TS errors
- [x] Verify dev server at localhost:5173
- [x] Deploy to Vercel (`npx vercel --prod`)
- [x] Allow auto-sync watcher to commit and push to GitHub
