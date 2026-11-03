export default {
  "category": "Problem Solving Strategies",
  "title": "Pigeonhole Principles",
  "img": "assets/pigeonhole.png",
  "desc": "If n+1 pigeons occupy n pigeonholes, at least one hole must contain more than one pigeon. Master the Dirichlet principle for capacity bounds, geometry, remainder classes, and Ramsey graph theory.",
  "sections": "4 Sections",
  "challenges": "30 Challenges",
  "bannerLevel": "LEVEL 1",
  "bannerTitle": "Dirichlet Bounds & Existence",
  "nodes": [
    {
      "top": 25,
      "left": 170,
      "active": true,
      "title": "The Hair Count Paradox",
      "sub": "Basic Dirichlet Principle",
      "desc": "In any city of 8 million, prove there exist two people with the exact same hair count."
    },
    {
      "top": 155,
      "left": 60,
      "active": false,
      "title": "Triangle Packing",
      "sub": "Geometric Partitions",
      "desc": "Five points placed inside a unit equilateral triangle: prove two are within distance ≤ 1/2."
    },
    {
      "top": 285,
      "left": 180,
      "active": false,
      "title": "The 6-Person Party",
      "sub": "Ramsey Graph Theory R(3,3)",
      "desc": "Show that among any 6 people, there are either 3 mutual friends or 3 mutual strangers."
    },
    {
      "top": 415,
      "left": 70,
      "active": false,
      "title": "Divisible Prefix Sums",
      "sub": "Remainder Congruences",
      "desc": "Prove any sequence of n integers contains a contiguous subsegment whose sum is divisible by n."
    }
  ],
  "problems": [
    {
      "id": "pigeonhole_concept",
      "category": "Pigeonhole: The Big Idea",
      "title": "What is the Pigeonhole Principle? (Socks in the Dark)",
      "text": "If you put more pigeons than holes, some hole gets at least two pigeons. It sounds obvious; the real skill is spotting what the \"pigeons\" and the \"holes\" are.\n\nA complete pigeonhole answer has two halves: show that your number is enough, and show that a smaller number is not.\n\nWarm-up: A drawer holds many red, blue and green socks, all mixed. In the dark, how many socks must you take out to be sure of having two of the same colour? Prove both halves.",
      "visual": "\n    <svg viewBox=\"0 0 320 130\" class=\"exercise-svg-diagram\">\n      <g transform=\"translate(40, 20)\">\n        <rect x=\"0\" y=\"40\" width=\"70\" height=\"55\" rx=\"8\" fill=\"#fee2e2\" stroke=\"#ef4444\" stroke-width=\"1.5\"/>\n        <text x=\"35\" y=\"73\" text-anchor=\"middle\" fill=\"#b91c1c\" font-size=\"11\" font-weight=\"bold\">Red</text>\n        <rect x=\"85\" y=\"40\" width=\"70\" height=\"55\" rx=\"8\" fill=\"#dbeafe\" stroke=\"#3b82f6\" stroke-width=\"1.5\"/>\n        <text x=\"120\" y=\"73\" text-anchor=\"middle\" fill=\"#1d4ed8\" font-size=\"11\" font-weight=\"bold\">Blue</text>\n        <rect x=\"170\" y=\"40\" width=\"70\" height=\"55\" rx=\"8\" fill=\"#dcfce7\" stroke=\"#22c55e\" stroke-width=\"1.5\"/>\n        <text x=\"205\" y=\"73\" text-anchor=\"middle\" fill=\"#15803d\" font-size=\"11\" font-weight=\"bold\">Green</text>\n        <text x=\"120\" y=\"22\" text-anchor=\"middle\" fill=\"#0f172a\" font-size=\"12\" font-weight=\"bold\">How many socks guarantee a pair?</text>\n      </g>\n    </svg>\n  ",
      "curatedHint": "What are the pigeons here, and what are the holes?",
      "progressiveHints": {
        "attempt1": "Could 3 socks fail? Try to pick 3 socks with no matching pair.",
        "attempt2": "One red, one blue, one green has no pair, so 3 is not enough.",
        "attempt3": "With 4 socks and only 3 colours, drop each sock into its colour's box. What must happen?"
      },
      "curatedSolution": {
        "technique": "Pigeonhole Principle with a sharpness example",
        "setup": "Pigeons = socks drawn. Holes = the 3 colours.",
        "steps": "1. 3 socks are not enough: red, blue, green contains no pair.\n2. Take 4 socks and place each into one of the 3 colour boxes.\n3. If every box held at most 1 sock, there would be at most 3 socks, but there are 4.\n4. So some box holds 2 socks: a matching pair.",
        "conclusion": "4 is the smallest number of socks that guarantees a matching pair.",
        "commonMistakes": "Proving only that 4 works and forgetting to show that 3 can fail; answering 2 or 6."
      }
    },
    {
      "id": "pigeonhole_p0",
      "badge": "PIGEONHOLE · PROBLEM 1 OF 4",
      "category": "Pigeonhole: Capacity Bounds",
      "title": "The London Hair Count Paradox",
      "text": "A human head has at most 150,000 hairs. London has a population of over 8 million people. Does there exist two people in London with the exact same number of hairs?",
      "visual": "\n          <svg viewBox=\"0 0 320 160\" class=\"exercise-svg-diagram\">\n            <g transform=\"translate(60, 20)\">\n              <rect x=\"0\" y=\"10\" width=\"80\" height=\"70\" rx=\"8\" fill=\"#fff7ed\" stroke=\"#ea580c\" stroke-width=\"1.5\"/>\n              <text x=\"40\" y=\"38\" text-anchor=\"middle\" fill=\"#ea580c\" font-size=\"11\" font-weight=\"bold\">Pigeonholes</text>\n              <text x=\"40\" y=\"60\" text-anchor=\"middle\" fill=\"#64748b\" font-size=\"10\">≤ 150,000 hairs</text>\n              <text x=\"100\" y=\"50\" text-anchor=\"middle\" fill=\"#94a3b8\" font-size=\"20\">&lt;</text>\n              <rect x=\"120\" y=\"10\" width=\"80\" height=\"70\" rx=\"8\" fill=\"#f0fdf4\" stroke=\"#16a34a\" stroke-width=\"1.5\"/>\n              <text x=\"160\" y=\"38\" text-anchor=\"middle\" fill=\"#16a34a\" font-size=\"11\" font-weight=\"bold\">Pigeons</text>\n              <text x=\"160\" y=\"60\" text-anchor=\"middle\" fill=\"#64748b\" font-size=\"10\">8,000,000 people</text>\n            </g>\n          </svg>\n        ",
      "curatedHint": "Identify what plays the role of 'pigeons' and what plays the role of 'pigeonholes'.",
      "progressiveHints": {
        "attempt1": "How many possible distinct hair counts can a human head have (from 0 up to 150,000)?",
        "attempt2": "There are 150,001 possible hair counts. How many people live in London? Compare the two numbers.",
        "attempt3": "Since 8,000,000 > 150,001, we have vastly more people (pigeons) than hair count categories (holes). What does the Dirichlet principle conclude?",
        "attempt4": "By the Pigeonhole Principle, if N items are put into k containers with N > k, at least one container must hold at least ⌈N/k⌉ items. Here 8,000,000 > 150,001, so at least two (in fact at least 53) people have identical hair counts."
      },
      "curatedSolution": {
        "technique": "Direct Pigeonhole Principle (Dirichlet Box Principle)",
        "setup": "Let P be the set of residents in London, with |P| > 8,000,000. Let H be the set of possible hair counts on a human head.",
        "steps": "1. The number of hairs on a human head is an integer ranging from 0 to 150,000 inclusive.\n2. Hence, the number of possible hair counts is |H| = 150,000 - 0 + 1 = 150,001 (the pigeonholes).\n3. Define a function f: P → H mapping each resident to their exact hair count.\n4. The domain has size |P| > 8,000,000, while the codomain has size |H| = 150,001.",
        "conclusion": "Because |P| > |H|, by the Pigeonhole Principle the function f cannot be injective. There exist distinct residents p1, p2 ∈ P such that f(p1) = f(p2). Thus, there exist two people with the exact same number of hairs.",
        "commonMistakes": "Forgetting 0 hairs (baldness) in counting pigeonholes; confusing the existential claim with an algorithmic way to find them."
      }
    },
    {
      "id": "pigeonhole_p1",
      "badge": "PIGEONHOLE · PROBLEM 2 OF 4",
      "category": "Pigeonhole: Geometric Partitions",
      "title": "Triangle Point Packing",
      "text": "Five points are placed inside an equilateral triangle of side length 1. Prove that at least two of the points are at a distance of at most 1/2 from each other.",
      "visual": "\n          <svg viewBox=\"0 0 320 160\" class=\"exercise-svg-diagram\">\n            <g transform=\"translate(110, 15)\">\n              <polygon points=\"50,5 5,95 95,95\" fill=\"#f8fafc\" stroke=\"#cbd5e1\" stroke-width=\"2\"/>\n              <polygon points=\"50,95 27.5,50 72.5,50\" fill=\"#fed7aa\" stroke=\"#ea580c\" stroke-dasharray=\"2 2\"/>\n              <circle cx=\"30\" cy=\"70\" r=\"3\" fill=\"#ea580c\"/>\n              <circle cx=\"45\" cy=\"80\" r=\"3\" fill=\"#ea580c\"/>\n              <circle cx=\"50\" cy=\"25\" r=\"3\" fill=\"#ea580c\"/>\n              <circle cx=\"70\" cy=\"75\" r=\"3\" fill=\"#ea580c\"/>\n              <circle cx=\"50\" cy=\"65\" r=\"3\" fill=\"#ea580c\"/>\n            </g>\n          </svg>\n        ",
      "curatedHint": "Divide the equilateral triangle of side 1 into smaller congruent equilateral triangles by connecting the midpoints of its three sides.",
      "progressiveHints": {
        "attempt1": "Connecting the midpoints of the sides of an equilateral triangle divides it into how many smaller triangles?",
        "attempt2": "It creates 4 smaller equilateral triangles, each with side length 1/2. How many points do we have to place?",
        "attempt3": "We have 5 points and 4 small triangles. By PHP, what must happen to at least one of the small triangles?",
        "attempt4": "At least one small triangle must contain at least 2 points. What is the maximum possible distance between any two points inside an equilateral triangle of side 1/2? The diameter is at most 1/2."
      },
      "curatedSolution": {
        "technique": "Geometric Pigeonhole Principle & Diameter Bounding",
        "setup": "Let T be an equilateral triangle of side length 1. Place 5 points S = {P1, ..., P5} inside or on the boundary of T.",
        "steps": "1. Connect the midpoints of the three edges of T. This partitions T into 4 congruent equilateral triangles, T1, T2, T3, T4, each of side length 1/2.\n2. Regard the 4 sub-triangles as pigeonholes, and the 5 points as pigeons.\n3. By the Pigeonhole Principle, since 5 > 4, at least one sub-triangle Tk must contain at least ⌈5/4⌉ = 2 points.\n4. For any convex set, the maximum distance between any two points (its diameter) is the maximum distance between its vertices.\n5. For an equilateral triangle of side 1/2, the distance between any two vertices is exactly 1/2. Thus diam(Tk) = 1/2.",
        "conclusion": "The two points falling into the same sub-triangle Tk satisfy dist(Pi, Pj) ≤ diam(Tk) = 1/2. This proves the claim rigorously.",
        "commonMistakes": "Asserting distance ≤ 1/2 without stating why the maximum distance within a sub-triangle equals its side length."
      }
    },
    {
      "id": "pigeonhole_p2",
      "badge": "PIGEONHOLE · PROBLEM 3 OF 4",
      "category": "Pigeonhole: Ramsey Graph Theory",
      "title": "The 6-Person Party Theorem",
      "text": "Prove that among any six people at a party, there are either three mutual acquaintances or three mutual strangers.",
      "visual": "\n          <svg viewBox=\"0 0 320 160\" class=\"exercise-svg-diagram\">\n            <g transform=\"translate(100, 15)\">\n              <circle cx=\"60\" cy=\"10\" r=\"6\" fill=\"#f97316\"/><circle cx=\"103.30127018922192\" cy=\"35\" r=\"6\" fill=\"#f97316\"/><circle cx=\"103.30127018922194\" cy=\"85\" r=\"6\" fill=\"#f97316\"/><circle cx=\"60\" cy=\"110\" r=\"6\" fill=\"#f97316\"/><circle cx=\"16.698729810778076\" cy=\"85.00000000000001\" r=\"6\" fill=\"#f97316\"/><circle cx=\"16.69872981077807\" cy=\"34.99999999999999\" r=\"6\" fill=\"#f97316\"/>\n              <line x1=\"60\" y1=\"10\" x2=\"103\" y2=\"35\" stroke=\"#3b82f6\" stroke-width=\"2\"/>\n              <line x1=\"60\" y1=\"10\" x2=\"103\" y2=\"85\" stroke=\"#3b82f6\" stroke-width=\"2\"/>\n              <line x1=\"60\" y1=\"10\" x2=\"60\" y2=\"110\" stroke=\"#3b82f6\" stroke-width=\"2\"/>\n              <line x1=\"103\" y1=\"35\" x2=\"103\" y2=\"85\" stroke=\"#3b82f6\" stroke-width=\"2\" stroke-dasharray=\"3 3\"/>\n            </g>\n          </svg>\n        ",
      "curatedHint": "Represent the people as 6 vertices of a complete graph. Pick one person A and look at their 5 relationships.",
      "progressiveHints": {
        "attempt1": "Person A has relationships with the other 5 people. Each relationship is either 'friend' (Blue) or 'stranger' (Orange). How many edges of the same color must meet at A?",
        "attempt2": "By PHP, out of 5 edges colored in 2 colors, at least ⌈5/2⌉ = 3 edges must have the same color. Assume without loss of generality A has 3 friends: B, C, D.",
        "attempt3": "Now look at the edges between B, C, and D. If any two of them are friends, what triangle do they form with A?",
        "attempt4": "If any pair (e.g. B and C) are friends, then {A, B, C} are 3 mutual friends. If NONE of {B, C, D} are friends, then B, C, and D must all be mutual strangers! Either way, a monochromatic triangle is guaranteed."
      },
      "curatedSolution": {
        "technique": "Ramsey Theory R(3,3) & Degree Partition Pigeonhole",
        "setup": "Model the 6 people as vertices V = {A, B, C, D, E, F} of complete graph K6. Color each edge Blue (friends) or Red (strangers).",
        "steps": "1. Select arbitrary vertex A. There are 5 edges incident to A: e(A, B), e(A, C), e(A, D), e(A, E), e(A, F).\n2. Partition these 5 edges into 2 color classes: Blue and Red.\n3. By the Pigeonhole Principle, since 5 = 2 × 2 + 1, at least ⌈5/2⌉ = 3 edges must share the same color.\n4. Without loss of generality, assume at least 3 edges are Blue, connecting A to B, C, and D.\n5. Now examine the edges of the triangle formed by {B, C, D}:\n   - Case 1: If any edge among B, C, D is Blue (say edge BC), then {A, B, C} forms a completely Blue triangle (3 mutual friends).\n   - Case 2: If no edge among B, C, D is Blue, then all three edges BC, CD, and DB must be Red. Then {B, C, D} forms a completely Red triangle (3 mutual strangers).",
        "conclusion": "In all exhaustive cases, there exists either a monochromatic Blue triangle or a monochromatic Red triangle. Thus R(3, 3) ≤ 6.",
        "commonMistakes": "Assuming acquaintance is transitive; failing to treat the two cases (Blue edge vs all Red edges) completely."
      }
    },
    {
      "id": "pigeonhole_p3",
      "badge": "PIGEONHOLE · PROBLEM 4 OF 4",
      "category": "Pigeonhole: Remainder Congruences",
      "title": "Divisible Contiguous Prefix Sums",
      "text": "Given any sequence of n integers a1, a2, ..., an, prove that there always exists a contiguous subsegment whose sum is divisible by n.",
      "visual": "\n          <svg viewBox=\"0 0 320 150\" class=\"exercise-svg-diagram\">\n            <g transform=\"translate(50, 30)\">\n              <rect width=\"220\" height=\"60\" rx=\"8\" fill=\"#f8fafc\" stroke=\"#cbd5e1\" stroke-width=\"1.5\"/>\n              <text x=\"110\" y=\"35\" text-anchor=\"middle\" fill=\"#0f172a\" font-size=\"13\" font-weight=\"bold\">Prefix Sums: S1, S2, ..., Sn (mod n)</text>\n            </g>\n          </svg>\n        ",
      "curatedHint": "Define the prefix sums S_k = a_1 + a_2 + ... + a_k for k = 1, 2, ..., n. What are their remainders modulo n?",
      "progressiveHints": {
        "attempt1": "Consider the n prefix sums S1, S2, ..., Sn. If any prefix sum has remainder 0 modulo n, what does that immediately show?",
        "attempt2": "If no prefix sum has remainder 0 mod n, how many possible remainders can they take? What are the allowed values?",
        "attempt3": "The allowed non-zero remainders are {1, 2, ..., n-1}, which has size n - 1. But you have n prefix sums! Apply PHP.",
        "attempt4": "By PHP, two prefix sums Si and Sj (with i < j) must share the same remainder mod n: Si ≡ Sj (mod n). Therefore, Sj - Si = a_{i+1} + ... + aj is divisible by n."
      },
      "curatedSolution": {
        "technique": "Prefix Sum Invariant & Modular Pigeonhole Principle",
        "setup": "Let a1, a2, ..., an be an arbitrary sequence of n integers. Define the prefix sums Sk = sum_{i=1}^k ai for each k ∈ {1, 2, ..., n}.",
        "steps": "1. There are n prefix sums: S1, S2, ..., Sn.\n2. Consider their remainders upon division by n: rk = Sk mod n, where rk ∈ {0, 1, ..., n-1}.\n3. Case 1: If any rk = 0 for some k, then Sk = a1 + a2 + ... + ak is already divisible by n, providing our contiguous subsegment.\n4. Case 2: If none of the prefix sums is divisible by n, then all n remainders must belong to the set {1, 2, ..., n-1}.\n5. The set {1, 2, ..., n-1} contains exactly n - 1 possible values (the pigeonholes).\n6. We have n prefix sums (the pigeons). By the Pigeonhole Principle, since n > n - 1, at least two prefix sums Si and Sj (with 1 ≤ i < j ≤ n) must have identical remainders: Si ≡ Sj (mod n).\n7. Then Sj - Si ≡ 0 (mod n), which means n divides (Sj - Si).\n8. But Sj - Si = (a1 + ... + aj) - (a1 + ... + ai) = a_{i+1} + a_{i+2} + ... + aj.",
        "conclusion": "The subsegment a_{i+1}, ..., aj is non-empty, contiguous, and its sum is divisible by n. This completes the proof for all n.",
        "commonMistakes": "Forgetting Case 1 where a single prefix sum is itself ≡ 0 mod n; indexing subsegment elements incorrectly."
      }
    }
  ]
};
