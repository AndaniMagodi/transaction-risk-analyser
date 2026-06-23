import { useQuery } from "@tanstack/react-query"
import { Paper, Typography, Skeleton, Grid } from "@mui/material"
import { getDashboardSummary } from "../api/analysis"
import { riskColor } from "../utils/risk"

interface Props {
  account?: string
}

export default function KpiCards({ account }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboardSummary", account],
    queryFn: () => getDashboardSummary(account),
    refetchInterval: 5000,
  })

  if (isLoading || !data) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3, 4].map((i) => (
          <Grid key={i} size={{ xs: 6, md: 3 }}>
            <Paper sx={{ p: 2 }}>
              <Skeleton width="60%" height={16} />
              <Skeleton width="40%" height={32} sx={{ mt: 1 }} />
            </Paper>
          </Grid>
        ))}
      </Grid>
    )
  }

  const cards = [
    { label: "Total Analyses", value: data.total_analyses },
    { label: "Total Transactions Reviewed", value: data.total_transactions },
    { label: "Total Flagged", value: data.flagged_transactions },
    { label: "Avg Risk Score", value: data.average_risk_score },
  ]

  return (
    <Grid container spacing={2}>
      {cards.map((card) => (
        <Grid key={card.label} size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, transition: "box-shadow 0.2s", '&:hover': { boxShadow: 2 } }}>
            <Typography variant="caption" color="text.secondary">
              {card.label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
              {card.value}
            </Typography>
          </Paper>
        </Grid>
      ))}
      <Grid size={12}>
        <Paper sx={{ p: 2, transition: "box-shadow 0.2s", '&:hover': { boxShadow: 2 } }}>
          <Typography variant="caption" color="text.secondary">
            Latest Risk Level
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: riskColor(data.risk_level) }}>
            {data.risk_level}
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  )
}
