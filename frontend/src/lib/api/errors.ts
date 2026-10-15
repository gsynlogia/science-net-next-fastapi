export const HttpStatus = {
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  Conflict: 409,
} as const;

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
