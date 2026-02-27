const supabase = require('../config/supabase');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const stream = require('stream');
const { z } = require('zod');

/**
 * Helper to perform chunked inserts into Supabase to prevent network/memory blowup.
 * @param {Array} data - Array of objects to insert.
 * @param {number} batchSize - Number of rows to insert per batch.
 */
const chunkedInsert = async (data, batchSize = 1000) => {
    let insertedCount = 0;
    for (let i = 0; i < data.length; i += batchSize) {
        const chunk = data.slice(i, i + batchSize);
        // Map payload into { data: jsonb } format for the universal_data table
        const insertPayload = chunk.map(item => ({ data: item }));

        const { error } = await supabase
            .from('universal_data')
            .insert(insertPayload);

        if (error) {
            console.error('Supabase batch insert error:', error);
            throw error;
        }
        insertedCount += chunk.length;
    }
    return insertedCount;
};

/**
 * Handle raw JSON paste.
 */
exports.ingestRawJson = async (req, res, next) => {
    try {
        const payload = req.body;

        if (!payload || typeof payload !== 'object') {
            return res.status(400).json({ error: 'Invalid JSON payload. Must be an object or array.' });
        }

        const dataArray = Array.isArray(payload) ? payload : [payload];
        if (dataArray.length === 0) {
            return res.status(400).json({ error: 'Empty JSON payload.' });
        }

        // Basic Validation - ensuring data is generically standard objects
        const validatedData = dataArray.filter(item => typeof item === 'object' && item !== null && !Array.isArray(item));
        if (validatedData.length === 0) {
            return res.status(400).json({ error: 'No valid objects found in JSON payload.' });
        }

        const insertedCount = await chunkedInsert(validatedData);

        res.status(200).json({
            message: 'JSON payload successfully ingested.',
            records_processed: insertedCount
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handle File Uploads (CSV, JSON, XLSX).
 */
exports.ingestFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const { originalname, buffer, mimetype } = req.file;
        let parsedData = [];

        // Handle CSVs using Streams (O(1) memory parsing for the parser, chunking buffer)
        if (originalname.endsWith('.csv') || mimetype === 'text/csv') {
            const bufferStream = new stream.PassThrough();
            bufferStream.end(buffer);

            let currentChunk = [];
            let totalInserted = 0;

            // Stream processing
            bufferStream
                .pipe(csv())
                .on('data', (data) => {
                    currentChunk.push(data);
                    // Standardize or infer schema if needed here.
                    if (currentChunk.length >= 1000) {
                        // Pause stream to await insert
                        bufferStream.pause();
                        chunkedInsert(currentChunk, 1000)
                            .then(inserted => {
                                totalInserted += inserted;
                                currentChunk = [];
                                bufferStream.resume();
                            })
                            .catch(err => {
                                console.error('Stream insert error:', err);
                                next(err);
                            });
                    }
                })
                .on('end', async () => {
                    if (currentChunk.length > 0) {
                        try {
                            const inserted = await chunkedInsert(currentChunk, 1000);
                            totalInserted += inserted;
                        } catch (err) {
                            return next(err);
                        }
                    }
                    return res.status(200).json({
                        message: 'CSV file successfully streamed and ingested.',
                        records_processed: totalInserted
                    });
                })
                .on('error', (err) => next(err));

            return; // Response handled in stream events
        }

        // Handle XLSX
        else if (originalname.endsWith('.xlsx') || originalname.endsWith('.xls') || mimetype.includes('spreadsheetml')) {
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0]; // grab first sheet
            parsedData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        }

        // Handle JSON
        else if (originalname.endsWith('.json') || mimetype === 'application/json') {
            const jsonString = buffer.toString('utf8');
            const data = JSON.parse(jsonString);
            parsedData = Array.isArray(data) ? data : [data];
        }

        else {
            return res.status(400).json({ error: 'Unsupported file type. Please upload CSV, JSON, or XLSX.' });
        }

        // Insert non-CSV file contents in chunks
        if (parsedData.length === 0) {
            return res.status(400).json({ error: 'File appears to be empty or misformatted.' });
        }

        const insertedCount = await chunkedInsert(parsedData);

        res.status(200).json({
            message: 'File successfully parsed and ingested.',
            records_processed: insertedCount
        });

    } catch (error) {
        next(error);
    }
};
