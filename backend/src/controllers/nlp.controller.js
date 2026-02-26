const { ChatGroq } = require('@langchain/groq');
const { PromptTemplate } = require('@langchain/core/prompts');
const { Pool } = require('pg');
const { Parser } = require('json2csv');

// Initialize connection pool to Postgres. 
// Ideally this uses AI_READONLY_DATABASE_URL to prevent AI Hallucinations from destroying database.
// If the user hasn't set it, we fallback to the standard DATABASE_URL.
const connectionString = process.env.AI_READONLY_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
    console.warn("WARNING: Neither AI_READONLY_DATABASE_URL nor DATABASE_URL is set in environment.");
}

const pool = new Pool({
    connectionString: connectionString,
    // Provide SSL config required by Supabase pooler connections
    ssl: { rejectUnauthorized: false } 
});

// Configure the Groq Model via LangChain
const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
    temperature: 0, // 0 for exact deterministic querying (less hallucination)
});

// The strict systemic prompt containing DB Schema and constraints
const SQL_PROMPT_TEMPLATE = `
You are an expert PostgreSQL developer. Your goal is to convert natural language queries into executable PostgreSQL queries.
You must return ONLY the raw valid SQL query. Do not include markdown formatting (like \`\`\`sql), do not include explanations, and do not append semicolons unless necessary.

CRITICAL SECURITY INSTRUCTIONS:
1. You may ONLY generate 'SELECT' queries. Any generation of UPDATE, INSERT, DELETE, DROP, ALTER, TRUNCATE, or other DML/DDL statements is strictly forbidden.
2. Only query the schema specified below.

DATABASE SCHEMA:
- Table Name: public.universal_data
- Columns:
  1. id (uuid, primary key)
  2. created_at (timestamp with time zone)
  3. data (jsonb)

The 'data' column contains dynamic JSON objects. To query specific attributes within the 'data' JSONB column, you must use PostgreSQL JSONB operators (like ->, ->>, @>, etc.).
Example: If the user asks for records where city is 'London', you should write:
SELECT * FROM public.universal_data WHERE data->>'city' = 'London';

If the user asks "Show me all data", you should write:
SELECT * FROM public.universal_data LIMIT 100;

Return ONLY the raw SQL query. No other text.

USER QUERY:
{query}
`;

const promptTemplate = new PromptTemplate({
    template: SQL_PROMPT_TEMPLATE,
    inputVariables: ['query'],
});

exports.generateAndExecuteQuery = async (req, res, next) => {
    try {
        const { query } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query parameter is missing.' });
        }

        // 1. Generate SQL from Natural Language
        const formattedPrompt = await promptTemplate.format({ query });
        const aiResponse = await llm.invoke(formattedPrompt);
        
        // Clean the AI response to get raw SQL
        let generatedSql = aiResponse.content.trim();
        if (generatedSql.startsWith('```sql')) {
            generatedSql = generatedSql.replace(/```sql/g, '').replace(/```/g, '').trim();
        } else if (generatedSql.startsWith('```')) {
            generatedSql = generatedSql.replace(/```/g, '').trim();
        }

        // 2. Security Check #1: Reject immediately if not SELECT
        if (!generatedSql.toLowerCase().startsWith('select')) {
            return res.status(403).json({ 
                error: 'Query violation detected. Only SELECT statements are permitted.',
                generatedSql 
            });
        }

        // 3. Security Check #2: Execute using Read-Only PG pool 
        // (Even if the Regex failed, the PG user role `ai_readonly` will enforce hard security)
        const dbResult = await pool.query(generatedSql);

        return res.status(200).json({
            success: true,
            sql: generatedSql,
            data: dbResult.rows,
            rowCount: dbResult.rowCount
        });

    } catch (error) {
        console.error("NLP Query Error:", error);
        return res.status(500).json({ 
            error: 'Failed to process and execute natural language query.',
            details: error.message 
        });
    }
};

exports.exportToCsv = async (req, res, next) => {
    try {
        const { data } = req.body;
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: 'Data array is required for CSV export.' });
        }

        if (data.length === 0) {
            return res.status(400).json({ error: 'Data is empty.' });
        }

        // Flatten the JSONB data column if it exists so columns map correctly in CSV
        const flattenedData = data.map(row => {
            const { data: jsonbData, ...rest } = row;
            if (jsonbData && typeof jsonbData === 'object') {
                return { ...rest, ...jsonbData };
            }
            return row;
        });

        const json2csvParser = new Parser();
        const csvString = json2csvParser.parse(flattenedData);

        res.header('Content-Type', 'text/csv');
        res.attachment('nlp_export.csv');
        return res.status(200).send(csvString);
    } catch (error) {
        next(error);
    }
};
