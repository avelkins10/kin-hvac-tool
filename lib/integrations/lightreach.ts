// LightReach API Integration
// Documentation: https://lightreach.com/api-docs

import { IFinanceProvider, FinanceApplicationData, FinanceApplicationResponse } from './finance-provider.interface'

export class LightReachClient implements IFinanceProvider {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.LIGHTREACH_API_KEY || ''
    this.baseUrl = process.env.LIGHTREACH_BASE_URL || 'https://api.lightreach.com/v1'
  }

  async createApplication(data: FinanceApplicationData): Promise<FinanceApplicationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create application')
      }

      const result = await response.json()
      return {
        applicationId: result.applicationId,
        status: result.status || 'pending',
        monthlyPayment: result.monthlyPayment,
        totalCost: result.totalCost,
        message: result.message,
      }
    } catch (error) {
      console.error('LightReach API error:', error)
      throw error
    }
  }

  async getApplicationStatus(applicationId: string): Promise<FinanceApplicationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/applications/${applicationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to get application status')
      }

      const result = await response.json()
      return {
        applicationId: result.applicationId,
        status: result.status || 'pending',
        monthlyPayment: result.monthlyPayment,
        totalCost: result.totalCost,
        message: result.message,
      }
    } catch (error) {
      console.error('LightReach API error:', error)
      throw error
    }
  }

  async getPaymentSchedule(applicationId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/applications/${applicationId}/payment-schedule`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to get payment schedule')
      }

      return await response.json()
    } catch (error) {
      console.error('LightReach API error:', error)
      throw error
    }
  }
}

export const lightReachClient = new LightReachClient()
