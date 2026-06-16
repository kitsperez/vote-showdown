# API Design
# QR Voting Application

**Base URL:** `/api/v1`  
**Auth:** Laravel Sanctum (Bearer token)  
**Format:** JSON

---

## Legend

| Symbol | Meaning |
|---|---|
| 🔒 | Requires admin authentication |
| 🌐 | Public — no auth required |

---

## 1. Authentication

### POST /api/v1/auth/login 🌐
Admin login.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "secret123"
}
```

**Response 200:**
```json
{
  "token": "1|abc123...",
  "admin": {
    "id": 1,
    "name": "Admin Name",
    "email": "admin@example.com"
  }
}
```

**Response 422:** Validation error  
**Response 401:** Invalid credentials

---

### POST /api/v1/auth/logout 🔒
Revoke current session token.

**Response 200:**
```json
{ "message": "Logged out successfully" }
```

---

### GET /api/v1/auth/me 🔒
Get current authenticated admin.

**Response 200:**
```json
{
  "id": 1,
  "name": "Admin Name",
  "email": "admin@example.com"
}
```

---

### POST /api/v1/auth/forgot-password 🌐
Send password reset email.

**Request:**
```json
{ "email": "admin@example.com" }
```

**Response 200:**
```json
{ "message": "Password reset link sent" }
```

---

### POST /api/v1/auth/reset-password 🌐
Reset password using token from email.

**Request:**
```json
{
  "token": "reset-token-from-email",
  "email": "admin@example.com",
  "password": "newpassword",
  "password_confirmation": "newpassword"
}
```

**Response 200:**
```json
{ "message": "Password reset successfully" }
```

---

## 2. Poll Management (Admin)

### GET /api/v1/admin/polls 🔒
List all polls for the authenticated admin.

**Query Params:**
- `status` — filter by status (draft, active, paused, closed, archived)
- `page` — pagination
- `per_page` — default 15

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Favorite Color",
      "type": "single",
      "status": "active",
      "room_code": "ABC123",
      "voting_url": "https://app.com/vote/ABC123",
      "total_votes": 42,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": { "current_page": 1, "total": 10 }
}
```

---

### POST /api/v1/admin/polls 🔒
Create a new poll.

**Request:**
```json
{
  "title": "Favorite Color",
  "description": "Pick your favorite.",
  "instructions": "Select one option below.",
  "type": "single",
  "options": [
    { "label": "Red", "display_order": 1 },
    { "label": "Blue", "display_order": 2 },
    { "label": "Green", "display_order": 3 }
  ]
}
```

**Response 201:**
```json
{
  "id": 1,
  "title": "Favorite Color",
  "room_code": "XYZ789",
  "voting_url": "https://app.com/vote/XYZ789",
  "qr_code_url": "https://app.com/storage/qrcodes/XYZ789.png",
  "status": "draft"
}
```

**Validation Rules:**
- `title`: required, max 255 chars
- `type`: required, enum: single|multiple
- `options`: required, array, min 2, max 10
- `options[].label`: required, max 255 chars

---

### GET /api/v1/admin/polls/{id} 🔒
Get a single poll with full details.

**Response 200:**
```json
{
  "id": 1,
  "title": "Favorite Color",
  "description": "...",
  "instructions": "...",
  "type": "single",
  "status": "active",
  "room_code": "XYZ789",
  "voting_url": "...",
  "qr_code_url": "...",
  "total_votes": 42,
  "options": [
    { "id": 1, "label": "Red", "vote_count": 20, "display_order": 1 },
    { "id": 2, "label": "Blue", "vote_count": 15, "display_order": 2 }
  ],
  "opened_at": "2025-01-01T10:00:00Z",
  "closed_at": null
}
```

---

### PUT /api/v1/admin/polls/{id} 🔒
Update poll details. Only allowed when status is `draft`.

**Request:** Same shape as POST  
**Response 200:** Updated poll object

---

### DELETE /api/v1/admin/polls/{id} 🔒
Soft delete a poll.

**Response 200:**
```json
{ "message": "Poll deleted" }
```

---

### POST /api/v1/admin/polls/{id}/open 🔒
Change poll status to `active`.

**Response 200:**
```json
{ "status": "active", "opened_at": "2025-01-01T10:00:00Z" }
```

---

### POST /api/v1/admin/polls/{id}/pause 🔒
Change poll status to `paused`.

