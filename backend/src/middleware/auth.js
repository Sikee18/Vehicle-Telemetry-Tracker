const requireApiKey = (req, res, next) => {
    // Only require API key for data ingestion (POST /telemetry) to prevent poisoning.
    // Read operations (GET) remain open for the dashboard in this version.
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            error: 'Authentication missing. Please provide an x-api-key header.'
        });
    }

    // In a production app, you might look this up in the DB.
    // For this hackathon, we validate against a secure environment variable.
    if (apiKey !== process.env.INGESTION_API_KEY) {
        return res.status(403).json({
            success: false,
            error: 'Invalid API Key provided.'
        });
    }

    next();
};

module.exports = requireApiKey;
