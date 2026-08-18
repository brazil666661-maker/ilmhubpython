import { CodeExample } from '../types';

export const PYTHON_EXAMPLES: CodeExample[] = [
  {
    id: 'hello-world',
    title: 'Hello World',
    category: 'basics',
    description: 'A friendly starter Python program greeting the ILMHUB platform.',
    code: `def main():
    name = "ILMHUB"
    print(f"👋 Hello, {name}!")
    print("Welcome to your online Python IDE & AI coding environment.")

if __name__ == "__main__":
    main()
`,
  },
  {
    id: 'calculator',
    title: 'Calculator & Math',
    category: 'basics',
    description: 'Basic arithmetic operations and standard mathematical functions.',
    code: `import math

def calculate(a: float, b: float):
    print("═" * 32)
    print(f"📊 Arithmetic Calculations for ({a}, {b})")
    print("═" * 32)
    print(f"Addition:       {a} + {b} = {a + b}")
    print(f"Subtraction:    {a} - {b} = {a - b}")
    print(f"Multiplication: {a} * {b} = {a * b}")
    print(f"Division:       {a} / {b} = {a / b:.4f}")
    print(f"Power:          {a} ** {b} = {a ** b}")
    print(f"Hypotenuse:     sqrt({a}² + {b}²) = {math.hypot(a, b):.4f}")

calculate(12, 4)
`,
  },
  {
    id: 'fibonacci',
    title: 'Fibonacci Sequence',
    category: 'algorithms',
    description: 'Generates the Fibonacci series with memoization and benchmarking.',
    code: `def fibonacci_series(n: int) -> list[int]:
    """Generate the first n Fibonacci numbers."""
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    
    fib = [0, 1]
    for _ in range(2, n):
        fib.append(fib[-1] + fib[-2])
    return fib

def main():
    count = 15
    print(f"Generating first {count} Fibonacci numbers:")
    series = fibonacci_series(count)
    
    for idx, num in enumerate(series, start=1):
        print(f"F({idx:2d}) = {num:>4d}")

if __name__ == "__main__":
    main()
`,
  },
  {
    id: 'intentional-error',
    title: 'Intentional Error Demo',
    category: 'errors',
    description: 'Contains a NameError and TypeError to demonstrate ILMHUB error diagnosis and AI Fix.',
    hasError: true,
    code: `# This example contains intentional errors to test the ILMHUB Error Detector!
# Click "Run" to see the smart error panel, then click "Fix with AI".

def greet_user():
    title = "ILMHUB Python IDE"
    # ERROR: undefined variable 'username'
    print("Welcome " + username + " to " + title)

greet_user()
`,
  },
  {
    id: 'data-structures',
    title: 'Data & Dictionary Analysis',
    category: 'data',
    description: 'Working with dictionaries, list comprehensions, and statistics.',
    code: `students = [
    {"name": "Ali", "score": 92, "city": "Tashkent"},
    {"name": "Zarina", "score": 88, "city": "Samarkand"},
    {"name": "Bobur", "score": 95, "city": "Bukhara"},
    {"name": "Malika", "score": 90, "city": "Tashkent"},
    {"name": "Jasur", "score": 78, "city": "Fergana"},
]

print("🎓 Student Performance Report:")
print("-" * 35)

scores = [s["score"] for s in students]
avg_score = sum(scores) / len(scores)

for s in students:
    status = "🌟 Top" if s["score"] >= 90 else "✅ Pass"
    print(f"{s['name']:<10} | {s['city']:<10} | Score: {s['score']:2d} {status}")

print("-" * 35)
print(f"Average Score: {avg_score:.1f}")
print(f"Highest Score: {max(scores)} ({[s['name'] for s in students if s['score'] == max(scores)][0]})")
`,
  },
  {
    id: 'oop-bank',
    title: 'OOP: Bank Account Class',
    category: 'basics',
    description: 'Object-oriented programming with encapsulation and transaction logs.',
    code: `class BankAccount:
    def __init__(self, owner: str, balance: float = 0.0):
        self.owner = owner
        self.balance = balance
        self.transactions = []
        self._log(f"Account created with initial balance \\\${balance:.2f}")

    def deposit(self, amount: float):
        if amount > 0:
            self.balance += amount
            self._log(f"Deposited \\\${amount:.2f}")
        return self.balance

    def withdraw(self, amount: float):
        if 0 < amount <= self.balance:
            self.balance -= amount
            self._log(f"Withdrew \\\${amount:.2f}")
        else:
            self._log(f"Failed withdrawal of \\\${amount:.2f} (Insufficient funds)")
        return self.balance

    def _log(self, message: str):
        self.transactions.append(message)
        print(f"[{self.owner}] {message} -> Balance: \\\${self.balance:.2f}")

# Simulation
account = BankAccount("Sardor", 100.0)
account.deposit(50.0)
account.withdraw(30.0)
account.withdraw(150.0)
`,
  },
  {
    id: 'primes',
    title: 'Prime Number Sieve',
    category: 'algorithms',
    description: 'Sieve of Eratosthenes algorithm for finding prime numbers.',
    code: `def find_primes(limit: int) -> list[int]:
    """Sieve of Eratosthenes."""
    if limit < 2:
        return []
    sieve = [True] * (limit + 1)
    sieve[0] = sieve[1] = False
    
    for i in range(2, int(limit**0.5) + 1):
        if sieve[i]:
            for multiple in range(i*i, limit + 1, i):
                sieve[multiple] = False
                
    return [i for i, is_prime in enumerate(sieve) if is_prime]

primes = find_primes(50)
print(f"Prime numbers up to 50 ({len(primes)} total):")
print(", ".join(map(str, primes)))
`,
  },
];
