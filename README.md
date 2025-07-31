# Expo Finance Calculator App

A modern finance calculator built with Expo SDK 53, React Native, and NativeWind.

## Features

- **Simple Interest Calculator** - Calculate simple interest with interactive visualizations
- **Loan EMI Calculator** - Calculate monthly EMI for loans with detailed breakdowns
- **Modern UI** - Built with React Native Paper and NativeWind (Tailwind CSS)
- **Cross-platform** - Runs on iOS, Android, and Web
- **Latest Tech Stack** - Expo SDK 53, React Native 0.79.5, TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (optional, but recommended)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator (macOS only)
- `npm run web` - Run in web browser

## Tech Stack

- **Expo SDK 53** - Latest Expo framework
- **React Native 0.79.5** - Latest React Native
- **Expo Router 5.1.4** - File-based routing
- **React Native Paper 5.12.6** - Material Design components
- **NativeWind 4.1.23** - Tailwind CSS for React Native
- **TypeScript** - Type safety
- **React Query** - Data fetching and state management
- **React Hook Form + Zod** - Form validation
- **Metro** - JavaScript bundler

## Project Structure

```
├── app/                    # Expo Router pages
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Home page
├── src/
│   ├── components/        # React Native components
│   │   ├── FinanceCalculator.tsx
│   │   ├── SimpleInterestCalculator.tsx
│   │   ├── LoanEmiCalculator.tsx
│   │   └── GraphPlot.tsx
│   ├── lib/              # Utility functions
│   └── hooks/            # Custom hooks
├── assets/               # Images and static files
├── App.tsx              # Main app component
├── app.json             # Expo configuration
├── babel.config.js      # Babel configuration
├── metro.config.js      # Metro bundler configuration
├── tailwind.config.js   # NativeWind configuration
└── global.css          # Global styles
```

## Features Implemented

### Simple Interest Calculator
- Principal amount input with validation
- Interest rate and time period inputs
- Real-time calculation with results display
- Growth visualization over time
- Currency formatting (INR)

### Loan EMI Calculator
- Loan amount, interest rate, and tenure inputs
- Monthly EMI calculation
- Total interest and amount breakdown
- Formula display and loan summary

### UI/UX Features
- Material Design with React Native Paper
- Responsive design with NativeWind
- Form validation with error messages
- Clean and modern interface
- Cross-platform compatibility

## Development

This app was migrated from a React web application to React Native using Expo SDK 53. All components have been rewritten to use React Native equivalents while maintaining the same functionality.

## License

MIT License
