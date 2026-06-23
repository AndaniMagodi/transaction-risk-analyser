import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Paper, Typography, Box, Chip, Stack, Divider, Collapse, CircularProgress
} from "@mui/material"
import { getAnalyses, getAnalysisDetail, type AnalysisDetail } from "../api/analysis"
import { riskChipColor } from "../utils/risk"
import FlaggedTable from "./FlaggedTable"

interface Props {
  account?: string
  expandAnalysisId?: string | null
}

export default function AnalysisHistory({ account, expandAnalysisId }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailCache, setDetailCache] = useState<Record<string, AnalysisDetail>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const { data: analyses = [] } = useQuery({
    queryKey: ["analyses", account],
    queryFn: () => getAnalyses(account),
    refetchInterval: 5000,
  })

  const loadDetail = async (id: string) => {
    if (detailCache[id]) return
    setLoadingId(id)
    try {
      const detail = await getAnalysisDetail(id)
      setDetailCache((prev) => ({ ...prev, [id]: detail }))
    } finally {
      setLoadingId(null)
    }
  }

  useEffect(() => {
    if (!expandAnalysisId) return
    setExpandedId(expandAnalysisId)
    loadDetail(expandAnalysisId)
  }, [expandAnalysisId])

  const handleToggle = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    await loadDetail(id)
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
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
                sx={{
                  cursor: "pointer",
                  "&:hover": { opacity: 0.8 },
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 1,
                  bgcolor: expandedId === a.id ? "action.hover" : "transparent",
                  borderRadius: 1,
                  p: expandedId === a.id ? 1 : 0,
                  mx: expandedId === a.id ? -1 : 0,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {new Date(a.created_at).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="primary" sx={{ display: "block" }}>
                    {a.account_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {a.summary}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>
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
                <Box sx={{ mt: 1.5 }}>
                  {loadingId === a.id ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                      <CircularProgress size={20} />
                    </Box>
                  ) : detailCache[a.id] ? (
                    <Stack spacing={1.5}>
                      <FlaggedTable
                        flags={detailCache[a.id].flags}
                        transactions={detailCache[a.id].transactions}
                      />
                      {detailCache[a.id].recommendations.length > 0 && (
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>
                            Recommendations
                          </Typography>
                          <Stack spacing={0.5}>
                            {detailCache[a.id].recommendations.map((rec, idx) => (
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
