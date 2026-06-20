import { useRef, useState } from "react"
import Papa from "papaparse"
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
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => fileInputRef.current?.click()}
      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      <p className="text-sm text-gray-500">
        {fileName ? `Loaded: ${fileName}` : "Drop a CSV file here, or click to browse"}
      </p>
      <p className="text-xs text-gray-400 mt-1">Columns: id, amount, merchant, date</p>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  )
}
