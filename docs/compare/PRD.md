# Product Requirements Document (PRD)
# QR Voting Application

**Version:** 1.0  
**Date:** 2025  
**Status:** Draft

---

## 1. Overview

### 1.1 Purpose
A web-based voting platform where administrators create polls and voters participate by scanning a QR code or entering a room code. No voter registration is required.

### 1.2 Goals
- Allow admins to create and manage polls quickly
- Allow voters to participate with zero friction (no account needed)
- Prevent duplicate votes without requiring voter accounts
- Show live results in real time

### 1.3 Non-Goals (Out of Scope for MVP)
- Multi-admin/team accounts
- Paid plans or billing
- Voter identity verification
- Export to third-party tools (Google Sheets, etc.)
- Mobile native apps (iOS/Android)

---

## 2. Users

### 2.1 Administrator
- Has an account (email + password)
- Creates, manages, opens, and closes polls
- Views live results and dashboards
- Can use projector/fullscreen mode for public display

### 2.2 Voter
- No account required
- Accesses poll via QR code, direct URL, or room code
- Votes anonymously
- Cannot vote more than once per poll

---

## 3. MVP Scope

The following features are included in the first release:

| Feature | Included in MVP |
|---|---|
| Admin login / logout | Yes |
| Forgot password | Yes |
| Create poll (single/multiple choice) | Yes |
| QR code generation | Yes |
| Room code access | Yes |
| Anonymous voting | Yes |
| Duplicate vote prevention | Yes |
| Live results (auto-refresh) | Yes |
| Bar chart visualization | Yes |
| Poll open / close / pause | Yes |
| Admin results dashboard | Yes |
| Projector/fullscreen mode | Yes |
| Poll duplication | Yes |
| Poll deletion | Yes |
| Audit logging | Yes |

---

## 4. Modules

### 4.1 Authentication Module
- Email and password login for admins
- Forgot password via email reset link
- Session-based authentication (Laravel Sanctum)
- Logout
- No voter accounts

### 4.2 Poll Creation Module
- Poll title, description, instructions
- Poll type: single-choice or multiple-choice
- 2 to 10 options per poll
- System auto-generates: room code, voting URL, QR code
- Poll statuses: draft, active, paused, closed, archived

### 4.3 QR / Room Code Access Module
- Voter scans QR or visits URL or enters room code manually
- System validates room code and poll status
- Voter is redirected to the correct poll page
- Invalid or closed polls show an appropriate error message

### 4.4 Voting Module
- Display poll title, description, and all options
- Voter selects option(s) and submits
- System confirms vote with a thank-you screen
- One vote per device enforced via fingerprint + local storage + session token
- Anonymous — no voter identity is stored

### 4.5 Live Results Module
- Real-time vote count per option
- Percentage calculation
- Bar chart visualization
- Auto-refresh (polling or SSE depending on scale)
- Leaderboard-style ranking
- Projector mode (large display, minimal UI)
- Fullscreen mode

### 4.6 Poll Management Module
- Open, close, pause, reopen a poll
- Duplicate poll
- Delete poll (soft delete)
- Archive poll
- Reset poll results
- All actions are logged in audit_logs

---

## 5. Functional Requirements

### Authentication
- FR-01: Admin must log in with email and password
- FR-02: System must support password reset via email
- FR-03: Session must expire after inactivity
- FR-04: Only authenticated admins can access the admin dashboard

### Poll Creation
- FR-05: Admin can create a poll with title, description, instructions, and type
- FR-06: Poll must have at least 2 and no more than 10 options
- FR-07: System generates a unique room code on poll creation
- FR-08: System generates a QR code that encodes the voting URL
- FR-09: Poll status defaults to draft on creation

### Voting
- FR-10: Voter accesses poll by QR, URL, or room code
- FR-11: System validates poll status before allowing a vote
- FR-12: Voter can only vote once per poll per device
- FR-13: Vote is recorded anonymously
- FR-14: Voter receives a confirmation screen after voting

### Results
- FR-15: Results update in near real-time
- FR-16: Results display vote count and percentage per option
- FR-17: Admin can view results in a fullscreen/projector mode

### Poll Management
- FR-18: Admin can open, pause, close, or archive any poll
- FR-19: Admin can duplicate a poll (copies options, not votes)
- FR-20: Admin can reset results (deletes all votes for a poll)
- FR-21: All admin actions on polls are recorded in the audit log

---

## 6. Non-Functional Requirements

- NFR-01: The system must handle up to 500 concurrent voters without performance degradation
- NFR-02: Page load time must be under 2 seconds on a standard connection
- NFR-03: The voting page must work on all modern mobile browsers
- NFR-04: The QR code must be scannable at standard print sizes (minimum 2x2 cm)
- NFR-05: The system must prevent duplicate votes with at least 95% reliability for non-technical users
- NFR-06: All API endpoints must respond within 500ms under normal load
- NFR-07: The application must be deployable on a Linux VPS
- NFR-08: Admin passwords must be hashed using bcrypt

---

## 7. Future Enhancements (Post-MVP)

- Voter comment/feedback per vote
- CSV/PDF export of results
- Scheduled polls (auto-open at a set time)
- Poll embed widget for other websites
- Multi-language support
- Custom branding per poll (logo, colors)
- Email/SMS notifications
- Google OAuth for admin login
- Analytics dashboard (voter participation over time)
- Multiple admin roles (super admin, viewer)
