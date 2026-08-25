const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    if (err.name === "ValidationError") {
        statusCode = 422;
        message = "Request validation failed";
    }

    if (err.code === 11000) {
        statusCode = 409;
        message = "A record with the same unique value already exists";
    }

    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Invalid or expired authentication token";
    }

    const errors = err.name === "ValidationError"
        ? Object.values(err.errors).map((item) => ({ field: item.path, message: item.message }))
        : err.errors || [];

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors,
        stack:
            process.env.NODE_ENV === "development"
                ? err.stack
                : undefined
    });
};

export { errorHandler };
