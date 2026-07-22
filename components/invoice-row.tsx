// components/invoice-row.tsx
type InvoiceStatus = 'paid' | 'pending' | 'overdue';

interface InvoiceRowProps {
  tokenId: string; // e.g. "TKN-0051"
  client: string;
  amount: number;
  status: InvoiceStatus;
}

const statusConfig: Record<InvoiceStatus, { color: string; label: string }> = {
  paid: { color: 'bg-paid', label: 'Paid' },
  pending: { color: 'bg-pending', label: 'Pending' },
  overdue: { color: 'bg-overdue', label: 'Overdue' },
};

export function InvoiceRow({ tokenId, client, amount, status }: InvoiceRowProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-4 border-b border-black/5 py-3 pl-3 relative hover:bg-black/[0.015] transition-colors">
      <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${config.color}`} />
      <span className="font-mono text-sm text-muted w-24 shrink-0">{tokenId}</span>
      <span className="text-sm text-ink flex-1">{client}</span>
      <span className="font-mono text-sm text-ink tabular-nums w-28 text-right">
        ₹{amount.toLocaleString('en-IN')}
      </span>
      <span className={`text-xs font-medium w-20 text-right ${
        status === 'paid' ? 'text-paid' : status === 'overdue' ? 'text-overdue' : 'text-pending'
      }`}>
        {config.label}
      </span>
    </div>
  );
}