# SBQ Employee Onboarding Platform - Troubleshooting & Operations Guide

This document contains essential instructions on how to start the application, common troubleshooting scenarios, and important backend/database information.

---

## 🚀 How to Start the App

The platform consists of a **Node.js (Express)** backend and a **React (Vite)** frontend. Both must be running simultaneously for the app to function.

### 1. Start the Backend Server
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. *Expected Output:* You should see a message saying `Server running on port 5000` and `Default Super Admin user seeded successfully!`.

### 2. Start the Frontend Application
1. Open a second, separate terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. *Expected Output:* You should see a message saying `VITE ready in X ms` and a local network link: `http://localhost:5173/`. 
4. Open your browser and navigate to `http://localhost:5173/`.

---

## 🛠️ Common Troubleshooting

### 1. "Failed to Submit Onboarding Request" (HTTP 500 Error)
**Cause:** The backend crashed, or the database schema is out of sync with the Prisma Client (common after wiping the database).
**Solution:**
1. Stop the backend server terminal (Ctrl + C).
2. Run the Prisma generator to fix the database bindings:
   ```bash
   cd backend
   npx prisma generate
   ```
3. Restart the backend server with `npm run dev`.

### 2. EPERM: Operation not permitted (Prisma DLL Locked)
**Cause:** Windows/OneDrive has locked a database query engine file, or a backend Node process is running in the background and locking the file.
**Solution:**
1. Kill any stray Node processes running on port 5000. 
   *(In PowerShell)*:
   ```powershell
   Get-NetTCPConnection -LocalPort 5000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
   ```
2. After killing the process, run `npx prisma generate` again.

### 3. "Transition Blocked" Errors when updating Ticket Status
**Cause:** The system strictly enforces the workflow order (HR -> IT -> Asset -> Dispatch -> QA -> Joined).
**Common Blockers:**
- **Induction Schedule:** If you get blocked moving to "Joined", ensure the Induction Schedule date and HR Coordinator fields are filled out in the HR module.
- **QA Verification:** You cannot close a ticket from Dispatch until a QA or Super Admin clicks "Submit QA Verification" inside the Dispatch module view.
- **DOJ Lock:** The system blocks marking a candidate as `Joined` if the Date of Joining (DOJ) is in the future.

### 4. Blank Page / "Users is not defined" (Frontend UI Crash)
**Cause:** A missing component import in the React code.
**Solution:** Check the frontend terminal running Vite for the exact file and line number. Add the missing import (usually from `lucide-react`) at the top of the `.tsx` file, save, and Vite will hot-reload automatically.

---

## 🧹 Database Operations

### How to Completely Wipe the Database (Start Fresh)
If you need to delete all test tickets and reset the platform to a clean slate, follow these steps:
1. Stop the backend server.
2. Run the force-reset command:
   ```bash
   cd backend
   npx prisma db push --force-reset --accept-data-loss
   ```
3. Regenerate the client (just to be safe):
   ```bash
   npx prisma generate
   ```
4. Start the backend again (`npm run dev`). When it starts, it will automatically run the seeder to recreate the default Super Admin user and mock Snipe-IT inventory.

---

## 🔑 Important App Information

### Default Logins
If you wipe the database, the seeder automatically creates this Super Admin account:
- **Email:** `admin@sbq.com`
- **Password:** `admin123`

### Workflows & Roles
- **TA (Talent Acquisition):** Submits the candidate details.
- **HR:** Responsible for BGV (Background Verification) approval, Keka Employee ID generation, and Induction Scheduling.
- **IT / Asset:** Prepares the email/credentials, uploads the Credential Sheet, and assigns hardware from inventory.
- **Dispatch:** Collects delivery address and inputs courier tracking information.
- **QA:** Submits final verification that all hardware and configurations are correct.
- **Super Admin:** Has access to all modules and can perform any action.

### Mock External APIs
The system has mock services configured for testing:
- **Snipe-IT:** Simulates hardware inventory. When an Asset is assigned, the mock Snipe-IT automatically fills the Serial Number and Asset Tag.
- **Active Directory:** Simulates email generation when a new candidate is added by TA.
