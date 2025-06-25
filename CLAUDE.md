# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL DEVELOPMENT WORKFLOW - ALWAYS FOLLOW

**IMPORTANT**: Before implementing any new features or making significant code changes, ALWAYS:
1. Update DESIGN.md with the new feature specifications and architecture details
2. Update TODO.md with implementation tasks and progress tracking
3. Then proceed with code implementation

This ensures continuity if work is interrupted and maintains clear documentation of the system architecture.

## Code Guidelines

- **CRITICAL**: Keep files to less than 250 lines to improve maintainability and readability
- Separate concerns into dedicated component files
- Use proper TypeScript interfaces and types in separate files when appropriate
- Never proactively create documentation files unless explicitly requested

## Project Overview

Space4X is a strategic 3D space trading game with competitive economics, resource management, and real-time AI competition. 

For game mechanics, rules, and configuration details, see DESIGN.md.

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

### Technical Stack
- **Framework**: React + TypeScript + Vite
- **3D Graphics**: Three.js + React Three Fiber + Drei
- **State Management**: React hooks

### Key Components

- **Scene**: Main 3D scene managing universe rendering and entity coordination
- **TradingPorts**: Trading port entities with economic data
- **Bots**: AI trader implementation
- **PlayerShip**: User-controlled entity
- **GameUI**: Trading terminal interface
- **Leaderboard**: Real-time ranking system
- **CameraController**: Center-focused camera system

### Technical Details

**State Management**: React hooks with proper synchronization to prevent race conditions. Port references are automatically updated across all entities when efficiency changes.

**Game Loop**: 60fps animation using Three.js useFrame. Smooth interpolation for movement with collision detection for arrival at destinations.

**Camera System**: Custom center-focused controller that keeps player ship centered while always looking toward universe center (0,0,0). Mouse wheel controls zoom distance.

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

## Current Focus

Performance optimizations are not a current priority. The game runs smoothly and all core systems are functional. Focus is on expanding gameplay mechanics and features rather than technical optimizations.

## Related Documentation

- **DESIGN.md**: Living design document with game vision, mechanics, and principles
- **TODO.md**: Development roadmap with prioritized tasks and current status