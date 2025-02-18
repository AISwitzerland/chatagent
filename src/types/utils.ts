import { BaseEntity } from './index';

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type WithOptional<T, K extends keyof T> = Omit<T, K> & { [P in K]?: T[P] };

export type Immutable<T> = {
  readonly [P in keyof T]: T[P] extends object ? Immutable<T[P]> : T[P];
};

export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : any;

export type EntityId = Pick<BaseEntity, 'id'>;

// Type Predicates
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isNonEmptyArray<T>(value: T[] | undefined | null): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

export function hasProperty<T extends object, P extends PropertyKey>(
  obj: T,
  prop: P
): obj is T & Record<P, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

// Date Utilities
export function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && date.toISOString() === dateString;
}

export function isDateInFuture(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && date > new Date();
}

// Validation Helpers
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export function isValidPhoneNumber(phone: string): boolean {
  // Schweizer Telefonnummern-Format
  const phoneRegex = /^(\+41|0041|0)([1-9]\d{8})$/;
  return phoneRegex.test(phone);
}

// Error Handling
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly code: string = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends Error {
  constructor(
    message: string,
    public readonly entityType: string,
    public readonly entityId?: string
  ) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// Type Guards for Common Patterns
export function isErrorWithMessage(error: unknown): error is Error & { message: string } {
  return (
    error instanceof Error ||
    (typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as any).message === 'string')
  );
}

export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    !!value &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as any).then === 'function'
  );
}

// Helper Functions
export function createEntityId(): string {
  return crypto.randomUUID();
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map(error => `${error.field ? `${error.field}: ` : ''}${error.message}`).join('\n');
}
