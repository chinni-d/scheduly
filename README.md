# Scheduly — Appointment Board

> A focused, responsive appointment board and booking calendar for small teams. Built with **Next.js**, **FastAPI**, and **PostgreSQL (Neon)**.

🌐 **Live Deployment**: [https://schedulely.manikantadarapureddy.in/](https://schedulely.manikantadarapureddy.in/)

---

## 📋 Project Overview

**Practical Task**: Full Stack Developer Intern — Appointment Board  
**Objective**: Build a simple appointment board for a small team that makes it easy to view, add, update, complete, and cancel appointments with time conflict prevention and responsive layout across all devices.

---

## ✨ Features & Requirements Checklist

| Requirement | Implementation Details | Status |
| :--- | :--- | :---: |
| **Show appointments list / board** | 7-Day calendar grid on desktop, dynamic day-selector strip on mobile, and an upcoming appointment list. | ✅ |
| **Add new appointment** | Modal form with Title, Description, Date, Start Time, and End Time. | ✅ |
| **Edit appointment** | Pre-populated modal allowing editing details with time conflict validation against other slots. | ✅ |
| **Complete appointment** | One-click "Complete" action updates status to `Completed` with visual badge and feedback toast. | ✅ |
| **Cancel appointment** | One-click "Cancel" action marks as `Cancelled`. **Cancelled appointments remain visible** with strikethrough styling. | ✅ |
| **Filter by date** | Interactive date picker with quick filters for "Today" and "All dates". | ✅ |
| **Filter by status** | Filter by `All`, `Scheduled`, `Completed`, or `Cancelled` via dropdown or clickable KPI metric cards. | ✅ |
| **Time slot conflict prevention** | Mathematical collision check (`startA < endB && endA > startB`) prevents overlapping bookings on the same date. | ✅ |
| **Time validation** | Enforces `end_time > start_time`. Rejects inverted time ranges with descriptive alerts. | ✅ |
| **Sample appointments** | Pre-seeded with realistic team appointments for immediate review upon first load. | ✅ |
| **Clear success & error alerts** | Real-time toast notifications for all successful actions, conflicts, and validation errors. | ✅ |
| **Skeleton loading state** | Animated pulsing placeholders for KPI cards, calendar columns, and appointments while fetching data. | ✅ |
| **Responsive design** | Fully responsive from 320px mobile screens to ultra-wide desktop monitors. | ✅ |

---

## 🔄 User Flow

1. **Dashboard & Overview**: The user opens the board and immediately sees pre-populated appointments across a 7-day week view, top KPI metrics (Scheduled, Completed, Cancelled), and an upcoming appointments agenda.
2. **Filtering**: The user can filter appointments by picking any calendar date or selecting a status (`Scheduled`, `Completed`, `Cancelled`, or `All`).
3. **Creating an Appointment**:
   - The user clicks **"+ New Appointment"**.
   - Fills in Title, Description (optional), Date, Start Time, and End Time.
   - The system validates that all required fields are present, end time is after start time, and that the slot is not already occupied by an active appointment on that date.
   - On success, the appointment appears on the board with a success toast notification.
4. **Modifying an Appointment**:
   - The user clicks the **Edit** icon on any appointment card to adjust times or details. The conflict validator allows keeping the current slot while verifying against others.
5. **Completing an Appointment**:
   - Clicking **Complete** turns the appointment card into a green completed badge and updates KPI totals.
6. **Cancelling an Appointment**:
   - Clicking **Cancel** marks the appointment as `Cancelled`. It **remains visible** on the board for record-keeping and audit history, while freeing the time slot for new bookings.

---

## 🧠 Architectural Decisions & Assumptions

### 1. Slot Conflict & Cancellation Logic
- **Assumption**: A cancelled appointment should remain visible for transparency and historical record, but should **free up its time slot** so another appointment can be scheduled at that time.
- **Implementation**: Overlap checks enforce that a new appointment conflicts only if:
  ```text
  start_new < end_existing  AND  end_new > start_existing
  ```
  Only appointments with `status != 'Cancelled'` are checked for collisions.

### 2. Adjacent Appointments
- **Assumption**: Back-to-back appointments (e.g., `10:00 AM – 11:00 AM` followed immediately by `11:00 AM – 12:00 PM`) are valid and common in business scheduling.
- **Implementation**: Strict inequality (`<` and `>`) is used, allowing contiguous adjacent slots without conflict.

### 3. Single-Day Boundaries
- **Assumption**: Appointments start and end on the same calendar day (no overnight shifts spanning across midnight).
- **Validation**: Enforced via `end_time > start_time` on both the client form and backend API.

### 4. Serverless & High-Concurrency Resilience
- **Assumption**: Small teams need fast, instant response times with minimal infrastructure overhead.
- **Implementation**: Uses `asyncpg` connection pooling with automatic lazy-reconnect (`get_or_init_pool()`) to guarantee reliable database operations during serverless cold starts.

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router, React 19, TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) icons
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+ ASGI)
- **Database**: [Neon PostgreSQL](https://neon.tech/) with [`asyncpg`](https://github.com/MagicStack/asyncpg) connection pool
- **Hosting & Deployment**: [Vercel](https://vercel.com/) (Next.js Edge/SSR + Vercel Python Serverless Functions)

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | API health check and database connection status |
| `GET` | `/api/appointments` | List appointments (supports `?date_filter=YYYY-MM-DD` and `?status_filter=...`) |
| `POST` | `/api/appointments` | Create an appointment (validates time range & slot availability) |
| `PUT` | `/api/appointments/{id}` | Update title, description, date, times, or status |
| `PATCH` | `/api/appointments/{id}/status` | Quick status change (`Scheduled`, `Completed`, `Cancelled`) |
| `DELETE` | `/api/appointments/{id}` | Delete an appointment permanently |

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/chinni-d/scheduly.git
cd scheduly
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
The frontend will be available at `http://localhost:3000`.

### 3. Backend Setup
```bash
# Create and activate virtual environment (optional)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn backend.main:app --port 8000 --reload
```
The backend API and interactive docs will be available at `http://127.0.0.1:8000/docs`.

### 4. Environment Configuration
Create a `.env` file in the root directory (based on `.env.example`):
```env
DATABASE_URL=postgresql://<user>:<password>@<neon_host>/<dbname>?sslmode=require
PORT=8000
FASTAPI_URL=http://127.0.0.1:8000
```

---

## 🚀 Deployment on Vercel

The application is configured as a unified full-stack monorepo:
- **`vercel.json`** routes `/api/*` requests to the serverless Python function in `api/index.py`.
- Next.js is automatically detected and built for the frontend interface.

To deploy your own instance:
1. Push this repository to GitHub.
2. Import the project into **[Vercel](https://vercel.com/)**.
3. Under **Project Settings $\rightarrow$ Environment Variables**, add:
   - `DATABASE_URL`: Your PostgreSQL connection string.
4. Click **Deploy**.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
