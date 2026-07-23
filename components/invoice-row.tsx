// components/invoice-row.tsx
type InvoiceStatus = 'paid' | 'pending' | 'overdue';

interface InvoiceRowProps {
  tokenId: string;
  client: string;
  amount: number;
  status: InvoiceStatus;
}

const statusConfig: Record<InvoiceStatus, { color: string; label: string; textColor: string }> = {
  paid: { color: 'bg-paid', label: 'Paid', textColor: 'text-paid' },
  pending: { color: 'bg-pending', label: 'Pending', textColor: 'text-pending' },
  overdue: { color: 'bg-overdue', label: 'Overdue', textColor: 'text-overdue' },
};

export function InvoiceRow({ tokenId, client, amount, status }: InvoiceRowProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-4 relative pl-3">
      <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${config.color}`} />
      <span className="font-mono text-sm text-white/40 w-24 shrink-0">{tokenId}</span>
      <span className="text-sm text-white flex-1">{client}</span>
      <span className="font-mono text-sm text-white tabular-nums w-28 text-right">
        ₹{amount.toLocaleString('en-IN')}
      </span>
      <span className={`text-xs font-medium w-20 text-right ${config.textColor}`}>
        {config.label}
      </span>
    </div>
  );
}