// Finance integration error handling utilities

export class FinanceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'FinanceError'
  }
}

export class FinanceValidationError extends FinanceError {
  constructor(message: string, public field?: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'FinanceValidationError'
  }
}

export class FinanceAPIError extends FinanceError {
  constructor(
    message: string,
    public provider: string,
    statusCode: number = 500,
    details?: any
  ) {
    super(message, 'API_ERROR', statusCode, details)
    this.name = 'FinanceAPIError'
  }
}

export class FinanceNetworkError extends FinanceError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', 503, details)
    this.name = 'FinanceNetworkError'
  }
}

/**
 * Format error for user display
 */
export function formatFinanceError(error: unknown): string {
  if (error instanceof FinanceError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}

/**
 * Log finance error with appropriate level
 */
export function logFinanceError(error: unknown, context?: string): void {
  const prefix = context ? `[Finance:${context}]` : '[Finance]'
  
  if (error instanceof FinanceValidationError) {
    console.warn(`${prefix} Validation error:`, error.message, error.field)
  } else if (error instanceof FinanceAPIError) {
    console.error(`${prefix} API error (${error.provider}):`, error.message, {
      statusCode: error.statusCode,
      details: error.details,
    })
  } else if (error instanceof FinanceNetworkError) {
    console.error(`${prefix} Network error:`, error.message, error.details)
  } else if (error instanceof FinanceError) {
    console.error(`${prefix} Error:`, error.message, {
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    })
  } else {
    console.error(`${prefix} Unexpected error:`, error)
  }
}

/**
 * Redact sensitive data from objects for logging
 */
export function redactSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data
  }

  const sensitiveFields = [
    'apiKey',
    'password',
    'ssn',
    'socialSecurityNumber',
    'creditCard',
    'cardNumber',
    'cvv',
    'securityCode',
  ]

  const redacted = { ...data }
  
  for (const field of sensitiveFields) {
    if (field in redacted) {
      redacted[field] = '[REDACTED]'
    }
  }

  // Recursively redact nested objects
  for (const key in redacted) {
    if (redacted[key] && typeof redacted[key] === 'object' && !Array.isArray(redacted[key])) {
      redacted[key] = redactSensitiveData(redacted[key])
    }
  }

  return redacted
}
