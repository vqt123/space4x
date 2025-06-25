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

**Universe Generation**: 500 trading ports randomly distributed within a 100x100x100 unit spherical space. Each port starts with 1000-3000 cargo holds that deplete as traders extract resources.

**Trading Economy**: Cargo-based economy where port efficiency = remainingCargo/maxCargo. At 100% efficiency, traders earn 100 credits per cargo hold. All trades cost a fixed 10 action points. Ports change color based on efficiency: green (75-100%), yellow (50-75%), orange (25-50%), red (0-25%).

**Competitive AI**: 10 intelligent trading bots (Alpha, Beta, Gamma, etc.) with 500 starting action points and 25 cargo holds. Bots trade at ports until efficiency drops below 50% (orange), then move to the nearest port. All actions have a 0.5 second cooldown.

**Player System**: Blue cone ship with 500 starting action points, 50 cargo holds (upgradeable to 200), and separate credits/totalProfit tracking. Players can always travel to the 3 nearest ports or upgrade cargo holds at blue cube hubs. Movement speed is 3x faster than original.

### Key Components

- **Scene**: Main 3D scene managing universe rendering and entity coordination
- **TradingPorts**: 500 green spheres (0.5 radius) with economic data and efficiency tracking
- **Bots**: Intelligent AI traders with resource management and strategic behavior
- **PlayerShip**: User-controlled entity with action point constraints and profit tracking
- **GameUI**: Trading terminal with current options, profit analysis, and decision support
- **Leaderboard**: Real-time ranking system showing player vs bot performance
- **CameraController**: Center-focused camera system with scroll wheel zoom

### Economic System Architecture

**Cargo-Based Trading**: Ports have 1000-3000 cargo holds. Each cargo hold traded yields efficiency × 100 credits (100 credits at 100% efficiency, 50 at 50%, etc).

**Fixed Trade Cost**: All trades cost exactly 10 action points, simplifying economic calculations.

**Efficiency System**: Port efficiency = remainingCargo / maxCargo. Visual indicators: Green (75-100%), Yellow (50-75%), Orange (25-50%), Red (0-25%).

**Credits vs Total Profit**: Credits are spendable currency for upgrades. Total Profit tracks lifetime earnings for leaderboard ranking.

**Cargo Hold Upgrades**: Players can upgrade from 50 to 200 cargo holds at upgrade hubs. Cost increases exponentially: 1000 × 1.1^upgradeNumber.

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
  remainingCargo: number
  maxCargo: number
}

interface Player {
  position: Vector3
  currentPort: TradingPort
  destinationPort: TradingPort | null
  progress: number
  speed: number
  isMoving: boolean
  actionPoints: number
  credits: number
  totalProfit: number
  cargoHolds: number
  shipType: ShipType
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
  shipType: ShipType
  cargoHolds: number
  lastActionTime?: number
}
```

## Code Guidelines

- Keep files to less than 250 lines to improve maintainability and readability
- Separate concerns into dedicated component files
- Use proper TypeScript interfaces and types in separate files when appropriate

## Development Workflow

**IMPORTANT**: Before implementing any new features or making significant code changes, ALWAYS:
1. Update DESIGN.md with the new feature specifications and architecture details
2. Update TODO.md with implementation tasks and progress tracking
3. Then proceed with code implementation

This ensures continuity if work is interrupted and maintains clear documentation of the system architecture.

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