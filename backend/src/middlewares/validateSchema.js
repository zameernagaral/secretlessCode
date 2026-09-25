/**
 * Schema Validation Middleware — Secretless Code
 *
 * Zero-dependency strict schema validator for request bodies.
 * Validates type, presence, length, pattern, and enum constraints.
 * Rejects requests that have unexpected extra keys (strict mode).
 *
 * Usage:
 *   router.post('/scan', validateBody(SCAN_SCHEMA), handler);
 */

/**
 * Field descriptor:
 * {
 *   type: 'string' | 'number' | 'boolean' | 'array' | 'object',
 *   required?: boolean,           // default: false
 *   minLength?: number,           // strings only
 *   maxLength?: number,           // strings only
 *   min?: number,                 // numbers only
 *   max?: number,                 // numbers only
 *   pattern?: RegExp,             // strings only
 *   enum?: any[],                 // whitelist of allowed values
 *   stripUnknown?: boolean,       // remove unknown top-level keys (default: true)
 * }
 */

/**
 * Validates a single value against a field descriptor.
 * @param {string} fieldName
 * @param {unknown} value
 * @param {object} descriptor
 * @returns {string | null} Error message or null if valid
 */
function validateField(fieldName, value, descriptor) {
  const { type, required, minLength, maxLength, min, max, pattern, enum: allowedValues } = descriptor;

  // Presence check
  if (value === undefined || value === null || value === '') {
    if (required) return `"${fieldName}" is required.`;
    return null; // optional field absent — fine
  }

  // Type check
  if (type === 'string' && typeof value !== 'string') {
    return `"${fieldName}" must be a string.`;
  }
  if (type === 'number' && typeof value !== 'number') {
    return `"${fieldName}" must be a number.`;
  }
  if (type === 'boolean' && typeof value !== 'boolean') {
    return `"${fieldName}" must be a boolean.`;
  }
  if (type === 'array' && !Array.isArray(value)) {
    return `"${fieldName}" must be an array.`;
  }
  if (type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
    return `"${fieldName}" must be an object.`;
  }

  // String constraints
  if (type === 'string') {
    const str = value;
    if (minLength !== undefined && str.length < minLength) {
      return `"${fieldName}" must be at least ${minLength} characters.`;
    }
    if (maxLength !== undefined && str.length > maxLength) {
      return `"${fieldName}" must be no longer than ${maxLength} characters.`;
    }
    if (pattern && !pattern.test(str)) {
      return `"${fieldName}" has an invalid format.`;
    }
  }

  // Number constraints
  if (type === 'number') {
    if (min !== undefined && value < min) {
      return `"${fieldName}" must be at least ${min}.`;
    }
    if (max !== undefined && value > max) {
      return `"${fieldName}" must be no greater than ${max}.`;
    }
  }

  // Enum whitelist
  if (allowedValues && !allowedValues.includes(value)) {
    return `"${fieldName}" must be one of: ${allowedValues.map(v => JSON.stringify(v)).join(', ')}.`;
  }

  return null;
}

/**
 * Creates an Express middleware that validates req.body against a schema.
 *
 * @param {Record<string, object>} schema - Map of fieldName → descriptor
 * @param {{ strict?: boolean }} options
 *   strict: true (default) = reject requests with fields not in the schema
 * @returns {import('express').RequestHandler}
 */
function validateBody(schema, { strict = true } = {}) {
  return (req, res, next) => {
    const body = req.body;

    // Body must be a plain object (not array, not null, not primitive)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({
        status: 'error',
        errorCode: 'INVALID_BODY',
        message: 'Request body must be a JSON object.'
      });
    }

    const errors = [];

    // Validate each declared field
    for (const [fieldName, descriptor] of Object.entries(schema)) {
      const error = validateField(fieldName, body[fieldName], descriptor);
      if (error) errors.push(error);
    }

    // Strict mode: reject unknown keys not declared in schema
    if (strict) {
      const allowedKeys = new Set(Object.keys(schema));
      const unknownKeys = Object.keys(body).filter(k => !allowedKeys.has(k));
      if (unknownKeys.length > 0) {
        errors.push(`Unknown field(s) not permitted: ${unknownKeys.map(k => `"${k}"`).join(', ')}.`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        errorCode: 'VALIDATION_ERROR',
        message: errors[0],      // return first error to avoid enumeration
        errors: errors            // full list for dev debugging
      });
    }

    next();
  };
}

// ── Pre-built schemas for each route ─────────────────────────────────────────

/**
 * POST /api/scan
 * Accepts only: { repoUrl: string }
 */
const SCAN_SCHEMA = {
  repoUrl: {
    type: 'string',
    required: true,
    minLength: 10,
    maxLength: 300
  }
};

module.exports = { validateBody, SCAN_SCHEMA };
