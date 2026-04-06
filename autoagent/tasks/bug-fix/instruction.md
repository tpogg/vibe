# Bug Fix

There is a broken Python script at `/task/files/calculator.py` that implements a simple RPN (Reverse Polish Notation) calculator.

The script has several bugs that cause it to produce wrong results or crash. Your job:

1. Read the script and identify all bugs
2. Fix the bugs
3. Save the corrected script to `/app/output/calculator.py`

The fixed script must:
- Accept a space-separated RPN expression as a command-line argument
- Support +, -, *, / operators
- Print the final numeric result to stdout (just the number, nothing else)
- Handle division correctly (use float division, not integer division)

Example: `python3 calculator.py "3 4 + 2 *"` should print `14.0`
