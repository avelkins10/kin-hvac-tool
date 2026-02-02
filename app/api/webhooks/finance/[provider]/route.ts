import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { emailClient } from '@/lib/email/email-client'
import crypto from 'crypto'

/**
 * Verify LightReach webhook authentication
 * LightReach uses apiKey header from webhook registration
 * Can also use clientId/clientSecret headers or Authorization header
 */
function verifyLightReachWebhook(
  request: NextRequest
): boolean {
  // Method 1: API Key (default, from webhook registration)
  const apiKey = request.headers.get('apiKey') || request.headers.get('api_key') || ''
  const expectedApiKey = process.env.LIGHTREACH_WEBHOOK_API_KEY || ''

  if (expectedApiKey && apiKey === expectedApiKey) {
    return true
  }

  // Method 2: Client Headers
  const clientId = request.headers.get('clientId') || ''
  const clientSecret = request.headers.get('clientSecret') || ''
  const expectedClientId = process.env.LIGHTREACH_WEBHOOK_CLIENT_ID || ''
  const expectedClientSecret = process.env.LIGHTREACH_WEBHOOK_CLIENT_SECRET || ''

  if (expectedClientId && expectedClientSecret && clientId === expectedClientId && clientSecret === expectedClientSecret) {
    return true
  }

  // Method 3: Basic Authorization
  const authHeader = request.headers.get('authorization') || ''
  if (authHeader.startsWith('Basic ')) {
    const credentials = Buffer.from(authHeader.substring(6), 'base64').toString('utf-8')
    const [id, secret] = credentials.split(':')
    if (id === expectedClientId && secret === expectedClientSecret) {
      return true
    }
  }

  // If no credentials configured, allow in development (with warning)
  if (!expectedApiKey && !expectedClientId) {
    console.warn('[Webhook] LightReach webhook credentials not configured, skipping verification (development mode)')
    return true
  }

  return false
}

/**
 * Verify webhook authentication based on provider
 */
