# Circuit Simulator - React Version

A React-based circuit simulator for R, RL, RC, and RLC circuits with frequency and time domain analysis.

## Features

- **Circuit Types**: R, RC, RL, RLC circuits
- **Analysis Modes**:
  - Frequency response analysis
  - Time domain analysis (charge/discharge)
- **Interactive Controls**:
  - Real-time parameter adjustment
  - Battery connection toggle for time analysis
  - Plot zoom and reset functionality
- **Visualization**: Interactive plots using Plotly.js

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## Usage

1. **Select Circuit Type**: Choose from R, RC, RL, or RLC
2. **Choose Analysis Mode**:
   - Frequency: Shows impedance vs frequency response
   - Time: Shows charge/discharge behavior
3. **Adjust Parameters**:
   - R: Resistance in Ohms
   - L: Inductance in mH
   - C: Capacitance in nF
   - V: Voltage in Volts
   - Rs: Series resistance (damping)
4. **Battery Control**: Toggle battery connection for time analysis
5. **Interactive Plot**: Zoom, pan, and reset the plot view

## Circuit Analysis

### Frequency Response

- Calculates impedance and current vs frequency
- Shows resonance frequency for RLC circuits
- Logarithmic frequency scale from 100Hz to 50kHz

### Time Response

- RC circuits: Capacitor voltage charge/discharge curves
- RL circuits: Inductor current rise/decay curves
- RLC circuits: Overdamped, critically damped, or underdamped response

## Technology Stack

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Plotly.js** - Interactive plotting
- **CSS** - Custom styling with CSS variables

## Project Structure

```
src/
├── App.jsx          # Main circuit simulator component
├── App.css          # Component styles
├── main.jsx         # React app entry point
├── index.css        # Global styles
└── assets/          # Static assets
```

## Original Implementation

This React version is a 1:1 port of the original Python/Tkinter simulator, maintaining the same mathematical formulas and circuit analysis algorithms.
