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
    const monthlyPayment = applicationDetails.monthlyPayment
      ? `$${applicationDetails.monthlyPayment.toFixed(2)}`
      : 'N/A'
    const totalCost = applicationDetails.totalCost
      ? `$${applicationDetails.totalCost.toFixed(2)}`
      : 'N/A'
    const term = applicationDetails.term ? `${applicationDetails.term} months` : 'N/A'

    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #28a745;">Great News! Your Financing Application Has Been Approved</h2>
            <p>Congratulations! Your financing application has been approved.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Monthly Payment:</strong> ${monthlyPayment}</p>
              ${totalCost !== 'N/A' ? `<p><strong>Total Cost:</strong> ${totalCost}</p>` : ''}
              ${term !== 'N/A' ? `<p><strong>Term:</strong> ${term}</p>` : ''}
            </div>
            <p>Next steps will be communicated shortly by your sales representative.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
          </div>
        </body>
      </html>
    `

    await this.sendEmail({
      to,
      subject: 'Financing Application Approved',
      html,
      text: `Your financing application has been approved. Monthly payment: ${monthlyPayment}`,
    })
  }

  async sendFinanceDenialEmail(to: string, applicationDetails: any): Promise<void> {
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc3545;">Financing Application Update</h2>
            <p>We regret to inform you that your financing application was not approved at this time.</p>
            ${applicationDetails.message ? `<p><strong>Reason:</strong> ${applicationDetails.message}</p>` : ''}
            <p>If you have questions about this decision or would like to explore alternative financing options, please contact your sales representative.</p>
            <p>We're here to help you find a solution that works for you.</p>
          </div>
        </body>
      </html>
    `

    await this.sendEmail({
      to,
      subject: 'Financing Application Update',
      html,
      text: `Your financing application was not approved. ${applicationDetails.message ? `Reason: ${applicationDetails.message}` : ''}`,
    })
  }

  async sendFinanceConditionalEmail(to: string, applicationDetails: any): Promise<void> {
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #ffc107;">Financing Application - Conditional Approval</h2>
            <p>Your financing application has received conditional approval.</p>
            ${applicationDetails.message ? `<p><strong>Details:</strong> ${applicationDetails.message}</p>` : ''}
            <p>Your sales representative will contact you shortly to discuss the next steps and any additional information that may be needed.</p>
            <p>If you have any questions, please don't hesitate to reach out.</p>
          </div>
        </body>
      </html>
    `

    await this.sendEmail({
      to,
      subject: 'Financing Application - Conditional Approval',
      html,
      text: `Your financing application has received conditional approval. ${applicationDetails.message ? `Details: ${applicationDetails.message}` : ''}`,
    })
  }

  async sendFinanceStatusNotificationEmail(
    to: string[],
    customerName: string,
    status: string,
    applicationDetails: any
  ): Promise<void> {
    const statusMessages: Record<string, { subject: string; message: string }> = {
      approved: {
        subject: `Finance Application Approved - ${customerName}`,
        message: `The finance application for ${customerName} has been approved.`,
      },
      denied: {
        subject: `Finance Application Denied - ${customerName}`,
        message: `The finance application for ${customerName} was not approved.`,
      },
      conditional: {
        subject: `Finance Application Conditionally Approved - ${customerName}`,
        message: `The finance application for ${customerName} has received conditional approval.`,
      },
    }

    const statusInfo = statusMessages[status.toLowerCase()] || {
      subject: `Finance Application Status Update - ${customerName}`,
      message: `The finance application for ${customerName} status has been updated to: ${status}`,
    }

    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Finance Application Status Update</h2>
            <p>${statusInfo.message}</p>
            ${applicationDetails.monthlyPayment ? `<p><strong>Monthly Payment:</strong> $${applicationDetails.monthlyPayment.toFixed(2)}</p>` : ''}
            ${applicationDetails.message ? `<p><strong>Details:</strong> ${applicationDetails.message}</p>` : ''}
            <p>Please review the application and follow up with the customer as needed.</p>
          </div>
        </body>
      </html>
    `

    await this.sendEmail({
      to,
      subject: statusInfo.subject,
      html,
      text: statusInfo.message,
    })
  }
}

export const emailClient = new EmailClient()
