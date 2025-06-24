# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Space4X is a strategic 3D space trading game with competitive economics, resource management, and real-time AI competition. Players compete against intelligent bots in a dynamic economy while managing limited action points for maximum profit.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### Core Game Systems

**Universe Generation**: 500 trading ports randomly distributed within a 100x100x100 unit spherical space. Each port has randomized base profit (40-120 credits), trade costs (10-25 action points), and dynamic efficiency multipliers.

**Trading Economy**: Complete economic system with diminishing returns, resource constraints, and competitive dynamics. Port efficiency decreases by 15% (player trades) or 10% (bot trades) to prevent camping and encourage strategic movement.

**Competitive AI**: 10 intelligent trading bots (Alpha, Beta, Gamma, etc.) with 300-500 starting action points. Bots make strategic decisions based on resource availability and choose profitable routes while respecting action point constraints.

**Player System**: Blue cone ship with 500 starting action points. Player selects from current port or 3 nearest destinations, with full cost/benefit analysis displayed for strategic decision making.

### Key Components

- **Scene**: Main 3D scene managing universe rendering and entity coordination
- **TradingPorts**: 500 green spheres (0.5 radius) with economic data and efficiency tracking
- **Bots**: Intelligent AI traders with resource management and strategic behavior
- **PlayerShip**: User-controlled entity with action point constraints and profit tracking
- **GameUI**: Trading terminal with current options, profit analysis, and decision support
- **Leaderboard**: Real-time ranking system showing player vs bot performance
- **CameraController**: Center-focused camera system with scroll wheel zoom

### Economic System Architecture

**TradeOption Interface**: Calculates profit, costs, travel time, and profit/action ratios for informed decision making.

**Diminishing Returns**: Port efficiency multipliers decrease with each trade, creating dynamic market conditions and encouraging movement.

**Resource Management**: Action points create strategic constraints, forcing players to optimize route planning and trade timing.

**Competitive Dynamics**: Bots and player compete for high-efficiency ports, creating market pressure and strategic urgency.

### Technical Details

**State Management**: React hooks with proper synchronization to prevent race conditions. Port references are automatically updated across all entities when efficiency changes.

**Game Loop**: 60fps animation using Three.js useFrame. Smooth interpolation for movement with collision detection for arrival at destinations.

**Camera System**: Custom center-focused controller that keeps player ship centered while always looking toward universe center (0,0,0). Mouse wheel controls zoom distance (10-200 units).

**Performance Optimizations**: Bot state persistence prevents reinitialization on port updates. Port reference syncing maintains entity relationships across state changes.

## Key Interfaces

```typescript
interface TradingPort {
  id: number
  position: Vector3
  name: string
  baseProfit: number
  currentProfitMultiplier: number
  tradeCost: number
}

interface Player {
  position: Vector3
  currentPort: TradingPort
  destinationPort: TradingPort | null
  progress: number
  speed: number
  isMoving: boolean
  actionPoints: number
  totalProfit: number
}

interface Bot {
  id: number
  position: Vector3
  currentPort: TradingPort
  destinationPort: TradingPort
  progress: number
  speed: number
  actionPoints: number
  totalProfit: number
  name: string
}
```

## Code Guidelines

- Keep files to less than 250 lines to improve maintainability and readability
- Separate concerns into dedicated component files
- Use proper TypeScript interfaces and types in separate files when appropriate

## Current Focus

Performance optimizations are not a current priority. The game runs smoothly and all core systems are functional. Focus is on expanding gameplay mechanics and features rather than technical optimizations.

## Gameplay Flow

1. **Decision Phase**: Player views current port vs 3 nearest destinations with profit/action analysis
2. **Execution Phase**: Player commits action points for trade or travel
3. **Competition Phase**: Watch AI bots make their own strategic decisions
4. **Feedback Phase**: See ranking changes and efficiency updates in real-time
5. **Strategic Planning**: Adapt strategy based on market conditions and remaining resources

## Related Documentation

- **DESIGN.md**: Living design document with game vision, mechanics, and principles
- **TODO.md**: Development roadmap with prioritized tasks and current status