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


