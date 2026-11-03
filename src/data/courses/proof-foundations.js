export default {
  "category": "Foundations",
  "title": "Proof Foundations",
  "img": "assets/proof-foundations.png",
  "desc": "The universal grammar of mathematics. Move beyond intuitive calculations to absolute certainty using direct deduction, contradiction, contrapositives, and induction.",
  "sections": "5 Sections",
  "challenges": "35 Challenges",
  "bannerLevel": "LEVEL 1",
  "bannerTitle": "Direct Deduction & Contradiction",
  "nodes": [
    {
      "top": 25,
      "left": 170,
      "active": true,
      "title": "Universal Modus Ponens",
      "sub": "Direct Deductions",
      "desc": "Master direct conditional deduction: assume antecedent P, build sound implications to reach Q."
    },
    {
      "top": 155,
      "left": 60,
      "active": false,
      "title": "Reductio ad Absurdum",
      "sub": "Proof by Contradiction",
      "desc": "Assume the negation ¬P, derive a logical contradiction to establish the truth of P."
    },
    {
      "top": 285,
      "left": 180,
      "active": false,
      "title": "The Law of Contrapositives",
      "sub": "Equivalence & Negation",
      "desc": "Prove that an implication P ⇒ Q is strictly logically equivalent to ¬Q ⇒ ¬P."
    },
    {
      "top": 415,
      "left": 70,
      "active": false,
      "title": "The Law of Induction",
      "sub": "Base Case & Step",
      "desc": "Establish the base case P(1) and the inductive leap P(k) ⇒ P(k+1) across all natural numbers."
    }
  ],
  "problems": [
    {
      "id": "proof_direct",
      "category": "Proof Foundations: Direct Proof",
      "title": "The Sum of Two Odd Numbers",
      "text": "A direct proof starts from what you are given and moves, step by step, to what you want. Each step must follow from a definition or an earlier step.\n\nDefinitions: an integer is even if it equals 2m for some integer m, and odd if it equals 2m + 1.\n\nProve: the sum of any two odd integers is even.",
      "visual": "\n    <svg viewBox=\"0 0 320 110\" class=\"exercise-svg-diagram\">\n      <g transform=\"translate(20, 25)\">\n        <rect x=\"0\" y=\"0\" width=\"80\" height=\"50\" rx=\"8\" fill=\"#fff7ed\" stroke=\"#ea580c\" stroke-width=\"1.5\"/>\n        <text x=\"40\" y=\"30\" text-anchor=\"middle\" fill=\"#ea580c\" font-size=\"13\" font-weight=\"bold\">odd</text>\n        <text x=\"98\" y=\"31\" text-anchor=\"middle\" fill=\"#94a3b8\" font-size=\"18\">+</text>\n        <rect x=\"115\" y=\"0\" width=\"80\" height=\"50\" rx=\"8\" fill=\"#fff7ed\" stroke=\"#ea580c\" stroke-width=\"1.5\"/>\n        <text x=\"155\" y=\"30\" text-anchor=\"middle\" fill=\"#ea580c\" font-size=\"13\" font-weight=\"bold\">odd</text>\n        <text x=\"213\" y=\"31\" text-anchor=\"middle\" fill=\"#94a3b8\" font-size=\"18\">=</text>\n        <rect x=\"230\" y=\"0\" width=\"60\" height=\"50\" rx=\"8\" fill=\"#f8fafc\" stroke=\"#94a3b8\" stroke-width=\"1.5\" stroke-dasharray=\"3 3\"/>\n        <text x=\"260\" y=\"31\" text-anchor=\"middle\" fill=\"#475569\" font-size=\"16\" font-weight=\"bold\">?</text>\n      </g>\n    </svg>\n  ",
      "curatedHint": "Checking 3 + 5 = 8 is a good start, but examples can't cover every integer. Use the definition of odd.",
      "progressiveHints": {
        "attempt1": "Write the two odd numbers as 2a + 1 and 2b + 1. Why should you use different letters?",
        "attempt2": "Add them: (2a + 1) + (2b + 1) = ?",
        "attempt3": "Can you factor a 2 out of 2a + 2b + 2? What does that show?"
      },
      "curatedSolution": {
        "technique": "Direct Proof from Definitions",
        "setup": "Let x and y be odd integers. By definition, x = 2a + 1 and y = 2b + 1 for some integers a and b.",
        "steps": "1. x + y = (2a + 1) + (2b + 1) = 2a + 2b + 2.\n2. Factor out 2: x + y = 2(a + b + 1).\n3. Since a + b + 1 is an integer, x + y has the form 2m.",
        "conclusion": "Therefore x + y is even, for every pair of odd integers.",
        "commonMistakes": "Using the same letter for both numbers (x = 2k + 1 and y = 2k + 1 silently assumes x = y); proving with examples only."
      }
    },
    {
      "id": "proof_p0",
      "badge": "PROOFS · PROBLEM 1 OF 4",
      "category": "Proof Foundations: Contradiction",
      "title": "The Irrationality of √2",
      "text": "To prove √2 is irrational by contradiction, we assume √2 = a/b where a, b are coprime positive integers (gcd(a, b) = 1). Deduce the contradiction that arises.",
      "visual": "\n          <svg viewBox=\"0 0 320 160\" class=\"exercise-svg-diagram\">\n            <g transform=\"translate(60, 25)\">\n              <rect width=\"200\" height=\"70\" rx=\"10\" fill=\"#fff7ed\" stroke=\"#ea580c\" stroke-width=\"1.5\"/>\n              <text x=\"100\" y=\"38\" text-anchor=\"middle\" fill=\"#ea580c\" font-size=\"15\" font-weight=\"bold\">√2 = a / b</text>\n              <text x=\"100\" y=\"58\" text-anchor=\"middle\" fill=\"#7c2d12\" font-size=\"11\">2b² = a²  ⇒  a, b both even?</text>\n            </g>\n          </svg>\n        ",
      "curatedHint": "Square both sides to get 2b² = a². What does this imply about the divisibility of a, and subsequently b?",
      "progressiveHints": {
        "attempt1": "If a² = 2b², what does that tell you about whether a² is even or odd? What does that imply about a itself?",
        "attempt2": "Since a is even, write a = 2k for some integer k. Substitute this back into 2b² = a² and simplify.",
        "attempt3": "You get 2b² = 4k², so b² = 2k². What does this say about the parity of b?",
        "attempt4": "Both a and b are divisible by 2. But we assumed a/b was in lowest terms with gcd(a, b) = 1. A fraction cannot be both irreducible and have both numerator and denominator divisible by 2."
      },
      "curatedSolution": {
        "technique": "Proof by Contradiction (Reductio ad Absurdum)",
        "setup": "Assume for the sake of contradiction that √2 is rational. Then √2 = a / b for positive integers a, b with gcd(a, b) = 1 (coprime, lowest terms).",
        "steps": "1. Squaring both sides yields 2 = a² / b², which implies a² = 2b².\n2. Since 2 divides 2b², 2 must divide a². By Euclid's lemma (or parity of squares), if 2 divides a², then 2 divides a. Thus a is even.\n3. Let a = 2k for some integer k. Substituting into a² = 2b² gives (2k)² = 2b² ⇒ 4k² = 2b² ⇒ b² = 2k².\n4. By the exact same deduction, since 2 divides 2k², 2 must divide b², meaning b is also even.",
        "conclusion": "Since both a and b are even, 2 is a common divisor of a and b: gcd(a, b) ≥ 2. This directly contradicts the assumption that gcd(a, b) = 1. Hence, the initial assumption that √2 is rational is false. √2 is irrational.",
        "commonMistakes": "Omitting the lemma that a² even implies a even; forgetting that gcd(a, b) = 1 is the crucial assumption contradicted."
      }
    },
    {
      "id": "proof_p1",
      "badge": "PROOFS · PROBLEM 2 OF 4",
      "category": "Proof Foundations: Contrapositive",
      "title": "Contrapositive Equivalence",
      "text": "To prove the statement: 'For all integers n, if n² is even, then n is even', formulate the logically equivalent contrapositive and execute its direct proof.",
      "visual": "\n          <svg viewBox=\"0 0 320 150\" class=\"exercise-svg-diagram\">\n            <g transform=\"translate(40, 30)\">\n              <rect x=\"0\" y=\"0\" width=\"105\" height=\"55\" rx=\"8\" fill=\"#f8fafc\" stroke=\"#cbd5e1\" stroke-width=\"1.5\"/>\n              <text x=\"52\" y=\"32\" text-anchor=\"middle\" fill=\"#0f172a\" font-size=\"11\" font-weight=\"bold\">P ⇒ Q</text>\n              <text x=\"120\" y=\"35\" text-anchor=\"middle\" fill=\"#ea580c\" font-size=\"16\">≡</text>\n              <rect x=\"135\" y=\"0\" width=\"105\" height=\"55\" rx=\"8\" fill=\"#fff7ed\" stroke=\"#ea580c\" stroke-width=\"1.5\"/>\n              <text x=\"187\" y=\"32\" text-anchor=\"middle\" fill=\"#ea580c\" font-size=\"11\" font-weight=\"bold\">¬Q ⇒ ¬P</text>\n            </g>\n          </svg>\n        ",
      "curatedHint": "The contrapositive of P ⇒ Q is ¬Q ⇒ ¬P. Negate 'n is even' and 'n² is even'.",
      "progressiveHints": {
        "attempt1": "What is the logical negation of 'n is even'? What is the negation of 'n² is even'?",
        "attempt2": "The contrapositive is: 'If n is odd, then n² is odd'. Write an odd integer n in the algebraic form 2k + 1.",
        "attempt3": "Compute n² = (2k + 1)² by expanding the binomial: 4k² + 4k + 1 = 2(2k² + 2k) + 1. What does this reveal about n²?",
        "attempt4": "Since n² = 2m + 1 where m = 2k² + 2k is an integer, n² is strictly odd. Proving ¬Q ⇒ ¬P directly establishes the truth of the original implication P ⇒ Q."
      },
      "curatedSolution": {
        "technique": "Proof by Contrapositive (¬Q ⇒ ¬P)",
        "setup": "Let P be the predicate 'n² is even' and Q be 'n is even'. The proposition to prove is P ⇒ Q. Its contrapositive is ¬Q ⇒ ¬P: 'If n is odd, then n² is odd'.",
        "steps": "1. Assume the antecedent of the contrapositive: n is odd.\n2. By the definition of an odd integer, n = 2k + 1 for some integer k ∈ ℤ.\n3. Compute n² using algebraic expansion: n² = (2k + 1)² = 4k² + 4k + 1.\n4. Factor out 2 from the first two terms: n² = 2(2k² + 2k) + 1.\n5. Since k is an integer, m = 2k² + 2k is also an integer. Thus n² = 2m + 1.",
        "conclusion": "By definition, n² is an odd integer, establishing ¬P. Since an implication P ⇒ Q is logically equivalent to its contrapositive ¬Q ⇒ ¬P, the original statement 'If n² is even, then n is even' is proven.",
        "commonMistakes": "Confusing the contrapositive (¬Q ⇒ ¬P) with the converse (Q ⇒ P) or inverse (¬P ⇒ ¬Q); failing to factor 2 from the expansion."
      }
    },
    {
      "id": "proof_p2",
      "badge": "PROOFS · PROBLEM 3 OF 4",
      "category": "Proof Foundations: Induction",
      "title": "Sum of First n Odd Numbers",
      "text": "Prove by mathematical induction that 1 + 3 + 5 + ... + (2n - 1) = n² for all positive integers n ≥ 1.",
      "visual": "\n          <svg viewBox=\"0 0 320 160\" class=\"exercise-svg-diagram\">\n            <g transform=\"translate(40, 20)\">\n              <rect x=\"0\" y=\"0\" width=\"22\" height=\"22\" rx=\"3\" fill=\"#fed7aa\"/><rect x=\"24\" y=\"0\" width=\"22\" height=\"22\" rx=\"3\" fill=\"#fed7aa\"/><rect x=\"48\" y=\"0\" width=\"22\" height=\"22\" rx=\"3\" fill=\"#f97316\"/><rect x=\"0\" y=\"24\" width=\"22\" height=\"22\" rx=\"3\" fill=\"#fed7aa\"/><rect x=\"24\" y=\"24\" width=\"22\" height=\"22\" rx=\"3\" fill=\"#fed7aa\"/><rect x=\"48\" y=\"24\" width=\"22\" height=\"22\" rx=\"3\" fill=\"#f97316\"/><rect x=\"0\" y=\"48\" width=\"22\" height=\"22\" rx=\"3\" fill=\"#f97316\"/><rect x=\"24\" y=\"48\" width=\"22\" height=\"22\" rx=\"3\" fill=\"#f97316\"/><rect x=\"48\" y=\"48\" width=\"22\" height=\"22\" rx=\"3\" fill=\"#f97316\"/>\n              <text x=\"160\" y=\"45\" text-anchor=\"middle\" fill=\"#0f172a\" font-size=\"13\" font-weight=\"bold\">k² + (2k + 1) = (k + 1)²</text>\n            </g>\n          </svg>\n        ",
      "curatedHint": "Structure your proof into two distinct components: the Base Case (n = 1) and the Inductive Step (assume true for k, prove for k + 1).",
      "progressiveHints": {
        "attempt1": "Verify the base case: does the formula hold for n = 1? What is the LHS and what is the RHS?",
        "attempt2": "State the Induction Hypothesis clearly: assume 1 + 3 + ... + (2k - 1) = k² for some positive integer k ≥ 1.",
        "attempt3": "For n = k + 1, the sum is [1 + 3 + ... + (2k - 1)] + (2(k+1) - 1). Substitute the Induction Hypothesis into the bracketed part.",
        "attempt4": "You get k² + (2k + 1). Factor this quadratic polynomial: k² + 2k + 1 = (k + 1)². This matches the formula for n = k + 1, completing the induction."
      },
      "curatedSolution": {
        "technique": "Mathematical Induction (Weak Induction)",
        "setup": "Let P(n) be the statement: sum_{i=1}^n (2i - 1) = n² for n ∈ ℕ.",
        "steps": "1. Base Case (n = 1):\n   LHS = 2(1) - 1 = 1.\n   RHS = 1² = 1.\n   Since LHS = RHS = 1, P(1) is true.\n2. Inductive Hypothesis: Assume P(k) is true for some positive integer k ≥ 1, so 1 + 3 + ... + (2k - 1) = k².\n3. Inductive Step: We must show P(k + 1) is true, namely 1 + 3 + ... + (2k - 1) + (2(k+1) - 1) = (k + 1)².\n4. Group the first k terms: LHS = [1 + 3 + ... + (2k - 1)] + (2k + 1).\n5. By the Induction Hypothesis, the bracketed term is k²: LHS = k² + 2k + 1.\n6. Recognizing the perfect square trinomial: k² + 2k + 1 = (k + 1)² = RHS.",
        "conclusion": "Both the base case and inductive step hold. By the Principle of Mathematical Induction, P(n) is true for all integers n ≥ 1.",
        "commonMistakes": "Omitting the base case; assuming P(k+1) is true instead of deriving it from P(k)."
      }
    },
    {
      "id": "proof_p3",
      "badge": "PROOFS · PROBLEM 4 OF 4",
      "category": "Proof Foundations: Cases & Exhaustion",
      "title": "The Law of Exhaustive Cases",
      "text": "Prove that for every integer n, the product n(n + 1) is always even, using proof by exhaustive cases.",
      "visual": "\n          <svg viewBox=\"0 0 320 150\" class=\"exercise-svg-diagram\">\n            <g transform=\"translate(60, 25)\">\n              <circle cx=\"100\" cy=\"50\" r=\"45\" fill=\"#f8fafc\" stroke=\"#94a3b8\" stroke-dasharray=\"3 3\"/>\n              <path d=\"M 100,5 L 100,95 M 55,50 L 145,50\" stroke=\"#ea580c\" stroke-width=\"1.5\"/>\n              <text x=\"75\" y=\"35\" fill=\"#0f172a\" font-size=\"10\" font-weight=\"bold\">Case 1</text>\n              <text x=\"125\" y=\"35\" fill=\"#0f172a\" font-size=\"10\" font-weight=\"bold\">Case 2</text>\n              <text x=\"75\" y=\"75\" fill=\"#0f172a\" font-size=\"10\" font-weight=\"bold\">Case 3</text>\n              <text x=\"125\" y=\"75\" fill=\"#0f172a\" font-size=\"10\" font-weight=\"bold\">Case 4</text>\n            </g>\n          </svg>\n        ",
      "curatedHint": "By the Division Algorithm, every integer n is either even (n = 2k) or odd (n = 2k + 1). Examine each case separately.",
      "progressiveHints": {
        "attempt1": "Partition the set of all integers ℤ into two exhaustive cases based on parity.",
        "attempt2": "Case 1: n is even (n = 2k). Substitute into n(n + 1). Is the product divisible by 2?",
        "attempt3": "Case 2: n is odd (n = 2k + 1). Then what is (n + 1)? Substitute both into n(n + 1).",
        "attempt4": "In Case 1, n(n+1) = 2k(2k+1) = 2[k(2k+1)], which is even. In Case 2, (n+1) = 2k+2 = 2(k+1), so n(n+1) = (2k+1)2(k+1) = 2[(2k+1)(k+1)], which is also even. Since every integer is either even or odd, the theorem holds universally."
      },
      "curatedSolution": {
        "technique": "Proof by Exhaustive Cases (Division Algorithm Partition)",
        "setup": "Let n ∈ ℤ. By the Division Algorithm with divisor 2, every integer n is uniquely expressed as either n = 2k or n = 2k + 1 for some k ∈ ℤ. The cases are disjoint and exhaustive.",
        "steps": "1. Case 1: n is even.\n   Then n = 2k for some integer k.\n   The product is n(n + 1) = 2k(2k + 1) = 2[k(2k + 1)].\n   Since k(2k + 1) is an integer, n(n + 1) is divisible by 2, hence EVEN.\n2. Case 2: n is odd.\n   Then n = 2k + 1 for some integer k.\n   Then n + 1 = (2k + 1) + 1 = 2k + 2 = 2(k + 1).\n   The product is n(n + 1) = (2k + 1) × 2(k + 1) = 2[(2k + 1)(k + 1)].\n   Since (2k + 1)(k + 1) is an integer, n(n + 1) is divisible by 2, hence EVEN.",
        "conclusion": "Since every integer n is either even or odd, and in both cases n(n + 1) is even, the statement holds universally for all n ∈ ℤ.",
        "commonMistakes": "Failing to explain why the two cases partition all integers; testing specific numbers instead of algebraic variables."
      }
    }
  ]
};
