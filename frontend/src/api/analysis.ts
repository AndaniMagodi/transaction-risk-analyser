import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "" : "http://localhost:8000"),
})

export interface Transaction {
  id: number | string
  amount: number
  merchant: string
  date: string
}

export interface Flag {
  transaction_id: string | number
  reason: string
  severity: "Low" | "Medium" | "High" | "Critical"
}

export interface AnalysisResult {
  id: string
  risk_score: number
  risk_level: "Low" | "Medium" | "High" | "Critical"
  summary: string
  flags: Flag[]
  recommendations: string[]
}

export interface Analysis {
  id: string
  created_at: string
  account_name: string
  risk_score: number
  risk_level: "Low" | "Medium" | "High" | "Critical"
  summary: string
  total_transactions: number
  flagged_transactions: number
}

export interface AnalysisDetail extends Analysis {
  flags: Flag[]
  recommendations: string[]
  transactions: Transaction[]
}

export interface DashboardSummary {
  total_analyses: number
  total_transactions: number
  flagged_transactions: number
  average_risk_score: number
  risk_level: "Low" | "Medium" | "High" | "Critical"
}

export const analyseTransactions = async (
  accountName: string,
  transactions: Transaction[]
): Promise<AnalysisResult> => {
  const { data } = await api.post("/api/analyze", { account_name: accountName, transactions })
  return data
}

export const getAccounts = async (): Promise<string[]> => {
  const { data } = await api.get("/api/accounts")
  return data
}

export const getAnalyses = async (account?: string): Promise<Analysis[]> => {
  const { data } = await api.get("/api/analyses", { params: account ? { account } : {} })
  return data
}

export const getAnalysisDetail = async (id: string): Promise<AnalysisDetail> => {
  const { data } = await api.get(`/api/analyses/${id}`)
  return data
}

export const getDashboardSummary = async (account?: string): Promise<DashboardSummary> => {
  const { data } = await api.get("/api/dashboard", { params: account ? { account } : {} })
  return data
}

export const askAboutAnalysis = async (analysisId: string, question: string): Promise<string> => {
  const { data } = await api.post(`/api/analyses/${analysisId}/ask`, { text: question })
  return data.answer
}