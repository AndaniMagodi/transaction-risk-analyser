import {
  Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Box
} from "@mui/material"
import type { Flag, Transaction } from "../api/analysis"

const severityChipColor = (severity: string): "error" | "warning" | "info" | "success" => {
  switch (severity) {
    case "Critical": return "error"
    case "High": return "warning"
    case "Medium": return "info"
    default: return "success"
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
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" mb={1.5}>
        Flagged Transactions ({flags.length})
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Merchant</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell align="right">Severity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flags.map((flag, i) => {
              const txn = getTransaction(flag.transaction_id)
              return (
                <TableRow key={i} hover>
                  <TableCell sx={{ fontWeight: 600 }}>#{flag.transaction_id}</TableCell>
                  <TableCell>{txn?.merchant ?? "—"}</TableCell>
                  <TableCell>{txn ? `R${txn.amount.toLocaleString()}` : "—"}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{flag.reason}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={flag.severity}
                      color={severityChipColor(flag.severity)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {flags.length === 0 && (
        <Box py={3} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            No flagged transactions
          </Typography>
        </Box>
      )}
    </Paper>
  )
}
