// LightReach/Palmetto Finance API Integration
// Documentation: https://docs.palmetto.com
// Based on Palmetto Finance API structure

import { IFinanceProvider, FinanceApplicationData, FinanceApplicationResponse } from './finance-provider.interface'
import {
  FinanceAPIError,
  FinanceNetworkError,
  FinanceValidationError,
  logFinanceError,
  redactSensitiveData,
} from './finance-errors'

// Palmetto Finance API response types
interface PalmettoAuthResponse {
  access_token: string
  token_type?: string
  expires_in?: number
}

interface PalmettoAccountResponse {
  id: string
  status: string
  applicants?: Array<{
    type: 'primary' | 'secondary'
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
  }>
  [key: string]: any
}

export class LightReachClient implements IFinanceProvider {
  private username: string
  private password: string
  private baseUrl: string
  private authUrl: string
  private accessToken: string | null = null
  private tokenExpiry: number = 0
  private readonly maxRetries = 3
  private readonly retryDelay = 1000 // 1 second
  private readonly tokenRefreshBuffer = 5 * 60 * 1000 // Refresh token 5 minutes before expiry

  constructor() {
    // Support both old API key format and new username/password format
    const apiKey = process.env.LIGHTREACH_API_KEY || ''
    this.username = process.env.PALMETTO_FINANCE_ACCOUNT_EMAIL || process.env.LIGHTREACH_USERNAME || ''
    this.password = process.env.PALMETTO_FINANCE_ACCOUNT_PASSWORD || process.env.LIGHTREACH_PASSWORD || ''

    // Determine environment (default to 'next' for staging)
    const environment = (process.env.PALMETTO_FINANCE_ENVIRONMENT || 'next').toLowerCase()
    const isProduction = environment === 'prod' || environment === 'production'

    if (isProduction) {
      this.baseUrl = process.env.PALMETTO_FINANCE_BASE_URL || 'https://palmetto.finance'
      this.authUrl = process.env.PALMETTO_FINANCE_AUTH_URL || 'https://palmetto.finance/api/auth/login'
    } else {
      this.baseUrl = process.env.PALMETTO_FINANCE_BASE_URL || 'https://next.palmetto.finance'
      this.authUrl = process.env.PALMETTO_FINANCE_AUTH_URL || 'https://next.palmetto.finance/api/auth/login'
    }

    // Fallback to old LIGHTREACH_BASE_URL if set
    if (process.env.LIGHTREACH_BASE_URL) {
      this.baseUrl = process.env.LIGHTREACH_BASE_URL
    }

    // Legacy support: if API key is provided, log warning
    if (apiKey && !this.username) {
      console.warn(
        '[LightReach] LIGHTREACH_API_KEY is deprecated. Please use PALMETTO_FINANCE_ACCOUNT_EMAIL and PALMETTO_FINANCE_ACCOUNT_PASSWORD'
      )
    }

    if (!this.username || !this.password) {
      console.warn('[LightReach] Palmetto Finance credentials not configured. Finance operations will fail.')
    }
  }

