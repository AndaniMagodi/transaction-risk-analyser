import { useRef, useState } from "react"
import Papa from "papaparse"
import { Box, Typography } from "@mui/material"
import UploadFileIcon from "@mui/icons-material/UploadFile"
import type { Transaction } from "../api/analysis"

interface Props {
  onParsed: (transactions: Transaction[]) => void
}

export default function CsvUpload({ onParsed }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState("")
  const [error, setError] = useState("")

  const handleFile = (file: File) => {
    setError("")
    setFileName(file.name)

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as any[]
          const transactions: Transaction[] = rows.map((row, i) => ({
            id: row.id ?? i + 1,
            amount: Number(row.amount),
            merchant: String(row.merchant ?? "Unknown"),
            date: String(row.date ?? ""),
          }))
          if (transactions.length === 0) {
            setError("No rows found in CSV")
            return
          }
          onParsed(transactions)
        } catch {
          setError("Could not parse CSV — check column names (id, amount, merchant, date)")
        }
      },
      error: () => setError("Failed to read file"),
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <Box
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => fileInputRef.current?.click()}
      sx={{
        border: "2px dashed",
        borderColor: "divider",
        borderRadius: 2,
        p: 4,
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.15s",
        "&:hover": { borderColor: "text.secondary", bgcolor: "action.hover" },
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      <UploadFileIcon sx={{ fontSize: 32, color: "text.disabled", mb: 1 }} />
      <Typography variant="body2" color="text.secondary">
        {fileName ? `Loaded: ${fileName}` : "Drop a CSV file here, or click to browse"}
      </Typography>
      <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>
        Columns: id, amount, merchant, date
      </Typography>
      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
          {error}
        </Typography>
      )}
    </Box>
  )
}
