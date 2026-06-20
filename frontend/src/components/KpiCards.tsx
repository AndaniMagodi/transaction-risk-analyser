import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { getDashboardSummary } from "../api/analysis"

const riskColor = (level: string) => {
  switch (level) {
    case "Critical": return "text-red-600"
    case "High": return "text-orange-500"
    case "Medium": return "text-yellow-500"
    default: return "text-green-500"
  }
}

export default function KpiCards() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: getDashboardSummary,
    refetchInterval: 5000,
  })

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
            <div className="h-7 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    )
  }

  const cards = [
    { label: "Total Analyses", value: data.total_analyses },
    { label: "Total Transactions", value: data.total_transactions },
    { label: "Flagged Transactions", value: data.flagged_transactions },
    { label: "Avg Risk Score", value: data.average_risk_score },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
        >
          <div className="text-xs text-gray-500">{card.label}</div>
          <motion.div
            key={card.value}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
            className="text-2xl font-bold mt-1"
          >
            {card.value}
          </motion.div>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white rounded-lg border p-4 col-span-2 lg:col-span-4 hover:shadow-md transition-shadow"
      >
        <div className="text-xs text-gray-500">Current Risk Level</div>
        <div className={`text-2xl font-bold mt-1 ${riskColor(data.risk_level)}`}>
          {data.risk_level}
        </div>
      </motion.div>
    </motion.div>
  )
}
