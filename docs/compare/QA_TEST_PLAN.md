# QA Test Plan
# QR Voting Application

**Version:** 1.0

---

## 1. Testing Scope

This plan covers all MVP features. Each module has functional, edge case, and negative tests.

---

## 2. Test Types

| Type | Tool | Who |
|---|---|---|
| Unit tests (backend) | PHPUnit / Pest | Developer |
| Feature tests (API) | PHPUnit / Pest | Developer |
| Component tests (frontend) | Vitest + RTL | Developer |
| E2E tests | Playwright | Developer / QA |
| Manual QA | Browser | QA / Developer |
| Load testing | k6 | Developer |

---

## 3. Authentication

### TC-AUTH-01: Valid Login
- **Input:** Correct email and password
- **Expected:** Returns 200 with token and admin object

### TC-AUTH-02: Invalid Password
- **Input:** Correct email, wrong password
- **Expected:** Returns 401 with error message

### TC-AUTH-03: Non-Existent Email
- **Input:** Email not in database
- **Expected:** Returns 401 (do not reveal whether email exists)

### TC-AUTH-04: Rate Limiting on Login
- **Input:** 6+ login attempts in one minute from same IP
- **Expected:** 6th request returns 429

### TC-AUTH-05: Forgot Password with Valid Email
- **Input:** Registered admin email
- **Expected:** Returns 200, email is sent with reset link

### TC-AUTH-06: Forgot Password with Unknown Email
- **Input:** Email not in database
- **Expected:** Returns 200 (do not reveal whether email exists)

### TC-AUTH-07: Password Reset with Valid Token
- **Input:** Valid reset token + matching passwords
- **Expected:** Returns 200, password is updated

### TC-AUTH-08: Password Reset with Expired Token
- **Input:** Token older than 60 minutes
- **Expected:** Returns 422 with token expired message

### TC-AUTH-09: Logout
- **Input:** Valid Bearer token
- **Expected:** Returns 200, token is revoked, subsequent requests with same token return 401

### TC-AUTH-10: Access Admin Route Without Token
- **Input:** GET /admin/polls with no Authorization header
- **Expected:** Returns 401

---

## 4. Poll Creation

### TC-POLL-01: Create Valid Single-Choice Poll
- **Input:** Title, type: single, 3 valid options
- **Expected:** Returns 201 with poll object including room_code, voting_url, and qr_code_url

### TC-POLL-02: Create Valid Multiple-Choice Poll
- **Input:** Title, type: multiple, 5 options
- **Expected:** Returns 201

### TC-POLL-03: Create Poll with 1 Option
- **Input:** Only 1 option in options array
- **Expected:** Returns 422 with validation error

### TC-POLL-04: Create Poll with 11 Options
- **Input:** 11 options in options array
- **Expected:** Returns 422 with validation error

### TC-POLL-05: Create Poll with Empty Title
- **Input:** Title is empty string
- **Expected:** Returns 422 with title required error

### TC-POLL-06: Room Code Uniqueness
- **Action:** Create 100 polls
- **Expected:** All room codes are unique

### TC-POLL-07: QR Code is Generated
- **Action:** Create a poll
- **Expected:** `qr_code_url` is accessible and returns a valid image

### TC-POLL-08: Default Status is Draft
- **Action:** Create a poll
- **Expected:** `status` field in response is `draft`

---

## 5. Poll Lifecycle

### TC-LIFECYCLE-01: Open a Draft Poll
- **Action:** POST /admin/polls/:id/open on a draft poll
- **Expected:** Status changes to `active`, `opened_at` is set

### TC-LIFECYCLE-02: Pause an Active Poll
- **Action:** POST /admin/polls/:id/pause on an active poll
- **Expected:** Status changes to `paused`

### TC-LIFECYCLE-03: Close an Active Poll
- **Action:** POST /admin/polls/:id/close on an active poll
- **Expected:** Status changes to `closed`, `closed_at` is set

### TC-LIFECYCLE-04: Cannot Vote on Paused Poll
- **Action:** Submit vote to a paused poll
- **Expected:** Returns 422 with poll not active message

### TC-LIFECYCLE-05: Cannot Vote on Closed Poll
- **Action:** Submit vote to a closed poll
- **Expected:** Returns 422

### TC-LIFECYCLE-06: Edit Draft Poll
- **Action:** PUT /admin/polls/:id on a draft poll
- **Expected:** Returns 200 with updated data

### TC-LIFECYCLE-07: Cannot Edit Active Poll
- **Action:** PUT /admin/polls/:id on an active poll
- **Expected:** Returns 422 or 403 with appropriate message

### TC-LIFECYCLE-08: Duplicate Poll
- **Action:** POST /admin/polls/:id/duplicate
- **Expected:** New poll created with same title (+ "Copy"), same options, zero votes, status draft

### TC-LIFECYCLE-09: Delete Poll (Soft Delete)
- **Action:** DELETE /admin/polls/:id
- **Expected:** Poll no longer appears in list, `deleted_at` is set in DB

### TC-LIFECYCLE-10: Reset Results
- **Action:** POST /admin/polls/:id/reset on a closed poll
- **Expected:** All votes deleted, `total_votes` and all `vote_count` fields reset to 0

---

## 6. QR Code & Room Code Access

### TC-ACCESS-01: Valid Room Code
- **Input:** Valid room code for an active poll
- **Expected:** Returns 200 with poll details and options

### TC-ACCESS-02: Invalid Room Code
- **Input:** Room code that does not exist
- **Expected:** Returns 404

