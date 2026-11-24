/** An error that is safe to show to API clients. `extra` is merged onto the instance (retryAfter, upstream...). */
export class AppError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.expose = true;
    Object.assign(this, extra);
  }
}
