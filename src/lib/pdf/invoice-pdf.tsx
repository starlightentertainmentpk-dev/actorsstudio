import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { Invoice } from '@/types/finance'
import { formatCurrency } from '@/lib/finance/commission'

const styles = StyleSheet.create({
  page: {
    padding: 36,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#18181b',
    lineHeight: 1.4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#4f46e5',
    paddingBottom: 16,
    marginBottom: 20,
  },
  agencyBrand: {
    width: '55%',
  },
  agencyTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  agencySubtitle: {
    fontSize: 8.5,
    color: '#4f46e5',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 2,
    marginBottom: 6,
  },
  agencyMeta: {
    fontSize: 8,
    color: '#64748b',
    lineHeight: 1.3,
  },
  invoiceMetaColumn: {
    width: '40%',
    alignItems: 'flex-end',
  },
  invoiceHeading: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    letterSpacing: 1,
  },
  invoiceNumber: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#4f46e5',
    marginTop: 2,
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  badgePaid: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
  },
  badgePartial: {
    backgroundColor: '#fef3c7',
    color: '#b45309',
  },
  badgeDraft: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
  },
  badgeSent: {
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
  },
  badgeOverdue: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
  metaDetailRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  metaLabel: {
    color: '#64748b',
    width: 80,
    textAlign: 'right',
    marginRight: 6,
    fontSize: 8,
  },
  metaValue: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    fontSize: 8,
  },
  addressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  billToColumn: {
    width: '55%',
  },
  billToLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#4f46e5',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  clientCompany: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  clientMeta: {
    fontSize: 8,
    color: '#475569',
    lineHeight: 1.3,
  },
  termsColumn: {
    width: '40%',
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
    paddingLeft: 12,
  },
  table: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingVertical: 7,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingVertical: 7,
    paddingHorizontal: 8,
    backgroundColor: '#fafafa',
  },
  colNo: { width: '6%', color: '#94a3b8' },
  colDesc: { width: '54%', paddingRight: 8 },
  colQty: { width: '12%', textAlign: 'center' },
  colRate: { width: '14%', textAlign: 'right' },
  colTotal: { width: '14%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  remittanceBox: {
    width: '55%',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  remittanceTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bankItem: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bankLabel: {
    width: 80,
    fontSize: 7.5,
    color: '#64748b',
    fontFamily: 'Helvetica-Bold',
  },
  bankValue: {
    flex: 1,
    fontSize: 7.5,
    color: '#0f172a',
  },
  totalsBox: {
    width: '40%',
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  totalLabel: {
    color: '#64748b',
    fontSize: 8.5,
  },
  totalValue: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    fontSize: 8.5,
  },
  grandTotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 2,
    borderTopColor: '#0f172a',
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  grandTotalValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#4f46e5',
  },
  balanceDueLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    borderRadius: 4,
    marginTop: 4,
  },
  balanceDueLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  balanceDueValue: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
  },
  notesSection: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    marginBottom: 24,
  },
  notesTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 7.5,
    color: '#64748b',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7.5,
    color: '#94a3b8',
  },
})

export interface InvoicePDFProps {
  invoice: Invoice
  agency?: {
    name?: string
    legalName?: string
    taxId?: string
    address?: string
    city?: string
    country?: string
    email?: string
    phone?: string
    bankName?: string
    accountTitle?: string
    iban?: string
    swift?: string
  }
}

