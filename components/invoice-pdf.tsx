import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica' },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  header: { fontSize: 20, marginBottom: 4 },
  sub: { fontSize: 10, color: '#666' },
  meta: { fontSize: 9, color: '#666', marginTop: 2 },
  billLabel: { fontSize: 9, color: '#999', marginBottom: 4 },
  clientName: { fontSize: 13, marginBottom: 2 },
  clientMeta: { fontSize: 10, color: '#666' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemName: { fontSize: 11 },
  itemMeta: { fontSize: 9, color: '#999', marginTop: 2 },
  amount: { fontSize: 11, textAlign: 'right' },
  summaryBlock: { marginTop: 16, alignItems: 'flex-end' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', width: 200, paddingVertical: 3 },
  summaryLabel: { fontSize: 10, color: '#666' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', width: 200, paddingTop: 10, marginTop: 6, borderTopWidth: 1, borderTopColor: '#000' },
  totalLabel: { fontSize: 13 },
  payBox: { marginTop: 32, padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 4 },
  payTitle: { fontSize: 9, color: '#999', marginBottom: 4 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#999', textAlign: 'center' },
})

const inr = (n: any) => 'Rs. ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function InvoicePdf({ invoice }: { invoice: any }) {
  const seller = invoice.seller || {}
  const firstItem = invoice.items?.[0]
  const client = firstItem?.clients || {}
  const hasGst = Number(invoice.gst_total) > 0
  const sellerName = seller.business_name || seller.name || 'Invoice'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.top}>
          <View>
            <Text style={styles.header}>{sellerName}</Text>
            {seller.address ? <Text style={styles.meta}>{seller.address}</Text> : null}
            {seller.gst_number ? <Text style={styles.meta}>GSTIN: {seller.gst_number}</Text> : null}
            {seller.pan_number ? <Text style={styles.meta}>PAN: {seller.pan_number}</Text> : null}
            {seller.email ? <Text style={styles.meta}>{seller.email}</Text> : null}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 14 }}>{hasGst ? 'TAX INVOICE' : 'INVOICE'}</Text>
            <Text style={styles.sub}>{invoice.invoice_number}</Text>
            {invoice.generated_at ? <Text style={styles.meta}>Date: {new Date(invoice.generated_at).toLocaleDateString('en-IN')}</Text> : null}
            {invoice.due_date ? <Text style={styles.meta}>Due: {new Date(invoice.due_date).toLocaleDateString('en-IN')}</Text> : null}
          </View>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={styles.billLabel}>BILL TO</Text>
          <Text style={styles.clientName}>{client.name || 'Client'}</Text>
          {client.address ? <Text style={styles.clientMeta}>{client.address}</Text> : null}
          {client.email ? <Text style={styles.clientMeta}>{client.email}</Text> : null}
          {client.gst_number ? <Text style={styles.clientMeta}>GSTIN: {client.gst_number}</Text> : null}
        </View>

        {(invoice.items || []).map((item: any, i: number) => (
          <View key={i} style={styles.row}>
            <View>
              <Text style={styles.itemName}>{item.tokens?.name}</Text>
              <Text style={styles.itemMeta}>{item.projects?.name}</Text>
            </View>
            <Text style={styles.amount}>{inr(item.amount_inr)}</Text>
          </View>
        ))}

        <View style={styles.summaryBlock}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryLabel}>{inr(invoice.subtotal)}</Text>
          </View>
          {hasGst ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST (18%)</Text>
              <Text style={styles.summaryLabel}>{inr(invoice.gst_total)}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalLabel}>{inr(invoice.grand_total)}</Text>
          </View>
        </View>

        {(seller.upi_id || seller.bank_details) ? (
          <View style={styles.payBox}>
            <Text style={styles.payTitle}>PAYMENT DETAILS</Text>
            {seller.upi_id ? <Text style={styles.clientMeta}>UPI: {seller.upi_id}</Text> : null}
            {seller.bank_details ? <Text style={styles.clientMeta}>{seller.bank_details}</Text> : null}
            <Text style={styles.meta}>Please quote {invoice.invoice_number} as the payment reference.</Text>
          </View>
        ) : null}

        {!hasGst ? <Text style={styles.footer}>Supplier is not registered under GST. No tax charged.</Text> : null}
      </Page>
    </Document>
  )
}
