export type RiskLevel = "Low" | "Medium" | "High" | "Critical"

export const riskColor = (level: string) => {
  switch (level) {
    case "Critical":
      return "error.main"
    case "High":
      return "warning.dark"
    case "Medium":
      return "warning.main"
    default:
      return "success.main"
  }
}

export const riskChipColor = (level: string): "error" | "warning" | "info" | "success" => {
  switch (level) {
    case "Critical":
      return "error"
    case "High":
      return "warning"
    case "Medium":
      return "info"
    default:
      return "success"
  }
}