export function InvoicePDF({ invoice, agency }: InvoicePDFProps) {
  const currency = invoice.currency || 'PKR'
  const items = invoice.items && invoice.items.length > 0 ? invoice.items : [
    {
      description: 'Talent Appearance & Performance Fee',
      quantity: 1,
      unit_price: invoice.subtotal || invoice.total_amount,
      line_total: invoice.subtotal || invoice.total_amount,
    },
  ]

  const balanceDue = Math.max(0, invoice.total_amount - (invoice.amount_paid || 0))

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return styles.badgePaid
      case 'partially_paid':
        return styles.badgePartial
      case 'overdue':
        return styles.badgeOverdue
      case 'sent':
        return styles.badgeSent
      default:
        return styles.badgeDraft
    }
  }

  const agencyLegal = agency?.legalName || 'Actors Studio Talent Agency (Pvt) Ltd'
  const agencyBrand = agency?.name || 'ACTORS STUDIO HQ'
  const agencyTaxId = agency?.taxId || 'PK-NTN-984218-7'
  const agencyAddress = agency?.address || 'Suite 402, Executive Tower, Clifton Block 4'
  const agencyCity = agency?.city || 'Karachi, Pakistan'
  const agencyEmail = agency?.email || 'finance@actorsstudio.pk'
  const agencyPhone = agency?.phone || '+92 21 3584 9200'

  const bankName = agency?.bankName || 'Standard Chartered Bank (Pakistan) Ltd'
  const accountTitle = agency?.accountTitle || 'Actors Studio Management (Pvt) Ltd'
  const iban = agency?.iban || 'PK36 SCBL 0000 0011 2345 6789'
  const swift = agency?.swift || 'SCBLPKKA'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.agencyBrand}>
            <Text style={styles.agencyTitle}>{agencyBrand}</Text>
            <Text style={styles.agencySubtitle}>ENTERPRISE TALENT & PRODUCTION FINANCE</Text>
            <Text style={styles.agencyMeta}>{agencyLegal}</Text>
            <Text style={styles.agencyMeta}>{agencyAddress}, {agencyCity}</Text>
            <Text style={styles.agencyMeta}>NTN / Tax ID: {agencyTaxId} | {agencyEmail}</Text>
            <Text style={styles.agencyMeta}>Tel: {agencyPhone}</Text>
          </View>

          <View style={styles.invoiceMetaColumn}>
            <Text style={styles.invoiceHeading}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <Text style={[styles.statusBadge, getStatusBadgeStyle(invoice.status)]}>
              {invoice.status.replace('_', ' ')}
            </Text>

            <View style={styles.metaDetailRow}>
              <Text style={styles.metaLabel}>Issue Date:</Text>
              <Text style={styles.metaValue}>
                {new Date(invoice.created_at || Date.now()).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.metaDetailRow}>
              <Text style={styles.metaLabel}>Due Date:</Text>
              <Text style={styles.metaValue}>
                {new Date(invoice.due_date).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.metaDetailRow}>
              <Text style={styles.metaLabel}>Terms:</Text>
              <Text style={styles.metaValue}>{invoice.payment_terms || 'Net 30'}</Text>
            </View>
          </View>
        </View>

        {/* Client & Terms Grid */}
        <View style={styles.addressGrid}>
          <View style={styles.billToColumn}>
            <Text style={styles.billToLabel}>Billed To Client:</Text>
            <Text style={styles.clientCompany}>
              {invoice.client?.company_name || 'Valued Client'}
            </Text>
            {invoice.client?.address && (
              <Text style={styles.clientMeta}>{invoice.client.address}</Text>
            )}
            {invoice.client?.city && (
              <Text style={styles.clientMeta}>
                {invoice.client.city}, {invoice.client.country || 'Pakistan'}
              </Text>
            )}
            {invoice.client?.billing_email && (
              <Text style={styles.clientMeta}>Billing: {invoice.client.billing_email}</Text>
            )}
            {invoice.client?.phone && (
              <Text style={styles.clientMeta}>Phone: {invoice.client.phone}</Text>
            )}
          </View>

          <View style={styles.termsColumn}>
            <Text style={styles.billToLabel}>Booking Reference:</Text>
            <Text style={[styles.clientCompany, { fontSize: 9.5 }]}>
              {invoice.deal?.deal_name || 'Commercial Talent Booking'}
            </Text>
            <Text style={styles.clientMeta}>Currency: {currency}</Text>
            <Text style={styles.clientMeta}>Payment Method: Direct Bank Wire / Electronic Transfer</Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNo}>#</Text>
            <Text style={styles.colDesc}>DESCRIPTION / SERVICES</Text>
            <Text style={styles.colQty}>QTY</Text>
            <Text style={styles.colRate}>UNIT RATE</Text>
            <Text style={styles.colTotal}>AMOUNT</Text>
          </View>

          {items.map((item, index) => (
            <View
              key={index}
              style={index % 2 === 1 ? styles.tableRowAlt : styles.tableRow}
            >
              <Text style={styles.colNo}>{index + 1}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colRate}>{formatCurrency(item.unit_price, currency)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.line_total, currency)}</Text>
            </View>
          ))}
        </View>

        {/* Remittance & Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.remittanceBox}>
            <Text style={styles.remittanceTitle}>Remittance Bank Details</Text>
            <View style={styles.bankItem}>
              <Text style={styles.bankLabel}>Beneficiary:</Text>
              <Text style={styles.bankValue}>{accountTitle}</Text>
            </View>
            <View style={styles.bankItem}>
              <Text style={styles.bankLabel}>Bank Name:</Text>
              <Text style={styles.bankValue}>{bankName}</Text>
            </View>
            <View style={styles.bankItem}>
              <Text style={styles.bankLabel}>IBAN / Acc #:</Text>
              <Text style={[styles.bankValue, { fontFamily: 'Helvetica-Bold' }]}>{iban}</Text>
            </View>
            <View style={styles.bankItem}>
              <Text style={styles.bankLabel}>SWIFT / BIC:</Text>
              <Text style={styles.bankValue}>{swift}</Text>
            </View>
            <View style={styles.bankItem}>
              <Text style={styles.bankLabel}>Reference:</Text>
              <Text style={styles.bankValue}>Quote {invoice.invoice_number} on wire transfer</Text>
            </View>
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal, currency)}</Text>
            </View>

            {invoice.tax_rate > 0 && (
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>Sales Tax / GST ({invoice.tax_rate}%):</Text>
                <Text style={styles.totalValue}>{formatCurrency(invoice.tax_amount, currency)}</Text>
              </View>
            )}

            {invoice.discount_amount > 0 && (
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>Promotional Discount:</Text>
                <Text style={[styles.totalValue, { color: '#16a34a' }]}>
                  -{formatCurrency(invoice.discount_amount, currency)}
                </Text>
              </View>
            )}

            <View style={styles.grandTotalLine}>
              <Text style={styles.grandTotalLabel}>Total Amount:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total_amount, currency)}</Text>
            </View>

            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Amount Paid to Date:</Text>
              <Text style={[styles.totalValue, { color: '#16a34a' }]}>
                {formatCurrency(invoice.amount_paid || 0, currency)}
              </Text>
            </View>

            <View style={styles.balanceDueLine}>
              <Text style={styles.balanceDueLabel}>Balance Due:</Text>
              <Text style={styles.balanceDueValue}>{formatCurrency(balanceDue, currency)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Special Instructions & Commercial Notes:</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for your business. For billing queries, email finance@actorsstudio.pk
          </Text>
          <Text style={styles.footerText}>
            Generated securely by Actor's Studio OS • Page 1 of 1
          </Text>
        </View>
      </Page>
    </Document>
  )
}