**Response 200:**
```json
{ "status": "paused" }
```

---

### POST /api/v1/admin/polls/{id}/close 🔒
Change poll status to `closed`.

**Response 200:**
```json
{ "status": "closed", "closed_at": "2025-01-01T12:00:00Z" }
```

---

### POST /api/v1/admin/polls/{id}/archive 🔒
Change poll status to `archived`.

**Response 200:**
```json
{ "status": "archived" }
```

---

### POST /api/v1/admin/polls/{id}/duplicate 🔒
Duplicate a poll. Copies title, description, type, and options. Votes are not copied.

**Response 201:**
```json
{
  "id": 5,
  "title": "Favorite Color (Copy)",
  "room_code": "NEW123",
  "status": "draft"
}
```

---

### POST /api/v1/admin/polls/{id}/reset 🔒
Reset all votes for a poll. Requires `status` to be `closed` or `paused`.

**Response 200:**
```json
{ "message": "Poll results reset. All votes deleted." }
```

---

## 3. QR Code & Room Code (Public)

### GET /api/v1/polls/validate/{room_code} 🌐
Validate a room code and return poll details if active.

**Response 200:**
```json
{
  "poll_id": 1,
  "title": "Favorite Color",
  "description": "Pick your favorite.",
  "instructions": "Select one option below.",
  "type": "single",
  "status": "active",
  "options": [
    { "id": 1, "label": "Red" },
    { "id": 2, "label": "Blue" }
  ]
}
```

**Response 404:** Room code not found  
**Response 422:** Poll is not active (with `status` in response)

---

### GET /api/v1/polls/{room_code} 🌐
Alias for the above — used by QR code URL and direct link.

Same response shape as `validate`.

---

## 4. Voting (Public)

### POST /api/v1/polls/{room_code}/vote 🌐
Submit a vote.

**Request:**
```json
{
  "option_ids": [2],
  "voter_token": "hashed-device-fingerprint",
  "session_token": "local-session-uuid"
}
```

**Response 201:**
```json
{
  "message": "Vote submitted successfully",
  "vote_id": 99
}
```

**Response 409:** Already voted  
**Response 422:** Poll not active / invalid option selection  
**Response 429:** Rate limit exceeded

**Notes:**
- For single-choice polls, `option_ids` must have exactly 1 item
- For multiple-choice polls, `option_ids` must have 1 or more items
- Server validates `voter_token` uniqueness against `votes` table
- Server stores `voter_token` in hashed form only

---

### GET /api/v1/polls/{room_code}/check-vote 🌐
Check if a device has already voted for this poll.

**Request query param:** `voter_token=hashed-value`

**Response 200:**
```json
{ "has_voted": true }
```

---

## 5. Live Results

### GET /api/v1/polls/{room_code}/results 🌐
Get current results for a poll.

**Response 200:**
```json
{
  "poll_id": 1,
  "title": "Favorite Color",
  "status": "active",
  "total_votes": 42,
  "options": [
    {
      "id": 1,
      "label": "Red",
      "vote_count": 20,
      "percentage": 47.6
    },
    {
      "id": 2,
      "label": "Blue",
      "vote_count": 15,
      "percentage": 35.7
    },
    {
      "id": 3,
      "label": "Green",
      "vote_count": 7,
      "percentage": 16.7
    }
  ],
  "last_updated": "2025-01-01T10:05:00Z"
}
```

---

### GET /api/v1/admin/polls/{id}/results 🔒
Admin-only results view with full metadata.

Same shape as public results plus:
```json
{
  "opened_at": "...",
  "closed_at": null,
  "audit_summary": {
    "last_action": "poll.opened",
    "last_action_at": "2025-01-01T10:00:00Z"
  }
}
```

---

## 6. Error Response Format

All errors follow this structure:

```json
{
  "message": "Human-readable error message",
  "errors": {
    "field_name": ["Validation message here"]
  }
}
```

**Status Codes Used:**

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad request |
| 401 | Unauthenticated |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict (duplicate vote) |
| 422 | Validation error |
| 429 | Too many requests |
| 500 | Server error |

---

## 7. Rate Limiting

| Route | Limit |
|---|---|
| POST /auth/login | 5 per minute per IP |
| POST /polls/{code}/vote | 3 per minute per IP |
| GET /polls/*/results | 30 per minute per IP |
| GET /polls/validate/* | 20 per minute per IP |
