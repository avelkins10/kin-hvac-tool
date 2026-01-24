// SignNow API Integration
// Documentation: https://signnow.github.io/SignNowNodeSDK/
// MCP integration available for enhanced capabilities

import { SignNow } from '@signnow/api-client'

interface SignatureRequest {
  proposalId: string
  documentBase64: string
  documentName: string
  signers: Array<{
    email: string
    name: string
    role?: string
  }>
  emailSubject?: string
  emailMessage?: string
}

export class SignNowClient {
  private client: SignNow

  constructor() {
    const apiHost = process.env.SIGNNOW_API_HOST || 'https://api.signnow.com'
    const basicToken = process.env.SIGNNOW_BASIC_TOKEN || ''
    const username = process.env.SIGNNOW_USERNAME || ''
    const password = process.env.SIGNNOW_PASSWORD || ''

    if (!basicToken || !username || !password) {
      throw new Error('SignNow credentials are required: SIGNNOW_BASIC_TOKEN, SIGNNOW_USERNAME, SIGNNOW_PASSWORD')
    }

    this.client = new SignNow({
      apiHost,
      basicToken,
      credentials: {
        username,
        password,
      },
    })
  }

  async createDocument(request: SignatureRequest): Promise<{ documentId: string; status: string }> {
    try {
      // Upload document from base64 PDF
      const uploadResponse = await this.client.document.upload({
        file: {
          name: request.documentName,
          data: Buffer.from(request.documentBase64, 'base64'),
        },
      })

      if (!uploadResponse.id) {
        throw new Error('Failed to upload document: no document ID returned')
      }

      const documentId = uploadResponse.id

      // Prepare invitees (signers)
      const invitees = request.signers.map((signer, index) => {
        const nameParts = signer.name.split(' ')
        return {
          email: signer.email,
          role_id: signer.role || 'Signer 1',
          order: index + 1,
          first_name: nameParts[0] || signer.name,
          last_name: nameParts.slice(1).join(' ') || '',
        }
      })

      // Create and send invite for signing
      const inviteResponse = await this.client.document.invite({
        document_id: documentId,
        invite: {
          to: invitees.map((inv) => inv.email),
          from: process.env.SIGNNOW_FROM_EMAIL || process.env.SIGNNOW_USERNAME || '',
          subject: request.emailSubject || 'Please sign your HVAC proposal agreement',
          message: request.emailMessage || 'Please review and sign the attached proposal agreement.',
        },
      })

      return {
        documentId,
        status: 'pending', // SignNow documents start as pending
      }
    } catch (error: any) {
      console.error('SignNow API error:', error)
      if (error.response) {
        console.error('SignNow error response:', error.response.data)
      }
      throw new Error(`Failed to create SignNow document: ${error.message || 'Unknown error'}`)
    }
  }

  async getDocumentStatus(documentId: string): Promise<{
    documentId: string
    status: string
    dateCreated?: string
    dateCompleted?: string
  }> {
    try {
      const document = await this.client.document.get({ document_id: documentId })

      // Map SignNow status to our status
      let status = 'unknown'
      if (document.status === 'completed') {
        status = 'completed'
      } else if (document.status === 'pending') {
        status = 'pending'
      } else if (document.status === 'sent') {
        status = 'sent'
      }

      return {
        documentId: document.id || documentId,
        status,
        dateCreated: document.created ? new Date(document.created * 1000).toISOString() : undefined,
        dateCompleted: document.finished ? new Date(document.finished * 1000).toISOString() : undefined,
      }
    } catch (error: any) {
      console.error('SignNow API error:', error)
      throw new Error(`Failed to get document status: ${error.message || 'Unknown error'}`)
    }
  }

  async downloadSignedDocument(documentId: string): Promise<Buffer> {
    try {
      const pdf = await this.client.document.download({ document_id: documentId })

      // SignNow returns the PDF as a buffer/stream
      if (Buffer.isBuffer(pdf)) {
        return pdf
      }
      if (typeof pdf === 'string') {
        return Buffer.from(pdf, 'base64')
      }
      // If it's a stream, convert to buffer
      const chunks: Buffer[] = []
      for await (const chunk of pdf as any) {
        chunks.push(Buffer.from(chunk))
      }
      return Buffer.concat(chunks)
    } catch (error: any) {
      console.error('SignNow API error:', error)
      throw new Error(`Failed to download document: ${error.message || 'Unknown error'}`)
    }
  }
}

export const signNowClient = new SignNowClient()
