# Team Task Distribution (ConUHacks 2026)

This document groups tasks into 4 distinct roles to minimize merge conflicts. Each teammate should work on their dedicated branch.

## 👤 Teammate 1: Frontend User Flow (Current Frontend Person)
**Branch:** `feat/frontend-user`
**Focus:** Public-facing UI for generic users.
- [ ] **Landing Page**: Simple hero section with "I Lost Something" button.
- [ ] **Auth Pages**: Login / Signup forms (integrating Supabase Auth).
- [ ] **Inquiry Form**:
    - Build a form with: Description (Text Area) + Image Upload (Input file).
    - Handle "Loading" state while image is uploading.
- [ ] **User Dashboard**:
    - Fetch list of *my* inquiries (`supabase.from('inquiries').select('*')`).
    - Display status badges (Submitted, Matched, Resolved).

## 🔧 Teammate 2: Backend Core & Gemini
**Branch:** `feat/backend-core`
**Focus:** Express Server, API Headers, and AI Integration.
- [*] **Server Setup**: Ensure `index.js` parses JSON and File Uploads correctly.
- [*] **Gemini Integration**:
    - Finish `services/gemini.js` to ensure reliable Description Generation.
    - (Optional) Add a simple logic to extract "Keywords" from the description.
- [*] **API Route - Inquiry**:
    - Implement `POST /api/inquiry`.
    - Receive File -> Send to Storage -> Send to Gemini -> Save to DB.
- [*] **API Route - Inventory**:
    - Implement `POST /api/inventory` (Admin adds found item).

## 🛡️ Teammate 3: Assistant Dashboard (Feature Set)
**Branch:** `feat/assistant-admin`
**Focus:** The "Hidden" internal tools for Admins.
- [ ] **Inventory Manager UI**:
    - A table/grid showing all "Found Items" (`inventory` table).
    - "Add New Found Item" form (similar to Inquiry form but for Inventory).
- [ ] **Match Review UI** (The Hackathon Winner Feature!):
    - Create a page that fetches from the `matches` table.
    - Show **Side-by-Side Comparison**:
        - Left: User's Lost Item (Image + Text).
        - Right: Potential Found Match (Image + Text).
    - Add "Confirm Match" and "Reject Match" buttons.

## 🧠 Teammate 4: Data Logic & Notifications
**Branch:** `feat/data-logic`
**Focus:** The "Glue" that connects everything + Database Integrity.
- [ ] **Matching Logic (The Algorithm)**:
    - Write the SQL function or Node.js helper that runs when a new Inquiry comes in.
    - Logic: "Search `inventory` descriptions using Postgres Full-Text Search".
    - Save results into the `matches` table.
- [ ] **Notifications**:
    - Set up **Resend** (Email Service).
    - Create a helper `sendMatchEmail(userEmail, matchDetails)`.
    - Trigger this email when Teammate 3 clicks "Confirm Match".
- [ ] **RLS & Security Testing**:
    - Verify that Teammate 1 (User) *cannot* query the `inventory` table directly.

---

## 🚀 Integration Strategy
1.  **Teammate 4** sets up the Supabase SQL (Done/Script provided).
2.  **Teammate 2** builds the API Skeleton.
3.  **Teammate 1 & 3** build their UIs using mock data first, then connect to Teammate 2's API.
