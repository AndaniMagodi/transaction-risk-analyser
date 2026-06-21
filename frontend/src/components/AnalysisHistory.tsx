import { useQuery } from "@tanstack/react-query"
import { Paper, Typography, Box, Chip, Stack, Divider } from "@mui/material"
import { getAnalyses } from "../api/analysis"

const riskChipColor = (level: string): "error" | "warning" | "info" | "success" => {
  switch (level) {
    case "Critical": return "error"
    case "High": return "warning"
    case "Medium": return "info"
    default: return "success"
  }
}

export default function AnalysisHistory() {
  const { data: analyses = [] } = useQuery({
    queryKey: ["analyses"],
    queryFn: getAnalyses,
    refetchInterval: 5000,
  })

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
        <Stack spacing={1.5} sx={{ maxHeight: 320, overflowY: "auto" }}>
          {analyses.map((a, i) => (
            <Box key={a.id}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {new Date(a.created_at).toLocaleString()}
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
              {i < analyses.length - 1 && <Divider sx={{ mt: 1.5 }} />}
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  )
}
