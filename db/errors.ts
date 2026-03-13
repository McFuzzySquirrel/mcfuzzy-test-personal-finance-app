export type DatabaseErrorCode =
  | 'NOT_FOUND'
  | 'CONSTRAINT_VIOLATION'
  | 'INVALID_INPUT'
  | 'PROTECTED_RESOURCE';

export class DatabaseError extends Error {
  code: DatabaseErrorCode;

  constructor(message: string, code: DatabaseErrorCode) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
  }
}
