# CLAUDE.md

**CRITICAL**: NEVER use `cd` with `&&` in background processes - it locks up the terminal. Use separate commands:
```bash
# WRONG - locks terminal:
cd server && npm run dev > /dev/null 2>&1 &

# CORRECT - use full paths or separate commands:
nohup npm --prefix server run dev > server.log 2>&1 &
# OR
bash -c "cd server && npm run dev" > server.log 2>&1 &
```

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL DEVELOPMENT WORKFLOW - ALWAYS FOLLOW

**IMPORTANT**: Before implementing any new features or making significant code changes, ALWAYS:
1. Update DESIGN.md with the new feature specifications and architecture details
2. Update TODO.md with implementation tasks and progress tracking
3. Then proceed with code implementation

This ensures continuity if work is interrupted and maintains clear documentation of the system architecture.

## CLIENT-SERVER DEVELOPMENT WORKFLOW

**Current Priority**: Converting from single-client to client-server architecture

### Server Development (Node.js + TypeScript)
```bash
cd server/
npm run dev        # Start server with hot reload
npm run build      # Build server for production
npm test           # Run server-side tests
```

### Client Development (Pure Three.js + React UI)
```bash
cd client/         # After conversion from current src/
npm run dev        # Start client development server  
npm run build      # Build client for production
```

### Development Order
1. **Server First**: Implement server-side game logic with 100ms ticks
2. **Client Second**: Convert existing React Three Fiber to pure Three.js
3. **Integration**: Connect client and server via WebSocket
4. **Testing**: Multi-client testing and performance validation

## Code Guidelines

- **CRITICAL**: Keep files to less than 250 lines to improve maintainability and readability
- Separate concerns into dedicated component files
- Use proper TypeScript interfaces and types in separate files when appropriate
- Never proactively create documentation files unless explicitly requested

## Project Overview

Space4X is a strategic 3D space trading game with competitive economics, resource management, and real-time AI competition. 

For game mechanics, rules, and configuration details, see DESIGN.md.

## Development Commands

### Legacy Commands (Pre-Conversion)
```bash
# Start development server (React Three Fiber client)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Server Commands (After Conversion)
```bash
cd server/
npm install
npm run dev > /dev/null 2>&1 &        # Development with hot reload (background)
npm run build      # Production build
npm start          # Start production server
npm test           # Run tests
```

### Client Commands (After Conversion)
```bash
cd client/
npm install  
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview production build
```

## Architecture

### Current Technical Stack (Legacy - Pre-Conversion)
- **Framework**: React + TypeScript + Vite
- **3D Graphics**: Three.js + React Three Fiber + Drei
- **State Management**: React hooks

### Target Technical Stack (Client-Server)
- **Server**: Node.js + TypeScript + Socket.io + Express
- **Client**: Pure Three.js + React UI + WebSocket
- **Communication**: WebSocket with 100ms server ticks
- **State Authority**: Server-side validation and game loop

### Server Components (Target)
- **GameWorld**: Central authoritative game state management
- **GameLoop**: 100ms tick-based server updates (10 TPS)  
- **TickManager**: Precise timing and tick counting
- **Systems**: Movement, Trading, Economy, Cooldown (5-tick = 500ms)
- **Entities**: Server-side Player, Bot, TradingPort, Leaderboard
- **Network**: Socket.io WebSocket management and message routing
- **Bot AI**: Server-side intelligent trading with proper cooldowns

### Client Components (Target)
- **ThreeRenderer**: Pure Three.js 3D scene (no React Three Fiber)
- **GameClient**: WebSocket communication with server
- **UI Components**: React for interface only (GameUI, Leaderboard)
- **Interpolation**: Smooth movement between server updates
- **Prediction**: Client-side input responsiveness

### Technical Details

**Server Authority**: All game logic runs on server with 100ms ticks. Clients are thin visualization layers.

**Tick System**: Server operates on precise 100ms intervals. Actions have 5-tick (500ms) cooldowns.

**Communication**: WebSocket messages every 100ms with game state updates. Clients send action requests.

**Rendering**: Client-side 60fps Three.js rendering independent of server tick rate with smooth interpolation.

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