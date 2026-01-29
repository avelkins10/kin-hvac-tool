// Proposal PDF Generator
// Uses jsPDF to generate proposal documents from proposal data
// Similar to agreement-generator but formatted for customer viewing

import { jsPDF } from 'jspdf'
import type { Proposal } from '@prisma/client'

export async function generateProposalPDF(proposal: Proposal): Promise<Buffer> {
  const doc = new jsPDF()
  
  // Add title
  doc.setFontSize(20)
  doc.text('HVAC Proposal', 20, 20)
  
  // Add proposal details
  doc.setFontSize(12)
  let yPos = 40
  
  if (proposal.customerData) {
    const customer = proposal.customerData as any
    doc.setFontSize(14)
    doc.text('Customer Information:', 20, yPos)
    yPos += 10
    doc.setFontSize(12)
    if (customer.name) doc.text(`Name: ${customer.name}`, 20, yPos)
    yPos += 8
    if (customer.email) doc.text(`Email: ${customer.email}`, 20, yPos)
    yPos += 8
    if (customer.phone) doc.text(`Phone: ${customer.phone}`, 20, yPos)
    yPos += 8
    if (customer.address) {
      doc.text(`Address: ${customer.address}`, 20, yPos)
      yPos += 8
      if (customer.city || customer.state || customer.zip) {
        const cityStateZip = [customer.city, customer.state, customer.zip].filter(Boolean).join(', ')
        doc.text(cityStateZip, 20, yPos)
        yPos += 8
      }
    }
    yPos += 10
  }
  
  // Add equipment details
  if (proposal.selectedEquipment) {
    doc.setFontSize(14)
    doc.text('Selected Equipment:', 20, yPos)
    yPos += 10
    doc.setFontSize(12)
    const equipment = proposal.selectedEquipment as any
    if (equipment.brand) doc.text(`Brand: ${equipment.brand}`, 20, yPos)
    yPos += 8
    if (equipment.model) doc.text(`Model: ${equipment.model}`, 20, yPos)
    yPos += 8
    if (equipment.tonnage) doc.text(`Tonnage: ${equipment.tonnage}`, 20, yPos)
    yPos += 8
    if (equipment.seer) doc.text(`SEER Rating: ${equipment.seer}`, 20, yPos)
    yPos += 10
  }
  
  // Add add-ons if any
  if (proposal.addOns && Array.isArray(proposal.addOns) && proposal.addOns.length > 0) {
    doc.setFontSize(14)
    doc.text('Add-ons:', 20, yPos)
    yPos += 10
    doc.setFontSize(12)
    proposal.addOns.forEach((addon: any) => {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }
      doc.text(`• ${addon.name || 'Add-on'}: $${(addon.price || 0).toFixed(2)}`, 20, yPos)
      yPos += 8
    })
    yPos += 5
  }
  
  // Add totals
  if (proposal.totals) {
    doc.setFontSize(14)
    doc.text('Pricing Summary:', 20, yPos)
    yPos += 10
    doc.setFontSize(12)
    const totals = proposal.totals as any
    if (totals.equipment !== undefined) {
      doc.text(`Equipment: $${totals.equipment.toFixed(2)}`, 20, yPos)
      yPos += 8
    }
    if (totals.addOns !== undefined) {
      doc.text(`Add-ons: $${totals.addOns.toFixed(2)}`, 20, yPos)
      yPos += 8
    }
    if (totals.maintenance !== undefined) {
      doc.text(`Maintenance Plan: $${totals.maintenance.toFixed(2)}`, 20, yPos)
      yPos += 8
    }
    if (totals.incentives !== undefined && totals.incentives > 0) {
      doc.text(`Incentives: -$${totals.incentives.toFixed(2)}`, 20, yPos)
      yPos += 8
    }
    if (totals.subtotal !== undefined) {
      doc.text(`Subtotal: $${totals.subtotal.toFixed(2)}`, 20, yPos)
      yPos += 8
    }
    if (totals.tax !== undefined) {
      doc.text(`Tax: $${totals.tax.toFixed(2)}`, 20, yPos)
      yPos += 8
    }
    if (totals.total !== undefined) {
      doc.setFontSize(16)
      doc.text(`Total: $${totals.total.toFixed(2)}`, 20, yPos)
      yPos += 15
    }
  }
  
  // Add payment method
  if (proposal.paymentMethod) {
    const payment = proposal.paymentMethod as any
    if (payment.method) {
      doc.setFontSize(14)
      doc.text('Payment Method:', 20, yPos)
      yPos += 10
      doc.setFontSize(12)
      const methodText = payment.method === 'cash' ? 'Cash' : 
                        payment.method === 'financing' ? 'Financing' : 
                        payment.method === 'leasing' ? 'Leasing' : payment.method
      doc.text(methodText, 20, yPos)
      yPos += 10
    }
  }
  
  // Add validity notice
  yPos += 10
  if (yPos > 250) {
    doc.addPage()
    yPos = 20
  }
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('This proposal is valid for 30 days from the date of issue.', 20, yPos)
  
  // Convert to buffer
  const pdfBlob = doc.output('arraybuffer')
  return Buffer.from(pdfBlob)
}
