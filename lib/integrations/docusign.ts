// DocuSign API Integration
// Documentation: https://developers.docusign.com/docs/esign-rest-api/

import { ApiClient, EnvelopesApi, EnvelopeDefinition, Signer, SignHere, Tabs, Document } from 'docusign-esign'

interface DocuSignConfig {
  integrationKey: string
  userId: string
  accountId: string
  privateKey: string
  basePath: string
}

interface SignatureRequest {
  proposalId: string
  documentBase64: string
  documentName: string
  signers: Array<{
    email: string
    name: string
    routingOrder?: number
  }>
  emailSubject?: string
  emailBlurb?: string
}

export class DocuSignClient {
  private apiClient: ApiClient
  private config: DocuSignConfig
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor() {
    this.config = {
      integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY || '',
      userId: process.env.DOCUSIGN_USER_ID || '',
      accountId: process.env.DOCUSIGN_ACCOUNT_ID || '',
      privateKey: process.env.DOCUSIGN_PRIVATE_KEY || '',
      basePath: process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi',
    }

    this.apiClient = new ApiClient()
    this.apiClient.setBasePath(this.config.basePath)
  }

  private async getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    // Request new token using JWT
    try {
      const jwtLifeSec = 3600 // 1 hour
      const results = await this.apiClient.requestJWTUserToken(
        this.config.integrationKey,
        this.config.userId,
        'signature impersonation',
        Buffer.from(this.config.privateKey),
        jwtLifeSec
      )

      this.accessToken = results.body.access_token
      this.tokenExpiry = Date.now() + (jwtLifeSec - 60) * 1000 // Refresh 1 min before expiry

      return this.accessToken
    } catch (error) {
      console.error('DocuSign authentication error:', error)
      throw new Error('Failed to authenticate with DocuSign')
    }
  }

  async createEnvelope(request: SignatureRequest): Promise<{ envelopeId: string; status: string }> {
    try {
      const accessToken = await this.getAccessToken()
      this.apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`)

      const envelopesApi = new EnvelopesApi(this.apiClient)

      // Create document
      const document = new Document()
      document.documentBase64 = request.documentBase64
      document.name = request.documentName
      document.fileExtension = 'pdf'
      document.documentId = '1'

      // Create signers
      const signers = request.signers.map((signer, index) => {
        const signerObj = new Signer()
        signerObj.email = signer.email
        signerObj.name = signer.name
        signerObj.routingOrder = signer.routingOrder || (index + 1).toString()
        signerObj.recipientId = (index + 1).toString()

        // Add signature tab
        const signHere = new SignHere()
        signHere.documentId = '1'
        signHere.pageNumber = '1'
        signHere.recipientId = (index + 1).toString()
        signHere.tabLabel = 'SignHereTab'
        signHere.xPosition = '100'
        signHere.yPosition = '100'

        const tabs = new Tabs()
        tabs.signHereTabs = [signHere]
        signerObj.tabs = tabs

        return signerObj
      })

      // Create envelope definition
      const envelopeDefinition = new EnvelopeDefinition()
      envelopeDefinition.emailSubject = request.emailSubject || 'Please sign this document'
      envelopeDefinition.emailBlurb = request.emailBlurb || 'Please review and sign the attached document.'
      envelopeDefinition.documents = [document]
      envelopeDefinition.recipients = { signers }
      envelopeDefinition.status = 'sent'

      // Create envelope
      const results = await envelopesApi.createEnvelope(this.config.accountId, {
        envelopeDefinition,
      })

      return {
        envelopeId: results.envelopeId || '',
        status: results.status || 'sent',
      }
    } catch (error) {
      console.error('DocuSign API error:', error)
      throw error
    }
  }

  async getEnvelopeStatus(envelopeId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken()
      this.apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`)

      const envelopesApi = new EnvelopesApi(this.apiClient)
      const envelope = await envelopesApi.getEnvelope(this.config.accountId, envelopeId)

      return {
        envelopeId: envelope.envelopeId,
        status: envelope.status,
        statusDateTime: envelope.statusDateTime,
        completedDateTime: envelope.completedDateTime,
      }
    } catch (error) {
      console.error('DocuSign API error:', error)
      throw error
    }
  }

  async downloadSignedDocument(envelopeId: string): Promise<Buffer> {
    try {
      const accessToken = await this.getAccessToken()
      this.apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`)

      const envelopesApi = new EnvelopesApi(this.apiClient)
      const document = await envelopesApi.getDocument(
        this.config.accountId,
        envelopeId,
        'combined'
      )

      return Buffer.from(document, 'base64')
    } catch (error) {
      console.error('DocuSign API error:', error)
      throw error
    }
  }
}

export const docuSignClient = new DocuSignClient()
