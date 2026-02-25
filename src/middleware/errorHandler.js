const errorHandler = (err, req, res, next) => {
    console.error(err); // Log error stack for debugging

    // Supabase/PostgreSQL Errors

    // 23505: unique_violation
    if (err.code === '23505') {
        return res.status(400).json({
            success: false,
            error: 'Duplicate field value entered'
        });
    }

    // 23514: check_violation (our conditional validation)
    if (err.code === '23514') {
        return res.status(400).json({
            success: false,
            error: `Database constraint violation: ${err.message}`
        });
    }

    // 22P02: invalid_text_representation (e.g., bad UUID)
    if (err.code === '22P02') {
        return res.status(400).json({
            success: false,
            error: 'Invalid ID format'
        });
    }

    // Generic Joi Validation Error
    if (err.isJoi) {
        return res.status(400).json({
            success: false,
            error: err.details.map(detail => detail.message).join(', ')
        });
    }

    // Default server error
    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
};

module.exports = errorHandler;