function verifyWebhookAuthentication(
  provider: string,
  request: NextRequest
): boolean {
  switch (provider.toLowerCase()) {
    case 'lightreach': {
      return verifyLightReachWebhook(request)
    }
    default:
      // For unknown providers, log warning but allow (can be configured per provider)
      console.warn(`[Webhook] Unknown provider: ${provider}, authentication skipped`)
      return true
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider.toLowerCase()
  const startTime = Date.now()

  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    let body: any

    try {
      body = JSON.parse(rawBody)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    const { event, accountId, accountReference, status, ...otherData } = body

    // Validate required fields for LightReach webhooks
    if (provider.toLowerCase() === 'lightreach') {
      if (!event) {
        return NextResponse.json(
          { error: 'event is required' },
          { status: 400 }
        )
      }

      if (!accountId) {
        return NextResponse.json(
          { error: 'accountId is required' },
          { status: 400 }
        )
      }
    } else {
      // Legacy format for other providers
      const applicationId = body.applicationId
      if (!applicationId || !body.status) {
        return NextResponse.json(
          { error: 'applicationId and status are required' },
          { status: 400 }
        )
      }
    }

    // Verify webhook authentication
    const authValid = verifyWebhookAuthentication(provider, request)
    if (!authValid) {
      console.error('[Webhook] Invalid authentication for provider:', provider)
      return NextResponse.json(
        { error: 'Invalid webhook authentication' },
        { status: 401 }
      )
    }

    // Log webhook receipt
    console.log('[Webhook] Received finance webhook:', {
      provider,
      event,
      accountId,
      accountReference,
      status,
      timestamp: new Date().toISOString(),
    })

    // For LightReach, find application by accountId (stored as externalApplicationId)
    // or by accountReference (stored in proposal's externalReference)
    let application = null

    if (provider.toLowerCase() === 'lightreach') {
      // Try to find by accountId first (most reliable)
      application = await prisma.financeApplication.findFirst({
        where: {
          lenderId: provider,
          externalApplicationId: accountId,
        },
        include: {
          proposal: {
            include: {
              company: {
                include: {
                  users: {
                    where: {
                      role: {
                        in: ['COMPANY_ADMIN', 'SUPER_ADMIN'],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      // If not found by accountId, try to find by accountReference (proposal ID)
      if (!application && accountReference) {
        const proposal = await prisma.proposal.findFirst({
          where: {
            id: accountReference,
          },
        })

        if (proposal) {
          application = await prisma.financeApplication.findFirst({
            where: {
              proposalId: proposal.id,
              lenderId: provider,
            },
            include: {
              proposal: {
                include: {
                  company: {
                    include: {
                      users: {
                        where: {
                          role: {
                            in: ['COMPANY_ADMIN', 'SUPER_ADMIN'],
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          })
        }
      }
    } else {
      // Legacy format for other providers
      application = await prisma.financeApplication.findFirst({
        where: {
          lenderId: provider,
          externalApplicationId: body.applicationId,
        },
        include: {
          proposal: {
            include: {
              company: {
                include: {
                  users: {
                    where: {
                      role: {
                        in: ['COMPANY_ADMIN', 'SUPER_ADMIN'],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })
    }

    if (!application) {
      console.warn('[Webhook] Application not found:', { provider, accountId, accountReference, event })
      // Return 200 to prevent webhook retries for invalid application IDs
      return NextResponse.json({ received: true, message: 'Application not found' })
    }

    const previousStatus = application.status
    const existingResponseData = (application.responseData as any) || {}

    // Map LightReach event to application status
    let newStatus = previousStatus
    let shouldSendEmail = false
    let emailStatus = ''

    // Extra responseData to merge (account updates, milestones, quote, stipulations, etc.)
    let mergeResponseData: Record<string, unknown> = {}

    if (provider.toLowerCase() === 'lightreach') {
      switch (event) {
        case 'applicationStatus':
          const statusMap: Record<string, 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'DENIED' | 'CONDITIONAL' | 'CANCELLED'> = {
            approved: 'APPROVED',
            approvedWithStipulations: 'CONDITIONAL',
            declined: 'DENIED',
            expired: 'CANCELLED',
            creditFrozen: 'PENDING',
          }
          newStatus = statusMap[status?.toLowerCase() || ''] || 'PENDING'
          shouldSendEmail = true
          emailStatus = status?.toLowerCase() || ''
          break
        case 'accountUpdated':
          // Merge Palmetto account updates into our stored data so we stay in sync
          if (body.updates && typeof body.updates === 'object') {
            mergeResponseData.accountUpdates = body.updates
            mergeResponseData.accountUpdatedAt = new Date().toISOString()
          }
          break
        case 'milestoneAchieved':
          mergeResponseData.milestones = Array.isArray(existingResponseData.milestones)
            ? [...existingResponseData.milestones, { milestone: otherData.newMilestone, at: new Date().toISOString() }]
            : [{ milestone: otherData.newMilestone, at: new Date().toISOString() }]
          console.log('[Webhook] Milestone achieved:', otherData.newMilestone)
          break
        case 'milestonePackage':
          mergeResponseData.milestonePackages = Array.isArray(existingResponseData.milestonePackages)
            ? [...existingResponseData.milestonePackages, { ...otherData, at: new Date().toISOString() }]
            : [{ ...otherData, at: new Date().toISOString() }]
          console.log('[Webhook] Milestone package:', otherData.type, otherData.status)
          break
        case 'quoteVoided':
          newStatus = 'CANCELLED'
          break
        case 'quoteCreated':
          if (otherData.quoteId) mergeResponseData.quoteId = otherData.quoteId
          if (otherData.quoteReference) mergeResponseData.quoteReference = otherData.quoteReference
          break
        case 'contractSent':
          shouldSendEmail = false
          break
        case 'contractSigned':
        case 'contractApproved':
          newStatus = 'APPROVED'
          shouldSendEmail = true
          emailStatus = 'approved'
          break
        case 'contractVoided':
          newStatus = 'CANCELLED'
          shouldSendEmail = true
          emailStatus = 'cancelled'
          break
        case 'contractReinstated':
          newStatus = 'APPROVED'
          mergeResponseData.contractReinstatedAt = new Date().toISOString()
          break
        case 'stipulationAdded':
        case 'stipulationCleared':
        case 'allStipulationsCleared':
          mergeResponseData.stipulationsUpdatedAt = new Date().toISOString()
          break
        case 'requirementCompleted':
          mergeResponseData.requirementCompletedAt = new Date().toISOString()
          mergeResponseData.requirementCompleted = otherData
          break
        case 'termsAndConditionsAccepted':
          mergeResponseData.termsAndConditionsAcceptedAt = otherData.dateAccepted || new Date().toISOString()
          break
        case 'activeQuoteExceedsMonthlyPaymentCaps':
          mergeResponseData.quoteExceedsPaymentCap = true
          mergeResponseData.quoteExceedsPaymentCapAt = new Date().toISOString()
          mergeResponseData.monthlyPaymentCap = otherData.monthlyPaymentCap
          break
        default:
          console.log('[Webhook] Received event:', event, 'for account:', accountId)
          mergeResponseData.lastWebhookEvent = event
          mergeResponseData.lastWebhookPayload = otherData
      }
    } else {
      // Legacy format
      newStatus = (body.status as string).toUpperCase() as any
      shouldSendEmail = true
      emailStatus = body.status
    }

    // Track contract events with timestamps
    const contractStatus: any = { ...existingResponseData.contractStatus }
    
    if (event === 'contractSent') {
      contractStatus.sentAt = new Date().toISOString()
      contractStatus.sent = true
    } else if (event === 'contractSigned') {
      contractStatus.signedAt = new Date().toISOString()
      contractStatus.signed = true
    } else if (event === 'contractApproved') {
      contractStatus.approvedAt = new Date().toISOString()
      contractStatus.approved = true
    } else     if (event === 'contractVoided') {
      contractStatus.voidedAt = new Date().toISOString()
      contractStatus.voided = true
    }
    if (event === 'contractReinstated') {
      contractStatus.reinstatedAt = new Date().toISOString()
      contractStatus.reinstated = true
    }

    // Update application status
    const updated = await prisma.financeApplication.update({
      where: { id: application.id },
      data: {
        status: newStatus,
        responseData: {
          ...existingResponseData,
          ...(body.updates && event === 'accountUpdated' ? body.updates : {}),
          ...mergeResponseData,
          ...otherData,
          event,
          accountId,
          accountReference,
          contractReference: otherData.contractReference,
          quoteReference: otherData.quoteReference,
          status: status || body.status,
          webhookReceivedAt: new Date().toISOString(),
          contractStatus: Object.keys(contractStatus).length > 0 ? contractStatus : undefined,
        },
      },
    })

    console.log('[Webhook] Application updated:', {
      applicationId: application.id,
      previousStatus,
      newStatus: updated.status,
      provider,
    })

    // Send email notifications based on status
    const proposal = application.proposal
    const customerData = proposal.customerData as any
    const customerEmail = customerData?.email

    // Prepare application details for emails
    const applicationDetails = {
      monthlyPayment: otherData.monthlyPayment || (updated.responseData as any)?.monthlyPayment,
      totalCost: otherData.totalCost || (updated.responseData as any)?.totalCost,
      apr: otherData.apr || (updated.responseData as any)?.apr,
      term: otherData.term || (updated.responseData as any)?.term,
      message: otherData.message || (updated.responseData as any)?.message,
    }

    // Send emails (don't fail webhook if email fails)
    try {
      if (shouldSendEmail && customerEmail) {
        switch (emailStatus.toLowerCase()) {
          case 'approved':
            await emailClient.sendFinanceApprovalEmail(customerEmail, applicationDetails)
            console.log('[Webhook] Approval email sent to customer:', customerEmail)
            break
          case 'declined':
          case 'denied':
            await emailClient.sendFinanceDenialEmail(customerEmail, applicationDetails)
            console.log('[Webhook] Denial email sent to customer:', customerEmail)
            break
          case 'approvedwithstipulations':
          case 'conditional':
            await emailClient.sendFinanceConditionalEmail(customerEmail, applicationDetails)
            console.log('[Webhook] Conditional approval email sent to customer:', customerEmail)
            break
        }
      }

      // Send notification to company admins
      const adminEmails = proposal.company.users
        .filter((user) => user.email)
        .map((user) => user.email)
        .filter((email): email is string => !!email)

      if (shouldSendEmail && adminEmails.length > 0 && customerData?.name) {
        await emailClient.sendFinanceStatusNotificationEmail(
          adminEmails,
          customerData.name,
          emailStatus || status || 'updated',
          applicationDetails
        )
        console.log('[Webhook] Status notification sent to admins:', adminEmails)
      }
    } catch (emailError) {
      // Log email errors but don't fail the webhook
      console.error('[Webhook] Error sending email notifications:', emailError)
    }

    const processingTime = Date.now() - startTime
    console.log('[Webhook] Webhook processed successfully:', {
      provider,
      event,
      accountId,
      accountReference,
      applicationId: application.id,
      previousStatus,
      newStatus: updated.status,
      processingTimeMs: processingTime,
    })

    return NextResponse.json({
      received: true,
      applicationId: application.id,
      status: updated.status,
      event,
    })
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`[Webhook] Error processing ${provider} webhook:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      processingTimeMs: processingTime,
    })

    // Return 500 to trigger webhook retry (if provider supports it)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

