import type { Flag, Transaction } from "../api/analysis"

const severityColor = (severity: string) => {
  switch (severity) {
    case "Critical": return "bg-red-100 text-red-700"
    case "High": return "bg-orange-100 text-orange-700"
    case "Medium": return "bg-yellow-100 text-yellow-700"
    default: return "bg-green-100 text-green-700"
  }
}

interface Props {
  flags: Flag[]
  transactions: Transaction[]
}

export default function FlaggedTable({ flags, transactions }: Props) {
  const getTransaction = (id: string | number) =>
    transactions.find((t) => String(t.id) === String(id))

  return (
    <div className="bg-white rounded-lg border p-4">
      <h2 className="text-sm font-medium mb-3">Flagged Transactions ({flags.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 pr-4">ID</th>
              <th className="pb-2 pr-4">Merchant</th>
              <th className="pb-2 pr-4">Amount</th>
              <th className="pb-2 pr-4">Reason</th>
              <th className="pb-2">Severity</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((flag, i) => {
              const txn = getTransaction(flag.transaction_id)
              return (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">#{flag.transaction_id}</td>
                  <td className="py-2 pr-4">{txn?.merchant ?? "—"}</td>
                  <td className="py-2 pr-4">{txn ? `R${txn.amount.toLocaleString()}` : "—"}</td>
                  <td className="py-2 pr-4 text-gray-600">{flag.reason}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded font-semibold ${severityColor(flag.severity)}`}>
                      {flag.severity}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
