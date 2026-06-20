import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
})

export interface Transaction {
  id: number
  amount: number
  merchant: string
  date: string
  [key: string]: any
}

export interface Flag {
  transaction_id: string | number
  reason: string
  severity: "Low" | "Medium" | "High" | "Critical"
}

export interface AnalysisResult {
  risk_score: number
  risk_level: "Low" | "Medium" | "High" | "Critical"
  summary: string
  flags: Flag[]
  recommendations: string[]
}

export interface Analysis {
  id: string
  created_at: string
  risk_score: number
  risk_level: "Low" | "Medium" | "High" | "Critical"
  summary: string
  total_transactions: number
  flagged_transactions: number
}

export interface DashboardSummary {
  total_analyses: number
  total_transactions: number
  flagged_transactions: number
  average_risk_score: number
  risk_level: "Low" | "Medium" | "High" | "Critical"
}

export const analyseTransactions = async (transactions: Transaction[]): Promise<AnalysisResult> => {
  const { data } = await api.post("/api/analyze", { transactions })
  return data
}

export const getTransactionHistory = async (): Promise<Transaction[]> => {
  const { data } = await api.get("/api/transactions")
  return data
}

export const getAnalyses = async (): Promise<Analysis[]> => {
  const { data } = await api.get("/api/analyses")
  return data
}

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const { data } = await api.get("/api/dashboard")
  return data
}
