# User Stories
# QR Voting Application

**Format:** As a [role], I want to [action], so that [benefit].  
**Priority:** Must Have (MVP) | Should Have | Nice to Have

---

## 1. Admin — Authentication

-- As an admin, I want to log in with my email and password so that I can access the dashboard securely. | Must Have |
-- As an admin, I want to log out so that my session is ended on shared devices. | Must Have |
-- As an admin, I want to reset my password via email so that I can regain access if I forget it. | Must Have |
-- As an admin, I want my session to expire after inactivity so that unauthorized users cannot access my account. | Must Have |

---

## 2. Admin — Poll Creation

-- As an admin, I want to create a poll with a title, description, and instructions so that voters understand what they are voting on. | Must Have |
-- As an admin, I want to add between 2 and 10 options to a poll so that voters have meaningful choices. | Must Have |
-- As an admin, I want to choose between single-choice and multiple-choice poll types so that the voting rules match my intent. | Must Have |
-- As an admin, I want the system to automatically generate a unique room code so that I can share it with voters easily. | Must Have |
-- As an admin, I want to see a QR code for my poll so that I can display it on a screen or printed material. | Must Have |
-- As an admin, I want to download or copy the voting URL so that I can share it digitally. | Must Have |
-- As an admin, I want to edit a poll while it is in draft status so that I can correct mistakes before opening it. | Must Have |

---

## 3. Admin — Poll Management
-- As an admin, I want to open a poll so that voters can start submitting votes. | Must Have |
-- As an admin, I want to pause a poll so that I can temporarily stop new votes without closing it permanently. | Must Have |
-- As an admin, I want to close a poll so that no more votes are accepted. | Must Have |
-- As an admin, I want to archive a poll so that it is hidden from the main list but still accessible. | Should Have |
-- As an admin, I want to duplicate a poll so that I can reuse its structure for future votes. | Should Have |
-- As an admin, I want to delete a poll so that test or unwanted polls are removed. | Must Have |
-- As an admin, I want to reset the results of a poll so that I can run it again without creating a new one. | Should Have |
-- As an admin, I want to see a list of all my polls filtered by status so that I can manage them efficiently. | Must Have |

---

## 4. Admin — Results

-- As an admin, I want to see live vote counts per option so that I know how voting is progressing. | Must Have |
-- s an admin, I want to see percentages alongside vote counts so that I can understand the distribution at a glance. | Must Have |
-- As an admin, I want the results to update automatically without refreshing the page so that I can monitor a live event. | Must Have |
-- As an admin, I want a fullscreen/projector mode so that I can display results on a large screen during an event. | Must Have |
-- As an admin, I want to see options ranked from highest to lowest votes so that the leading option is immediately visible. | Must Have |

---

## 5. Voter — Access

-- As a voter, I want to scan a QR code to access a poll so that I don't need to type anything. | Must Have |
-- As a voter, I want to type a room code to access a poll so that I can participate even without a camera. | Must Have |
-- As a voter, I want to visit a direct URL to access a poll so that I can participate from a link shared online. | Must Have |
-- As a voter, I want to see a clear error message if the poll is closed or paused so that I understand why I cannot vote. | Must Have |

---

## 6. Voter — Voting

-- As a voter, I want to see the poll title, description, and all options clearly so that I can make an informed choice. | Must Have |
-- As a voter, I want to select my preferred option(s) and submit my vote with one tap so that the process is quick. | Must Have |
-- As a voter, I want to see a confirmation screen after voting so that I know my vote was recorded. | Must Have |
-- As a voter, I want the system to prevent me from voting twice so that my earlier vote is not overridden. | Must Have |
-- As a voter, I want to vote anonymously so that my choice is private. | Must Have |
-- As a voter, I want the voting page to work on my mobile phone so that I don't need a computer. | Must Have |

---

## 7. System Behaviors

-- As the system, I want to log all admin actions (create, open, close, delete) so that there is an audit trail. | Must Have |
-- As the system, I want to enforce rate limiting on the vote endpoint so that a single device cannot flood the system. | Must Have |
-- As the system, I want to reject a duplicate vote at the database level so that even concurrent submissions are handled correctly. | Must Have |
-- As the system, I want to update vote counts atomically so that the displayed totals are always accurate. | Must Have |

---

## 8. Nice to Have (Post-MVP)

-- As an admin, I want to export poll results to CSV so that I can analyze data externally. | Nice to Have |
-- As an admin, I want to schedule a poll to open at a specific time so that I don't need to be present. | Nice to Have |
-- As an admin, I want to add custom branding (logo, colors) to a poll so that it matches my organization. | Nice to Have |
-- As a voter, I want to see live results after voting so that I know how my vote compares. | Nice to Have |
