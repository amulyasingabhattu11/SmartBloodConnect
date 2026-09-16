import { verifyToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import { findUserById } from '../repositories/userRepository.js';

export const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('Authentication token is required.', 401);
    }

    const token = header.slice('Bearer '.length);
    const payload = verifyToken(token);
    const user = await findUserById(payload.userId);

    if (!user || user.account_status !== 'ACTIVE') {
      throw new AppError('Your account is not active.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired authentication token.', 401));
    }
    next(error);
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return next(new AppError('Administrator access is required.', 403));
  }
  next();
};