  /**
   * Authenticate and get access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry - this.tokenRefreshBuffer) {
      return this.accessToken
    }

    if (!this.username || !this.password) {
      throw new FinanceAPIError(
        'Palmetto Finance credentials not configured',
        'lightreach',
        500
      )
    }

    try {
      const response = await this.makeRequest(this.authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
        }),
      })

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch {
          errorData = { message: response.statusText }
        }

        throw new FinanceAPIError(
          errorData.message || 'Authentication failed',
          'lightreach',
          response.status,
          errorData
        )
      }

      const authResponse: PalmettoAuthResponse = await response.json()
      this.accessToken = authResponse.access_token

      // Set token expiry (default to 1 hour if not provided)
      const expiresIn = authResponse.expires_in || 3600
      this.tokenExpiry = Date.now() + expiresIn * 1000

      console.log('[LightReach] Authentication successful')
      return this.accessToken
    } catch (error) {
      if (error instanceof FinanceAPIError) {
        throw error
      }

      logFinanceError(error, 'getAccessToken')
      throw new FinanceAPIError(
        `Failed to authenticate: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'lightreach',
        500
      )
    }
  }

  /**
   * Validate application data before submission
   */
  private validateApplicationData(data: FinanceApplicationData): void {
    const requiredFields: (keyof FinanceApplicationData)[] = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'address',
      'city',
      'state',
      'zip',
      'systemPrice',
    ]

    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        throw new FinanceValidationError(
          `Missing required field: ${field}`,
          field as string
        )
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      throw new FinanceValidationError('Invalid email format', 'email')
    }

    // Validate phone format and length (at least 10 digits)
    const phoneRegex = /^[\d\s\-\(\)\+]+$/
    if (!phoneRegex.test(data.phone)) {
      throw new FinanceValidationError('Invalid phone format', 'phone')
    }
    const digitsOnly = data.phone.replace(/\D/g, '')
    if (digitsOnly.length < 10) {
      throw new FinanceValidationError(
        'Phone number must be at least 10 digits',
        'phone'
      )
    }

    // Validate system price
    if (typeof data.systemPrice !== 'number' || data.systemPrice <= 0) {
      throw new FinanceValidationError(
        'System price must be a positive number',
        'systemPrice'
      )
    }

    // Validate state (2-letter code)
    if (data.state.length !== 2) {
      throw new FinanceValidationError(
        'State must be a 2-letter code',
        'state'
      )
    }

    // Validate ZIP code (5 or 9 digits)
    const zipRegex = /^\d{5}(-\d{4})?$/
    if (!zipRegex.test(data.zip)) {
      throw new FinanceValidationError(
        'ZIP code must be 5 digits or 9 digits (12345 or 12345-6789)',
        'zip'
      )
    }
  }

  /**
   * Make API request with retry logic
   */
  private async makeRequest(
    url: string,
    options: RequestInit,
    retries = this.maxRetries
  ): Promise<Response> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        return response
      } catch (error: any) {
        lastError = error

        // Don't retry on abort (timeout) or if it's the last attempt
        if (error.name === 'AbortError' || attempt === retries) {
          break
        }

        // Wait before retrying (exponential backoff)
        const delay = this.retryDelay * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw new FinanceNetworkError(
      `Request failed after ${retries + 1} attempts: ${lastError?.message || 'Unknown error'}`,
      { url, lastError: lastError?.message }
    )
  }

  async createApplication(data: FinanceApplicationData): Promise<FinanceApplicationResponse> {
    // Validate input data
    this.validateApplicationData(data)

    // Get access token
    const token = await this.getAccessToken()

    // Transform our application data to Palmetto Finance API v2 format
    // Based on official API documentation: /api/v2/accounts/
    const palmettoAccountData = {
      programType: 'hvac' as const,
      applicants: [
        {
          type: 'primary' as const,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email.toLowerCase().trim(),
          phoneNumber: data.phone.trim(),
          address: {
            address1: data.address.trim(),
            city: data.city.trim(),
            state: data.state.trim(),
            zip: data.zip.trim(),
          },
        },
      ],
      address: {
        address1: data.address.trim(),
        city: data.city.trim(),
        state: data.state.trim(),
        zip: data.zip.trim(),
      },
      // Sales rep info - required but can be set from env or passed in data
      salesRepName: data.salesRepName || process.env.PALMETTO_SALES_REP_NAME || 'Austin Elkins',
      salesRepEmail: data.salesRepEmail || process.env.PALMETTO_SALES_REP_EMAIL || 'austin@kinhome.com',
      salesRepPhoneNumber: data.salesRepPhoneNumber || process.env.PALMETTO_SALES_REP_PHONE || '801-928-6369',
      // External reference to link back to our proposal
      ...(data.externalReference && { externalReference: data.externalReference }),
      ...(data.externalReferenceIds && { externalReferenceIds: data.externalReferenceIds }),
      // Human-readable name for Palmetto dashboard (e.g. customer name)
      ...(data.friendlyName && data.friendlyName.trim() && { friendlyName: data.friendlyName.trim() }),
      // System design (home size, equipment, systems) so LightReach portal shows account details
      ...(data.systemDesign && typeof data.systemDesign === 'object' && Object.keys(data.systemDesign).length > 0 && { systemDesign: data.systemDesign }),
    }

    // Use v2 endpoint as recommended by API docs
    const url = `${this.baseUrl}/api/v2/accounts`
    const requestBody = JSON.stringify(palmettoAccountData)

    // Log request (with sensitive data redacted)
    const logData = redactSensitiveData(palmettoAccountData)
    console.log('[LightReach] Creating account/application:', {
      url,
      data: logData,
      timestamp: new Date().toISOString(),
    })

    try {
      const response = await this.makeRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: requestBody,
      })

      // Handle non-OK responses
      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch {
          // If response isn't JSON, use status text
          errorData = { message: response.statusText }
        }

        logFinanceError(
          new FinanceAPIError(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            'lightreach',
            response.status,
            errorData
          ),
          'createApplication'
        )

        throw new FinanceAPIError(
          errorData.message || 'Failed to create application',
          'lightreach',
          response.status,
          errorData
        )
      }

      // Parse response
      let result: PalmettoAccountResponse
      try {
        result = await response.json()
      } catch (error) {
        throw new FinanceAPIError(
          'Invalid response format from Palmetto Finance API',
          'lightreach',
          500,
          { error: error instanceof Error ? error.message : 'Unknown error' }
        )
      }

      // Validate response has required fields
      if (!result.id) {
        throw new FinanceAPIError(
          'Invalid response: missing account id',
          'lightreach',
          500,
          result
        )
      }

      // Map Palmetto status to our status format
      const statusMap: Record<string, 'pending' | 'submitted' | 'approved' | 'denied' | 'conditional' | 'cancelled'> = {
        '1 - Created': 'pending',
        '2 - Credit Approved': 'approved',
        '3 - Credit Approved': 'approved',
        '4 - Credit Denied': 'denied',
        'Terms & Conditions Accepted': 'submitted',
        '5 - Contract Created': 'submitted',
        '6 - Contract Sent': 'submitted',
        '7 - Contract Signed': 'approved',
        '8 - Contract Approved': 'approved',
        '99 - Credit Expired': 'cancelled',
      }

      const mappedStatus = statusMap[result.status] || 'pending'

      // Log successful response
      console.log('[LightReach] Account/application created:', {
        accountId: result.id,
        status: result.status,
        mappedStatus,
        timestamp: new Date().toISOString(),
      })

      return {
        applicationId: result.id,
        status: mappedStatus,
        // Extract payment info if available in response
        monthlyPayment: (result as any).monthlyPayment,
        totalCost: (result as any).totalCost || data.systemPrice,
        apr: (result as any).apr,
        term: (result as any).term,
        message: (result as any).message || `Account created with status: ${result.status}`,
      }
    } catch (error) {
      // Re-throw FinanceError types as-is
      if (
        error instanceof FinanceAPIError ||
        error instanceof FinanceNetworkError ||
        error instanceof FinanceValidationError
      ) {
        throw error
      }

      // Wrap unexpected errors
      logFinanceError(error, 'createApplication')
      throw new FinanceAPIError(
        `Unexpected error creating application: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'lightreach',
        500,
        { originalError: error instanceof Error ? error.message : String(error) }
      )
    }
  }

  async getApplicationStatus(applicationId: string): Promise<FinanceApplicationResponse> {
    if (!applicationId || applicationId.trim() === '') {
      throw new FinanceValidationError('Application ID is required', 'applicationId')
    }

    // Get access token
    const token = await this.getAccessToken()

    const url = `${this.baseUrl}/api/accounts/${applicationId}`

    console.log('[LightReach] Getting application status:', {
      url,
      applicationId,
      timestamp: new Date().toISOString(),
    })

    try {
      const response = await this.makeRequest(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch {
          errorData = { message: response.statusText }
        }

        if (response.status === 404) {
          throw new FinanceAPIError(
            `Application not found: ${applicationId}`,
            'lightreach',
            404,
            errorData
          )
        }

        logFinanceError(
          new FinanceAPIError(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            'lightreach',
            response.status,
            errorData
          ),
          'getApplicationStatus'
        )

        throw new FinanceAPIError(
          errorData.message || 'Failed to get application status',
          'lightreach',
          response.status,
          errorData
        )
      }

      let result: PalmettoAccountResponse
      try {
        result = await response.json()
      } catch (error) {
        throw new FinanceAPIError(
          'Invalid response format from Palmetto Finance API',
          'lightreach',
          500,
          { error: error instanceof Error ? error.message : 'Unknown error' }
        )
      }

      if (!result.id) {
        throw new FinanceAPIError(
          'Invalid response: missing account id',
          'lightreach',
          500,
          result
        )
      }

      // Map Palmetto status to our status format
      const statusMap: Record<string, 'pending' | 'submitted' | 'approved' | 'denied' | 'conditional' | 'cancelled'> = {
        '1 - Created': 'pending',
        '2 - Credit Approved': 'approved',
        '3 - Credit Approved': 'approved',
        '4 - Credit Denied': 'denied',
        'Terms & Conditions Accepted': 'submitted',
        '5 - Contract Created': 'submitted',
        '6 - Contract Sent': 'submitted',
        '7 - Contract Signed': 'approved',
        '8 - Contract Approved': 'approved',
        '99 - Credit Expired': 'cancelled',
      }

      const mappedStatus = statusMap[result.status] || 'pending'

      console.log('[LightReach] Account status retrieved:', {
        accountId: result.id,
        status: result.status,
        mappedStatus,
        timestamp: new Date().toISOString(),
      })

      return {
        applicationId: result.id,
        status: mappedStatus,
        monthlyPayment: (result as any).monthlyPayment,
        totalCost: (result as any).totalCost,
        apr: (result as any).apr,
        term: (result as any).term,
        message: (result as any).message || `Account status: ${result.status}`,
      }
    } catch (error) {
      if (
        error instanceof FinanceAPIError ||
        error instanceof FinanceNetworkError ||
        error instanceof FinanceValidationError
      ) {
        throw error
      }

      logFinanceError(error, 'getApplicationStatus')
      throw new FinanceAPIError(
        `Unexpected error getting application status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'lightreach',
        500,
        { originalError: error instanceof Error ? error.message : String(error) }
      )
    }
  }

  /**
   * Get pricing information for an account (includes monthly payment schedule)
   * This uses the HVAC pricing endpoint which returns monthly payments by year.
   * Optional systemDesign (equipment type, SEER, tonnage, etc.) can improve pricing accuracy.
   */
  async getPricing(
    accountId: string,
    totalFinancedAmount: number,
    systemDesign?: Record<string, unknown>
  ): Promise<any> {
    if (!accountId || accountId.trim() === '') {
      throw new FinanceValidationError('Account ID is required', 'accountId')
    }

    // Get access token
    const token = await this.getAccessToken()

    const url = `${this.baseUrl}/api/v2/accounts/${accountId}/pricing/hvac`

    const body: { totalFinancedAmount: number; systemDesign?: Record<string, unknown> } = {
      totalFinancedAmount,
    }
    if (systemDesign && Object.keys(systemDesign).length > 0) {
      body.systemDesign = systemDesign
    }

    console.log('[LightReach] Getting pricing:', {
      url,
      accountId,
      totalFinancedAmount,
      hasSystemDesign: !!body.systemDesign,
      timestamp: new Date().toISOString(),
    })

    try {
      const response = await this.makeRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch {
          errorData = { message: response.statusText }
        }

        if (response.status === 404) {
          throw new FinanceAPIError(
            `Account not found: ${accountId}`,
            'lightreach',
            404,
            errorData
          )
        }

        logFinanceError(
          new FinanceAPIError(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            'lightreach',
            response.status,
            errorData
          ),
          'getPricing'
        )

        throw new FinanceAPIError(
          errorData.message || 'Failed to get pricing',
          'lightreach',
          response.status,
          errorData
        )
      }

      let result: any
      try {
        result = await response.json()
      } catch (error) {
        throw new FinanceAPIError(
          'Invalid response format from Palmetto Finance API',
          'lightreach',
          500,
          { error: error instanceof Error ? error.message : 'Unknown error' }
        )
      }

      console.log('[LightReach] Pricing retrieved:', {
        accountId,
        productsCount: Array.isArray(result) ? result.length : 'N/A',
        timestamp: new Date().toISOString(),
      })

      return result
    } catch (error) {
      if (
        error instanceof FinanceAPIError ||
        error instanceof FinanceNetworkError ||
        error instanceof FinanceValidationError
      ) {
        throw error
      }

      logFinanceError(error, 'getPricing')
      throw new FinanceAPIError(
        `Unexpected error getting pricing: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'lightreach',
        500,
        { originalError: error instanceof Error ? error.message : String(error) }
      )
    }
  }

  /**
   * Get stipulations for an account (conditional approval requirements).
   * GET /api/accounts/{accountId}/stipulations
   */
  async getStipulations(accountId: string): Promise<any> {
    if (!accountId || accountId.trim() === '') {
      throw new FinanceValidationError('Account ID is required', 'accountId')
    }
    const token = await this.getAccessToken()
    const url = `${this.baseUrl}/api/accounts/${accountId}/stipulations`
    const response = await this.makeRequest(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new FinanceAPIError(
        (errorData as any)?.message || `Failed to get stipulations: ${response.status}`,
        'lightreach',
        response.status,
        errorData
      )
    }
    return response.json()
  }

  /**
   * Get contract signing link for the current contract.
   * POST /api/accounts/{accountId}/contracts/current/signing-link
   */
  async getSigningLink(accountId: string): Promise<{ url?: string; signingLink?: string }> {
    if (!accountId || accountId.trim() === '') {
      throw new FinanceValidationError('Account ID is required', 'accountId')
    }
    const token = await this.getAccessToken()
    const url = `${this.baseUrl}/api/accounts/${accountId}/contracts/current/signing-link`
    const response = await this.makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new FinanceAPIError(
        (errorData as any)?.message || `Failed to get signing link: ${response.status}`,
        'lightreach',
        response.status,
        errorData
      )
    }
    const data = await response.json()
    return { url: data.url ?? data.signingLink, signingLink: data.signingLink ?? data.url }
  }

  async getPaymentSchedule(
    applicationId: string,
    options?: { systemDesign?: Record<string, unknown> }
  ): Promise<any> {
    if (!applicationId || applicationId.trim() === '') {
      throw new FinanceValidationError('Application ID is required', 'applicationId')
    }

    // Get access token
    const token = await this.getAccessToken()

    // Get account details first to get total cost
    const account = await this.getApplicationStatus(applicationId)
    const totalCost = account.totalCost

    if (!totalCost) {
      throw new FinanceAPIError(
        'Cannot get payment schedule: total cost not available for this account',
        'lightreach',
        400
      )
    }

    // Use pricing endpoint to get payment schedule; optional systemDesign for more accurate pricing
    const pricing = await this.getPricing(
      applicationId,
      totalCost,
      options?.systemDesign
    )

    // Extract payment schedule from pricing response
    // Pricing returns array of products, each with monthlyPayments array
    if (Array.isArray(pricing) && pricing.length > 0) {
      // Return the first product's payment schedule (or combine all if needed)
      const firstProduct = pricing[0]
      return {
        productId: firstProduct.productId,
        productName: firstProduct.name,
        monthlyPayments: firstProduct.monthlyPayments || [],
        escalationRate: firstProduct.escalationRate,
        allProducts: pricing, // Include all products for reference
      }
    }

    return { monthlyPayments: [], message: 'No pricing products available' }

    console.log('[LightReach] Getting payment schedule:', {
      url,
      applicationId,
      timestamp: new Date().toISOString(),
    })

    try {
      const response = await this.makeRequest(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch {
          errorData = { message: response.statusText }
        }

        if (response.status === 404) {
          throw new FinanceAPIError(
            `Application not found: ${applicationId}`,
            'lightreach',
            404,
            errorData
          )
        }

        logFinanceError(
          new FinanceAPIError(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            'lightreach',
            response.status,
            errorData
          ),
          'getPaymentSchedule'
        )

        throw new FinanceAPIError(
          errorData.message || 'Failed to get payment schedule',
          'lightreach',
          response.status,
          errorData
        )
      }

      let result: any
      try {
        result = await response.json()
      } catch (error) {
        throw new FinanceAPIError(
          'Invalid response format from LightReach API',
          'lightreach',
          500,
          { error: error instanceof Error ? error.message : 'Unknown error' }
        )
      }

      console.log('[LightReach] Payment schedule retrieved:', {
        applicationId,
        scheduleLength: Array.isArray(result) ? result.length : 'N/A',
        timestamp: new Date().toISOString(),
      })

      return result
    } catch (error) {
      if (
        error instanceof FinanceAPIError ||
        error instanceof FinanceNetworkError ||
        error instanceof FinanceValidationError
      ) {
        throw error
      }

      logFinanceError(error, 'getPaymentSchedule')
      throw new FinanceAPIError(
        `Unexpected error getting payment schedule: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'lightreach',
        500,
        { originalError: error instanceof Error ? error.message : String(error) }
      )
    }
  }
}

export const lightReachClient = new LightReachClient()
