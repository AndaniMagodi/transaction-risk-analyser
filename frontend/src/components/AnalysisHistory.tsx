import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Paper, Typography, Box, Chip, Stack, Divider, Collapse, CircularProgress
} from "@mui/material"
import axios from "axios"
import { getAnalyses } from "../api/analysis"
import FlaggedTable from "./FlaggedTable"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
})

const riskChipColor = (level: string): "error" | "warning" | "info" | "success" => {
  switch (level) {
    case "Critical": return "error"
    case "High": return "warning"
    case "Medium": return "info"
    default: return "success"
  }
}

interface Props {
  account?: string
}

export default function AnalysisHistory({ account }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailCache, setDetailCache] = useState<Record<string, any>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const { data: analyses = [] } = useQuery({
    queryKey: ["analyses", account],
    queryFn: () => getAnalyses(account),
    refetchInterval: 5000,
  })

  const handleToggle = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    if (!detailCache[id]) {
      setLoadingId(id)
      try {
        const { data } = await api.get(`/api/analyses/${id}`)
        setDetailCache((prev) => ({ ...prev, [id]: data }))
      } finally {
        setLoadingId(null)
      }
    }
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" mb={1.5}>
        Analysis History
      </Typography>

      {analyses.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No analyses yet.
        </Typography>
      ) : (
        <Stack spacing={1.5} sx={{ maxHeight: 480, overflowY: "auto" }}>
          {analyses.map((a, i) => (
            <Box key={a.id}>
              <Box
                onClick={() => handleToggle(a.id)}
                sx={{ cursor: "pointer", "&:hover": { opacity: 0.8 } }}
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
                gap={1}
              >
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" fontWeight={600}>
                    {new Date(a.created_at).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    {a.summary}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" mt={0.5} display="block">
                    {a.total_transactions} transactions · {a.flagged_transactions} flagged
                  </Typography>
                </Box>
                <Chip
                  label={a.risk_score}
                  color={riskChipColor(a.risk_level)}
                  size="small"
                  sx={{ fontWeight: 700, flexShrink: 0, mt: 0.3 }}
                />
              </Box>

              <Collapse in={expandedId === a.id}>
                <Box mt={1.5}>
                  {loadingId === a.id ? (
                    <Box display="flex" justifyContent="center" py={2}>
                      <CircularProgress size={20} />
                    </Box>
                  ) : detailCache[a.id] ? (
                    <Stack spacing={1.5}>
                      <FlaggedTable
                        flags={detailCache[a.id].flags}
                        transactions={detailCache[a.id].transactions}
                      />
                      {detailCache[a.id].recommendations?.length > 0 && (
                        <Box>
                          <Typography variant="caption" fontWeight={600} display="block" mb={0.5}>
                            Recommendations
                          </Typography>
                          <Stack spacing={0.5}>
                            {detailCache[a.id].recommendations.map((rec: string, idx: number) => (
                              <Typography key={idx} variant="caption" color="text.secondary">
                                → {rec}
                              </Typography>
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  ) : null}
                </Box>
              </Collapse>

              {i < analyses.length - 1 && <Divider sx={{ mt: 1.5 }} />}
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  )
}
