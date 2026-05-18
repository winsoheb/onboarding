# 🚀 Enterprise Onboarding Portal (SBQ)

Welcome to the **SBQ Enterprise Onboarding Portal**! This is a state-of-the-art, role-based platform designed to automate and streamline the entire employee onboarding lifecycle—from Talent Acquisition to IT Provisioning and Hardware Dispatch.

## 🌟 Key Features

- **Department-Specific Queues**: Custom dashboards and action queues tailored for TA, HR, IT, Asset, Dispatch, and QA teams.
- **Smart Email Generation Engine**: Automatically generates collision-free, professional official email IDs based on candidate names, checking local databases and seamlessly querying the live **Snipe-IT API** for absolute deduplication.
- **Automated Workflow Routing**: When a department approves a candidate (e.g., HR clears BGV), the ticket is instantly routed to the next department's queue (e.g., IT Provisioning).
- **Professional Announcement Automation**: Generates beautiful, uniform, single-click-copy onboarding announcement email drafts right on the ticket page.
- **Premium Glassmorphism UI**: Built with a sleek, modern aesthetic using React and TailwindCSS v4, including a fully integrated Day/Night mode toggler.

---

## 🏗 Architecture & Flow Diagram

The flowchart below maps out the entire lifecycle of an onboarding ticket as it moves seamlessly across different departments and interacts with the external Snipe-IT system.

```mermaid
graph TD
    %% Custom Styling for Departments
    classDef ta fill:#e0f2fe,stroke:#0ea5e9,stroke-width:2px,color:#0369a1,border-radius:8px
    classDef hr fill:#fce7f3,stroke:#ec4899,stroke-width:2px,color:#be185d,border-radius:8px
    classDef it fill:#e0e7ff,stroke:#6366f1,stroke-width:2px,color:#4338ca,border-radius:8px
    classDef asset fill:#dcfce7,stroke:#22c55e,stroke-width:2px,color:#15803d,border-radius:8px
    classDef external fill:#f3f4f6,stroke:#6b7280,stroke-width:2px,stroke-dasharray: 5 5,color:#374151
    classDef final fill:#fef9c3,stroke:#eab308,stroke-width:2px,color:#a16207

    %% Process Start
    Start((New Hire Selected)) --> B

    %% Talent Acquisition Stage
    subgraph TA_STAGE [Talent Acquisition Phase]
        B[TA Enters Candidate Details]:::ta
        B --> C{Check Email Duplication}:::ta
        C -- Search Snipe-IT / Local DB --> D[Generate Unique Official Email]:::ta
        D --> E[Submit Onboarding Request]:::ta
    end

    %% External APIs Integration
    SnipeIT[(Snipe-IT Inventory API)]:::external
    C -.-> SnipeIT

    %% Human Resources Stage
    subgraph HR_STAGE [HR Verification Phase]
        E -->|Ticket Status: HR Verification| F[Visible in HR Pending Queue]:::hr
        F --> G{Background Verification}:::hr
        G -- Failed --> ClosedFail((Ticket Closed)):::final
        G -- Cleared --> H[HR Approves Details]:::hr
    end

    %% IT Provisioning Stage
    subgraph IT_STAGE [IT Provisioning Phase]
        H -->|Ticket Status: IT Account Creation| I[Visible in IT Provisioning Queue]:::it
        I --> J[Create AD Account]:::it
        J --> K[Assign O365 License]:::it
        K --> L[Enable MFA & Generate Temp Password]:::it
        L --> M[IT Approves & Moves Forward]:::it
    end

    %% Asset Management Stage
    subgraph ASSET_STAGE [Asset Preparation Phase]
        M -->|Ticket Status: Asset Preparation| N[Visible in Asset Pending Queue]:::asset
        N --> O{Hardware Required?}:::asset
        O -- No --> SkipAsset[Bypass Logistics]:::asset
        O -- Yes --> P[Prepare & Configure Laptop]:::asset
        P --> Q[Log Hardware Assignment]:::asset
        Q --> R[Asset Team Approves]:::asset
    end

    %% Syncing Asset assignment with Snipe-IT
    Q -.-> SnipeIT

    %% Final Logistics & QA
    subgraph FINAL_STAGE [Logistics & Closure]
        R --> S[Dispatch Team Arranges Courier]:::external
        S --> T[QA Team Verifies Flow & Accounts]:::external
        T --> U[Ready for Joining]:::external
    end

    SkipAsset --> U
    U --> V((Candidate Successfully Joined)):::final
```

---

## 🛠 Tech Stack

### Frontend
- **React 18** (Vite)
- **TailwindCSS v4** (Utility-first styling & Dark Mode)
- **Lucide React** (Beautiful iconography)
- **React Router v6** (Client-side routing)

### Backend
- **Node.js & Express**
- **Prisma ORM** (Database modeling and querying)
- **PostgreSQL** (Relational Database)
- **Snipe-IT Integration** (External REST API for Asset Syncing)

---

## 🚀 Getting Started

### 1. Database Setup
Ensure PostgreSQL is running. Open `backend/.env` and configure your database URL and Snipe-IT API Token.
```env
DATABASE_URL="postgresql://user:password@localhost:5432/onboarding?schema=public"
SNIPEIT_URL="http://192.168.1.209/api/v1"
SNIPEIT_TOKEN="your_secure_token"
```

### 2. Run Backend
```bash
cd backend
npm install
npx prisma db push
npx prisma generate
npm run dev
```

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173` in your browser. Use the provided bypass buttons on the Login page to instantly preview different department roles!

---
*Built for scale, efficiency, and exceptional employee experiences.*
