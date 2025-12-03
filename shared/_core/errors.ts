/**
 * Custom Error Types
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function ForbiddenError(message: string = "Access denied"): AppError {
  return new AppError(message, 403);
}

export function NotFoundError(message: string = "Not found"): AppError {
  return new AppError(message, 404);
}

export function BadRequestError(message: string = "Bad request"): AppError {
  return new AppError(message, 400);
}

export function UnauthorizedError(message: string = "Unauthorized"): AppError {
  return new AppError(message, 401);
}
