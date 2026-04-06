"""RPN Calculator - has bugs that need fixing."""
import sys

def rpn_calc(expression):
    stack = []
    tokens = expression.split()

    for token in tokens:
        if token in "+-*/":
            a = stack.pop()  # Bug 1: operand order is swapped
            b = stack.pop()
            if token == "+":
                stack.append(a + b)
            elif token == "-":
                stack.append(a - b)  # Bug 2: should be b - a
            elif token == "*":
                stack.append(a * b)
            elif token == "/":
                stack.append(a // b)  # Bug 3: integer division instead of float
        else:
            stack.append(int(token))  # Bug 4: should be float for consistent output

    return stack[0]

if __name__ == "__main__":
    expr = sys.argv[0]  # Bug 5: should be sys.argv[1]
    result = rpn_calc(expr)
    print(f"Result: {result}")  # Bug 6: should print just the number
