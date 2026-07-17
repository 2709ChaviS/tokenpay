import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica' },
  header: { fontSize: 20, marginBottom: 4 },
  sub: { fontSize: 10, color: '#666', marginBottom: 20 },
  billTo: { marginBottom: 24 },
  billLabel: { fontSize: 9, color: '#999', marginBottom: 4 },
  clientName: { fontSize: 13, marginBottom: 2 },
  clientMeta: { fontSize: 10, color: '#666' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: { fontSize: 11 },
  itemMeta: { fontSize: 9, color: '#999', marginTop: 2 },
  amount: { fontSize: 11, textAlign: 'right' },
  summaryBlock: { marginTop: 16, alignItems: 'flex-end' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    paddingVertical: 3,
  },
  summaryLabel: { fontSize: 10, color: '#666' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
  totalLabel: { fontSize: 13 },
})

export function InvoicePdf({ invoice }: { invoice: any }) {
  const firstItem = invoice.items?.[0]
  const clientName = firstItem?.clients?.name || 'Client'
  const clientEmail = firstItem?.clients?.email
  const clientGst = firstItem?.clients?.gst_number

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>TokenPay</Text>
        <Text style={styles.sub}>
          Invoice {invoice.invoice_number}
          {invoice.generated_at ? ' · ' + new Date(invoice.generated_at).toLocaleDateString('en-IN') : ''}
        </Text>

        <View style={styles.billTo}>
          <Text style={styles.billLabel}>BILL TO</Text>
          <Text style={styles.clientName}>{clientName}</Text>
          {clientEmail ? <Text style={styles.clientMeta}>{clientEmail}</Text> : null}
          {clientGst ? <Text style={styles.clientMeta}>GSTIN: {clientGst}</Text> : null}
        </View>

        {(invoice.items || []).map((item: any, i: number) => (
          <View key={i} style={styles.row}>
            <View>
              <Text style={styles.itemName}>{item.tokens?.name}</Text>
              <Text style={styles.itemMeta}>{item.projects?.name}</Text>
            </View>
            <Text style={styles.amount}>Rs. {item.final_amount?.toLocaleString('en-IN')}</Text>
          </View>
        ))}

        <View style={styles.summaryBlock}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryLabel}>Rs. {invoice.subtotal?.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST</Text>
            <Text style={styles.summaryLabel}>Rs. {invoice.gst_total?.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalLabel}>Rs. {invoice.grand_total?.toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
