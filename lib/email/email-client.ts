// Email client using nodemailer
import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

class EmailClient {
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    // Configure transporter based on environment
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    }

    if (emailConfig.auth.user && emailConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(emailConfig)
    } else {
      console.warn('Email not configured - SMTP credentials missing')
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      throw new Error('Email transporter not configured')
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    }

    try {
      await this.transporter.sendMail(mailOptions)
    } catch (error) {
      console.error('Error sending email:', error)
      throw error
    }
  }

  async sendProposalEmail(to: string, proposalId: string, proposalUrl: string): Promise<void> {
    const html = `
      <html>
        <body>
          <h2>Your HVAC Proposal is Ready</h2>
          <p>Thank you for your interest in our HVAC services. Your personalized proposal is ready for review.</p>
          <p><a href="${proposalUrl}">View Your Proposal</a></p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
        </body>
      </html>
    `

    await this.sendEmail({
      to,
      subject: 'Your HVAC Proposal is Ready',
      html,
      text: `Your HVAC proposal is ready. View it at: ${proposalUrl}`,
    })
  }

  async sendSignatureRequestEmail(to: string, signatureUrl: string): Promise<void> {
    const html = `
      <html>
        <body>
          <h2>Action Required: Please Sign Your Agreement</h2>
          <p>Your proposal has been accepted. Please review and sign the agreement to proceed.</p>
          <p><a href="${signatureUrl}">Sign Agreement</a></p>
        </body>
      </html>
    `

    await this.sendEmail({
      to,
      subject: 'Please Sign Your Agreement',
      html,
      text: `Please sign your agreement at: ${signatureUrl}`,
    })
  }

  async sendFinanceApprovalEmail(to: string, applicationDetails: any): Promise<void> {
    const html = `
      <html>
        <body>
          <h2>Great News! Your Financing Application Has Been Approved</h2>
          <p>Congratulations! Your financing application has been approved.</p>
          <p>Monthly Payment: $${applicationDetails.monthlyPayment?.toFixed(2) || 'N/A'}</p>
          <p>Next steps will be communicated shortly.</p>
        </body>
      </html>
    `

    await this.sendEmail({
      to,
      subject: 'Financing Application Approved',
      html,
      text: `Your financing application has been approved. Monthly payment: $${applicationDetails.monthlyPayment?.toFixed(2) || 'N/A'}`,
    })
  }
}

export const emailClient = new EmailClient()
