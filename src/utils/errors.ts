export class ConflictError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = 'ERR_CONFLICT') {
    super(message);
    this.name = 'ConflictError';
    this.code = code;
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class UnauthorizedError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = 'ERR_UNAUTHORIZED') {
    super(message);
    this.name = 'UnauthorizedError';
    this.code = code;
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class NotFoundError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = 'ERR_NOT_FOUND') {
    super(message);
    this.name = 'NotFoundError';
    this.code = code;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
