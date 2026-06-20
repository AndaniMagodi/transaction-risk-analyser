import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

class RiskAnalysisService:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "llama-3.1-8b-instant"

    def analyse_transactions(self, transactions: list[dict]) -> dict:
        prompt = f"""You are a financial risk analyst. Analyse the following transactions and return a JSON response only — no preamble, no markdown, no explanation outside the JSON.

Transactions:
{transactions}

Return this exact JSON structure:
{{
  "risk_score": <number 0-100>,
  "risk_level": "<Low|Medium|High|Critical>",
  "summary": "<2-3 sentence plain English summary of what you found>",
  "flags": [
    {{
      "transaction_id": "<id or index>",
      "reason": "<why this transaction is flagged>",
      "severity": "<Low|Medium|High|Critical>"
    }}
  ],
  "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}}

Flag transactions that show: unusually large amounts, duplicate entries, round number patterns, rapid succession transactions, unusual merchants, or amounts that deviate significantly from the norm."""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1024,
        )

        response_text = response.choices[0].message.content.strip()

        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]

        return json.loads(response_text.strip())

# Singleton
risk_service = RiskAnalysisService()
