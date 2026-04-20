# Knucklebones

![Knucklebones Banner](https://img.shields.io/badge/Cult_of_the_Lamb-Fan_Game-crimson?style=for-the-badge)

**Knucklebones** is a high-fidelity web implementation of the "Knucklebones" minigame from *Cult of the Lamb*. It is a strategic dice-rolling game that blends luck with tactical placement, offering a polished, dark-themed aesthetic and various game modes.

## 🎮 How to Play

The objective is to achieve a higher score than your opponent. The game ends as soon as one player fills their 3x3 grid.

### The Mechanics
1. **Roll the Die:** On your turn, roll a standard 6-sided die.
2. **Place your Die:** Choose one of the three columns on your board to place the die.
3. **Multipliers:** If you place a die in a column that already contains a die of the same value, their scores are multiplied.
   - **Double:** Two dice of the same value result in `(Value + Value) x 2`.
   - **Triple:** Three dice of the same value result in `(Value + Value + Value) x 3`.
4. **Destroy Opponent Dice:** Placing a die in a column will **destroy** all dice of that same value in your opponent's corresponding column. Use this to sabotage their highest-scoring columns!

## 🚀 Features

- **Single Player:** Battle against a smart AI with multiple difficulty levels (Easy, Medium, Hard).
- **Local PvP:** Play against a friend on the same machine.
- **Online Multiplayer:** Powered by **Firebase Realtime Database**, join or create private rooms to play globally.
- **Modern UI:** Premium aesthetics featuring:
  - Dark-mode design with glowing accents.
  - Smooth glassmorphism effects.
  - Interactive micro-animations for dice and buttons.
  - Dynamic score calculation.
- **Multilingual Support:** Available in **English** and **Spanish**.

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML5, CSS3 (Modern features like CSS Variables, Grid, and Flexbox), and JavaScript (ES6+).
- **Backend:** Firebase (Authentication & Realtime Database).
- **Icons:** Custom SVG icons for a consistent premium feel.

## 📦 Getting Started

Since this is a vanilla JavaScript project, no complex installation is required.

1. Clone the repository:
   ```bash
   git clone https://github.com/marcmeru11/Knucklebones.git
   ```
2. Open `index.html` in your favorite web browser.
3. *Note: Firebase features require a valid configuration. If you are deploying your own version, ensure you update the Firebase settings in `src/js/FirebaseService.js`.*

## 📜 Credits

- Inspired by the minigame from **Cult of the Lamb** (Massive Monster / Devolver Digital).
- Created as a fan project for educational and entertainment purposes.

---

*“A game of chance... and consequence.”*
