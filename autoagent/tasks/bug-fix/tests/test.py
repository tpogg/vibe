"""Verify the fixed RPN calculator."""
import os
import subprocess

OUTPUT = "/app/output/calculator.py"
REWARD = "/logs/reward.txt"

TEST_CASES = [
    ("3 4 +", "7.0"),
    ("3 4 + 2 *", "14.0"),
    ("5 1 2 + 4 * + 3 -", "14.0"),
    ("10 2 /", "5.0"),
    ("15 7 1 1 + - / 3 * 2 1 1 + + -", "5.0"),
]

def main():
    os.makedirs(os.path.dirname(REWARD), exist_ok=True)

    if not os.path.exists(OUTPUT):
        open(REWARD, "w").write("0.0")
        print("FAIL: output file not found")
        return

    passed = 0
    for expr, expected in TEST_CASES:
        try:
            result = subprocess.run(
                ["python3", OUTPUT, expr],
                capture_output=True, text=True, timeout=10,
            )
            actual = result.stdout.strip()
            if actual == expected:
                passed += 1
            else:
                print(f"FAIL: rpn('{expr}') = '{actual}', expected '{expected}'")
        except Exception as e:
            print(f"FAIL: rpn('{expr}') raised {e}")

    score = passed / len(TEST_CASES)
    open(REWARD, "w").write(f"{score:.2f}")
    print(f"Score: {score:.2f} ({passed}/{len(TEST_CASES)} tests passed)")

if __name__ == "__main__":
    main()
