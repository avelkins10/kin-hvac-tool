// PandaDoc API Integration
// Documentation: https://developers.pandadoc.com/reference/sdk
// Better Next.js/Turbopack compatibility than DocuSign

import * as pd_api from 'pandadoc-node-client'

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

export class PandaDocClient {
  private client: pd_api.DocumentsApi
  private config: pd_api.Configuration

  constructor() {
    const apiKey = process.env.PANDADOC_API_KEY || ''
    
    this.config = pd_api.createConfiguration({
      authMethods: {
        apiKey: `API-Key ${apiKey}`,
      },
    })

    this.client = new pd_api.DocumentsApi(this.config)
  }

  async createDocument(request: SignatureRequest): Promise<{ documentId: string; status: string }> {
    try {
      // Prepare recipients
      const recipients = request.signers.map((signer, index) => {
        const nameParts = signer.name.split(' ')
        return {
          email: signer.email,
          firstName: nameParts[0] || signer.name,
          lastName: nameParts.slice(1).join(' ') || '',
          role: signer.role || 'signer',
        }
      })

      // Create document from PDF content
      const documentCreateRequest: pd_api.DocumentCreateRequest = {
        name: request.documentName,
        content: request.documentBase64,
        contentEncoding: 'base64',
        tags: [`proposal-${request.proposalId}`],
        recipients: recipients,
      }

      const document = await this.client.create({
        documentCreateRequest,
      })

      if (!document.id) {
        throw new Error('Failed to create document: no document ID returned')
      }

      // Send document for signing
      const documentSendRequest: pd_api.DocumentSendRequest = {
        message: request.emailMessage || 'Please review and sign the attached document.',
        subject: request.emailSubject || 'Please sign your HVAC proposal agreement',
        silent: false,
      }

      await this.client.send(document.id, {
        documentSendRequest,
      })

      return {
        documentId: document.id,
        status: document.status || 'document.draft',
      }
    } catch (error: any) {
      console.error('PandaDoc API error:', error)
      if (error.body) {
        console.error('PandaDoc error body:', error.body)
      }
      throw new Error(`Failed to create PandaDoc document: ${error.message || 'Unknown error'}`)
    }
  }

  async getDocumentStatus(documentId: string): Promise<{
    documentId: string
    status: string
    dateCreated?: string
    dateCompleted?: string
  }> {
    try {
      const document = await this.client.details(documentId)

      return {
        documentId: document.id || documentId,
        status: document.status || 'unknown',
        dateCreated: document.dateCreated,
        dateCompleted: document.dateCompleted,
      }
    } catch (error: any) {
      console.error('PandaDoc API error:', error)
      throw new Error(`Failed to get document status: ${error.message || 'Unknown error'}`)
    }
  }

  async downloadSignedDocument(documentId: string): Promise<Buffer> {
    try {
      const pdf = await this.client.download(documentId, {
        version: 'final',
      })

      // PandaDoc returns the PDF as a buffer/stream
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
      console.error('PandaDoc API error:', error)
      throw new Error(`Failed to download document: ${error.message || 'Unknown error'}`)
    }
  }
}

export const pandaDocClient = new PandaDocClient()
