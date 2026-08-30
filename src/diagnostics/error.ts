import type { ColorScaleErrorCode } from '../types.js';

export class ColorScaleError extends Error {
  readonly code: ColorScaleErrorCode;
  readonly details: Record<string, unknown> | undefined;

  constructor(code: ColorScaleErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ColorScaleError';
    this.code = code;
    this.details = details;
  }
}
