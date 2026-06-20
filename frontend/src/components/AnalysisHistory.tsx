import { useQuery } from "@tanstack/react-query"
import { getAnalyses } from "../api/analysis"

const riskBadge = (level: string) => {
  switch (level) {
    case "Critical": return "bg-red-100 text-red-700"
    case "High": return "bg-orange-100 text-orange-700"
    case "Medium": return "bg-yellow-100 text-yellow-700"
    default: return "bg-green-100 text-green-700"
  }
}

export default function AnalysisHistory() {
  const { data: analyses = [] } = useQuery({
    queryKey: ["analyses"],
    queryFn: getAnalyses,
    refetchInterval: 5000,
  })

  return (
    <div className="bg-white rounded-lg border p-4">
      <h2 className="text-sm font-medium mb-3">Analysis History</h2>
      {analyses.length === 0 ? (
        <p className="text-sm text-gray-400">No analyses yet.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {analyses.map((a) => (
            <div key={a.id} className="border rounded p-3 text-xs flex justify-between items-start">
              <div>
                <div className="font-medium">{new Date(a.created_at).toLocaleString()}</div>
                <p className="text-gray-500 mt-1">{a.summary}</p>
                <p className="text-gray-400 mt-1">
                  {a.total_transactions} transactions · {a.flagged_transactions} flagged
                </p>
              </div>
              <span className={`px-2 py-1 rounded font-semibold ${riskBadge(a.risk_level)}`}>
                {a.risk_score}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
