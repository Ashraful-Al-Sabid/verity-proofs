export default {
  "category": "Problem Solving Strategies",
  "title": "Parity",
  "img": "assets/parity.png",
  "desc": "An even number is said to have even parity, and an odd number, odd parity. Despite its utmost simplicity, parity appears in the solution of the most difficult Olympiad problems.",
  "sections": "6 Sections",
  "challenges": "32 Challenges",
  "bannerLevel": "LEVEL 1",
  "bannerTitle": "Alternations & Invariants",
  "nodes": [
    {
      "top": 20,
      "left": 160,
      "active": true,
      "title": "What is Parity?",
      "sub": "The Even & The Odd",
      "desc": "An even number has even parity; an odd number has odd parity. Grouping into pairs of 2."
    },
    {
      "top": 115,
      "left": 60,
      "active": false,
      "title": "The Gear Paradox",
      "sub": "§1 · Alternations",
      "desc": "Eleven interlocked gears in a ring: can they all rotate simultaneously?"
    },
    {
      "top": 210,
      "left": 180,
      "active": false,
      "title": "Knight Alternations",
      "sub": "Chessboard Bipartitions",
      "desc": "Every move of a chess knight toggles square color. Knight returns to a1."
    },
    {
      "top": 305,
      "left": 60,
      "active": false,
      "title": "The 63-Step Tour",
      "sub": "Proof of Impossibility",
      "desc": "Why can't a knight visit all 64 squares and finish on h8?"
    },
    {
      "top": 400,
      "left": 180,
      "active": false,
      "title": "Partition into Pairs",
      "sub": "§2 · Domino Tilings",
      "desc": "Domino tilings and the 5×5 checkerboard odd-area contradiction."
    },
    {
      "top": 495,
      "left": 70,
      "active": false,
      "title": "Odd & Even Sums",
      "sub": "§3 · Addition Parity",
      "desc": "Can ten 1, 3, or 5-ruble bills sum to 25? Parity under addition."
    }
  ],
  "problems": [
    {
      "id": "parity_deck0",
      "badge": "LEARNING DECK · §1 WHAT IS PARITY?",
      "category": "Parity: The Even & The Odd",
      "title": "What is Parity? (The Five Odd Numbers Paradox)",
      "text": "An even number is said to have even parity, and an odd number, odd parity.\n\nAt its heart, parity asks: can a set of objects be partitioned into pairs with none left over? If yes, it is even (2k). If exactly one is left over, it is odd (2k + 1).\n\nWarm-up Challenge: Can you find five odd numbers whose sum is 100? Try it, and explain why or why not using mathematical parity.",
      "visual": "\n          <svg viewBox=\"0 0 340 130\" class=\"exercise-svg-diagram\">\n            <g transform=\"translate(20, 20)\">\n              <rect x=\"0\" y=\"10\" width=\"55\" height=\"55\" rx=\"10\" fill=\"#fff7ed\" stroke=\"#ea580c\" stroke-width=\"2\"/>\n              <text x=\"27\" y=\"42\" text-anchor=\"middle\" fill=\"#ea580c\" font-size=\"14\" font-weight=\"bold\">(O + O)</text>\n              <text x=\"27\" y=\"80\" text-anchor=\"middle\" fill=\"#64748b\" font-size=\"11\" font-weight=\"600\">= Even</text>\n\n              <text x=\"70\" y=\"45\" text-anchor=\"middle\" fill=\"#94a3b8\" font-size=\"18\">+</text>\n\n              <rect x=\"85\" y=\"10\" width=\"55\" height=\"55\" rx=\"10\" fill=\"#fff7ed\" stroke=\"#ea580c\" stroke-width=\"2\"/>\n              <text x=\"112\" y=\"42\" text-anchor=\"middle\" fill=\"#ea580c\" font-size=\"14\" font-weight=\"bold\">(O + O)</text>\n              <text x=\"112\" y=\"80\" text-anchor=\"middle\" fill=\"#64748b\" font-size=\"11\" font-weight=\"600\">= Even</text>\n\n              <text x=\"155\" y=\"45\" text-anchor=\"middle\" fill=\"#94a3b8\" font-size=\"18\">+</text>\n\n              <rect x=\"170\" y=\"10\" width=\"55\" height=\"55\" rx=\"10\" fill=\"#fee2e2\" stroke=\"#dc2626\" stroke-width=\"2\"/>\n              <text x=\"197\" y=\"42\" text-anchor=\"middle\" fill=\"#dc2626\" font-size=\"14\" font-weight=\"bold\">O</text>\n              <text x=\"197\" y=\"80\" text-anchor=\"middle\" fill=\"#64748b\" font-size=\"11\" font-weight=\"600\">= Odd</text>\n\n              <text x=\"240\" y=\"45\" text-anchor=\"middle\" fill=\"#0f172a\" font-size=\"18\">=</text>\n\n              <rect x=\"255\" y=\"10\" width=\"55\" height=\"55\" rx=\"10\" fill=\"#fef2f2\" stroke=\"#991b1b\" stroke-width=\"2\"/>\n              <text x=\"282\" y=\"42\" text-anchor=\"middle\" fill=\"#991b1b\" font-size=\"14\" font-weight=\"bold\">ODD</text>\n              <text x=\"282\" y=\"80\" text-anchor=\"middle\" fill=\"#ef4444\" font-size=\"11\" font-weight=\"700\">≠ 100</text>\n            </g>\n          </svg>\n        ",
      "curatedHint": "Any sum of two odd numbers is even (Odd + Odd = Even). Group the five numbers into pairs and look at the parity of their sum.",
      "progressiveHints": {
        "attempt1": "What is the sum of any two odd numbers? (e.g. 1+3=4, 5+7=12). Is it even or odd?",
        "attempt2": "Pair up the first four numbers: (odd + odd) + (odd + odd) = even + even = even. Now add the fifth odd number: even + odd = ?",
        "attempt3": "The sum of any five odd numbers must always be an ODD number. Now look at 100: is 100 even or odd?",
        "attempt4": "Since the sum of 5 odd numbers is strictly odd, and 100 is even, an odd number can never equal an even number. This is a rigorous proof by contradiction."
      },
      "curatedSolution": {
        "technique": "Addition Parity Invariance & Proof by Contradiction",
        "setup": "Let x₁, x₂, x₃, x₄, x₅ be five odd integers. We test whether x₁ + x₂ + x₃ + x₄ + x₅ = 100 is solvable.",
        "steps": "1. By definition, every odd integer x is congruent to 1 modulo 2: x ≡ 1 (mod 2).\n2. Summing all five odd integers modulo 2:\n   x₁ + x₂ + x₃ + x₄ + x₅ ≡ 1 + 1 + 1 + 1 + 1 = 5 ≡ 1 (mod 2).\n3. Therefore, the sum of any five odd integers is strictly ODD.\n4. But the target value is 100, which is an EVEN integer: 100 ≡ 0 (mod 2).",
        "conclusion": "Because 1 ≢ 0 (mod 2), an odd sum can never equal the even number 100. It is impossible to find five odd numbers whose sum is 100. The impossibility stems from a fundamental contradiction in the parity of the set itself.",
        "commonMistakes": "Testing specific examples (like 19+21+...) without proving the general parity property for all odd numbers."
      }
    },
    {
      "id": "parity_p0",
      "badge": "§1 · PROBLEM 1 OF 6",
      "category": "Parity: Alternations",
      "title": "The 11-Gear Chain Paradox",
      "text": "Eleven gears are placed on a plane, arranged in a closed circular chain so each gear meshes with its two neighbors (Figure 6). Can all the gears rotate simultaneously?",
      "visual": "\n          <img src=\"assets/gears-11.png\" alt=\"Figure 6: Eleven gears arranged in a closed chain\" class=\"exercise-img-diagram\" />\n        ",
      "curatedHint": "Two meshing gears must turn in opposite directions. Pick one gear to rotate clockwise, and follow the sequence around the ring.",
      "progressiveHints": {
        "attempt1": "Consider what happens to adjacent rotational directions in any mechanical mesh. Do they rotate in the same direction or opposite directions?",
        "attempt2": "Number the gears sequentially 1 through 11. If Gear 1 rotates clockwise, what can you deduce about all the odd-numbered gears?",
        "attempt3": "Notice that Gear 1 and Gear 11 are both odd-numbered gears. But in a closed ring, Gear 11 meshes directly back into Gear 1. What does this force?",
        "attempt4": "Assume by contradiction simultaneous rotation is possible. Let sign(CW)=+1, sign(CCW)=-1. Then sign(i+1) = -sign(i). This gives sign(11) = (-1)^10 * sign(1) = +sign(1). But meshing requires sign(11) = -sign(1), yielding +1 = -1, an impossibility."
      },
      "curatedSolution": {
        "technique": "Alternation Invariant & Proof by Contradiction",
        "setup": "Let 11 gears be indexed in circular order 1, 2, ..., 11, where gear i meshes with gear i+1, and gear 11 meshes with gear 1. Assume simultaneous rotation is possible.",
        "steps": "1. When two gears mesh, their linear tangential velocity at the pitch point must match, forcing adjacent gears to rotate in opposite directions (clockwise vs counter-clockwise).\n2. Assign +1 to clockwise rotation and -1 to counter-clockwise rotation. For any adjacent pair, sign(gear_{i+1}) = -sign(gear_i).\n3. Without loss of generality, assume gear 1 rotates clockwise (+1). By mathematical induction, gear k rotates with direction sign(k) = (-1)^{k-1}.\n4. For gear 11 (k=11), sign(11) = (-1)^{10} = +1 (clockwise).",
        "conclusion": "Because the chain is closed, gear 11 meshes with gear 1. Meshing demands sign(1) = -sign(11) = -1. But we established sign(1) = +1, which yields the contradiction +1 = -1. Therefore, all 11 gears cannot rotate simultaneously.",
        "commonMistakes": "Assuming gear tooth counts matter for direction (tooth counts alter angular speed, not rotational orientation); omitting the proof that odd gears are in-phase."
      }
    },
    {
      "id": "parity_deck1",
      "badge": "LEARNING DECK · CHESSBOARD PARITY",
      "category": "Parity: Alternation of Colors",
      "title": "The Knight's Color Alternation (Returning to a1)",
      "text": "On a chessboard, squares alternate colors: Black and White.\n\nEvery move of a chess knight jumps to an opposite-colored square (Black → White → Black → White...). Thus, every single knight move alternates color parity!\n\nChallenge: On a chessboard, a knight starts from square a1, and returns there after making several moves. Prove that the knight must make an even number of moves.",
      "visual": "\n          <svg viewBox=\"0 0 320 140\" class=\"exercise-svg-diagram\">\n            <g transform=\"translate(60, 20)\">\n              <rect x=\"0\" y=\"20\" width=\"50\" height=\"50\" rx=\"8\" fill=\"#1e293b\"/>\n              <text x=\"25\" y=\"50\" text-anchor=\"middle\" fill=\"#ffffff\" font-size=\"12\" font-weight=\"bold\">a1 (B)</text>\n\n              <path d=\"M 60,45 L 110,45\" stroke=\"#f97316\" stroke-width=\"2.5\" stroke-dasharray=\"4 4\" marker-end=\"url(#arrow)\"/>\n              <text x=\"85\" y=\"35\" text-anchor=\"middle\" fill=\"#f97316\" font-size=\"10\" font-weight=\"700\">Move 1</text>\n\n              <rect x=\"120\" y=\"20\" width=\"50\" height=\"50\" rx=\"8\" fill=\"#f8fafc\" stroke=\"#cbd5e1\" stroke-width=\"2\"/>\n              <text x=\"145\" y=\"50\" text-anchor=\"middle\" fill=\"#0f172a\" font-size=\"12\" font-weight=\"bold\">White</text>\n\n              <path d=\"M 180,45 L 230,45\" stroke=\"#3b82f6\" stroke-width=\"2.5\" stroke-dasharray=\"4 4\"/>\n              <text x=\"205\" y=\"35\" text-anchor=\"middle\" fill=\"#3b82f6\" font-size=\"10\" font-weight=\"700\">Move 2</text>\n\n              <rect x=\"240\" y=\"20\" width=\"50\" height=\"50\" rx=\"8\" fill=\"#1e293b\"/>\n              <text x=\"265\" y=\"50\" text-anchor=\"middle\" fill=\"#ffffff\" font-size=\"12\" font-weight=\"bold\">Black</text>\n            </g>\n          </svg>\n        ",
      "curatedHint": "Square a1 has a fixed color. What color is the knight on after 1 move? 2 moves? 3 moves? k moves?",
      "progressiveHints": {
        "attempt1": "At each move, a knight jumps from a square of one color to a square of the opposite color.",
        "attempt2": "After an odd number of moves (1, 3, 5...), what color square is the knight on relative to where it started?",
        "attempt3": "After any odd number of moves, the knight is on a square of the opposite color. After any even number of moves, it is on a square of the same color.",
        "attempt4": "Square a1 is the starting square. To return to a1 (the same square, hence the same color), the knight must make an even number of color alternations. Therefore, the total number of moves must be strictly even."
      },
      "curatedSolution": {
        "technique": "Bipartite Graph Alternation & Cycle Parity",
        "setup": "A chessboard is a bipartite graph where edges exist only between squares of opposite colors (Black and White). Square a1 is a black square.",
        "steps": "1. Let square(0) = a1 be the black starting square.\n2. Every valid knight move transitions between Black and White squares: Black ↔ White.\n3. By induction, after k moves, if k is odd, the knight is on a White square; if k is even, the knight is on a Black square.\n4. The knight returns to square a1, which is a Black square.",
        "conclusion": "Because a1 has the same color as the starting square, the number of transitions k must be an even integer. Therefore, any closed loop made by a knight consists of an even number of moves.",
        "commonMistakes": "Focusing on coordinate distances instead of using the bipartite coloring alternation."
      }
    },
    {
      "id": "parity_p1",
      "badge": "§1 · PROBLEM 2 OF 6",
      "category": "Parity: Proof of Impossibility",
      "title": "The 63-Step Knight's Tour from a1 to h8",
      "text": "Can a knight start at square a1 of an 8×8 chessboard, visit each of the remaining 63 squares exactly once, and finish on square h8?",
      "visual": "\n          <svg viewBox=\"0 0 320 180\" class=\"exercise-svg-diagram\">\n            <g transform=\"translate(100, 20)\">\n              <rect width=\"120\" height=\"120\" rx=\"8\" fill=\"#f8fafc\" stroke=\"#cbd5e1\" stroke-width=\"2\"/>\n              <rect x=\"0\" y=\"105\" width=\"15\" height=\"15\" fill=\"#f97316\" rx=\"2\"/>\n              <text x=\"7\" y=\"116\" text-anchor=\"middle\" fill=\"#ffffff\" font-size=\"8\" font-weight=\"bold\">a1</text>\n              <rect x=\"105\" y=\"0\" width=\"15\" height=\"15\" fill=\"#f97316\" rx=\"2\"/>\n              <text x=\"112\" y=\"11\" text-anchor=\"middle\" fill=\"#ffffff\" font-size=\"8\" font-weight=\"bold\">h8</text>\n              <path d=\"M 15,105 Q 60,60 105,15\" stroke=\"#ea580c\" stroke-width=\"2.5\" stroke-dasharray=\"4 4\" fill=\"none\"/>\n            </g>\n          </svg>\n        ",
      "curatedHint": "Color the chessboard with standard black and white squares. How does the square's color change with every single knight move?",
      "progressiveHints": {
        "attempt1": "Every move of a knight changes the parity of the coordinate sum (x + y). What does this mean for the color of the square the knight visits at each step?",
        "attempt2": "To visit all 64 squares starting from a1, exactly how many moves must the knight make? Is that number even or odd?",
        "attempt3": "After 63 moves (an odd number), what color square must the knight occupy compared to its starting square a1? Check the colors of a1 and h8.",
        "attempt4": "Square a1 is black ((1+1) is even). Square h8 is black ((8+8) is even). But an odd sequence of 63 color-toggling moves must end on a white square. Hence finishing on h8 is strictly impossible."
      },
      "curatedSolution": {
        "technique": "Bipartite Graph Parity & Color Invariance",
        "setup": "Consider standard 8×8 chessboard coloring where square (x, y) is black if x + y is even, and white if x + y is odd. Square a1 is (1, 1) [black] and square h8 is (8, 8) [black].",
        "steps": "1. A knight move consists of (±1, ±2) or (±2, ±1). The change in coordinate sum Δ(x + y) is always ±1 or ±3, which is strictly ODD.\n2. Therefore, every single move transitions the knight between squares of opposite colors (Black ↔ White).\n3. A tour visiting all 64 squares exactly once begins at square 1 and ends at square 64, comprising exactly 64 - 1 = 63 moves.\n4. By parity of transitions, after any odd number of moves k, the knight must be on a square of the OPPOSITE color from its starting square.",
        "conclusion": "Starting on black square a1, move 63 must land on a white square. However, h8 is a black square. This parity contradiction proves no such knight's tour can finish on h8.",
        "commonMistakes": "Focusing on geometric board diagonals instead of bipartite coloring; confusing number of squares visited (64) with number of moves made (63)."
      }
    },
    {
      "id": "parity_p3",
      "badge": "§2 · PROBLEM 3 OF 6",
      "category": "Parity: Partitioning into Pairs",
      "title": "The 5×5 Domino Coverage Paradox",
      "text": "Can a 5×5 square checkerboard be completely tiled without overlaps using standard 1×2 dominoes?",
      "visual": "\n          <svg viewBox=\"0 0 320 170\" class=\"exercise-svg-diagram\">\n            <g transform=\"translate(100, 15)\">\n              <rect width=\"110\" height=\"110\" rx=\"6\" fill=\"#f8fafc\" stroke=\"#cbd5e1\" stroke-width=\"2\"/>\n              <rect x=\"0\" y=\"0\" width=\"22\" height=\"22\" fill=\"#fed7aa\" stroke=\"#e2e8f0\"/><rect x=\"22\" y=\"0\" width=\"22\" height=\"22\" fill=\"#ffffff\" stroke=\"#e2e8f0\"/><rect x=\"44\" y=\"0\" width=\"22\" height=\"22\" fill=\"#fed7aa\" stroke=\"#e2e8f0\"/><rect x=\"66\" y=\"0\" width=\"22\" height=\"22\" fill=\"#ffffff\" stroke=\"#e2e8f0\"/><rect x=\"88\" y=\"0\" width=\"22\" height=\"22\" fill=\"#fed7aa\" stroke=\"#e2e8f0\"/><rect x=\"0\" y=\"22\" width=\"22\" height=\"22\" fill=\"#ffffff\" stroke=\"#e2e8f0\"/><rect x=\"22\" y=\"22\" width=\"22\" height=\"22\" fill=\"#fed7aa\" stroke=\"#e2e8f0\"/><rect x=\"44\" y=\"22\" width=\"22\" height=\"22\" fill=\"#ffffff\" stroke=\"#e2e8f0\"/><rect x=\"66\" y=\"22\" width=\"22\" height=\"22\" fill=\"#fed7aa\" stroke=\"#e2e8f0\"/><rect x=\"88\" y=\"22\" width=\"22\" height=\"22\" fill=\"#ffffff\" stroke=\"#e2e8f0\"/><rect x=\"0\" y=\"44\" width=\"22\" height=\"22\" fill=\"#fed7aa\" stroke=\"#e2e8f0\"/><rect x=\"22\" y=\"44\" width=\"22\" height=\"22\" fill=\"#ffffff\" stroke=\"#e2e8f0\"/><rect x=\"44\" y=\"44\" width=\"22\" height=\"22\" fill=\"#fed7aa\" stroke=\"#e2e8f0\"/><rect x=\"66\" y=\"44\" width=\"22\" height=\"22\" fill=\"#ffffff\" stroke=\"#e2e8f0\"/><rect x=\"88\" y=\"44\" width=\"22\" height=\"22\" fill=\"#fed7aa\" stroke=\"#e2e8f0\"/><rect x=\"0\" y=\"66\" width=\"22\" height=\"22\" fill=\"#ffffff\" stroke=\"#e2e8f0\"/><rect x=\"22\" y=\"66\" width=\"22\" height=\"22\" fill=\"#fed7aa\" stroke=\"#e2e8f0\"/><rect x=\"44\" y=\"66\" width=\"22\" height=\"22\" fill=\"#ffffff\" stroke=\"#e2e8f0\"/><rect x=\"66\" y=\"66\" width=\"22\" height=\"22\" fill=\"#fed7aa\" stroke=\"#e2e8f0\"/><rect x=\"88\" y=\"66\" width=\"22\" height=\"22\" fill=\"#ffffff\" stroke=\"#e2e8f0\"/><rect x=\"0\" y=\"88\" width=\"22\" height=\"22\" fill=\"#fed7aa\" stroke=\"#e2e8f0\"/><rect x=\"22\" y=\"88\" width=\"22\" height=\"22\" fill=\"#ffffff\" stroke=\"#e2e8f0\"/><rect x=\"44\" y=\"88\" width=\"22\" height=\"22\" fill=\"#fed7aa\" stroke=\"#e2e8f0\"/><rect x=\"66\" y=\"88\" width=\"22\" height=\"22\" fill=\"#ffffff\" stroke=\"#e2e8f0\"/><rect x=\"88\" y=\"88\" width=\"22\" height=\"22\" fill=\"#fed7aa\" stroke=\"#e2e8f0\"/>\n            </g>\n          </svg>\n        ",
      "curatedHint": "Calculate the total area (number of unit squares) of the 5×5 board and compare it to the area covered by each 1×2 domino.",
      "progressiveHints": {
        "attempt1": "How many unit squares does a single 1×2 domino cover? If you use k dominoes, what must be true about the total number of squares covered?",
        "attempt2": "Calculate the total number of unit squares on a 5×5 board. Is 25 divisible by 2?",
        "attempt3": "Any region perfectly tiled by dominoes can be partitioned into pairs of unit squares. Can a set of 25 elements be partitioned into pairs?",
        "attempt4": "Each domino covers exactly 2 squares. Thus k dominoes cover 2k squares, which is strictly even. But 5×5 = 25 is odd. 2k = 25 has no integer solution."
      },
      "curatedSolution": {
        "technique": "Partitioning into Pairs & Parity Area Measure",
        "setup": "A 5×5 checkerboard contains 5 × 5 = 25 unit squares. Each domino has dimensions 1×2 and covers exactly 2 adjacent unit squares.",
        "steps": "1. Assume the board can be covered by k dominoes without overlaps or gaps.\n2. Because the dominoes form a partition of the board's area, the total area must equal the sum of the areas of the individual tiles.\n3. Total Area = 2 × k = 2k, which is an EVEN integer for any integer k.\n4. But the actual area of the board is 5 × 5 = 25, which is an ODD integer.",
        "conclusion": "The equation 2k = 25 has no integer solution since 25 is not divisible by 2. Thus, at least one unit square must always remain uncovered.",
        "commonMistakes": "Relying on complex coloring arguments when a simple area parity proof suffices; assuming rotations might allow half-square overlaps."
      }
    },
    {
      "id": "parity_p2",
      "badge": "§3 · PROBLEM 4 OF 6",
      "category": "Parity: Odd & Even Arithmetics",
      "title": "The 25-Ruble Bill Riddle",
      "text": "Can a cashier make change of a 25-ruble bill using in all exactly ten bills, each having a value of 1, 3, or 5 rubles?",
      "visual": "\n          <svg viewBox=\"0 0 320 160\" class=\"exercise-svg-diagram\">\n            <g transform=\"translate(50, 30)\">\n              <rect x=\"0\" y=\"10\" width=\"90\" height=\"50\" rx=\"8\" fill=\"#fff7ed\" stroke=\"#fb923c\" stroke-width=\"2\"/>\n              <text x=\"45\" y=\"40\" text-anchor=\"middle\" fill=\"#ea580c\" font-size=\"16\" font-weight=\"bold\">25 ₽</text>\n              <text x=\"110\" y=\"42\" text-anchor=\"middle\" fill=\"#94a3b8\" font-size=\"20\">=</text>\n              <rect x=\"130\" y=\"10\" width=\"130\" height=\"50\" rx=\"8\" fill=\"#f8fafc\" stroke=\"#94a3b8\" stroke-width=\"1.5\" stroke-dasharray=\"3 3\"/>\n              <text x=\"195\" y=\"40\" text-anchor=\"middle\" fill=\"#475569\" font-size=\"12\" font-weight=\"600\">10 bills of (1, 3, 5) ?</text>\n            </g>\n          </svg>\n        ",
      "curatedHint": "Inspect the parity of each available bill value (1, 3, 5) and what happens when you sum an even number of odd numbers.",
      "progressiveHints": {
        "attempt1": "What do the denominations 1, 3, and 5 rubles all have in common regarding parity?",
        "attempt2": "If you add two odd numbers, the sum is even. What is the parity of the sum of ten odd numbers?",
        "attempt3": "The total requested amount is 25 rubles. Is 25 an even or an odd integer? Compare this with the parity of 10 odd numbers.",
        "attempt4": "Any sum of 10 odd integers can be written as the sum of 5 pairs of odd integers. Each pair is even, so the total sum is strictly even. Since 25 is odd, an even sum cannot equal 25."
      },
      "curatedSolution": {
        "technique": "Addition Parity Invariance (Modulo 2 Arithmetic)",
        "setup": "Let x1, x2, ..., x10 be the values of the ten bills. Each xi ∈ {1, 3, 5}. We are asked if sum_{i=1}^{10} xi = 25 is solvable in integers.",
        "steps": "1. Notice that every allowable bill is odd: 1 ≡ 1 (mod 2), 3 ≡ 1 (mod 2), 5 ≡ 1 (mod 2).\n2. The parity of the sum of n integers is congruent to the sum of their parities modulo 2.\n3. sum_{i=1}^{10} xi ≡ sum_{i=1}^{10} 1 ≡ 10 ≡ 0 (mod 2).\n4. Therefore, any combination of ten such bills must yield an EVEN total.",
        "conclusion": "The target value is 25, which is ODD (25 ≡ 1 mod 2). Because 0 ≠ 1 mod 2, it is fundamentally impossible to make change of 25 rubles with 10 odd bills.",
        "commonMistakes": "Attempting trial-and-error arithmetic with specific combinations; forgetting to state that 10 is an even number of odd addends."
      }
    }
  ]
};
