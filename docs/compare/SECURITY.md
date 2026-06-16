# Security Review
# QR Voting Application

**Version:** 1.0

---

## 1. Duplicate Vote Prevention

This is the most critical security concern for a public, anonymous voting system.

### Strategy: Three-Layer Defense

**Layer 1 — Database Unique Constraint**
- `votes` table has a `UNIQUE(poll_id, voter_token)` index
- This is the hard, non-bypassable server-side guard
- Even if the client sends multiple requests, only one will succeed

**Layer 2 — Voter Token (Hashed Device Fingerprint)**
- On page load, the voter's browser generates a fingerprint from: `User-Agent`, `screen resolution`, `timezone`, `language`, `canvas fingerprint`, `WebGL fingerprint`
- These signals are combined and hashed (SHA-256) client-side
- The hash is stored in `localStorage` under a poll-specific key
- The same hash is sent with the vote submission
- The server hashes it again before storing — raw fingerprint data never persists

**Layer 3 — Session Token**
- On first visit to a poll page, the server issues a short-lived session token
- Stored in `localStorage`
- Checked via `voter_sessions` table before accepting a vote

**Limitations:**
- Determined users in incognito + VPN can bypass fingerprinting
- This is acceptable — the system targets casual/accidental duplicate votes, not determined adversaries
- For high-stakes votes, additional controls (email OTP, etc.) should be added as a future enhancement

---

## 2. Rate Limiting

Apply Laravel's built-in throttle middleware:

| Endpoint | Limit | Scope |
|---|---|---|
| POST /auth/login | 5 / min | Per IP |
| POST /auth/forgot-password | 3 / min | Per IP |
| POST /polls/:code/vote | 3 / min | Per IP |
| GET /polls/:code/results | 30 / min | Per IP |
| GET /polls/validate/:code | 20 / min | Per IP |
| All other admin endpoints | 60 / min | Per token |

Rate limit responses return HTTP `429 Too Many Requests` with a `Retry-After` header.

---

## 3. CSRF Protection

- Laravel's CSRF protection is enabled for all non-API (web) routes
- The API uses Sanctum token authentication — token-based auth is inherently CSRF-resistant for API routes
- SPA (React) communicates via Bearer token in the `Authorization` header, not cookies
- If cookies are used for auth, include the `X-XSRF-TOKEN` header per Laravel Sanctum documentation

---

## 4. XSS Prevention

**Server-side:**
- All text inputs (poll title, description, options) are stored as plain text
- All API responses return JSON — no HTML rendering on the server side

**Client-side (React):**
- React escapes all values rendered via JSX by default
- Never use `dangerouslySetInnerHTML` with user-generated content
- Sanitize any rich text fields (description/instructions) with DOMPurify if you ever add HTML support

**Content Security Policy (CSP):**
- Set a strict CSP header on the server
- Disallow inline scripts
- Allow only known CDN sources for external assets

---

## 5. SQL Injection Prevention

- All database queries must use Laravel Eloquent ORM or Query Builder with parameterized bindings
- Never concatenate user input directly into raw SQL strings
- If raw queries are necessary, always use `DB::select()` with named bindings
- Input validation runs before any query is executed

---

## 6. Room Code Security

- Room codes are 6-character uppercase alphanumeric strings (excluding ambiguous characters)
- Total keyspace: ~28 million combinations (excluding O, 0, I, 1, L from 36 chars = 31 chars → 31^6 ≈ 887 million, then filtered)
- Rate limiting on the validate endpoint (20 / min per IP) makes brute-force enumeration impractical
- Room codes are only active while a poll status is `active`
- Expired/closed poll codes return `422` with a `status` field — they do not reveal other poll details

---

## 7. QR Code Abuse Prevention

- QR codes encode the public voting URL only — no admin tokens or secrets
- QR code images are stored server-side; the URL path does not expose internal IDs
- QR codes for closed polls resolve to the same validation endpoint which returns `422`
- No additional security is needed beyond poll status validation

---

## 8. API Protection

**Authentication:**
- Sanctum Bearer token required for all `/admin/*` routes
- Tokens are stored server-side and can be revoked on logout
- Token expiry: configurable, recommend 8 hours for admin sessions

**Authorization:**
- Admins can only access their own polls — enforce with `where('admin_id', auth()->id())` on all poll queries
- Never expose other admins' polls or data

**Input Validation:**
- All request inputs validated with Laravel Form Requests before controller logic runs
- Reject unexpected fields (use `$request->validated()` only)

**Response Hardening:**
- Never return stack traces or database errors in production responses
- Use Laravel's `APP_DEBUG=false` in production
- Return generic `500` messages — log details server-side only

---

## 9. Admin Account Security

- Passwords hashed with bcrypt (Laravel default, cost factor 12+)
- Password reset tokens expire after 60 minutes
- Failed login attempts are rate-limited (5 per minute)
- No admin self-registration — accounts are seeded or created via CLI
- Consider enforcing a minimum password length of 12 characters

---

## 10. Infrastructure Security

- HTTPS enforced on all routes (SSL/TLS via Let's Encrypt on VPS)
- HTTP → HTTPS redirect at the web server level (Nginx)
- Database not exposed to the public internet — accessible only from the application server
- `.env` file excluded from version control (`.gitignore`)
- Sensitive environment variables: `APP_KEY`, `DB_PASSWORD`, `MAIL_PASSWORD` stored securely
- Server firewall: allow only ports 80, 443, and SSH (22 with key-only auth)

---

## 11. Data Privacy

- No personal voter data is stored
- `voter_token` is a SHA-256 hash — the original fingerprint is discarded
- `ip_address` is stored in votes for abuse investigation only — not linked to any voter identity
- `voter_sessions` records are purged after `expires_at` via a scheduled cleanup job
- Admins should be informed of this in the system documentation
