# 🚗 Universal Vehicle Telemetry & NLP Analytics Platform

This project is a full-stack, real-time dashboard and AI-driven analytics platform designed to track, monitor, and query vehicle telemetry data. It features a scalable backend capable of processing massive datasets via Node.js streams, and an interactive React frontend equipped with a natural language (NLP) querying engine powered by Groq and LangChain.

## 🌟 Key Features

### 1. 🛡️ Secure API Ingestion
A protected `/telemetry` endpoint that requires an `x-api-key` header to securely ingest live data from IoT devices or vehicles. Unauthorized attempts are instantly rejected with HTTP 401.

### 2. 📊 Universal Data Ingestion (Chunked Streams)
A robust `DataIngestion` engine capable of parsing massive CSVs, JSON, and XLSX files. It utilizes Node.js streams to keep memory overhead at `O(1)` and performs chunked bulk inserts directly into Supabase, allowing users to upload datasets with millions of rows without crashing the browser or server.

### 3. 🧠 AI-Powered NLP Analytics
An integrated "AI Query Assistant" powered by the **Groq Llama 3** LLM. 
- You can ask natural language questions (e.g., *"Count the total number of telemetry records"* or *"Show me all vehicles that went faster than 100 km/h"*).
- The AI safely translates your sentence into raw PostgreSQL syntax via LangChain.
- The SQL strictly executes against the Supabase database and instantly renders the results into a dynamic data table. 
- You can quickly export the AI's findings to **CSV** or **JSON** with one click.

### 4. 📈 Real-Time Dashboards & Visualizations
A sleek React frontend featuring:
- **KPI Cards**: Instantly recalculate average speeds, peak engine temperatures, and lowest battery/fuel levels entirely on the backend via O(1) PostgreSQL RPC calculations. 
- **Recharts**: Dynamic line charts plotting Speed, Engine Temperature, and Battery/Fuel levels chronologically.
- **Historical Ranges**: Controls to dynamically fetch 'Latest', 'Recent', or 'Custom Range' telemetry blocks (1hr, 24hr, 7 days).
- **Data Simulator**: A built-in security simulator to live-test the API Key authorization flow visually.

---

## 🛠️ Tech Stack Architecture

### Backend
* **Runtime**: Node.js & Express.js
* **Database**: PostgreSQL (hosted on Supabase)
* **AI/NLP**: `@langchain/groq` using the `llama-3.3-70b-versatile` model.
* **Security**: Custom API Key Middleware & JSON Web Tokens (JWT).
* **Data Processing**: `csv-parser` for streaming, `xlsx` for Excel sheets, `zod` for payload validation.

### Frontend
* **Framework**: React + Vite
* **Styling**: Vanilla CSS with modern UI/UX principles (Glassmorphism, Dark Mode, CSS Variables).
* **Data Fetching**: Axios
* **Charts**: Recharts
* **Icons**: Lucide React

---

## 🚀 Getting Started

### Prerequisites
1. **Node.js**: v18 or higher.
2. **Supabase**: A Supabase project with a `telemetry` table and a `universal_data` JSONB table.
3. **Groq API Key**: A free key from the Groq Developer Console.

### 1. Environment Setup

**Backend `.env` Configuration**
Create a `.env` file in the `/backend` directory:
```env
PORT=3000
SUPABASE_URL="https://[YOUR_INSTANCE].supabase.co"
SUPABASE_KEY="[YOUR_SERVICE_ROLE_KEY]"
INGESTION_API_KEY="hackathon_secret_key_123"

# AI Configuration
GROQ_API_KEY="gsk_..."

# PostgreSQL Connection Strings
DATABASE_URL="postgresql://postgres.[INSTANCE]:[PASSWORD]@[POOLER_URL]:6543/postgres?pgbouncer=true"
AI_READONLY_DATABASE_URL="postgresql://postgres.[INSTANCE]:[PASSWORD]@[POOLER_URL]:6543/postgres?pgbouncer=true"
```

**Frontend `.env` Configuration**
Create a `.env` file in the `/frontend` directory:
```env
VITE_API_URL="http://localhost:3000"
```

### 2. Installation & Running

1. **Install Dependencies**
   Navigate to both the `backend` and `frontend` folders and run:
   ```bash
   npm install
   ```

2. **Start the Backend**
   ```bash
   cd backend
   npm run dev
   ```
   *(The server will start on port 3000)*

3. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   *(The Vite dashboard will be available at http://localhost:5173)*

### 3. Seeding the Database (Optional)
If your database is empty, you can generate 500 rows of fake telemetry data to instantly view the dashboards:
```bash
cd backend
node seed.js
```

---

## 🔐 Security Architecture Notes
1. **Data Ingestion**: The `/telemetry` POST route is protected by `requireApiKey` middleware.
2. **AI SQL Execution**: The NLP natural language processor implements multiple levels of defense:
   - **Prompt Engineering**: The LLM system prompt strictly forbids DML/DDL generation (INSERT, DROP, ALTER).
   - **Regex Checking**: The Express Controller forcefully rejects any generated string that does not explicitly begin with `SELECT`.
   - *(Optional Production Security)*: The `AI_READONLY_DATABASE_URL` is configured to ideally route through a locked-down, read-only PostgreSQL user role to prevent AI hallucination destruction at the infrastructure level.
