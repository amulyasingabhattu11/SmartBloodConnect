import { ZodError } from 'zod';
import { env } from '../config/env.js';

export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (error, req, res, next) => {
  if (error instanceof ZodError) {
    return res.status(422).json({
      message: 'Validation failed.',
      errors: error.errors.map((item) => ({ path: item.path.join('.'), message: item.message }))
    });
  }

  const statusCode = error.statusCode || 500;
  const response = {
    message: statusCode >= 500 ? 'A server error occurred.' : error.message
  };

  if (error.details) response.details = error.details;
  if (env.nodeEnv !== 'production' && statusCode >= 500) response.stack = error.stack;

  return res.status(statusCode).json(response);
};

