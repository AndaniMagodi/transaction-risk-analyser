import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { analyseTransactions, type AnalysisResult, type Transaction } from "./api/analysis"
import KpiCards from "./components/KpiCards"
import FlaggedTable from "./components/FlaggedTable"
import AnalysisHistory from "./components/AnalysisHistory"
import CsvUpload from "./components/CsvUpload"

const queryClient = new QueryClient()

const SAMPLE_TRANSACTIONS: Transaction[] = [
  { id: 1, amount: 500, merchant: "Shoprite", date: "2026-06-15" },
  { id: 2, amount: 50000, merchant: "Unknown", date: "2026-06-15" },
  { id: 3, amount: 500, merchant: "Shoprite", date: "2026-06-15" },
  { id: 4, amount: 100, merchant: "Checkers", date: "2026-06-15" },
  { id: 5, amount: 99999, merchant: "Cash", date: "2026-06-15" },
]

const riskColor = (level: string) => {
  switch (level) {
    case "Critical": return "text-red-600"
    case "High": return "text-orange-500"
    case "Medium": return "text-yellow-500"
    default: return "text-green-500"
  }
}

function Dashboard() {
  const [mode, setMode] = useState<"csv" | "json">("csv")
  const [input, setInput] = useState(JSON.stringify(SAMPLE_TRANSACTIONS, null, 2))
  const [csvTransactions, setCsvTransactions] = useState<Transaction[] | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [submittedTransactions, setSubmittedTransactions] = useState<Transaction[]>([])
  const [parseError, setParseError] = useState("")

  const { mutate, isPending } = useMutation({
    mutationFn: analyseTransactions,
    onSuccess: (data) => {
      setResult(data)
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] })
      queryClient.invalidateQueries({ queryKey: ["analyses"] })
    },
  })

  const handleAnalyse = () => {
    setParseError("")

    if (mode === "csv") {
      if (!csvTransactions || csvTransactions.length === 0) {
        setParseError("Upload a CSV file first")
        return
      }
      setSubmittedTransactions(csvTransactions)
      mutate(csvTransactions)
      return
    }

    try {
      const parsed = JSON.parse(input)
      setSubmittedTransactions(parsed)
      mutate(parsed)
    } catch {
      setParseError("Invalid JSON — please check your input")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white px-6 py-4">
        <h1 className="text-xl font-semibold">Transaction Risk Analyser</h1>
        <p className="text-sm text-gray-500">AI-powered financial transaction risk detection</p>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <KpiCards />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium">Transaction Data</h2>
                <div className="flex gap-1 bg-gray-100 rounded-md p-0.5">
                  <button
                    onClick={() => setMode("csv")}
                    className={`text-xs px-3 py-1 rounded transition-colors ${
                      mode === "csv" ? "bg-white shadow-sm font-medium" : "text-gray-500"
                    }`}
                  >
                    CSV Upload
                  </button>
                  <button
                    onClick={() => setMode("json")}
                    className={`text-xs px-3 py-1 rounded transition-colors ${
                      mode === "json" ? "bg-white shadow-sm font-medium" : "text-gray-500"
                    }`}
                  >
                    JSON
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {mode === "csv" ? (
                  <motion.div
                    key="csv"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <CsvUpload onParsed={setCsvTransactions} />
                    {csvTransactions && (
                      <p className="text-xs text-gray-500 mt-2">
                        {csvTransactions.length} transactions loaded
                      </p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="json"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <textarea
                      className="w-full h-64 text-xs font-mono border rounded p-3 bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 transition-shadow"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {parseError && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-red-500 mt-2"
                  >
                    {parseError}
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                onClick={handleAnalyse}
                disabled={isPending}
                className="mt-3 w-full bg-gray-900 text-white py-2.5 rounded text-sm hover:bg-gray-700 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Analysing...
                  </span>
                ) : (
                  "Analyse Transactions"
                )}
              </button>
            </div>

            <AnalysisHistory />
          </div>

          {/* Results */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {!result && !isPending && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-lg border p-6 text-center text-sm text-gray-400"
                >
                  Upload or paste transaction data, then click Analyse
                </motion.div>
              )}

              {isPending && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-lg border p-6 text-center text-sm text-gray-400"
                >
                  Analysing transactions...
                </motion.div>
              )}

              {result && !isPending && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="bg-white rounded-lg border p-4">
                    <h2 className="text-sm font-medium mb-3">Risk Assessment</h2>
                    <div className="flex items-center gap-4">
                      <div className="text-5xl font-bold">{result.risk_score}</div>
                      <div>
                        <div className={`text-lg font-semibold ${riskColor(result.risk_level)}`}>
                          {result.risk_level} Risk
                        </div>
                        <div className="text-xs text-gray-500">out of 100</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">{result.summary}</p>
                  </div>

                  <FlaggedTable flags={result.flags} transactions={submittedTransactions} />

                  <div className="bg-white rounded-lg border p-4">
                    <h2 className="text-sm font-medium mb-3">Recommendations</h2>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-gray-600 flex gap-2">
                          <span className="text-gray-400">→</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  )
}
