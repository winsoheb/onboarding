import { Request, Response, NextFunction } from 'express';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
        email: string;
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is missing' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token is missing' });
  }

  // Local Bypass for Development
  if (token.startsWith('bypass-')) {
    const role = token.split('-')[1]; // e.g., bypass-TA -> role: TA
    req.user = {
      id: 1, // Mock user ID
      role: role,
      email: `mock_${role.toLowerCase()}@sbq.com`,
    };
    return next();
  }

  // Placeholder for real MSAL JWT Verification
  // try {
  //   const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //   req.user = decoded;
  //   return next();
  // } catch (err) { ... }

  return res.status(401).json({ error: 'Invalid token' });
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (req.user.role === 'SUPER_ADMIN' || roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ error: 'Forbidden: You do not have the required role.' });
  };
};
