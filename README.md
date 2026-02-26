# Vehicle Telemetry Tracker

A production-ready backend service for vehicle telemetry ingestion and retrieval.

## Project Overview

This service is designed to collect and manage structured telemetry data from both Fuel and Electric Vehicles (EV). It provides a RESTful API to ingest time-series operational data and retrieve it efficiently. The application is built with scalability and deployment in mind, migrating from MongoDB to a highly structured **Supabase (PostgreSQL)** database. and then add element

## Tech Stack

- **Node.js**: JavaScript runtime environment.
- **Express.js**: Fast, unopinionated, minimalist web framework for Node.js.
- **Supabase**: Open-source Firebase alternative leveraging PostgreSQL for scalable and strongly constrained relational data.
- **@supabase/supabase-js**: Library to interact with Supabase instances.
- **Joi**: Powerful schema description language and data validator for JavaScript.
- **dotenv**: Loads environment variables from a `.env` file.

## Setup Instructions

### Prerequisites

- Node.js (v18+ recommended)
- A Supabase Project (Create one for free at [supabase.com](https://supabase.com/))

### Installation

1. Clone this repository or download the source code.
2. Navigate to the project directory:
   ```bash
   cd "vehicle telemetry tracker"
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Database Initialization

1. Go to your Supabase Dashboard -> **SQL Editor**.
2. Open the file `supabase_setup.sql` provided in this project's root directory.
3. Copy the contents of `supabase_setup.sql` and execute it in your Supabase SQL Editor.
   *This will create your `telemetry` table, apply correct scaling constraints, disable Row Level Security (RLS) for testing, and scaffold an RPC function for data aggregation.*

### Environment Variables

Configure environment variables. A `.env` file is provided. Enter your Supabase project credentials and DeepSeek API Key:
```env
PORT=3000
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_KEY="your-anon-or-service-role-key"
DATABASE_URL="postgres://postgres:password@aws-0-xx.pooler.supabase.com:6543/postgres"

# New Module Variables
AI_READONLY_DATABASE_URL="postgres://ai_readonly:password@aws-0-xx.pooler.supabase.com:6543/postgres"
DEEPSEEK_API_KEY="your-deepseek-api-key"
```

### Running the Application

**Development Mode (auto-reloads on changes):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

### Seeding the Database (Optional)

To test the APIs with synthetic data, you can run the provided seed script. This will insert telemetry data for 10 vehicles (5 FUEL, 5 EV) over the past 24 hours.

```bash
npm run seed
```

## Scalability & Performance

- **PostgreSQL Constraints**: Enforcing required fields conditionally via SQL `CHECK` constraints prevents malformed payloads directly at the DB layer.
- **Indexing**: A compound index `(vehicle_id, timestamp DESC)` guarantees instant telemetry queries without expensive full table scans.
- **RPC Aggregation**: Employs a specific PostgreSQL `get_vehicle_summary` function deployed on the Supabase edge. This minimizes memory load on the Node server and securely offloads analytic calculations.
- **Centralized Error Handling**: Safely digests Supabase codes (like `23514` check violations) into uniform RESTful responses.

## New Enterprise Features

### 1. Universal Bulk Data Ingestion
- Provides seamless Drag-and-Drop functionality for ingesting massive `.csv`, `.json`, and `.xlsx` payloads directly into the database.
- Features backend chunking and parsing via `Node.js Streams` to guarantee **O(1) memory space complexity** even for multi-gigabyte files.
- Drops data into a dynamically indexed `JSONB` Supabase column, establishing extreme schema flexibility while keeping instant query speeds via a PostgreSQL `GIN` Index.

### 2. AI-Based NLP-to-SQL Querying & Export
- Generates complex data retrieval queries using Natural Language Prompts via **DeepSeek / LangChain**.
- Protects against AI Hallucinations using strict System Prompts mapping schemas explicitly, and crucially, operates through a dedicated restrictive `Read-Only PostgreSQL Role`.
- Provides a "Universal Export" capability inside the UI to download NLP results natively as `.csv` or `.json`.

## API Documentation

### 1. Ingest Telemetry Data
**Endpoint:** `POST /telemetry`

**Example Request Payload (FUEL):**
```json
{
  "vehicleId": "V-1234",
  "vehicleType": "FUEL",
  "timestamp": "2023-11-01T10:00:00Z",
  "speed": 85,
  "engineTemperature": 90,
  "fuelLevel": 45.5,
  "fuelConsumptionRate": 8.2
}
```

### 2. Get Latest Telemetry
**Endpoint:** `GET /vehicles/:vehicleId/latest`

### 3. Get Recent Telemetry
**Endpoint:** `GET /vehicles/:vehicleId/recent?limit=10`

### 4. Get Telemetry within Time Range
**Endpoint:** `GET /vehicles/:vehicleId?start=ISODate&end=ISODate`

### 5. Get Vehicle Summary
**Endpoint:** `GET /vehicles/:vehicleId/summary`

### 6. Universal Data Ingestion: File Upload
**Endpoint:** `POST /ingestion/upload`
**Content-Type:** `multipart/form-data` with a `file` field (.csv, .json, .xlsx).

### 7. Universal Data Ingestion: Raw JSON
**Endpoint:** `POST /ingestion/json`
**Content-Type:** `application/json`
**Payload:** JSON array or object directly in the body.

### 8. AI NLP-to-SQL Query
**Endpoint:** `POST /nlp/query`
**Content-Type:** `application/json`
**Payload:** 
```json
{
  "query": "Show me all vehicle records from Mumbai"
}
```

### 9. AI Results CSV Export
**Endpoint:** `POST /nlp/export/csv`
**Content-Type:** `application/json`
**Payload:** 
```json
{
  "data": [{ "id": 1, "col": "val" }]
}
```
**Returns:** Text/CSV blob attachment
