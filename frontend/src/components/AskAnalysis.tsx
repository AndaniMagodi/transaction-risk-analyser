import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Box, Paper, Typography, TextField, Button, CircularProgress, Stack } from "@mui/material"
import { askAboutAnalysis } from "../api/analysis"

export default function AskAnalysis({ analysisId }: { analysisId: string }) {
  const [question, setQuestion] = useState("")
  const [conversation, setConversation] = useState<{ question: string; answer: string }[]>([])

  const { mutate, isPending } = useMutation({
    mutationFn: (q: string) => askAboutAnalysis(analysisId, q),
    onSuccess: (answer, q) => {
        setConversation((prev) => [...prev, { question: q, answer }])
        setQuestion("")
      },
    })

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (!question.trim()) return
      mutate(question)
    }

    return (
        <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
            Ask About Analysis
            </Typography>
    
            <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField
                label="Your question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                fullWidth
                disabled={isPending}
            />
            <Button type="submit" variant="contained" disabled={isPending}>
                {isPending ? <CircularProgress size={24} /> : "Ask"}
            </Button>
            </Box>
    
            <Stack spacing={1}>
            {conversation.map((entry, idx) => (
                <Box key={idx} sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                    Q:
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                    {entry.question}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                    A:
                </Typography>
                <Typography variant="body2">{entry.answer}</Typography>
                </Box>
            ))}
            </Stack>
        </Paper>
        )
}

