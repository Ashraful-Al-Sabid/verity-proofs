const COLOR_SWITCH = [/(colou?r)[^.]{0,40}(change|switch|alternat|opposite|flip|differ)/, /opposite colou?r/, /alternat/, /black[^.]{0,25}white/, /white[^.]{0,25}black/, /bipartite/];

const stepMeta = {
  // ---------------- PARITY ----------------
  parity_deck0: {
    node: "What is Parity?", kind: "concept",
    desc: "Even means \"splits into pairs\". Warm up: can five odd numbers add up to 100?",
    rubric: {
      answer: "no", claimLabel: "You stated that it can't be done.",
      claimQuestion: "Before searching forever: do you think it's possible or impossible? State your answer, then explain why.",
      wrongQuestion: "Try it: write down five odd numbers whose sum is 100. If you can't, ask yourself what the sum of five odd numbers always looks like.",
      steps: [
        { label: "Odd + odd is even (pairs).", any: [/odd ?\+ ?odd/, /two odd/, /pair/, /mod(ulo)? ?2/, /2 ?[a-z] ?\+ ?1/, /\(o ?\+ ?o\)/], question: "Start small: what is the parity of the sum of just two odd numbers? How could you use that to handle five?" },
        { label: "Five odd numbers always sum to an odd number.", any: [/(sum|total|result|add up)[^.]{0,40}\bodd\b/, /odd number of odd/, /even ?\+ ?odd/, /5 ?≡ ?1/, /always odd/], question: "So what is the parity of the sum of all five odd numbers? Explain why it must be that." },
        { label: "100 is even, so the sums can never match.", any: [/100[^.]{0,25}even/, /even[^.]{0,25}100/], question: "Now compare with the target. What is the parity of 100, and why does that settle the question?" }
      ],
      success: "Every odd number leaves remainder 1 when divided by 2, so five of them sum to something odd. 100 is even, so no choice of five odd numbers can ever work. You proved an impossibility, not just failed to find an example."
    }
  },
  parity_p0: {
    node: "The Gear Paradox", kind: "problem",
    desc: "Eleven gears in a closed ring: can they all turn at once?",
    rubric: {
      answer: "no", claimLabel: "You claimed the gears cannot all rotate.",
      claimQuestion: "Can all 11 gears rotate at the same time? State your answer clearly, then justify it.",
      wrongQuestion: "Imagine gear 1 turns clockwise. Which way must gear 2 turn? Gear 3? Follow the pattern all the way to gear 11. Does it still work where gear 11 touches gear 1?",
      steps: [
        { label: "Touching gears turn in opposite directions.", any: [/opposite/, /alternat/, /counter/, /anti-?clockwise/, /\bccw\b/, /revers/], question: "Look at just two gears that mesh. If one turns clockwise, how must the other turn?" },
        { label: "The pattern forces gear 11 to turn the same way as gear 1.", any: [/(11|eleven|last)[^.]{0,60}(same|clockwise|\bcw\b)/, /odd[- ]numbered/, /odd number of gears/, /odd gears/, /(11|eleven) is odd/, /\bodd\b/], question: "Follow the pattern around the ring: if gear 1 turns clockwise, which way does gear 11 turn? Why?" },
        { label: "Gear 11 meshes with gear 1, giving a contradiction.", any: [/(mesh|touch|connect|adjacent|next to|meets?|neighbou?r)[^.]{0,60}(\b1\b|first|one)/, /contradict/, /conflict/, /\bjam/, /\block/, /both clockwise/, /same direction/], question: "Gear 11 also touches gear 1. What must be true of two touching gears, and does that hold here?" }
      ],
      success: "Touching gears alternate direction, so with gear 1 clockwise every odd-numbered gear is clockwise, including gear 11. But gear 11 touches gear 1, and touching gears must turn opposite ways. That contradiction shows the ring is locked."
    }
  },
  parity_deck1: {
    node: "Knight Alternations", kind: "concept",
    desc: "Every knight move flips the square's colour. What does a round trip require?",
    rubric: {
      answer: "prove",
      steps: [
        { label: "Every knight move switches square colour.", any: COLOR_SWITCH, question: "Look at one knight move. What happens to the colour of the square the knight stands on?" },
        { label: "After an odd number of moves the knight is on the other colour.", any: [/odd[^.]{0,60}(opposite|other|different|white)/, /(opposite|other|different)[^.]{0,50}odd/, /even number of (moves|switch|changes|jumps)/, /after (k|n) moves/, /odd number of (moves|switch|changes|jumps)/], question: "After 1 move, 2 moves, 3 moves… which colour is the knight on? What is the pattern for odd versus even counts?" },
        { label: "Ending on a1 means ending on the starting colour, so the count is even.", any: [/(a1|start|same square|back|returns?)[^.]{0,70}(same colou?r|even)/, /same colou?r[^.]{0,50}even/, /(so|therefore|hence|thus)[^.]{0,40}even/], question: "The knight ends on a1 itself. What colour is that compared with where it started, and what does that force about the number of moves?" }
      ],
      success: "Each move swaps colour, so after an odd number of moves the knight sits on the opposite colour. Returning to a1 puts it back on the starting colour, which only happens after an even number of moves."
    }
  },
  parity_p1: {
    node: "The 63-Step Tour", kind: "problem",
    desc: "Visit every square once, from a1 to h8. Possible or not?",
    rubric: {
      answer: "no", claimLabel: "You claimed the tour cannot end on h8.",
      claimQuestion: "Can the knight's tour end on h8? State your answer, then justify it.",
      wrongQuestion: "Before trusting that, colour the board. What does each knight move do to the colour, and what colour is h8 compared with a1?",
      steps: [
        { label: "Every knight move switches square colour.", any: COLOR_SWITCH, question: "Colour the board black and white. What does a single knight move do to the colour under the knight?" },
        { label: "The tour takes 63 moves, an odd number.", any: [/\b63\b/, /sixty-?three/], question: "Exactly how many moves does it take to visit all 64 squares once, starting on a1? Is that number even or odd?" },
        { label: "a1 and h8 have the same colour, but an odd number of moves must land on the other colour.", any: [/(a1|h8)[^.]{0,70}same colou?r/, /same colou?r/, /both (black|dark|white|light)/, /h8 is (black|dark)/], question: "After an odd number of moves, which colour must the knight be on? Now compare the colours of a1 and h8." }
      ],
      success: "Each move swaps colour, and the tour needs 63 moves, an odd number, so the last square has the opposite colour to a1. But a1 and h8 have the same colour, so the tour can never finish on h8."
    }
  },
  parity_p3: {
    node: "Partition into Pairs", kind: "problem",
    desc: "Can 1×2 dominoes perfectly cover a 5×5 board?",
    rubric: {
      answer: "no", claimLabel: "You claimed the board cannot be tiled.",
      claimQuestion: "Can the 5×5 board be fully covered? State your answer first.",
      wrongQuestion: "Count before you build: how many squares does the board have, and how many does each domino cover?",
      steps: [
        { label: "Each domino covers exactly 2 squares.", any: [/(cover|covers|occupies|takes|fills)[^.]{0,20}(2|two)\b/, /\b(2|two) squares/, /\b2k\b/, /pairs?/], question: "How many squares does one domino cover? What does that say about the total covered by any number of dominoes?" },
        { label: "Any set of dominoes covers an even number of squares.", any: [/\beven\b/], question: "If every domino covers 2 squares, is the total number of covered squares even or odd?" },
        { label: "The board has 25 squares, an odd number.", any: [/25[^.]{0,30}odd/, /odd[^.]{0,30}25/, /25 is not (divisible|even)/], question: "Count the squares on the 5×5 board. Why does that number make a perfect tiling impossible?" }
      ],
      success: "k dominoes always cover 2k squares, which is even. The board has 25 squares, which is odd, so at least one square is always left uncovered."
    }
  },
  parity_p2: {
    node: "Odd & Even Sums", kind: "problem",
    desc: "Ten bills of 1, 3 or 5 rubles making exactly 25?",
    rubric: {
      answer: "no", claimLabel: "You claimed the change can't be made.",
      claimQuestion: "Can the cashier do it? State your answer, then explain.",
      wrongQuestion: "Write down your ten bills and add them up. Then look at what 1, 3 and 5 have in common.",
      steps: [
        { label: "Every bill (1, 3, 5) is odd.", any: [/(1|3|5|bills?|each|all|every|denominations?)[^.]{0,40}odd/], question: "What do 1, 3 and 5 have in common?" },
        { label: "Ten odd numbers sum to an even number.", any: [/(ten|10)[^.]{0,40}even/, /even[^.]{0,40}(ten|10)/, /even number of odd/, /pairs? of odd/, /5 pairs/], question: "What is the parity of a sum of ten odd numbers? Why?" },
        { label: "25 is odd, so it can't equal that sum.", any: [/25[^.]{0,25}odd/, /odd[^.]{0,25}25/], question: "Compare that with 25. Why can't they be equal?" }
      ],
      success: "Every bill is odd, and ten odd numbers pair up into five even sums, so the total is even. 25 is odd, so exact change is impossible."
    }
  },

  // ---------------- INVARIANT ----------------
  invariant_concept: {
    node: "What is an Invariant?", kind: "concept",
    desc: "Find the quantity that never changes. Warm up with a chocolate bar.",
    rubric: {
      answer: "value", claimPattern: /\b47\b|forty-?seven/, claimLabel: "You found the number: 47 breaks.",
      claimQuestion: "How many breaks do you think are needed? Commit to a number, then explain why it is always that number.",
      wrongQuestion: "Test your number on a tiny bar, say 1 × 3 (3 squares). How many breaks does that need? Watch how the number of pieces changes with each break.",
      steps: [
        { label: "Each break increases the number of pieces by exactly one.", any: [/break[^.]{0,70}(one more|1 more|by (1|one)|increases?|adds?)/, /(one|1) (more|extra|additional) piece/, /pieces?[^.]{0,40}(increases?|goes up|grows)[^.]{0,20}(1|one)/, /\+ ?1/], question: "Ignore shapes and watch the number of pieces. What does a single break do to that number, wherever you break?" },
        { label: "You go from 1 piece to 48 pieces.", any: [/\b48\b/, /forty-?eight/], question: "How many pieces do you start with, and how many must you end with? Connect that to your answer." }
      ],
      success: "Every break adds exactly one piece, whatever you do. Going from 1 piece to 48 pieces therefore takes exactly 47 breaks. The invariant \"pieces − breaks = 1\" makes the strategy irrelevant."
    }
  },
  invariant_p0: {
    node: "The Chameleon Cycle", kind: "problem",
    desc: "13 red, 15 green, 17 blue. Can they ever all be one colour?",
    rubric: {
      answer: "no", claimLabel: "You claimed they can never be one colour.",
      claimQuestion: "Can all the chameleons end up the same colour? State your answer, then justify it.",
      wrongQuestion: "If you think it's possible, write out the sequence of meetings. While you try, record how R − G changes after each meeting.",
      steps: [
        { label: "You tracked how one meeting changes the counts.", any: [/(-1|minus (1|one)|decreas|lose)[^.]{0,70}(\+ ?2|plus (2|two)|increas|gain)/, /r ?- ?1/, /\+ ?2/, /(1|one) less[^.]{0,40}(2|two) more/], question: "Suppose a red and a green chameleon meet. Write down exactly how R, G and B change." },
        { label: "Differences between counts stay the same modulo 3.", any: [/(difference|r ?- ?g|g ?- ?b|b ?- ?r)[^.]{0,90}(mod|modulo|remainder|multiple of 3|\b3\b)/, /mod(ulo)? ?3[^.]{0,90}(differ|invariant|unchanged|same|preserved)/], question: "Compare R − G before and after a meeting. What stays the same if you only care about remainders when dividing by 3?" },
        { label: "The start state can never reach two zero counts.", any: [/\b(13|15|17)\b/, /1, ?0, ?2/, /0, ?0, ?45/, /(two|2) (of the )?(counts|colou?rs)[^.]{0,30}(0|zero)/, /(0|zero)[^.]{0,40}(difference|mod)/], question: "In the all-one-colour state, two counts are 0, so their difference is 0. What are the differences for 13, 15, 17 modulo 3? Can they ever become 0?" }
      ],
      success: "A meeting changes the counts by (−1, −1, +2), so every pairwise difference changes by 0 or ±3 and stays fixed modulo 3. The starting differences are never 0 mod 3, but one colour would need two counts of 0 (difference 0). So it is impossible."
    }
  },
  invariant_p1: {
    node: "Blackboard Differences", kind: "problem",
    desc: "Replace a, b with |a − b| until one number is left. Can it be 0?",
    rubric: {
      answer: "no", claimLabel: "You claimed the last number can't be 0.",
      claimQuestion: "Can the final number be 0? State your answer first.",
      wrongQuestion: "Track the total sum of all the numbers on the board. How does it change after one replacement, and what is it at the start?",
      steps: [
        { label: "Each replacement changes the sum by an even amount, so the sum's parity never changes.", any: [/(sum|total)[^.]{0,90}(even|2 ?min|by 2|parity)/, /parity[^.]{0,50}(sum|total|invariant|unchanged|same|preserved)/, /a ?\+ ?b ?- ?\|? ?a ?- ?b/], question: "When you replace a and b with |a − b|, how does the total sum change? Is that change even or odd?" },
        { label: "The starting sum 1 + 2 + … + 1985 is odd.", any: [/(initial|starting|original|start|1 ?\+ ?2|993|sum of 1)[^.]{0,90}odd/, /odd[^.]{0,40}(initial|start)/, /1985 ?x ?993/], question: "Work out the parity of 1 + 2 + … + 1985. Is it even or odd?" },
        { label: "The last number equals the sum, so it is odd and can't be 0.", any: [/(last|final|remaining|one number)[^.]{0,70}odd/, /(0|zero) is even/], question: "When only one number is left, it is the whole sum. What does that tell you about whether it can be 0?" }
      ],
      success: "Replacing a, b with |a − b| reduces the sum by 2·min(a, b), an even number, so the sum's parity is invariant. The starting sum 1985 × 993 is odd, so the last number is odd and can never be 0."
    }
  },
  invariant_p2: {
    node: "The Coin-Flip Circle", kind: "problem",
    desc: "Flip 4 neighbouring coins at a time. Can you reach all heads?",
    rubric: {
      answer: "no", claimLabel: "You claimed all heads is unreachable.",
      claimQuestion: "Can all the coins show heads? State your answer, then justify it.",
      wrongQuestion: "Try it for a few moves while counting the tails after each flip. What do you notice about that count?",
      steps: [
        { label: "Each flip changes the number of tails by an even amount.", any: [/(tails?|heads?)[^.]{0,90}(even|by 2|±2|4 ?- ?2 ?k|parity)/, /parity[^.]{0,50}(tails|heads)/, /4 ?- ?2 ?k/], question: "Count the tails. If the 4 flipped coins include k tails, how many tails are there afterwards? Is the change even or odd?" },
        { label: "There is 1 tail at the start, an odd number.", any: [/\b(1|one|single) tails?\b/, /odd number of tails/, /tails?[^.]{0,30}odd/, /starts?[^.]{0,30}odd/], question: "How many tails are there at the start? Is that even or odd?" },
        { label: "All heads means 0 tails, which is even.", any: [/\b(0|zero|no) tails/, /all heads[^.]{0,70}(even|\b0\b|zero)/], question: "How many tails does the all-heads position have? Why can that never be reached?" }
      ],
      success: "Flipping 4 coins with k tails changes the tail count by 4 − 2k, which is even, so the parity of tails never changes. You start with 1 tail (odd) and all heads needs 0 tails (even), so it's impossible."
    }
  },
  invariant_p3: {
    node: "Monovariants & Descent", kind: "problem",
    desc: "At most 3 enemies each: can two rooms always keep the peace?",
    rubric: {
      answer: "yes", claimLabel: "You claimed such a split always exists.",
      claimQuestion: "Is such a split always possible? State your answer, then build the argument.",
      wrongQuestion: "Try a small case first, such as 4 politicians who are all enemies of each other. Can you split them? Then think about fixing an unhappy politician one at a time.",
      steps: [
        { label: "Move anyone who has 2 or more enemies in their room.", any: [/(2|two|more than (1|one)|at least (2|two))[^.]{0,50}enem[^.]{0,70}(move|switch|swap|transfer|change)/, /(move|switch|swap|transfer)[^.]{0,70}(2|two|more than one|at least two)[^.]{0,20}enem/, /unhappy[^.]{0,50}(move|switch)/], question: "Start with any split. If someone is unhappy (2 or more enemies in their room), what could you do with them?" },
        { label: "They have at most 1 enemy in the other room.", any: [/(at most|only|no more than) (1|one)[^.]{0,50}(other|new)/, /(other|new) room[^.]{0,50}(at most|only|no more than) (1|one)/, /3 ?- ?2/], question: "That person has at most 3 enemies in total. How many of them can be in the other room?" },
        { label: "The number of enemy pairs sharing a room strictly decreases.", any: [/(total|number of|count|sum)[^.]{0,50}(conflict|enemy pairs|hostil|pairs|enemies)[^.]{0,70}(decreas|goes down|drops|reduc|smaller|falls)/, /monovariant/, /(decreas|goes down|drops|reduc)[^.]{0,30}(by )?at least (1|one)/], question: "Count all the enemy pairs that share a room. What happens to that number after such a move?" },
        { label: "It can't decrease forever, so the process stops at a good split.", any: [/(stop|terminat|finite|eventually|forever|non-?negative|cannot go below|can't go below|≥ ?0|>= ?0|bounded)/], question: "That count can't keep dropping forever. Why not, and what does the arrangement look like when the moves stop?" }
      ],
      success: "Whenever someone has 2+ enemies in their room, they have at most 1 in the other, so moving them lowers the number of same-room enemy pairs by at least 1. That number is a non-negative integer and can't fall forever, so the process stops, and when it does, everyone has at most 1 enemy in their room."
    }
  },

  // ---------------- PIGEONHOLE ----------------
  pigeonhole_concept: {
    node: "What is Pigeonhole?", kind: "concept",
    desc: "More pigeons than holes forces a crowd. Warm up with socks in the dark.",
    rubric: {
      answer: "value", claimPattern: /\b4\b|\bfour\b/, claimLabel: "You found the number: 4 socks.",
      claimQuestion: "How many socks guarantee a matching pair? Commit to a number, then prove both halves.",
      wrongQuestion: "Check the worst case. How many socks could you draw and still have no pair? One more than that is your answer. Can you see why?",
      steps: [
        { label: "3 socks might all be different colours, so 3 is not enough.", any: [/(3|three)[^.]{0,70}(different|one of each|not enough|might|could|each colou?r|all colou?rs)/, /(red|blue|green)[^.]{0,20}(red|blue|green)[^.]{0,20}(red|blue|green)/], question: "Why isn't 3 enough? Describe a draw of 3 socks with no pair." },
        { label: "4 socks with only 3 colours forces two to match.", any: [/(4|four)[^.]{0,70}(3|three) colou?rs/, /pigeon/, /(two|2) (must|will|have to)[^.]{0,30}(same|match)/, /more socks than colou?rs/], question: "Now take 4 socks. With only 3 colours, why must two of them match?" }
      ],
      success: "Three socks can be red, blue and green, so 3 is not enough. Four socks in only three colour boxes means some box holds two, so 4 always works. You showed both halves: enough, and smallest."
    }
  },
  pigeonhole_p0: {
    node: "The Hair Count Paradox", kind: "problem",
    desc: "8 million people, at most 150,000 hairs each. Must two match?",
    rubric: {
      answer: "yes", claimLabel: "You claimed two people must share a hair count.",
      claimQuestion: "Must two Londoners have exactly the same number of hairs? State your answer, then prove it.",
      wrongQuestion: "Count the possible hair counts (0, 1, 2, … up to 150,000) and compare with the number of people. Could every person really have a different count?",
      steps: [
        { label: "There are only 150,001 possible hair counts (the holes).", any: [/150 ?,?001/, /150 ?,?000/, /150k/, /0 to 150/, /hair counts?/, /pigeonholes?/, /\bholes?\b/], question: "How many different hair counts are possible? Don't forget someone could be bald." },
        { label: "There are more people than possible counts.", any: [/(8|million|population|people|londoners)[^.]{0,90}(more|greater|exceed|>|larger|bigger|outnumber)/, /(more|greater)[^.]{0,40}(people|pigeons)/, />/], question: "Compare the number of people in London with the number of possible hair counts. What principle applies?" }
      ],
      success: "Hair counts range over 0 to 150,000, which is only 150,001 holes, but London has over 8 million people (pigeons). More pigeons than holes, so two people must share a hair count."
    }
  },
  pigeonhole_p1: {
    node: "Triangle Packing", kind: "problem",
    desc: "Five points in a unit triangle: two are at most 1/2 apart.",
    rubric: {
      answer: "prove",
      steps: [
        { label: "Split the triangle into 4 small triangles of side 1/2.", any: [/(4|four)[^.]{0,40}(triangle|region|part|piece|section)/, /midpoint/], question: "How could you cut the big triangle into smaller pieces where any two points in the same piece are close together?" },
        { label: "5 points and 4 regions, so two points share a region.", any: [/(5|five)[^.]{0,60}(4|four)/, /pigeon/, /(two|2) (points )?(must |will )?(be |lie |fall |end up )?in the same/], question: "You have 5 points and 4 pieces. What does the pigeonhole principle tell you?" },
        { label: "Two points in a small triangle are at most 1/2 apart.", any: [/(1\/2|half|0\.5)[^.]{0,70}(apart|distance|side|at most|diameter|away)/, /(distance|diameter|apart)[^.]{0,70}(1\/2|half|0\.5)/], question: "Why are two points inside a triangle of side 1/2 at most 1/2 apart?" }
      ],
      success: "Joining the midpoints cuts the triangle into 4 triangles of side 1/2. With 5 points, some small triangle holds two of them, and two points in a triangle of side 1/2 are at most 1/2 apart."
    }
  },
  pigeonhole_p2: {
    node: "The 6-Person Party", kind: "problem",
    desc: "Among any 6 people: 3 mutual friends or 3 mutual strangers.",
    rubric: {
      answer: "prove",
      steps: [
        { label: "Focus on one person and their 5 relationships.", any: [/(5|five) (other|people|relationships?|edges?|connections?|others|lines)/, /(pick|choose|take|consider) (one|a|any) person/, /person a\b/, /vertex a\b/], question: "Focus on one person, A. How many relationships does A have with the other five?" },
        { label: "At least 3 of those relationships are the same type.", any: [/at least (3|three)/, /(3|three)[^.]{0,60}(same|of one kind|all friends|all strangers)/, /pigeon/], question: "Split A's 5 relationships into friends and strangers. Why must at least 3 be of the same type?" },
        { label: "Check those 3 among themselves: either way you get a triangle.", any: [/(among|between) (them|those|these|the three)/, /any (two|2) of (them|those|these)/, /(if|whether) (any|two)[^.]{0,70}(know|friends|strangers)/, /either way/, /otherwise/, /both cases/, /none of them/], question: "Say A knows B, C and D. What happens if any two of B, C, D know each other? And if none do?" }
      ],
      success: "Person A has 5 relationships, so at least 3 are the same type, say friends B, C, D. If any two of them are friends, they form a friendly triangle with A; if none are, B, C, D are three mutual strangers. Either way the claim holds."
    }
  },
  pigeonhole_p3: {
    node: "Divisible Prefix Sums", kind: "problem",
    desc: "Any n integers contain a run whose sum is divisible by n.",
    rubric: {
      answer: "prove",
      steps: [
        { label: "Use the running (prefix) sums S₁, …, Sₙ.", any: [/prefix/, /partial sums?/, /running (sum|total)/, /cumulative/, /\bs_?k\b/, /\bs ?1\b[^.]{0,30}\bs ?n\b/], question: "Look at the running totals S₁ = a₁, S₂ = a₁ + a₂, …, Sₙ. How many are there?" },
        { label: "Look at their remainders modulo n.", any: [/remainder/, /mod(ulo)? ?n\b/, /residue/], question: "What remainders can those running totals leave when divided by n?" },
        { label: "If some remainder is 0, that prefix already works.", any: [/(remainder|residue)[^.]{0,40}(0|zero)/, /≡ ?0/, /(already|itself) divisible/, /divisible by n already/], question: "What if one of the running totals is already divisible by n? Is that a valid answer?" },
        { label: "Otherwise two share a remainder, and the run between them works.", any: [/(two|2)[^.]{0,60}same (remainder|residue)/, /pigeon/, /s_?j ?- ?s_?i/, /difference/], question: "If none is divisible by n, there are n totals but only n − 1 non-zero remainders. What follows, and which run of numbers works?" }
      ],
      success: "Take the n prefix sums mod n. If one is 0, that prefix works. Otherwise n sums share only n − 1 non-zero remainders, so two match, Sᵢ ≡ Sⱼ, and the run aᵢ₊₁ + … + aⱼ = Sⱼ − Sᵢ is divisible by n."
    }
  },

  // ---------------- PROOF FOUNDATIONS ----------------
  proof_direct: {
    node: "Direct Proof", kind: "concept",
    desc: "From definitions to conclusion: odd + odd is always even.",
    rubric: {
      answer: "prove", generalize: true,
      steps: [
        { label: "Write the two odd numbers as 2a + 1 and 2b + 1.", any: [/2 ?[a-z] ?\+ ?1/], question: "Start from the definition. How can you write any odd integer using algebra? Use different letters for the two numbers." },
        { label: "Add them: 2a + 2b + 2.", any: [/2 ?[a-z] ?\+ ?2 ?[a-z] ?\+ ?2/, /2 ?\( ?[a-z] ?\+ ?[a-z] ?\+ ?1 ?\)/], question: "Add your two expressions together. What do you get?" },
        { label: "Factor out 2, so the sum is even by definition.", any: [/2 ?\( ?[a-z]/, /divisible by 2/, /multiple of 2/, /factor/, /even by definition/, /= ?2 ?m\b/, /2 times/], question: "Can you write the sum as 2 × (some integer)? Why does that prove it's even?" }
      ],
      success: "Writing the numbers as 2a + 1 and 2b + 1, their sum is 2a + 2b + 2 = 2(a + b + 1), which is twice an integer, so it is even by definition. This covers every pair of odd numbers, not just the examples you tried."
    }
  },
  proof_p0: {
    node: "Contradiction", kind: "problem",
    desc: "Assume √2 = a/b in lowest terms and break the assumption.",
    rubric: {
      answer: "prove",
      steps: [
        { label: "Squaring gives a² = 2b².", any: [/a ?\^ ?2 ?= ?2 ?b ?\^ ?2/, /2 ?b ?\^ ?2 ?= ?a ?\^ ?2/, /a squared/, /a\*a/], question: "Square both sides of √2 = a/b. What equation relating a and b do you get?" },
        { label: "So a² is even, and therefore a is even.", any: [/\ba (is |must be )?even/, /2 divides a\b/, /a ?= ?2 ?k/], question: "What does a² = 2b² tell you about a²? And then about a itself?" },
        { label: "Substituting a = 2k gives b² = 2k², so b is even too.", any: [/b ?\^ ?2 ?= ?2 ?k ?\^ ?2/, /\bb (is |must be )?(also )?even/, /2 divides b\b/, /both[^.]{0,20}even/], question: "Write a = 2k and substitute. What does that tell you about b?" },
        { label: "Both even contradicts gcd(a, b) = 1.", any: [/gcd/, /coprime/, /lowest terms/, /common (factor|divisor)/, /contradict/, /simplest form/], question: "Both a and b are even. Which assumption does that break?" }
      ],
      success: "From a² = 2b², a² is even so a is even. Writing a = 2k gives b² = 2k², so b is even too. Then 2 divides both a and b, which contradicts gcd(a, b) = 1, so √2 is irrational."
    }
  },
  proof_p1: {
    node: "Contrapositive", kind: "problem",
    desc: "Prove \"n² even ⇒ n even\" by proving its contrapositive.",
    rubric: {
      answer: "prove", generalize: true,
      steps: [
        { label: "Contrapositive: if n is odd, then n² is odd.", any: [/n (is )?odd[^.]{0,70}(n ?\^ ?2|n squared|square)[^.]{0,25}odd/], question: "First state the contrapositive: negate both parts of \"if n² is even, then n is even\" and swap them." },
        { label: "Write n = 2k + 1.", any: [/2 ?k ?\+ ?1/], question: "Assume n is odd. How do you write that algebraically?" },
        { label: "n² = 2(2k² + 2k) + 1, which is odd.", any: [/4 ?k ?\^ ?2/, /2 ?\( ?2 ?k ?\^ ?2/, /2 ?m ?\+ ?1/], question: "Square your expression and show the result has the form 2m + 1." },
        { label: "The contrapositive is equivalent, so the original statement holds.", any: [/equivalent/, /(therefore|hence|thus|so)[^.]{0,70}(original|statement|n is even)/, /which proves/, /proves the (original|statement)/], question: "You proved \"n odd ⇒ n² odd\". Why does that prove the original statement?" }
      ],
      success: "The contrapositive is \"n odd ⇒ n² odd\". With n = 2k + 1, n² = 4k² + 4k + 1 = 2(2k² + 2k) + 1, which is odd. A statement and its contrapositive are logically equivalent, so n² even ⇒ n even."
    }
  },
  proof_p2: {
    node: "Induction", kind: "problem",
    desc: "Show 1 + 3 + … + (2n − 1) = n² for every n.",
    rubric: {
      answer: "prove",
      steps: [
        { label: "Base case: n = 1 gives 1 = 1².", any: [/base/, /n ?= ?1\b/, /1 ?= ?1 ?\^ ?2/], question: "Every induction needs a starting point. Check the formula for n = 1." },
        { label: "Inductive hypothesis: assume it holds for n = k.", any: [/assum/, /hypothesis/, /suppose[^.]{0,40}\bk\b/, /true for k/, /p\( ?k ?\)/], question: "State your inductive hypothesis clearly: what exactly do you assume for n = k?" },
        { label: "Adding 2k + 1 gives k² + 2k + 1 = (k + 1)².", any: [/k ?\^ ?2 ?\+ ?2 ?k ?\+ ?1/, /\( ?k ?\+ ?1 ?\) ?\^ ?2/], question: "For n = k + 1 the sum gains one more term. What is it, and what do you get when you add it to k²?" },
        { label: "So it holds for all positive integers n.", any: [/all (positive )?(integers|n|natural)/, /every n\b/, /by (the principle of )?(mathematical )?induction/, /for all/], question: "You have a base case and an inductive step. What can you conclude, and why?" }
      ],
      success: "The base case holds (1 = 1²). Assuming 1 + 3 + … + (2k − 1) = k², adding the next term 2k + 1 gives k² + 2k + 1 = (k + 1)². By induction the formula holds for every positive integer n."
    }
  },
  proof_p3: {
    node: "Cases & Exhaustion", kind: "problem",
    desc: "Split into cases that cover everything: n(n + 1) is even.",
    rubric: {
      answer: "prove", generalize: true,
      steps: [
        { label: "Every integer is even or odd: two cases cover everything.", any: [/even or odd/, /odd or even/, /either[^.]{0,30}(even|odd)/, /two cases/, /case 1/], question: "Split all integers into cases that cover everything. What are the natural two cases here?" },
        { label: "Case n even: n = 2k, so n(n + 1) has a factor 2.", any: [/n ?= ?2 ?k(?! ?\+)/, /n (is )?even[^.]{0,90}(even|2 ?\(|factor|multiple of 2)/], question: "Case 1: n is even. Write n = 2k. Why is n(n + 1) even?" },
        { label: "Case n odd: n + 1 is even, so the product is even.", any: [/n ?\+ ?1 (is )?even/, /2 ?k ?\+ ?2/, /2 ?\( ?k ?\+ ?1 ?\)/, /n (is )?odd[^.]{0,90}(even|2 ?\(|factor|multiple of 2)/], question: "Case 2: n is odd. What can you say about n + 1, and so about the product?" }
      ],
      success: "Every integer is even or odd. If n = 2k, the product 2k(n + 1) is even. If n is odd, n + 1 = 2(k + 1) is even, so the product is even. The cases cover all integers, so n(n + 1) is always even."
    }
  }
};

export { stepMeta };
