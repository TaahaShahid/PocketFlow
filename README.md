# PocketFlow

PocketFlow is a production-style full-stack personal finance management platform that enables users to manage wallets, budgets, transactions, savings goals, and financial analytics through a modern web application.

The project is designed to simulate a real-world cloud-native application by combining modern frontend development, backend APIs, containerization, cloud deployment, CI/CD, and Infrastructure as Code.

---

# Features

* 🔐 Firebase Authentication
* 💳 Wallet Management
* 💰 Budget Planning
* 📈 Transaction Tracking
* 🎯 Savings Goals
* 📊 Dashboard Analytics
* 📱 Responsive User Interface
* ☁️ Cloud Deployment
* 🚀 Automated CI/CD Pipeline

---

# Tech Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Axios
* Firebase Authentication

## Backend

* FastAPI
* Python
* Firestore
* Pydantic

## Cloud & DevOps

* AWS EC2
* Amazon ECR
* Docker
* Docker Compose
* Nginx
* GitHub Actions
* Vercel

---

# Project Structure

```text
PocketFlow/
│
├── finance-dashboard/        # Next.js Frontend
├── finance-backend/          # FastAPI Backend
├── nginx/                    # Reverse Proxy
├── .github/workflows/        # CI/CD Pipelines
├── docker-compose.prod.yml
├── .env.example
└── README.md
```

---

# Architecture

```text
                         GitHub
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
      GitHub Actions                   Vercel
             │                             │
             ▼                             ▼
       Build Backend               Next.js Frontend
             │                             │
             ▼                     /api Rewrite Proxy
        Amazon ECR                         │
             │                             ▼
             ▼                     AWS EC2 + Nginx
       Docker Backend                      │
             │                             ▼
             └────────────────────► FastAPI Backend
                                           │
                                           ▼
                                   Firebase Firestore
```

---

# Deployment

## Frontend

The frontend is hosted on **Vercel**.

Every push to the **main** branch automatically deploys the latest frontend version.

---

## Backend

The backend is hosted on an **AWS EC2** instance.

Deployment pipeline:

1. Push changes to GitHub
2. GitHub Actions builds the backend Docker image
3. Image is pushed to Amazon ECR
4. GitHub Actions connects to EC2 over SSH
5. Docker Compose pulls the latest backend image
6. Backend container is recreated automatically
7. Nginx continues serving API requests

---

# Environment Variables

## Frontend

```env
NEXT_PUBLIC_API_URL=

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

## Backend

```env
FIREBASE_SERVICE_ACCOUNT_B64=
```

---

# Running Locally

## Frontend

```bash
cd finance-dashboard

npm install

npm run dev
```

Frontend runs on:

```
http://localhost:3000
```

---

## Backend

```bash
cd finance-backend

python -m venv .venv

source .venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend runs on:

```
http://localhost:8000
```

---

# CI/CD

## Frontend

* Hosted on Vercel
* Automatic deployments from GitHub
* Instant Preview Deployments
* Production deployments on every push to `main`

---

## Backend

* GitHub Actions
* Docker Image Build
* Amazon ECR
* AWS EC2 Deployment
* Docker Compose
* Nginx Reverse Proxy

---

# Roadmap

The following improvements are planned for future versions of PocketFlow:

## Infrastructure

* Terraform Infrastructure as Code
* Modular Terraform Architecture
* Automated AWS Infrastructure Provisioning
* Infrastructure Versioning

## Container Orchestration

* Kubernetes
* Amazon EKS Deployment
* Rolling Updates
* Horizontal Pod Autoscaling
* Self-Healing Deployments

## Cloud Improvements

* Custom Domain
* HTTPS Backend
* CloudWatch Monitoring
* Centralized Logging
* Automated Backups
* Secrets Management

## Application

* Email Notifications
* AI-powered Spending Insights
* Recurring Transactions
* CSV Import / Export
* Advanced Reporting
* Multi-user Collaboration

## Testing

* Unit Testing
* Integration Testing
* End-to-End Testing
* Automated Test Pipeline

---

# Certifications

* AWS Certified Solutions Architect – Associate
* AWS Certified Cloud Practitioner

---

# Author

**Taaha Shahid**

Software Engineer | Cloud & DevOps Enthusiast

GitHub: https://github.com/TaahaShahid

LinkedIn: https://linkedin.com/in/taaha-shahid-3baa16408
