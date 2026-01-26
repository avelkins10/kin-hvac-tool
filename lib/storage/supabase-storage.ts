// Supabase Storage Utility
// Handles file uploads, downloads, and management for the HVAC tool

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase Storage] SUPABASE_URL and SUPABASE_ANON_KEY must be set')
}

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Storage bucket names
export const STORAGE_BUCKETS = {
  NAMEPLATES: 'nameplates',
  PROPOSALS: 'proposals',
  SIGNED_DOCS: 'signed-docs',
  AGREEMENTS: 'agreements',
} as const

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS]

/**
 * Upload a nameplate photo
 * @param file - File object or base64 string
 * @param proposalId - Proposal ID
 * @param companyId - Company ID for folder structure
 * @returns Public URL of uploaded file
 */
export async function uploadNameplatePhoto(
  file: File | string,
  proposalId: string,
  companyId: string
): Promise<{ url: string; path: string }> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const fileName = `${proposalId}-${Date.now()}.jpg`
  const filePath = `${companyId}/${fileName}`

  let fileData: File | Blob
  if (typeof file === 'string') {
    // Convert base64 to blob
    const base64Data = file.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    fileData = new Blob([buffer], { type: 'image/jpeg' })
  } else {
    fileData = file
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.NAMEPLATES)
    .upload(filePath, fileData, {
      contentType: 'image/jpeg',
      upsert: false,
    })

  if (error) {
    throw new Error(`Failed to upload nameplate photo: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKETS.NAMEPLATES)
    .getPublicUrl(filePath)

  return {
    url: urlData.publicUrl,
    path: filePath,
  }
}

/**
 * Upload a proposal PDF
 * @param pdfBuffer - PDF as Buffer
 * @param proposalId - Proposal ID
 * @param companyId - Company ID for folder structure
 * @returns Public URL of uploaded file
 */
export async function uploadProposalPDF(
  pdfBuffer: Buffer,
  proposalId: string,
  companyId: string
): Promise<{ url: string; path: string }> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const fileName = `proposal-${proposalId}.pdf`
  const filePath = `${companyId}/${fileName}`

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.PROPOSALS)
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true, // Allow overwriting
    })

  if (error) {
    throw new Error(`Failed to upload proposal PDF: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKETS.PROPOSALS)
    .getPublicUrl(filePath)

  return {
    url: urlData.publicUrl,
    path: filePath,
  }
}

/**
 * Upload a signed document
 * @param pdfBuffer - PDF as Buffer
 * @param proposalId - Proposal ID
 * @param companyId - Company ID for folder structure
 * @returns Public URL of uploaded file
 */
export async function uploadSignedDocument(
  pdfBuffer: Buffer,
  proposalId: string,
  companyId: string
): Promise<{ url: string; path: string }> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const fileName = `signed-${proposalId}-${Date.now()}.pdf`
  const filePath = `${companyId}/${fileName}`

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.SIGNED_DOCS)
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (error) {
    throw new Error(`Failed to upload signed document: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKETS.SIGNED_DOCS)
    .getPublicUrl(filePath)

  return {
    url: urlData.publicUrl,
    path: filePath,
  }
}

/**
 * Upload an agreement PDF
 * @param pdfBuffer - PDF as Buffer
 * @param proposalId - Proposal ID
 * @param companyId - Company ID for folder structure
 * @returns Public URL of uploaded file
 */
export async function uploadAgreementPDF(
  pdfBuffer: Buffer,
  proposalId: string,
  companyId: string
): Promise<{ url: string; path: string }> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const fileName = `agreement-${proposalId}.pdf`
  const filePath = `${companyId}/${fileName}`

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.AGREEMENTS)
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (error) {
    throw new Error(`Failed to upload agreement PDF: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKETS.AGREEMENTS)
    .getPublicUrl(filePath)

  return {
    url: urlData.publicUrl,
    path: filePath,
  }
}

/**
 * Delete a file from storage
 * @param bucket - Storage bucket name
 * @param filePath - Path to file
 */
export async function deleteFile(bucket: StorageBucket, filePath: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { error } = await supabase.storage.from(bucket).remove([filePath])

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

/**
 * Get a signed URL for private file access (expires in 1 hour)
 * @param bucket - Storage bucket name
 * @param filePath - Path to file
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL
 */
export async function getSignedUrl(
  bucket: StorageBucket,
  filePath: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn)

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`)
  }

  return data.signedUrl
}

/**
 * List files in a bucket for a company
 * @param bucket - Storage bucket name
 * @param companyId - Company ID
 * @returns Array of file paths
 */
export async function listCompanyFiles(
  bucket: StorageBucket,
  companyId: string
): Promise<string[]> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase.storage.from(bucket).list(companyId)

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`)
  }

  return data.map((file) => `${companyId}/${file.name}`)
}
