import { useState } from "react"
import { useMutation, useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  Box, Container, Typography, Paper, ToggleButtonGroup, ToggleButton,
  TextField, Button, CircularProgress, Stack, Fade, Grid,
  Autocomplete
} from "@mui/material"
import {
  analyseTransactions, getAccounts, getAnalyses, getAnalysisDetail,
  type AnalysisResult, type Transaction
} from "./api/analysis"
import { riskColor } from "./utils/risk"
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

function Dashboard() {
  const [mode, setMode] = useState<"csv" | "json">("csv")
  const [input, setInput] = useState(JSON.stringify(SAMPLE_TRANSACTIONS, null, 2))
  const [csvTransactions, setCsvTransactions] = useState<Transaction[] | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [submittedTransactions, setSubmittedTransactions] = useState<Transaction[]>([])
  const [parseError, setParseError] = useState("")
  const [accountName, setAccountName] = useState("")
  const [accountFilter, setAccountFilter] = useState<string | null>(null)
  const [latestAnalysisId, setLatestAnalysisId] = useState<string | null>(null)

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  })

  const { data: savedAnalyses = [] } = useQuery({
    queryKey: ["analyses", accountFilter],
    queryFn: () => getAnalyses(accountFilter ?? undefined),
    enabled: !result,
  })

  const { data: latestSaved } = useQuery({
    queryKey: ["analysisDetail", savedAnalyses[0]?.id],
    queryFn: () => getAnalysisDetail(savedAnalyses[0].id),
    enabled: !result && savedAnalyses.length > 0,
  })

  const displayResult = result ?? (latestSaved ? {
    id: latestSaved.id,
    risk_score: latestSaved.risk_score,
    risk_level: latestSaved.risk_level,
    summary: latestSaved.summary,
    flags: latestSaved.flags,
    recommendations: latestSaved.recommendations,
  } : null)

  const displayTransactions = result
    ? submittedTransactions
    : (latestSaved?.transactions ?? [])

  const { mutate, isPending } = useMutation({
    mutationFn: ({ account, transactions }: { account: string; transactions: Transaction[] }) =>
      analyseTransactions(account, transactions),
    onSuccess: (data) => {
      setResult(data)
      setLatestAnalysisId(data.id)
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary"] })
      queryClient.invalidateQueries({ queryKey: ["analyses"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
    },
  })

  const handleAnalyse = () => {
    setParseError("")

    if (!accountName.trim()) {
      setParseError("Enter an account or client name first")
      return
    }

    if (mode === "csv") {
      if (!csvTransactions || csvTransactions.length === 0) {
        setParseError("Upload a CSV file first")
        return
      }
      setSubmittedTransactions(csvTransactions)
      mutate({ account: accountName.trim(), transactions: csvTransactions })
      return
    }

    try {
      const parsed = JSON.parse(input)
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setParseError("JSON must be a non-empty array of transactions")
        return
      }
      setSubmittedTransactions(parsed)
      mutate({ account: accountName.trim(), transactions: parsed })
    } catch {
      setParseError("Invalid JSON — please check your input")
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1100,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          px: 3,
          py: 2,
          textAlign: "center",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Transaction Risk Analyser
        </Typography>
        <Typography variant="body2" color="text.secondary">
          AI-powered financial transaction risk detection
        </Typography>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="subtitle2" color="text.secondary">
              Viewing stats for:
            </Typography>
            <Autocomplete
              size="small"
              options={accounts}
              value={accountFilter}
              onChange={(_, val) => {
                setAccountFilter(val)
                setResult(null)
                setLatestAnalysisId(null)
              }}
              sx={{ width: 260 }}
              renderInput={(params) => (
                <TextField {...params} placeholder="All accounts" />
              )}
            />
          </Box>

          <KpiCards account={accountFilter ?? undefined} />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Stack spacing={3}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                    <Typography variant="h6">Transaction Data</Typography>
                    <ToggleButtonGroup
                      value={mode}
                      exclusive
                      size="small"
                      onChange={(_, val) => val && setMode(val)}
                    >
                      <ToggleButton value="csv" sx={{ textTransform: "none", px: 2 }}>CSV Upload</ToggleButton>
                      <ToggleButton value="json" sx={{ textTransform: "none", px: 2 }}>JSON</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  <TextField
                    fullWidth
                    size="small"
                    label="Account / Client Name"
                    placeholder="e.g. Client A, Account 12345"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    sx={{ mb: 2 }}
                  />

                  {mode === "csv" ? (
                    <Box>
                      <CsvUpload onParsed={setCsvTransactions} />
                      {csvTransactions && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                          {csvTransactions.length} transactions loaded
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <TextField
                      multiline
                      fullWidth
                      rows={12}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      sx={{
                        "& .MuiInputBase-root": {
                          fontFamily: "monospace",
                          fontSize: 12,
                          bgcolor: "grey.50",
                        },
                      }}
                    />
                  )}

                  {parseError && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                      {parseError}
                    </Typography>
                  )}

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={handleAnalyse}
                    disabled={isPending}
                    sx={{ mt: 2, py: 1.2 }}
                    startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : null}
                  >
                    {isPending ? "Analysing..." : "Analyse Transactions"}
                  </Button>
                </Paper>

                <AnalysisHistory
                  account={accountFilter ?? undefined}
                  expandAnalysisId={latestAnalysisId}
                />
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, lg: 6 }}>
              {!displayResult && !isPending && (
                <Paper sx={{ p: 4, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    Upload or paste transaction data, then click Analyse
                  </Typography>
                </Paper>
              )}

              {isPending && (
                <Paper sx={{ p: 4, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    Analysing transactions...
                  </Typography>
                </Paper>
              )}

              {displayResult && !isPending && (
                <Fade in>
                  <Stack spacing={3}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 1.5 }}>Risk Assessment</Typography>
                      {!result && latestSaved && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                          Showing latest saved analysis · {new Date(latestSaved.created_at).toLocaleString()}
                        </Typography>
                      )}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography variant="h2" sx={{ fontWeight: 700 }}>{displayResult.risk_score}</Typography>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: riskColor(displayResult.risk_level) }}>
                            {displayResult.risk_level} Risk
                          </Typography>
                          <Typography variant="caption" color="text.secondary">out of 100</Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                        {displayResult.summary}
                      </Typography>
                    </Paper>

                    <FlaggedTable flags={displayResult.flags} transactions={displayTransactions} />

                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 1.5 }}>Recommendations</Typography>
                      <Stack spacing={1}>
                        {displayResult.recommendations.map((rec, i) => (
                          <Box key={i} sx={{ display: "flex", gap: 1 }}>
                            <Typography color="text.disabled">→</Typography>
                            <Typography variant="body2" color="text.secondary">{rec}</Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  </Stack>
                </Fade>
              )}
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  )
}
