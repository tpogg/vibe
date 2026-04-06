"""Verify FizzBuzz output."""
import os
import sys

OUTPUT = "/app/output/fizzbuzz.txt"
REWARD = "/logs/reward.txt"

def expected_fizzbuzz():
    lines = []
    for i in range(1, 101):
        if i % 15 == 0:
            lines.append("FizzBuzz")
        elif i % 3 == 0:
            lines.append("Fizz")
        elif i % 5 == 0:
            lines.append("Buzz")
        else:
            lines.append(str(i))
    return lines

def main():
    os.makedirs(os.path.dirname(REWARD), exist_ok=True)

    if not os.path.exists(OUTPUT):
        open(REWARD, "w").write("0.0")
        print("FAIL: output file not found")
        return

    actual = open(OUTPUT).read().strip().splitlines()
    expected = expected_fizzbuzz()

    if len(actual) != 100:
        open(REWARD, "w").write("0.0")
        print(f"FAIL: expected 100 lines, got {len(actual)}")
        return

    correct = sum(1 for a, e in zip(actual, expected) if a.strip() == e)
    score = correct / 100.0
    open(REWARD, "w").write(f"{score:.2f}")
    print(f"Score: {score:.2f} ({correct}/100 correct)")

if __name__ == "__main__":
    main()
