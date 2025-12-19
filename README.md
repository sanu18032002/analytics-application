# Causal Funnel (Analytics Application) – Full Stack Analytics Assignment

A user analytics platform that tracks page views and clicks, and visualizes user journeys and heatmaps.

---

## 🚀 Quick Start (Docker)

The easiest way to run the entire stack is using Docker Compose.

### Prerequisites

- Docker
- Docker Compose

### Run the App

- docker-compose up --build

---

## 🔧 Configuration (Environment Variables)

For local Docker usage, `docker-compose.yml` already sets sane defaults.

### Backend (`backend/server.js`)

- **`MONGO_URI`**: Mongo connection string (default: `mongodb://127.0.0.1:27017/user_analytics`)
- **`CORS_ORIGINS`**: Comma-separated allowlist for browser origins (example: `http://localhost:3000,http://localhost:8080`)
- **`JSON_BODY_LIMIT`**: Request body limit (default: `64kb`)
- **`EVENT_TTL_SECONDS`**: Event retention in seconds (default: 30 days)

Example file: `backend/env.example`

### Dashboard (`dashboard/app/*`)

- **`NEXT_PUBLIC_API_BASE_URL`**: Browser API base URL (used by client components)
- **`API_BASE_URL`**: Server-side API base URL (used by Next server components)

Example file: `dashboard/env.example`

Important: `NEXT_PUBLIC_*` values are inlined into the client bundle at **build time**. In Docker, this repo passes it as a build arg in `docker-compose.yml`.


### Access the Services

- **Dashboard:** http://localhost:3000  
- **Test Website:** http://localhost:8080/test.html  
- **Backend API:** http://localhost:5000  

---

## 🛠 Tech Stack

- **Frontend:** Next.js (App Router), Tailwind CSS  
- **Backend:** Node.js, Express  
- **Database:** MongoDB  
- **DevOps:** Docker, Docker Compose  

---

## 📝 Usage Guide

1. Open the **Test Website**:  
   http://localhost:8080/test.html  
2. Click the buttons on the test page to generate event data.  
3. Open the **Dashboard**:  
   http://localhost:3000  
4. Click **“View Heatmaps”** and enter the URL:  
   `http://localhost:8080/test.html`

---

## 💡 Assumptions & Trade-offs

- **Heatmap Visualization:**  
  The heatmap uses an iframe overlay. This requires the target website to allow framing (no `X-Frame-Options: DENY` headers).

- **Session Persistence:**  
  Sessions are stored in `localStorage`. If the user clears browser data, a new session ID is generated.

- **Scalability:**  
  For this demo, MongoDB writes are synchronous. In a high-scale production environment, a message queue (Kafka/RabbitMQ) would be used to buffer events before writing to the database.

## 🧭 Future Enhancements (Roadmap)

While the current MVP meets the core requirements, the following features are planned for production readiness:

### 🔴 Critical (Security & Stability)
* **Secure Ingestion:** Implement request schema validation (Zod/Joi) for `/api/events` to drop unknown fields. Add API key authentication per tracked site to prevent abuse.
* **Rate Limiting:** Implement `express-rate-limit` to prevent event flooding from malicious clients.
* **Strict Authorization:** Move beyond simple CORS allowlists; enforce per-site authentication tokens so allowed origins cannot spam the ingestion endpoint.
* **Infrastructure Stability:** Pin the MongoDB Docker image version (e.g., `mongo:8.2`) instead of `latest` to prevent volume incompatibility during future upgrades.

### 🟠 High (Architecture & Accuracy)
* **BFF Pattern (Backend for Frontend):** Route browser traffic through Next.js Route Handlers (`app/api/*`) to keep the Node.js backend internal. This hides backend hostnames from the client and simplifies CORS.
* **Heatmap Accuracy:** Persist element identifiers (CSS Selectors) or element-relative coordinates rather than absolute page coordinates. This ensures heatmaps remain accurate across different screen sizes and responsive layouts.
* **Observability:** Add structured logging (Winston/Pino), unique request IDs, and basic metrics (ingestion rate, latency, DB write failures) for better debugging.

### 🟡 Medium (Scalability & Maintainability)
* **Code Modularization:** Refactor the monolithic `server.js` into distinct `models/`, `routes/`, and `controllers/` directories for better testability and maintenance.
* **Data Modeling:** Introduce a separate `sessions` collection with pre-aggregated stats to speed up the dashboard load times as data volume grows.
* **Security Hardening:** Implement `helmet` for security headers, strict timeouts, and configure `trust proxy` settings for deployment behind Nginx/Load Balancers.

### 🟢 Low (UX & Documentation)
* **UI Polish:** Improve the dashboard with consistent component styling, skeleton loading states, and pagination for the sessions list.
* **Developer Experience:** Add documentation for "Data Reset" procedures and Docker volume management.


