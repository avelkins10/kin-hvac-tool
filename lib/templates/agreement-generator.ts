// Agreement PDF Generator
// Uses jsPDF to generate agreement documents from proposal data

import { jsPDF } from 'jspdf'
import type { Proposal } from '@prisma/client'

export async function generateAgreementPDF(proposal: Proposal): Promise<Buffer> {
  const doc = new jsPDF()

  // Add title
  doc.setFontSize(20)
  doc.text('HVAC Proposal Agreement', 20, 20)

  // Add proposal details
  doc.setFontSize(12)
  let yPos = 40

  if (proposal.customerData) {
    const customer = proposal.customerData as any
    doc.text(`Customer: ${customer.name || ''}`, 20, yPos)
    yPos += 10
    doc.text(`Address: ${customer.address || ''}`, 20, yPos)
    yPos += 10
    doc.text(`Email: ${customer.email || ''}`, 20, yPos)
    yPos += 10
    doc.text(`Phone: ${customer.phone || ''}`, 20, yPos)
    yPos += 15
  }

  // Add equipment details
  if (proposal.selectedEquipment) {
    doc.setFontSize(14)
    doc.text('Selected Equipment:', 20, yPos)
    yPos += 10
    doc.setFontSize(12)
    const equipment = proposal.selectedEquipment as any
    if (equipment.brand) doc.text(`Brand: ${equipment.brand}`, 20, yPos)
    yPos += 10
    if (equipment.model) doc.text(`Model: ${equipment.model}`, 20, yPos)
    yPos += 10
    if (equipment.tonnage) doc.text(`Tonnage: ${equipment.tonnage}`, 20, yPos)
    yPos += 15
  }

  // Add totals
  if (proposal.totals) {
    doc.setFontSize(14)
    doc.text('Pricing Summary:', 20, yPos)
    yPos += 10
    doc.setFontSize(12)
    const totals = proposal.totals as any
    if (totals.subtotal) doc.text(`Subtotal: $${totals.subtotal.toFixed(2)}`, 20, yPos)
    yPos += 10
    if (totals.tax) doc.text(`Tax: $${totals.tax.toFixed(2)}`, 20, yPos)
    yPos += 10
    if (totals.total) {
      doc.setFontSize(14)
      doc.text(`Total: $${totals.total.toFixed(2)}`, 20, yPos)
      yPos += 15
    }
  }

  // Add terms and conditions
  doc.setFontSize(14)
  doc.text('Terms and Conditions:', 20, yPos)
  yPos += 10
  doc.setFontSize(10)
  const terms = [
    '1. This agreement is subject to final approval and inspection.',
    '2. Installation will be scheduled upon receipt of signed agreement and deposit.',
    '3. All work will be performed in accordance with local building codes.',
    '4. Warranty terms are as specified in the equipment manufacturer documentation.',
    '5. Payment terms are as agreed upon in the financing or payment section.',
  ]

  terms.forEach((term) => {
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }
    doc.text(term, 20, yPos)
    yPos += 8
  })

  // Add signature lines
  yPos += 10
  if (yPos > 250) {
    doc.addPage()
    yPos = 20
  }

  doc.setFontSize(12)
  doc.text('Customer Signature:', 20, yPos)
  yPos += 20
  doc.line(20, yPos, 100, yPos)
  yPos += 10
  doc.setFontSize(10)
  doc.text('Date: _______________', 20, yPos)

  yPos += 20
  doc.setFontSize(12)
  doc.text('Company Representative Signature:', 20, yPos)
  yPos += 20
  doc.line(20, yPos, 100, yPos)
  yPos += 10
  doc.setFontSize(10)
  doc.text('Date: _______________', 20, yPos)

  // Convert to buffer
  const pdfBlob = doc.output('arraybuffer')
  return Buffer.from(pdfBlob)
}
