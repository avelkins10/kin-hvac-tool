import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { lightReachClient, DocumentType } from '@/lib/integrations/lightreach';
import {
  FinanceError,
  FinanceValidationError,
  formatFinanceError,
  logFinanceError,
} from '@/lib/integrations/finance-errors';

// Valid document types for LightReach
const VALID_DOCUMENT_TYPES: DocumentType[] = [
  'bluetoothHVACTool',
  'proofOfLoadHVAC',
  'hvacInstallationPhotos',
  'other',
];

/**
 * POST /api/finance/lightreach/documents/[accountId]
 * Upload a document to a LightReach account
 *
 * Body (FormData):
 * - file: File (required)
 * - documentType: string (required) - one of: bluetoothHVACTool, proofOfLoadHVAC, hvacInstallationPhotos, other
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const session = await requireAuth();
    const { accountId } = await params;

    if (!accountId || accountId.trim() === '') {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = formData.get('documentType') as string | null;

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate document type
    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type is required' },
        { status: 400 }
      );
    }

    if (!VALID_DOCUMENT_TYPES.includes(documentType as DocumentType)) {
      return NextResponse.json(
        {
          error: `Invalid document type. Must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    console.log('[Document Upload] Uploading:', {
      accountId,
      documentType,
      filename: file.name,
      fileSize: file.size,
      userId: session.user.id,
      timestamp: new Date().toISOString(),
    });

    // Check if credentials are configured
    const hasCredentials =
      !!process.env.PALMETTO_FINANCE_ACCOUNT_EMAIL &&
      !!process.env.PALMETTO_FINANCE_ACCOUNT_PASSWORD;

    if (!hasCredentials) {
      return NextResponse.json(
        {
          error: 'LightReach credentials not configured',
          code: 'CREDENTIALS_REQUIRED',
        },
        { status: 503 }
      );
    }

    // Upload document to LightReach
    const result = await lightReachClient.uploadDocument(
      accountId,
      documentType as DocumentType,
      file,
      file.name
    );

    console.log('[Document Upload] Success:', {
      accountId,
      documentId: result.documentId,
      documentType,
    });

    return NextResponse.json({
      success: true,
      documentId: result.documentId,
      accountId,
      documentType,
    });
  } catch (error) {
    logFinanceError(error, 'document-upload');

    if (error instanceof FinanceValidationError) {
      return NextResponse.json(
        {
          error: formatFinanceError(error),
          field: error.field,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    if (error instanceof FinanceError) {
      return NextResponse.json(
        {
          error: formatFinanceError(error),
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        error: formatFinanceError(error),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/finance/lightreach/documents/[accountId]
 * Get list of documents for a LightReach account (if supported by API)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    await requireAuth();
    const { accountId } = await params;

    if (!accountId || accountId.trim() === '') {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Note: LightReach may not have a documents list endpoint
    // This is a placeholder for future implementation
    return NextResponse.json({
      accountId,
      documents: [],
      message: 'Document listing not yet implemented',
    });
  } catch (error) {
    logFinanceError(error, 'document-list');
    return NextResponse.json(
      { error: 'Failed to list documents' },
      { status: 500 }
    );
  }
}
