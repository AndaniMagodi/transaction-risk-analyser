import random
import csv
from datetime import datetime, timedelta

random.seed(42)

merchants = ["Shoprite", "Checkers", "Pick n Pay", "Woolworths", "Spar", "Engen",
             "Shell", "Takealot", "Uber Eats", "Netflix", "DSTV", "Vodacom",
             "MTN", "Clicks", "Dis-Chem", "Builders Warehouse", "Game", "Makro"]

suspicious_merchants = ["Unknown Merchant", "Cash Withdrawal", "Wire Transfer XYZ", "Offshore Payment Co"]

rows = []
start_date = datetime(2026, 6, 1)
txn_id = 1

for i in range(60):
    date = start_date + timedelta(hours=random.randint(0, 24*18))
    rows.append({
        "id": txn_id,
        "amount": round(random.uniform(50, 1500), 2),
        "merchant": random.choice(merchants),
        "date": date.strftime("%Y-%m-%d %H:%M")
    })
    txn_id += 1

for i in range(5):
    date = start_date + timedelta(hours=random.randint(0, 24*18))
    rows.append({
        "id": txn_id,
        "amount": round(random.uniform(35000, 95000), 2),
        "merchant": random.choice(suspicious_merchants),
        "date": date.strftime("%Y-%m-%d %H:%M")
    })
    txn_id += 1

for amt in [10000, 20000, 50000, 15000]:
    date = start_date + timedelta(hours=random.randint(0, 24*18))
    rows.append({
        "id": txn_id,
        "amount": amt,
        "merchant": "Cash Withdrawal",
        "date": date.strftime("%Y-%m-%d %H:%M")
    })
    txn_id += 1

dup_merchant = "Takealot"
dup_amount = 899.00
base_date = start_date + timedelta(days=5, hours=14)
for i in range(3):
    rows.append({
        "id": txn_id,
        "amount": dup_amount,
        "merchant": dup_merchant,
        "date": (base_date + timedelta(minutes=i*2)).strftime("%Y-%m-%d %H:%M")
    })
    txn_id += 1

rows.sort(key=lambda r: r["date"])

with open("realistic_transactions.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["id", "amount", "merchant", "date"])
    writer.writeheader()
    writer.writerows(rows)

print(f"Generated {len(rows)} transactions")
