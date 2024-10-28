const CustomError = require("./CustomError");

const handleDevError = (res, error) => {
    res.status(error.statusCode).send({
        status: error.statusCode,
        message: error.message,
        stackTrace: error.stack,
        error: error
    });
};

const handleCastError = (err) => {
    const message = `Invalid value for ${err.path}: ${err.value}!`;
    return new CustomError(message, 400);
};
// duplicate  error handler
const handleDuplicateKeyError = (err, model) => {
    let message;
    Object.keys(err?.keyValue)?.map(key => {
        message = `${message ? `${message} & ` : ''
            } There is already a ${model} with ${key} "${err?.keyValue[key]}".Please use another ${key}!`;
    })
    return new CustomError(message, 400);
};
// required field error handler
const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map(val => val.message);
    const message = `Invalid input data: ${errors.join('. ')}`;
    return new CustomError(message, 400);
};
const handleProdError = (res, error) => {
    if (error.isOperational) {
        res.status(error.statusCode).send({
            // status: error.statusCode,
            success: false,
            message: error.message
        });
    } else {
        console.error('ERROR 💥:', error);
        res.status(500).send({
            status: 'error',
            success: false,
            message: 'Something went wrong! Please try again later.'
        });
    }
};

module.exports = (error, req, res, next, model) => {
    error.statusCode = error.statusCode || 500;
    error.status = error.status || 'error';
    if (process.env.NODE_ENV === 'development') {
        handleDevError(res, error);
    } else if (process.env.NODE_ENV === 'production') {
        if (error.name === 'CastError') error = handleCastError(error);
        if (error.code === 11000) error = handleDuplicateKeyError(error, model);
        if (error.name === 'ValidationError') error = handleValidationError(error);
        handleProdError(res, error);
    }
};
