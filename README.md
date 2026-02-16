# Real-Time Polling Application

## Overview

This is a full-stack real-time polling application that allows users to:

- Create polls with multiple options
- Share poll links
- Vote in real time
- View live vote updates instantly
- Prevent duplicate voting using anti-abuse mechanisms

### Tech Stack

- **Frontend:** React (Vite) – Deployed on Vercel  
- **Backend:** Express.js – Deployed on Render  
- **Database:** PostgreSQL (Neon)  
- **Real-Time Communication:** Socket.io  

---

# Fairness / Anti-Abuse Mechanisms

To ensure fair voting and reduce abuse, the system implements two layered protection mechanisms.

## 1. IP-Based Vote Restriction

Each vote stores the client’s IP address in the database.

Before accepting a vote, the backend checks:

- Whether a vote already exists for the same poll from the same IP address.

If found, the vote is rejected.

### Why this helps
- Prevents repeated voting from the same network.
- Reduces simple abuse using page refresh or scripts.

---

## 2. Browser-Based Unique Token (UUID)

When a user votes in a poll:

- A unique UUID is generated.
- It is stored in `localStorage` in the browser.
- The token is sent along with the vote request.
- The backend stores this token in the database.

Before accepting a vote, the backend checks:

- Whether the same token has already voted in that poll.

If found, the vote is rejected.

### Why this helps
- Prevents duplicate voting from the same browser.
- Blocks repeated voting after page refresh.
- Adds protection even when users share the same network.

---

## Combined Protection Logic

A vote is rejected if:

- The IP address has already voted, **OR**
- The browser token has already voted.

This layered approach balances fairness and simplicity without requiring authentication.

---

# Edge Cases Handled

The system handles multiple important edge cases.

## Poll Creation

- Empty poll title is rejected.
- Less than two options is rejected.
- Duplicate options are not allowed.
- Empty option fields are ignored.
- Maximum of 10 options enforced.
- Option length validation implemented.

---

## Voting

- Invalid poll ID returns proper error.
- Invalid option ID is rejected.
- Duplicate votes (same IP or token) are blocked.
- Vote without selecting an option is prevented.
- Vote button disables after successful submission.
- Options maintain fixed order during real-time updates for good structure.

---

## Real-Time Consistency

- Each poll acts as a separate Socket.io room.
- Only users viewing a specific poll receive updates.
- Vote updates do not reorder options (using `option_order` column).
- Database transactions (`BEGIN / COMMIT`) prevent race conditions.

---

## Deployment Edge Cases

- Dynamic CORS configuration supports production and preview URLs(for vercel domain).
- Environment-based configuration for local and production environments.
- Handles Render free-tier cold starts.

---

# Known Limitations

While the system is robust for assignment-level implementation, some limitations exist.

## 1. Shared Network Limitation

Users on the same public IP (e.g., office WiFi) may be restricted due to IP-based validation.

This is a tradeoff of using IP protection.

---

## 2. Token Resetting

Users can potentially bypass browser-token protection by:

- Using incognito mode
- Clearing localStorage
- Switching browsers

A stronger solution would require authentication.

---

## 3. No Authentication System

The system does not currently implement:

- User login
- OAuth
- Email verification

This was intentionally omitted to keep the system lightweight.

---

## 4. Free-Tier Hosting Constraints

- Backend may sleep after inactivity (Render free tier).
- WebSocket reconnection may take a few seconds after cold start.

---

# Future Improvements

If extended further, the following enhancements could be implemented:

- User authentication (Google OAuth or email login)
- Rate limiting middleware
- CAPTCHA integration
- Poll expiration feature
- Admin analytics dashboard
- Horizontal scaling with Redis for Socket.io

---

# Architecture Overview

Frontend (Vercel) ---> REST + WebSocket ---> Backend (Render) ---> PostgreSQL (Neon)


Each poll functions as a real-time room. When a vote occurs:

1. Vote is validated (IP + token).
2. Database is updated inside a transaction.
3. Updated results are emitted to the poll room.
4. All connected users see the update instantly.

---

# Conclusion

This project demonstrates:

- Full-stack application development
- Real-time communication using WebSockets
- Distributed deployment across cloud services
- Anti-abuse protection strategies
- Database integrity management
- Production-aware configuration

The system balances simplicity, fairness, and scalability while remaining suitable for lightweight real-time polling use cases.
