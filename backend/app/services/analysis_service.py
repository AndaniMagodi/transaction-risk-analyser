import json
import os
import re

from groq import Groq
from dotenv import load_dotenv
from pydantic import ValidationError

from app.schemas import AnalysisResult
from app.services.batch_processor import batch_processor

load_dotenv()


class AnalysisServiceError(Exception):
    pass


class MalformedResponseError(AnalysisServiceError):
    pass


class RiskAnalysisService:
    MAX_RETRIES = 2
    MAX_FLAGS = 10

    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "llama-3.1-8b-instant"

    def analyse_transactions_batched(self, transactions: list[dict]) -> dict:
        """Public entrypoint for routes. Transparently chunks large inputs."""
        return batch_processor.analyse_in_batches(
            transactions, analyse_fn=self.analyse_transactions
        )

    def analyse_transactions(self, transactions: list[dict]) -> dict:
        prompt = self._build_prompt(transactions)

        last_error: Exception | None = None
        for attempt in range(self.MAX_RETRIES + 1):
            try:
                response_text = self._call_model(prompt, retry_attempt=attempt)
                parsed = self._extract_json(response_text)
                return AnalysisResult.model_validate(parsed).model_dump()
            except (MalformedResponseError, ValidationError) as e:
                last_error = e
                continue
            except Exception as e:
                raise AnalysisServiceError("LLM request failed") from e

        raise MalformedResponseError(
            f"LLM did not return a valid schema-conformant response after "
            f"{self.MAX_RETRIES + 1} attempts"
        ) from last_error

    def answer_followup(
        self, transactions: list[dict], prior_result: dict, question: str
    ) -> str:
        prompt = f"""You are a financial risk analyst. All transaction amounts are in South African Rand (ZAR). Always refer to amounts using "R" or "Rand", never dollars or "$".


Transactions (JSON array):
{json.dumps(transactions, indent=2, default=str)}

Your prior analysis:
{json.dumps(prior_result, indent=2, default=str)}

The user is now asking a follow-up question about this specific analysis:
"{question}"

Answer the question directly, in plain English, using only the transaction
data and your prior analysis above as evidence. If the question can't be
answered from the available data, say so plainly. Do not return JSON —
respond with a short, clear, plain-text answer only (2-5 sentences)."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=512,
            )
        except Exception as e:
            raise AnalysisServiceError("LLM request failed") from e

        return response.choices[0].message.content.strip()

    def _build_prompt(self, transactions: list[dict]) -> str:
        transactions_json = json.dumps(transactions, indent=2, default=str)

        return f"""You are a financial risk analyst. All transaction amounts below are in South African Rand (ZAR). Always refer to amounts using "R" or "Rand", never dollars or "$".

Transactions (JSON array):
{transactions_json}

Return this exact JSON structure:
{{
  "risk_score": <integer 0-100>,
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

Flag transactions that show: unusually large amounts, duplicate entries, round number patterns, rapid succession transactions, unusual merchants, or amounts that deviate significantly from the norm.

Important: include at most the {self.MAX_FLAGS} most severe flags, ordered by severity (most severe first). Do not include more than {self.MAX_FLAGS} entries in "flags" even if more transactions look suspicious — summarise the rest in "summary" instead.

Important: risk_score must be a whole integer, not a decimal."""

    def _call_model(self, prompt: str, retry_attempt: int) -> str:
        messages = [{"role": "user", "content": prompt}]

        if retry_attempt > 0:
            messages.append({
                "role": "user",
                "content": (
                    "Your previous response was not valid JSON matching the "
                    "required schema. Return ONLY the JSON object, with no "
                    "markdown fences and no extra text."
                ),
            })

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.2,
                max_tokens=2048,
            )
        except Exception as e:
            raise AnalysisServiceError("LLM request failed") from e

        return response.choices[0].message.content.strip()

    @staticmethod
    def _extract_json(response_text: str) -> dict:
        match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if not match:
            raise MalformedResponseError("No JSON object found in LLM response")

        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError as e:
            raise MalformedResponseError("LLM returned invalid JSON") from e


risk_service = RiskAnalysisService()