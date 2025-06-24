# Space4X - Living Design Document

## Current Game State

Space4X is a strategic 3D space trading game featuring competitive economics, resource management, and real-time competition against AI traders.

## Game Universe

### Spatial Design
- **Scale**: 100x100x100 unit spherical space
- **Density**: 500 trading ports uniformly distributed
- **Visualization**: Center-focused 3D camera with scroll wheel zoom
- **Navigation**: Player ship always centered, camera looks toward universe center

### Trading Ports
- **Representation**: Green glowing spheres (0.5 unit radius)
- **Naming**: Alphanumeric system (Port A1, A2... Z26)
- **Economics**: Base profit (40-120 credits), trade cost (10-25 action points)
- **Diminishing Returns**: Efficiency decreases by 15% (player) or 10% (bots) per trade

### Competitive Ecosystem
- **Player**: Blue cone ship with 500 starting action points
- **AI Traders**: 10 named bots (Alpha, Beta, Gamma, etc.) with 300-500 action points
- **Intelligent Behavior**: Bots make strategic decisions based on resource constraints
- **Economic Competition**: All entities compete for profitable trading opportunities

## Core Gameplay Loop

### Strategic Decision Making
1. **Assess Current Options**: View current port vs 3 nearest destinations
2. **Analyze Profit/Action Ratios**: Make optimal resource allocation decisions
3. **Execute Trade or Travel**: Commit action points for maximum return
4. **Monitor Competition**: Track performance against AI traders via leaderboard

### Resource Management
- **Action Points**: Limited resource creating strategic constraints
- **Travel Costs**: 1 action point per unit of distance
- **Trade Costs**: Variable per port (10-25 action points)
- **Profit Optimization**: Balance travel investment vs immediate gains

## User Interface Design

### Trading Terminal (Left Panel)
- **Player Stats**: Action points, total profit, current location
- **Trade Options**: Current port + 3 nearest destinations with full analytics
- **Decision Support**: Profit, cost, profit/action ratio, efficiency percentage
- **Visual Hierarchy**: Current port highlighted, affordability indicators

### Live Leaderboard (Right Panel)
- **Real-time Rankings**: Player vs AI traders by total credits
- **Performance Metrics**: Credits earned and remaining action points
- **Competitive Feedback**: Immediate ranking changes based on decisions

### 3D Visualization
- **Spatial Awareness**: Universe layout and entity positions
- **Travel Feedback**: Lines showing destination paths for all entities
- **Center-focused View**: Always oriented toward universe center
- **Zoom Control**: Mouse wheel for different viewing distances

## Economic Systems

### Diminishing Returns
- **Port Efficiency**: Starts at 100%, decreases with each trade
- **Player Impact**: 15% reduction per trade (higher impact)
- **Bot Impact**: 10% reduction per trade (competitive pressure)
- **Strategic Implication**: Encourages movement and prevents camping

### Dynamic Pricing
- **Real-time Updates**: Port profitability changes based on trading activity
- **Market Forces**: High-efficiency ports become targets for multiple traders
- **Strategic Depth**: Timing and route planning become crucial

## Technical Architecture

### Current Implementation
- **Framework**: React 19.1.0 + TypeScript 5.8.3 + Vite 6.3.5
- **3D Graphics**: Three.js 0.177.0 + React Three Fiber 9.1.2 + Drei 10.3.0
- **State Management**: React hooks with proper synchronization across components
- **Rendering**: Individual mesh components for 500 trading ports
- **Animation**: 60fps game loop using Three.js useFrame hook
- **Camera System**: Custom center-focused controller with scroll wheel zoom (10-200 units)

### Component Architecture
- **App.tsx**: Main orchestrator with state management and event coordination (108 lines)
- **Scene.tsx**: 3D scene composition and entity rendering (51 lines)
- **Bots.tsx**: AI trading system with strategic decision-making (179 lines)
- **GameUI.tsx**: Trading terminal with decision support interface (151 lines)
- **PlayerMovement.tsx**: Ship movement logic with smooth interpolation (73 lines)
- **types.ts**: Comprehensive TypeScript interfaces (42 lines)
- **utils.ts**: Economic calculations and universe generation (86 lines)

### Performance Optimizations
- **Component Separation**: Well-organized single-responsibility components
- **Bot State Persistence**: Prevents reinitialization on port updates
- **Port Reference Syncing**: Maintains entity relationships across state changes
- **Type Safety**: Comprehensive TypeScript interfaces preventing runtime errors

### Current Technical Debt
- **Rendering Performance**: 500 individual port meshes (needs instanced mesh optimization)
- **State Updates**: Multiple setPorts calls could cause unnecessary re-renders
- **Memory Management**: Frequent Vector3 cloning in movement calculations

## First-Minute Experience

### Immediate Engagement
- **Clear Objectives**: Maximize profit with limited action points
- **Instant Feedback**: See efficiency decrease and rankings change
- **Strategic Depth**: Multiple viable approaches to optimization
- **Competitive Pressure**: AI traders creating urgency and comparison

### Learning Curve
- **Self-Explanatory**: Profit/action ratios make optimal choices obvious
- **Progressive Complexity**: Simple decisions reveal deeper strategic layers
- **Visual Clarity**: All necessary information displayed without clutter