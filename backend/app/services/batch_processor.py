import json
import math
from typing import Callable


class BatchProcessor:
    """Chunks large transaction lists and merges per-batch LLM results.
    Pure data-shaping logic with no Groq dependency — takes the actual
    LLM-calling function as an argument so it stays independently testable."""

    MAX_INPUT_TOKENS_PER_BATCH = 6000
    CHARS_PER_TOKEN_ESTIMATE = 4  # rough heuristic, not an exact tokenizer
    MAX_FLAGS = 10

    def analyse_in_batches(
        self,
        transactions: list[dict],
        analyse_fn: Callable[[list[dict]], dict],
    ) -> dict:
        batches = self._chunk_transactions(transactions)
        if len(batches) == 1:
            return analyse_fn(batches[0])

        batch_results = [analyse_fn(batch) for batch in batches]
        return self._merge_results(batch_results)

    def _estimate_tokens(self, transactions: list[dict]) -> int:
        raw = json.dumps(transactions, default=str)
        return len(raw) // self.CHARS_PER_TOKEN_ESTIMATE

    def _chunk_transactions(self, transactions: list[dict]) -> list[list[dict]]:
        if not transactions:
            return [[]]

        total_tokens = self._estimate_tokens(transactions)
        if total_tokens <= self.MAX_INPUT_TOKENS_PER_BATCH:
            return [transactions]

        num_batches = math.ceil(total_tokens / self.MAX_INPUT_TOKENS_PER_BATCH)
        batch_size = math.ceil(len(transactions) / num_batches)
        return [
            transactions[i : i + batch_size]
            for i in range(0, len(transactions), batch_size)
        ]

    def _merge_results(self, results: list[dict]) -> dict:
        severity_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}

        all_flags = [flag for r in results for flag in r["flags"]]
        all_flags.sort(key=lambda f: severity_order.get(f["severity"], 4))
        top_flags = all_flags[: self.MAX_FLAGS]

        scores = [r["risk_score"] for r in results]
        overall_score = round(max(scores) * 0.6 + (sum(scores) / len(scores)) * 0.4)

        level_order = ["Low", "Medium", "High", "Critical"]
        overall_level = max(
            (r["risk_level"] for r in results),
            key=lambda lvl: level_order.index(lvl) if lvl in level_order else 0,
        )

        seen, recommendations = set(), []
        for r in results:
            for rec in r["recommendations"]:
                if rec not in seen:
                    seen.add(rec)
                    recommendations.append(rec)

        summary = (
            f"Analysed {len(results)} batches covering all submitted transactions. "
            f"{len(all_flags)} total flags raised; highest-severity batch reached "
            f"{overall_level} risk."
        )

        return {
            "risk_score": min(overall_score, 100),
            "risk_level": overall_level,
            "summary": summary,
            "flags": top_flags,
            "recommendations": recommendations[:10],
        }


batch_processor = BatchProcessor()