### TC-ACCESS-03: Room Code for Closed Poll
- **Input:** Valid room code for a closed poll
- **Expected:** Returns 422 with `status: closed`

### TC-ACCESS-04: Room Code is Case-Insensitive
- **Input:** Lowercase version of a valid room code
- **Expected:** Returns 200 (normalize to uppercase server-side)

### TC-ACCESS-05: QR Code URL Redirects to Correct Poll
- **Action:** Visit the URL encoded in the QR code
- **Expected:** Voter lands on the correct voting page

---

## 7. Voting

### TC-VOTE-01: Submit Valid Single-Choice Vote
- **Input:** One `option_id` for a single-choice poll
- **Expected:** Returns 201, vote count increments

### TC-VOTE-02: Submit Valid Multiple-Choice Vote
- **Input:** Two `option_ids` for a multiple-choice poll
- **Expected:** Returns 201, both option counts increment

### TC-VOTE-03: Submit Two Options for Single-Choice Poll
- **Input:** Two `option_ids` for a single-choice poll
- **Expected:** Returns 422

### TC-VOTE-04: Submit Zero Options
- **Input:** Empty `option_ids` array
- **Expected:** Returns 422

### TC-VOTE-05: Submit Option Not Belonging to Poll
- **Input:** `option_id` from a different poll
- **Expected:** Returns 422

### TC-VOTE-06: Duplicate Vote — Same Token
- **Action:** Submit vote twice with same voter_token
- **Expected:** First returns 201, second returns 409

### TC-VOTE-07: Duplicate Vote — Concurrent Requests
- **Action:** Send 5 simultaneous vote requests with the same voter_token
- **Expected:** Exactly 1 vote is recorded, others return 409 or 500

### TC-VOTE-08: Total Vote Count Increments
- **Action:** Submit 10 valid votes (different tokens)
- **Expected:** `polls.total_votes` = 10 and option counts sum to 10

### TC-VOTE-09: Vote on Archived Poll
- **Input:** Valid room code for an archived poll
- **Expected:** Returns 422

---

## 8. Live Results

### TC-RESULTS-01: Results Match Submitted Votes
- **Action:** Submit 5 votes for option A and 3 for option B
- **Expected:** Results show A: 5 (62.5%), B: 3 (37.5%), total: 8

### TC-RESULTS-02: Percentages Sum to 100
- **Action:** Fetch results for any poll with votes
- **Expected:** Percentages of all options sum to 100 (allow ±0.1 for rounding)

### TC-RESULTS-03: Results Refresh
- **Action:** Submit a vote, then fetch results after 3 seconds
- **Expected:** Results reflect the new vote

### TC-RESULTS-04: Results Accessible Without Auth
- **Action:** GET /polls/:room_code/results without Bearer token
- **Expected:** Returns 200

### TC-RESULTS-05: Zero Votes State
- **Action:** Fetch results for a poll with no votes
- **Expected:** All percentages are 0, total_votes is 0

---

## 9. Security Tests

### TC-SEC-01: Rate Limit on Vote Endpoint
- **Action:** Submit 4 votes from same IP within 1 minute
- **Expected:** 4th request returns 429

### TC-SEC-02: Admin Cannot Access Another Admin's Poll
- **Action:** Admin B tries to GET /admin/polls/:id where poll belongs to Admin A
- **Expected:** Returns 404 or 403

### TC-SEC-03: XSS in Poll Title
- **Input:** Title = `<script>alert('xss')</script>`
- **Expected:** Stored as plain text, rendered escaped in UI, no script executes

### TC-SEC-04: SQL Injection in Room Code
- **Input:** Room code = `'; DROP TABLE polls; --`
- **Expected:** Returns 404, no database error, no data loss

### TC-SEC-05: Unauthenticated Access to Admin Poll List
- **Action:** GET /admin/polls with no token
- **Expected:** Returns 401

---

## 10. Mobile & Browser Compatibility

Test the voter flow on:

| Browser | OS | Test |
|---|---|---|
| Chrome | Android | QR scan → vote → confirm |
| Safari | iOS | QR scan → vote → confirm |
| Chrome | iOS | Room code entry → vote → confirm |
| Firefox | Android | Room code entry → vote → confirm |
| Chrome | Desktop | Full admin flow |
| Safari | macOS | Full admin flow |

---

## 11. Load Testing (k6)

### Scenario A — 500 concurrent voters
- 500 virtual users each submit one vote over 60 seconds
- **Acceptance:** No 5xx errors, p95 response time < 500ms

### Scenario B — Vote submission burst
- 100 users submit votes simultaneously within 1 second
- **Acceptance:** Exactly 100 votes recorded (no duplicate, no lost vote)

### Scenario C — Results page under load
- 200 users poll the results endpoint every 3 seconds for 5 minutes
- **Acceptance:** p95 response time < 300ms, no errors

---

## 12. Pre-Launch Checklist

- [ ] All TC-AUTH tests pass
- [ ] All TC-POLL tests pass
- [ ] All TC-VOTE tests pass
- [ ] All TC-RESULTS tests pass
- [ ] All TC-SEC tests pass
- [ ] QR code scans successfully on iOS and Android
- [ ] Voter flow works on mobile Safari
- [ ] Admin dashboard works on desktop Chrome and Safari
- [ ] Load test Scenario A passes
- [ ] `APP_DEBUG=false` on production
- [ ] SSL certificate installed and auto-renewing
- [ ] Database is not publicly accessible
- [ ] Audit logs are recording all admin actions
- [ ] Email delivery (password reset) tested on production SMTP
