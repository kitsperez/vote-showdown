# User Stories
# Vote Showdown

> **Realigned to the source of truth.** Roles updated to **Admin / Poll Creator / Voter** (D20),
> with guest voting by email/`voter_key` (not anonymous fingerprinting) and live results over
> Reverb. Format: As a [role], I want to [action], so that [benefit]. Priority: Must / Should / Nice.

---

## 1. Auth & Account

- As a **Poll Creator**, I want to register and log in, so that I can build and run my own polls. | Must |
- As a user, I want to log out, so that my session ends on shared devices. | Must |
- As a user, I want to reset my password by email, so that I can regain access. | Must |
- As an **Admin**, I want to manage user accounts and roles (D16), so that I control who can create polls. | Should |

## 2. Poll Creation (Poll Creator)

- As a Poll Creator, I want to create a poll with a title and optional description, so that voters know what they're voting on. | Must |
- As a Poll Creator, I want 2–10 options, each with a color and optionally an image or icon, so that the poll looks on-brand. | Must |
- As a Poll Creator, I want to choose single- or multiple-choice, so that the rules match my intent. | Must |
- As a Poll Creator, I want to set the poll to end after a countdown or at a deadline, so that it closes automatically. | Must |
- As a Poll Creator, I want an optional access password, so that only invited people can vote (D9). | Should |
- As a Poll Creator, I want a QR code and share link for my poll, so that I can display or send it. | Must |
- As a Poll Creator, I want to edit a poll, so that I can fix mistakes before/while it runs. | Must |

## 3. Poll Management

- As a Poll Creator, I want to launch a poll, so that voting opens (one active poll at a time per creator). | Must |
- As a Poll Creator/Admin, I want to close a poll, so that no more votes are accepted. | Must |
- As a Poll Creator/Admin, I want to restart a poll, so that I can run a fresh round (clears votes). | Should |
- As an Admin, I want to add time to a running poll, so that I can extend a close finish. | Should |
- As an Admin, I want to delete a poll, so that test/unwanted polls are removed. | Must |
- As an Admin, I want to remove a specific voter's votes (D18), so that I can moderate abuse. | Should |
- As a user, I want my poll list and dashboard, so that I can manage and monitor my polls. | Must |

## 4. Results

- As a viewer, I want live vote counts per option, so that I can follow progress. | Must |
- As a viewer, I want percentages alongside counts, so that I understand the distribution. | Must |
- As a viewer, I want results to update without refreshing (Reverb), so that I can watch a live event. | Must |
- As a Poll Creator, I want a public results/projection page, so that I can display it on a big screen. | Must |
- As a viewer, I want a clear winner highlighted when the poll ends, so that the outcome is obvious. | Should |

## 5. Voting (Voter)

- As a Voter, I want to scan a QR or open a link to reach a poll, so that I don't have to type anything. | Must |
- As a Voter, I want to vote without creating an account (guest by email/device), so that it's low friction. | Must |
- As a Voter, I want to be stopped from voting twice, so that my earlier vote isn't overridden. | Must |
- As a Voter, I want a clear message if the poll is locked, not started, or ended, so that I understand why I can't vote. | Must |
- As a Voter, I want to enter the access password once when required, so that I can vote on a gated poll. | Should |
- As a Voter, I want the voting page to work well on mobile, so that I don't need a computer. | Must |

## 6. System Behaviors

- As the system, I want tallies derived from vote rows, so that counts are always accurate and never client-trusted (D3). | Must |
- As the system, I want one vote per `voter_key` enforced by a lock + unique index, so that concurrent submissions can't duplicate (R2). | Must |
- As the system, I want votes to persist even if broadcasting fails, so that Reverb outages don't lose votes (R6). | Must |
- As the system, I want expired polls auto-ended on read and by the scheduler, so that timing is authoritative (R8). | Must |
- As the system, I want public/voting endpoints rate-limited, so that flooding/enumeration is blunted (R4). | Must |
- As the system, I want only salted IP hashes stored for visit stats (D17), so that no raw PII is kept (R13). | Should |

## 7. Nice to Have (post-current)

- As a Voter, I want a magic link that drops me straight onto the voting page (D2). | Nice |
- As an Admin, I want an audit log of admin actions, so that there's accountability. | Nice |
- As a Poll Creator, I want to duplicate a poll, so that I can reuse its structure. | Nice |
- As a Poll Creator, I want to export results, so that I can analyze them externally. | Nice |
