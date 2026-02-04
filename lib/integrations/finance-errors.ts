// Finance integration error handling utilities

export class FinanceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any,
  ) {
    super(message);
    this.name = "FinanceError";
  }
}

export class FinanceValidationError extends FinanceError {
  constructor(
    message: string,
    public field?: string,
    details?: any,
  ) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "FinanceValidationError";
  }
}

export class FinanceAPIError extends FinanceError {
  constructor(
    message: string,
    public provider: string,
    statusCode: number = 500,
    details?: any,
  ) {
    super(message, "API_ERROR", statusCode, details);
    this.name = "FinanceAPIError";
  }
}

export class FinanceNetworkError extends FinanceError {
  constructor(message: string, details?: any) {
    super(message, "NETWORK_ERROR", 503, details);
    this.name = "FinanceNetworkError";
  }
}

// ============================================================================
// LightReach-Specific Error Types (Phase 9)
// ============================================================================

/**
 * Error when state license is not on file for the organization.
 * User action: Contact LightReach to add the state license.
 */
export class StateLicenseError extends FinanceError {
  constructor(state: string, details?: any) {
    super(
      `State building contractor license not on file for ${state}. Contact LightReach to add your license for this state.`,
      "STATE_LICENSE_MISSING",
      400,
      { state, ...details },
    );
    this.name = "StateLicenseError";
  }
}

/**
 * Error when equipment is not on the approved vendor list.
 * This is typically a warning, not a blocking error.
 */
export class EquipmentNotApprovedError extends FinanceError {
  constructor(
    manufacturer: string,
    model: string,
    equipmentType: string,
    details?: any,
  ) {
    super(
      `Equipment "${manufacturer} ${model}" (${equipmentType}) is not on the LightReach approved vendor list. The application may still proceed, but approval is not guaranteed.`,
      "EQUIPMENT_NOT_APPROVED",
      400,
      { manufacturer, model, equipmentType, ...details },
    );
    this.name = "EquipmentNotApprovedError";
  }
}

/**
 * Error when credit application is declined.
 */
export class CreditDeclinedError extends FinanceError {
  constructor(reason?: string, details?: any) {
    super(
      reason || "Credit application was declined.",
      "CREDIT_DECLINED",
      400,
      details,
    );
    this.name = "CreditDeclinedError";
  }
}

/**
 * Error when credit is frozen for the applicant.
 */
export class CreditFrozenError extends FinanceError {
  constructor(details?: any) {
    super(
      "Credit file is frozen. Customer must unfreeze their credit before applying.",
      "CREDIT_FROZEN",
      400,
      details,
    );
    this.name = "CreditFrozenError";
  }
}

/**
 * Error when no credit hit (thin file or identity issues).
 */
export class NoHitError extends FinanceError {
  constructor(details?: any) {
    super(
      "Unable to locate credit file for this applicant. Please verify applicant information.",
      "NO_HIT",
      400,
      details,
    );
    this.name = "NoHitError";
  }
}

/**
 * Error when quote exceeds monthly payment cap.
 */
export class QuoteExceedsCapError extends FinanceError {
  constructor(monthlyPaymentCap?: number, details?: any) {
    super(
      `Quote exceeds the monthly payment cap${monthlyPaymentCap ? ` of $${monthlyPaymentCap}` : ""}. Please adjust the system design or financing terms.`,
      "QUOTE_EXCEEDS_CAP",
      400,
      { monthlyPaymentCap, ...details },
    );
    this.name = "QuoteExceedsCapError";
  }
}

/**
 * Parse LightReach API error response and return appropriate error type
 */
export function parseLightReachError(
  statusCode: number,
  errorData: any,
): FinanceError {
  const message = errorData?.message || errorData?.error || "Unknown error";
  const errorCode = errorData?.errorCode || errorData?.code;

  // Check for specific error patterns
  if (message.toLowerCase().includes("state building contractor license")) {
    const stateMatch =
      message.match(/for\s+(\w{2})\s+state/i) || message.match(/in\s+(\w{2})/i);
    return new StateLicenseError(stateMatch?.[1] || "unknown", errorData);
  }

  if (errorCode === "DECLINED" || message.toLowerCase().includes("declined")) {
    return new CreditDeclinedError(message, errorData);
  }

  if (
    errorCode === "CREDIT_FROZEN" ||
    message.toLowerCase().includes("credit frozen") ||
    message.toLowerCase().includes("credit freeze")
  ) {
    return new CreditFrozenError(errorData);
  }

  if (
    errorCode === "NO_HIT" ||
    message.toLowerCase().includes("no hit") ||
    message.toLowerCase().includes("unable to locate")
  ) {
    return new NoHitError(errorData);
  }

  if (
    message.toLowerCase().includes("payment cap") ||
    message.toLowerCase().includes("exceeds cap")
  ) {
    const capMatch = message.match(/\$?([\d,]+(?:\.\d{2})?)/i);
    const cap = capMatch
      ? parseFloat(capMatch[1].replace(/,/g, ""))
      : undefined;
    return new QuoteExceedsCapError(cap, errorData);
  }

  // Default to generic API error
  return new FinanceAPIError(message, "lightreach", statusCode, errorData);
}

/**
 * Format error for user display
 */
export function formatFinanceError(error: unknown): string {
  if (error instanceof FinanceError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

/**
 * Log finance error with appropriate level
 */
export function logFinanceError(error: unknown, context?: string): void {
  const prefix = context ? `[Finance:${context}]` : "[Finance]";

  if (error instanceof FinanceValidationError) {
    console.warn(`${prefix} Validation error:`, error.message, error.field);
  } else if (error instanceof FinanceAPIError) {
    console.error(`${prefix} API error (${error.provider}):`, error.message, {
      statusCode: error.statusCode,
      details: error.details,
    });
  } else if (error instanceof FinanceNetworkError) {
    console.error(`${prefix} Network error:`, error.message, error.details);
  } else if (error instanceof FinanceError) {
    console.error(`${prefix} Error:`, error.message, {
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    });
  } else {
    console.error(`${prefix} Unexpected error:`, error);
  }
}

/**
 * Redact sensitive data from objects for logging
 */
export function redactSensitiveData(data: any): any {
  if (!data || typeof data !== "object") {
    return data;
  }

  const sensitiveFields = [
    "apiKey",
    "password",
    "ssn",
    "socialSecurityNumber",
    "creditCard",
    "cardNumber",
    "cvv",
    "securityCode",
  ];

  const redacted = { ...data };

  for (const field of sensitiveFields) {
    if (field in redacted) {
      redacted[field] = "[REDACTED]";
    }
  }

  // Recursively redact nested objects
  for (const key in redacted) {
    if (
      redacted[key] &&
      typeof redacted[key] === "object" &&
      !Array.isArray(redacted[key])
    ) {
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }

  return redacted;
}
