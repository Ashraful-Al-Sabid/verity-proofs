export default {
  "category": "Problem Solving Strategies",
  "title": "Invariant",
  "img": "assets/invariant.png",
  "desc": "A quantity or property that remains conserved throughout an arbitrary sequence of allowable operations. Uncover fixed algebraic invariants and strictly decreasing monovariants to prove reachability and game outcomes.",
  "sections": "4 Sections",
  "challenges": "28 Challenges",
  "bannerLevel": "LEVEL 1",
  "bannerTitle": "Conserved Quantities & Monovariants",
  "nodes": [
    {
      "top": 25,
      "left": 170,
      "active": true,
      "title": "The Chameleon Cycle",
      "sub": "Modulo 3 Invariants",
      "desc": "13 red, 15 green, 17 blue chameleons meet pairwise. Discover why they can never all become one color."
    },
    {
      "top": 155,
      "left": 60,
      "active": false,
      "title": "Blackboard Differences",
      "sub": "Sum Parity Conservation",
      "desc": "Erasing pairs (a, b) and writing |a - b|: discover which final numbers are unreachable."
    },
    {
      "top": 285,
      "left": 180,
      "active": false,
      "title": "The Coin-Flip Circle",
      "sub": "Odd State Invariants",
      "desc": "Flipping four consecutive coins in a circle: prove the invariant that forbids all-heads."
    },
    {
      "top": 415,
      "left": 70,
      "active": false,
      "title": "Monovariants & Descent",
      "sub": "Finiteness & Termination",
      "desc": "Using strictly decreasing bounded quantities to prove complex algorithms must terminate."
    }
  ],
  "problems": [
    {
      "id": "invariant_concept",
      "category": "Invariant: The Big Idea",
      "title": "What is an Invariant? (Breaking a Chocolate Bar)",
      "text": "An invariant is something that never changes, no matter which allowed moves you make. When a problem asks \"Can we ever reach…?\", look for a quantity the moves cannot change, then compare the start with the goal.\n\nWarm-up: A chocolate bar is a 6 × 8 grid of 48 squares. In one break you take a single piece and snap it along a line into two pieces. How many breaks are needed to split the whole bar into 48 single squares? Prove that your answer does not depend on how you break it.",
      "visual": "\n    <svg viewBox=\"0 0 320 150\" class=\"exercise-svg-diagram\">\n      <g transform=\"translate(88, 12)\">\n        <rect x=\"0\" y=\"0\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"18\" y=\"0\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"36\" y=\"0\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"54\" y=\"0\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"72\" y=\"0\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"90\" y=\"0\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"108\" y=\"0\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"126\" y=\"0\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"0\" y=\"18\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"18\" y=\"18\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"36\" y=\"18\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"54\" y=\"18\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"72\" y=\"18\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"90\" y=\"18\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"108\" y=\"18\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"126\" y=\"18\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"0\" y=\"36\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"18\" y=\"36\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"36\" y=\"36\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"54\" y=\"36\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"72\" y=\"36\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"90\" y=\"36\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"108\" y=\"36\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"126\" y=\"36\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"0\" y=\"54\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"18\" y=\"54\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"36\" y=\"54\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"54\" y=\"54\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"72\" y=\"54\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"90\" y=\"54\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"108\" y=\"54\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"126\" y=\"54\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"0\" y=\"72\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"18\" y=\"72\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"36\" y=\"72\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"54\" y=\"72\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"72\" y=\"72\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"90\" y=\"72\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"108\" y=\"72\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"126\" y=\"72\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"0\" y=\"90\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"18\" y=\"90\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"36\" y=\"90\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"54\" y=\"90\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"72\" y=\"90\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"90\" y=\"90\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/><rect x=\"108\" y=\"90\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#a16207\" opacity=\"0.9\"/><rect x=\"126\" y=\"90\" width=\"17\" height=\"17\" rx=\"2\" fill=\"#92400e\" opacity=\"0.9\"/>\n        <path d=\"M 72,-4 L 72,112\" stroke=\"#ea580c\" stroke-width=\"2.5\" stroke-dasharray=\"4 3\"/>\n      </g>\n    </svg>\n  ",
      "curatedHint": "Don't track the shape of the pieces. Track how many pieces there are.",
      "progressiveHints": {
        "attempt1": "Before any break there is 1 piece. After one break? After two?",
        "attempt2": "Every break turns one piece into two, so the number of pieces goes up by exactly one, every time.",
        "attempt3": "You must finish with 48 pieces. How many +1 steps take you from 1 to 48?"
      },
      "curatedSolution": {
        "technique": "Counting Invariant (pieces − breaks never changes)",
        "setup": "Let P be the number of pieces and B the number of breaks made so far. Initially P = 1 and B = 0.",
        "steps": "1. A break takes one piece and splits it into two, so P increases by exactly 1 and B increases by exactly 1.\n2. Therefore P − B never changes: it is always 1 − 0 = 1.\n3. At the end P = 48, so B = P − 1 = 47.",
        "conclusion": "Every possible way of breaking uses exactly 47 breaks. The strategy does not matter, because P − B = 1 is invariant.",
        "commonMistakes": "Searching for a clever breaking order; assuming long breaks along the whole bar save breaks."
      }
    },
    {
      "id": "invariant_p0",
      "badge": "INVARIANTS · PROBLEM 1 OF 4",
      "category": "Invariant: Modulo 3 Congruence",
      "title": "The Three Chameleons of Camelot",
      "text": "An island has 13 red, 15 green, and 17 blue chameleons. Whenever two chameleons of different colors meet, they both change into the third color. Can all chameleons ever become monochromatic?",
      "visual": "\n          <svg viewBox=\"0 0 320 160\" class=\"exercise-svg-diagram\">\n            <g transform=\"translate(40, 30)\">\n              <circle cx=\"40\" cy=\"40\" r=\"28\" fill=\"#f87171\" opacity=\"0.9\"/>\n              <text x=\"40\" y=\"45\" text-anchor=\"middle\" fill=\"#ffffff\" font-weight=\"bold\">13 R</text>\n              <circle cx=\"120\" cy=\"40\" r=\"28\" fill=\"#4ade80\" opacity=\"0.9\"/>\n              <text x=\"120\" y=\"45\" text-anchor=\"middle\" fill=\"#ffffff\" font-weight=\"bold\">15 G</text>\n              <circle cx=\"200\" cy=\"40\" r=\"28\" fill=\"#60a5fa\" opacity=\"0.9\"/>\n              <text x=\"200\" y=\"45\" text-anchor=\"middle\" fill=\"#ffffff\" font-weight=\"bold\">17 B</text>\n            </g>\n          </svg>\n        ",
      "curatedHint": "Let R, G, B denote the counts of each color. Consider the differences between counts modulo 3 when two chameleons meet.",
      "progressiveHints": {
        "attempt1": "When one red and one green chameleon meet, R decreases by 1, G decreases by 1, and B increases by 2. How does (R - G) change?",
        "attempt2": "Compute (R - 1) - (G - 1). The difference R - G is completely unchanged! What happens to (R - B) modulo 3?",
        "attempt3": "Notice that (R - 1) - (B + 2) = R - B - 3 ≡ R - B (mod 3). Thus, all pairwise differences between counts modulo 3 are strictly invariant!",
        "attempt4": "Initially (R, G, B) = (13, 15, 17) ≡ (1, 0, 2) mod 3. All differences modulo 3 are non-zero. For all chameleons to be one color, two counts must be 0, requiring a difference of 0 mod 3. Since the invariant never equals 0 mod 3, it is impossible."
      },
      "curatedSolution": {
        "technique": "Modular Difference Invariant (Modulo 3)",
        "setup": "Let (R, G, B) be the number of red, green, and blue chameleons. Initial state is (13, 15, 17). Total population N = 45.",
        "steps": "1. When two chameleons of different colors meet (say Red and Green), the state changes: (R', G', B') = (R - 1, G - 1, B + 2).\n2. Look at the differences: R' - G' = (R - 1) - (G - 1) = R - G.\n3. Look at R' - B' = (R - 1) - (B + 2) = (R - B) - 3 ≡ (R - B) (mod 3).\n4. Therefore, the quantities (R - G) mod 3, (G - B) mod 3, and (B - R) mod 3 are strictly INVARIANT under any encounter.\n5. Initially, (13, 15, 17) ≡ (1, 0, 2) mod 3. The pairwise differences are: (R - G) ≡ 1, (G - B) ≡ 1, (B - R) ≡ 1 (mod 3). None are ≡ 0.",
        "conclusion": "For all chameleons to share a single color, two color populations must be 0 (e.g. (0, 0, 45)), which requires their difference to be 0 - 0 = 0 ≡ 0 (mod 3). Since our invariant is always 1 (mod 3), the monochromatic state is completely unreachable.",
        "commonMistakes": "Checking only total sums (which is conserved at 45); failing to compute the difference modulo 3."
      }
    },
    {
      "id": "invariant_p1",
      "badge": "INVARIANTS · PROBLEM 2 OF 4",
      "category": "Invariant: Operation Erasures",
      "title": "Blackboard Numbers from 1 to 1985",
      "text": "The numbers 1, 2, 3, ..., 1985 are written on a blackboard. We pick any two numbers a and b, erase them, and write |a - b|. We repeat until 1 number remains. Can that number be 0?",
      "visual": "\n          <svg viewBox=\"0 0 320 150\" class=\"exercise-svg-diagram\">\n            <g transform=\"translate(60, 25)\">\n              <rect width=\"200\" height=\"70\" rx=\"10\" fill=\"#1e293b\"/>\n              <text x=\"100\" y=\"42\" text-anchor=\"middle\" fill=\"#38bdf8\" font-size=\"14\" font-weight=\"bold\">1, 2, 3, ..., 1985</text>\n              <text x=\"100\" y=\"85\" text-anchor=\"middle\" fill=\"#94a3b8\" font-size=\"11\">Replace a, b with |a - b|</text>\n            </g>\n          </svg>\n        ",
      "curatedHint": "Consider the sum S of all numbers on the board. How does S change when a and b are replaced by |a - b|?",
      "progressiveHints": {
        "attempt1": "When you replace a and b with |a - b|, the old sum was S and the new sum is S' = S - (a + b) + |a - b|. Calculate the difference S - S'.",
        "attempt2": "Notice that (a + b) - |a - b| = 2 * min(a, b), which is always an EVEN integer! What does this mean for the parity of S?",
        "attempt3": "Because the sum changes by an even integer at every single erasure step, the parity of the sum S (mod 2) is invariant!",
        "attempt4": "The initial sum is S = 1985 * 1986 / 2 = 1985 * 993, which is the product of two odd numbers, hence ODD. The final single number must have the same parity as the initial sum (ODD). 0 is even, so 0 is impossible."
      },
      "curatedSolution": {
        "technique": "Sum Parity Invariant (Modulo 2 Conservation)",
        "setup": "Let S be the sum of all numbers currently on the blackboard. Initially, S = 1 + 2 + ... + 1985.",
        "steps": "1. The initial sum is given by the arithmetic formula S = (1985 × 1986) / 2 = 1985 × 993.\n2. Since 1985 is odd and 993 is odd, their product S is strictly ODD (S ≡ 1 mod 2).\n3. In each step, we choose two numbers a, b, erase them, and write |a - b|. The new sum is S' = S - (a + b) + |a - b|.\n4. Notice that (a + b) - |a - b| = 2 min(a, b) ≡ 0 (mod 2). Thus S' ≡ S (mod 2).\n5. Therefore, the parity of the sum of the numbers on the board is an INVARIANT.",
        "conclusion": "When only one number x remains, the sum is simply x. Because the parity of the sum was invariant and initially odd, x must be ODD. Since 0 is even (0 ≡ 0 mod 2), the final number cannot be 0.",
        "commonMistakes": "Assuming pairing consecutive numbers cancels them out (e.g. 2-1=1, 4-3=1, leaving a sum of ones); failing to check initial sum parity."
      }
    },
    {
      "id": "invariant_p2",
      "badge": "INVARIANTS · PROBLEM 3 OF 4",
      "category": "Invariant: Modular Cycles",
      "title": "The Circle of Ten Coins",
      "text": "Ten coins lie in a circle: 9 showing heads and 1 showing tails. In one move, you can flip any 4 consecutive coins. Can all coins ever show heads?",
      "visual": "\n          <svg viewBox=\"0 0 320 160\" class=\"exercise-svg-diagram\">\n            <circle cx=\"160\" cy=\"80\" r=\"50\" fill=\"none\" stroke=\"#e2e8f0\" stroke-dasharray=\"3 3\"/>\n            <circle cx=\"160\" cy=\"30\" r=\"11\" fill=\"#ea580c\"/>\n              <text x=\"160\" y=\"34\" text-anchor=\"middle\" font-size=\"9\" font-weight=\"bold\" fill=\"#fff\">T</text><circle cx=\"189.38926261462365\" cy=\"39.54915028125263\" r=\"11\" fill=\"#fed7aa\"/>\n              <text x=\"189.38926261462365\" y=\"43.54915028125263\" text-anchor=\"middle\" font-size=\"9\" font-weight=\"bold\" fill=\"#7c2d12\">H</text><circle cx=\"207.55282581475768\" cy=\"64.54915028125264\" r=\"11\" fill=\"#fed7aa\"/>\n              <text x=\"207.55282581475768\" y=\"68.54915028125264\" text-anchor=\"middle\" font-size=\"9\" font-weight=\"bold\" fill=\"#7c2d12\">H</text><circle cx=\"207.55282581475768\" cy=\"95.45084971874736\" r=\"11\" fill=\"#fed7aa\"/>\n              <text x=\"207.55282581475768\" y=\"99.45084971874736\" text-anchor=\"middle\" font-size=\"9\" font-weight=\"bold\" fill=\"#7c2d12\">H</text><circle cx=\"189.38926261462365\" cy=\"120.45084971874738\" r=\"11\" fill=\"#fed7aa\"/>\n              <text x=\"189.38926261462365\" y=\"124.45084971874738\" text-anchor=\"middle\" font-size=\"9\" font-weight=\"bold\" fill=\"#7c2d12\">H</text><circle cx=\"160\" cy=\"130\" r=\"11\" fill=\"#fed7aa\"/>\n              <text x=\"160\" y=\"134\" text-anchor=\"middle\" font-size=\"9\" font-weight=\"bold\" fill=\"#7c2d12\">H</text><circle cx=\"130.61073738537635\" cy=\"120.45084971874738\" r=\"11\" fill=\"#fed7aa\"/>\n              <text x=\"130.61073738537635\" y=\"124.45084971874738\" text-anchor=\"middle\" font-size=\"9\" font-weight=\"bold\" fill=\"#7c2d12\">H</text><circle cx=\"112.44717418524232\" cy=\"95.45084971874738\" r=\"11\" fill=\"#fed7aa\"/>\n              <text x=\"112.44717418524232\" y=\"99.45084971874738\" text-anchor=\"middle\" font-size=\"9\" font-weight=\"bold\" fill=\"#7c2d12\">H</text><circle cx=\"112.44717418524232\" cy=\"64.54915028125264\" r=\"11\" fill=\"#fed7aa\"/>\n              <text x=\"112.44717418524232\" y=\"68.54915028125264\" text-anchor=\"middle\" font-size=\"9\" font-weight=\"bold\" fill=\"#7c2d12\">H</text><circle cx=\"130.61073738537635\" cy=\"39.549150281252636\" r=\"11\" fill=\"#fed7aa\"/>\n              <text x=\"130.61073738537635\" y=\"43.549150281252636\" text-anchor=\"middle\" font-size=\"9\" font-weight=\"bold\" fill=\"#7c2d12\">H</text>\n          </svg>\n        ",
      "curatedHint": "Count the number of tails T. How does T change when you flip 4 coins?",
      "progressiveHints": {
        "attempt1": "If among the 4 flipped coins there are k tails and (4 - k) heads, what is the new count of tails?",
        "attempt2": "The k tails become heads, and the (4 - k) heads become tails. The change in tails is ΔT = (4 - k) - k = 4 - 2k. What is the parity of 4 - 2k?",
        "attempt3": "Notice 4 - 2k = 2(2 - k) is always an EVEN integer! Thus every flip changes the number of tails by an even amount (0, ±2, or ±4).",
        "attempt4": "We start with 1 tail (an odd number). Since T changes by an even integer, T must remain strictly ODD at every stage. All heads requires 0 tails, which is even. Hence, all heads is impossible."
      },
      "curatedSolution": {
        "technique": "State Parity Invariant under Local Permutations",
        "setup": "Let T be the number of coins showing tails. Initially, T = 1. We want to know if T can reach 0.",
        "steps": "1. In one operation, exactly 4 consecutive coins are flipped.\n2. Suppose that among these 4 coins, k coins currently show tails, and (4 - k) show heads, where k ∈ {0, 1, 2, 3, 4}.\n3. After flipping, the k tails become heads, and the (4 - k) heads become tails.\n4. The change in the total number of tails is ΔT = (4 - k) - k = 4 - 2k = 2(2 - k).\n5. Since ΔT is divisible by 2 for all possible values of k, the parity of T is strictly INVARIANT modulo 2.",
        "conclusion": "Initially, T = 1 ≡ 1 (mod 2) [odd]. Therefore, after any number of flips, T must remain ODD. To have all coins showing heads requires T = 0 ≡ 0 (mod 2) [even]. Because an odd number can never equal an even number, all heads is impossible.",
        "commonMistakes": "Focusing on coin positions rather than the count invariant; trying exhaustive move sequences."
      }
    },
    {
      "id": "invariant_p3",
      "badge": "INVARIANTS · PROBLEM 4 OF 4",
      "category": "Invariant: Monovariants",
      "title": "The Diplomatic Division Problem",
      "text": "In a parliament, every politician has at most 3 enemies. Can they always be partitioned into two rooms so each has at most 1 enemy in their room?",
      "visual": "\n          <svg viewBox=\"0 0 320 150\" class=\"exercise-svg-diagram\">\n            <g transform=\"translate(60, 20)\">\n              <rect x=\"0\" y=\"0\" width=\"85\" height=\"90\" rx=\"10\" fill=\"#fff7ed\" stroke=\"#fdba74\" stroke-width=\"1.5\"/>\n              <text x=\"42\" y=\"25\" text-anchor=\"middle\" fill=\"#ea580c\" font-size=\"12\" font-weight=\"bold\">Room A</text>\n              <rect x=\"115\" y=\"0\" width=\"85\" height=\"90\" rx=\"10\" fill=\"#f0fdf4\" stroke=\"#86efac\" stroke-width=\"1.5\"/>\n              <text x=\"157\" y=\"25\" text-anchor=\"middle\" fill=\"#16a34a\" font-size=\"12\" font-weight=\"bold\">Room B</text>\n            </g>\n          </svg>\n        ",
      "curatedHint": "Define a quantity M that measures total internal hostility (e.g. number of enemy pairs sharing the same room) and see what happens when a conflicted person switches rooms.",
      "progressiveHints": {
        "attempt1": "If someone has 2 or 3 enemies in their current room, how many enemies do they have in the other room, given they have at most 3 enemies total?",
        "attempt2": "They have at most 3 - 2 = 1 enemy in the other room! What happens to the total number of within-room conflicts if that person moves?",
        "attempt3": "Define M as the total number of conflicting pairs sharing a room. When a politician with ≥ 2 enemies in their room moves, M strictly decreases by at least 1.",
        "attempt4": "Since M is a non-negative integer (M ≥ 0), it cannot decrease infinitely. The process must terminate at a state where no politician has ≥ 2 enemies in their room."
      },
      "curatedSolution": {
        "technique": "Monovariant & Extremal Principle (Well-Ordering Principle)",
        "setup": "Let G = (V, E) be the hostility graph with max degree Δ ≤ 3. Partition V into two disjoint sets A and B. Define the monovariant M = |E(A)| + |E(B)|, representing total conflicting pairs sharing a room.",
        "steps": "1. Since the number of edges is finite and non-negative, M takes non-negative integer values: 0 ≤ M ≤ |E|.\n2. Suppose there exists a politician p who has ≥ 2 enemies in their current room (say Room A).\n3. Since p has at most 3 enemies total, p has at most 3 - 2 = 1 enemy in Room B.\n4. Move p from Room A to Room B. The number of conflicts in Room A decreases by at least 2, while conflicts in Room B increase by at most 1.\n5. The net change in M is ΔM ≤ 1 - 2 = -1. Thus, each such move strictly DECREASES M by at least 1.",
        "conclusion": "Because M is bounded below by 0 and decreases by at least 1 at each step, this reallocation process must terminate in finitely many steps. At termination, no politician can have ≥ 2 enemies in their room, ensuring every politician has at most 1 enemy in their room.",
        "commonMistakes": "Trying to construct the partition constructively by greedy assignment instead of monovariant descent."
      }
    }
  ]
};
