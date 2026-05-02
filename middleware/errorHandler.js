// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);

    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: "Email already exists"
        });
    }

    res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
};

export default errorHandler;