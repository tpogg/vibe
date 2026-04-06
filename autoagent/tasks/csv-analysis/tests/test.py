"""Verify CSV analysis output."""
import json
import os

OUTPUT = "/app/output/report.json"
REWARD = "/logs/reward.txt"

EXPECTED = {
    "total_revenue": 2069.25,
    "top_product": "Widget A",
    "num_transactions": 10,
    "revenue_by_product": {
        "Widget A": 1402.50,
        "Widget B": 840.00,
        "Widget C": 483.75,
    },
}

# Breakdown:
# Widget A: (10+8+15+22)*25.50 = 55*25.50 = 1402.50
# Widget B: (5+12+3)*42.00 = 20*42.00 = 840.00
# Widget C: (20+7+18)*10.75 = 45*10.75 = 483.75
# Total: 1402.50 + 840.00 + 483.75 = 2726.25
# Wait, let me recalculate...

def main():
    os.makedirs(os.path.dirname(REWARD), exist_ok=True)

    if not os.path.exists(OUTPUT):
        open(REWARD, "w").write("0.0")
        print("FAIL: output file not found")
        return

    try:
        actual = json.loads(open(OUTPUT).read())
    except json.JSONDecodeError as e:
        open(REWARD, "w").write("0.0")
        print(f"FAIL: invalid JSON: {e}")
        return

    # Recalculate expected values
    expected_revenue = {
        "Widget A": (10 + 8 + 15 + 22) * 25.50,
        "Widget B": (5 + 12 + 3) * 42.00,
        "Widget C": (20 + 7 + 18) * 10.75,
    }
    expected_total = sum(expected_revenue.values())
    expected_top = max(expected_revenue, key=expected_revenue.get)

    checks = 0
    total_checks = 4

    # Check total_revenue
    if abs(actual.get("total_revenue", 0) - round(expected_total, 2)) < 0.01:
        checks += 1
    else:
        print(f"FAIL: total_revenue expected {round(expected_total, 2)}, got {actual.get('total_revenue')}")

    # Check top_product
    if actual.get("top_product") == expected_top:
        checks += 1
    else:
        print(f"FAIL: top_product expected {expected_top}, got {actual.get('top_product')}")

    # Check num_transactions
    if actual.get("num_transactions") == 10:
        checks += 1
    else:
        print(f"FAIL: num_transactions expected 10, got {actual.get('num_transactions')}")

    # Check revenue_by_product
    rbp = actual.get("revenue_by_product", {})
    rbp_correct = all(
        abs(rbp.get(k, 0) - round(v, 2)) < 0.01
        for k, v in expected_revenue.items()
    )
    if rbp_correct and len(rbp) == len(expected_revenue):
        checks += 1
    else:
        print(f"FAIL: revenue_by_product mismatch")

    score = checks / total_checks
    open(REWARD, "w").write(f"{score:.2f}")
    print(f"Score: {score:.2f} ({checks}/{total_checks} checks passed)")

if __name__ == "__main__":
    main()
