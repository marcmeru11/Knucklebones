/**
 * MatatenaAI.js
 * Logic for the computer opponent in Single Player mode.
 */
class MatatenaAI {
    constructor() {
        this.difficulties = ['easy', 'medium', 'hard'];
    }

    /**
     * Calculates the score of a single column based on the quadratic rule (value * count^2).
     * @param {number[]} column - Array of dice values in the column.
     * @returns {number} The total score for the column.
     */
    getColumnScore(column) {
        if (!column || column.length === 0) return 0;
        const counts = {};
        column.forEach(val => {
            counts[val] = (counts[val] || 0) + 1;
        });

        let total = 0;
        for (const val in counts) {
            const value = parseInt(val);
            const count = counts[val];
            total += value * (count * count);
        }
        return total;
    }

    /**
     * Evaluates a potential move for the AI.
     * @param {number[]} humanCol - Current dice in the human player's column.
     * @param {number[]} aiCol - Current dice in the AI player's column.
     * @param {number} diceValue - The value of the rolled die.
     * @returns {number} The calculated score for this move.
     */
    evaluateMove(humanCol, aiCol, diceValue) {
        if (aiCol.length >= 3) return -Infinity; // Column is full

        // 1. Calculate Gain (how many points the AI adds)
        const oldAiScore = this.getColumnScore(aiCol);
        const newAiCol = [...aiCol, diceValue];
        const newAiScore = this.getColumnScore(newAiCol);
        const gain = newAiScore - oldAiScore;

        // 2. Calculate Damage (how many points it removes from the human)
        const oldHumanScore = this.getColumnScore(humanCol);
        const newHumanCol = humanCol.filter(val => val !== diceValue);
        const newHumanScore = this.getColumnScore(newHumanCol);
        const damage = (oldHumanScore - newHumanScore) * 1.5;

        // 3. Calculate Risk (penalty for high-value duplicates)
        let risk = 0;
        const countInAiCol = aiCol.filter(val => val === diceValue).length;
        if (countInAiCol > 0 && diceValue >= 4) {
            // If we add another valuable die, we are more vulnerable to human destroying it
            risk = diceValue * (countInAiCol + 1); 
        }

        return (gain + damage) - risk;
    }

    /**
     * Suggests the best column for the AI to place its die.
     * @param {number[][]} humanBoard - The human's board (3 columns).
     * @param {number[][]} aiBoard - The AI's board (3 columns).
     * @param {number} diceValue - The value to place.
     * @param {string} difficulty - 'easy', 'medium', or 'hard'.
     * @returns {number} The index of the chosen column (0, 1, or 2).
     */
    suggestMove(humanBoard, aiBoard, diceValue, difficulty = 'hard') {
        const scores = [0, 1, 2].map(idx => ({
            index: idx,
            score: this.evaluateMove(humanBoard[idx], aiBoard[idx], diceValue)
        }));

        // Filter out full columns
        const validMoves = scores.filter(move => move.score !== -Infinity);
        if (validMoves.length === 0) return 0; // Should not happen in normal gameplay

        if (difficulty === 'easy') {
            // Random move
            return validMoves[Math.floor(Math.random() * validMoves.length)].index;
        }

        // Sort by best score descending
        validMoves.sort((a, b) => b.score - a.score);

        if (difficulty === 'medium') {
            // 70% chance of best move, 30% random among valid
            if (Math.random() > 0.3) {
                return validMoves[0].index;
            } else {
                return validMoves[Math.floor(Math.random() * validMoves.length)].index;
            }
        }

        // 'hard' difficulty - Always best score
        return validMoves[0].index;
    }
}
