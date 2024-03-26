import {NextFunction} from "express";
import AppError from "../utility/appError";

const handleCastErrorDB = (err: any) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateDB = (err: any) => {
    const field = Object.values(err.keyValue)[0];
    const value = Object.keys(err.keyValue)[0];

    const message = `Duplicate value for field: ${field}, value: ${value}.`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err: any) => {
    // @ts-ignore
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const sendErrorDev = (err: any, res: any) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

const sendErrorProd = (err: any, res: any) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });

        // Programming or other unknown error: don't leak error details
    } else {
        // 1) Log Error
        console.error('ERROR', err);

        // 2) Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong back here!',
        });
    }
};

const handleJWTError = () =>
    new AppError('Invalid token. Please login again!', 401);
const handleJWTExpiredError = () =>
    new AppError('Expired token. Please login again!', 401);

export default (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = Object.assign(err);

        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateDB(error);
        if (error.name === 'ValidationError')
            error = handleValidationErrorDB(error);

        sendErrorProd(error, res);
    }
};
