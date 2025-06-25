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
- **Cargo**: Each port starts with 1000-3000 cargo holds
- **Trade Cost**: Fixed 10 action points per trade
- **Efficiency Colors**: Green (75-100%), Yellow (50-75%), Orange (25-50%), Red (0-25%)

### Ship Types & Fleet Diversity
- **Merchant Freighter** (Starting): 50 cargo holds (max 200), 1.0x travel cost (balanced)
- **Scout Courier**: 25 cargo holds (max 100), 0.7x travel cost (speed specialist)
- **Heavy Hauler**: 75 cargo holds (max 300), 1.5x travel cost (capacity specialist)
- **Mega Freighter**: 100 cargo holds (max 500), 2.0x travel cost (end-game domination)

### Competitive Ecosystem
- **Player**: Starts with Merchant Freighter, 500 action points, 50 cargo holds
- **AI Traders**: 10 named bots with 500 action points and 25 cargo holds
- **Bot Strategy**: Trade at ports until efficiency drops below 50% (orange), then move to nearest port
- **Action Cooldown**: 0.5 second cooldown between bot actions
- **Movement Speed**: 3x faster than original design for better pacing

## Core Gameplay Loop

### Strategic Decision Making
1. **Assess Current Options**: View current port vs 3 nearest destinations
2. **Analyze Profit/Action Ratios**: Make optimal resource allocation decisions
3. **Execute Trade or Travel**: Commit action points for maximum return
4. **Wait for Cooldown**: 0.5 second delay between all actions
5. **Monitor Competition**: Track performance against AI traders via leaderboard

### Resource Management
- **Action Points**: Limited resource creating strategic constraints
- **Travel Costs**: Ship-dependent (0.7x to 2.0x base distance cost)
- **Trade Costs**: Fixed 10 action points per trade
- **Cargo Holds**: Ship-dependent (25-100 starting, upgradeable at hubs)
- **Ship Selection**: Balance speed vs capacity vs upgrade costs

### Action Cooldown System
- **Universal Cooldown**: 0.5 seconds between all player and bot actions
- **Actions Affected**: Trading, traveling, cargo hold upgrades
- **Purpose**: Prevents action spamming and creates realistic pacing
- **Visual Feedback**: Buttons disabled and grayed out during cooldown
- **Cooldown Indicator**: Shows "⏱️ Cooldown Active" in player stats

## User Interface Design

### Trading Terminal (Left Panel)
- **Player Stats**: Action points, total profit, current location, ship type
- **Ship Information**: Cargo capacity, travel cost multiplier, current cargo
- **Trade Options**: Current port + 3 nearest destinations with full analytics
- **Decision Support**: Profit, cost, profit/action ratio, port cargo remaining
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

### Cargo-Based Economy
- **Port Cargo Capacity**: Each port starts with 1000-3000 cargo holds
- **Cargo Depletion**: Ships extract cargo equal to their cargo holds per trade
- **Profit Formula**: efficiency × 100 credits per cargo hold (100 credits/hold at 100%, 50 at 50%)
- **Dynamic Efficiency**: Port efficiency = remaining_cargo / max_cargo (0-100%)
- **Credits vs Total Profit**: Credits are spendable, Total Profit tracks lifetime earnings

### Dynamic Pricing
- **Real-time Updates**: Port profitability changes based on trading activity
- **Market Forces**: High-efficiency ports become targets for multiple traders
- **Strategic Depth**: Timing and route planning become crucial

## Technical Architecture

### Target Client-Server Implementation
- **Server**: Node.js + TypeScript + Socket.io
- **Client**: Pure Three.js + React UI + WebSocket
- **Game Loop**: 100ms server ticks (10 TPS)
- **Action Cooldown**: 500ms (5 server ticks)
- **Communication**: WebSocket with real-time state sync
- **Authority**: Server-side game state and validation

### Server Architecture
- **GameLoop**: 100ms tick-based authoritative game state
- **TickManager**: Precise timing and tick counting system
- **GameWorld**: Central state management for all entities
- **Systems**: Modular game logic (Movement, Trading, Economy, Cooldown)
- **Entities**: Server-side Player, Bot, TradingPort, Leaderboard
- **Network**: Socket.io WebSocket management and message routing
- **Bot AI**: Server-side intelligent trading behavior with 5-tick cooldowns

### Client Architecture
- **ThreeRenderer**: Pure Three.js 3D scene (no React Three Fiber)
- **GameClient**: WebSocket communication with server
- **Interpolation**: Smooth movement between server updates
- **UI Layer**: React components for interface only (no game logic)
- **Prediction**: Client-side movement prediction for responsiveness

### Message Protocol
```typescript
// Client to Server
interface PlayerAction {
  type: 'TRADE' | 'TRAVEL' | 'UPGRADE_CARGO'
  targetId?: number
}

// Server to Client (every 100ms)
interface GameStateUpdate {
  tick: number
  timestamp: number
  players: PlayerState[]
  bots: BotState[]
  ports: PortState[]
  leaderboard: LeaderboardEntry[]
}
```

### Server Performance Specifications
- **Tick Rate**: 100ms (10 TPS)
- **Action Validation**: 5-tick cooldown enforcement
- **Max Concurrent Players**: 50+
- **Bot AI**: Strategic decisions every tick with cooldown respect
- **Leaderboard**: Real-time server-side ranking calculation
- **State Broadcasting**: Delta updates to minimize bandwidth

### Client Performance Specifications
- **Rendering**: 60fps Three.js rendering independent of server ticks
- **Interpolation**: Smooth movement between 100ms server updates
- **Prediction**: Client-side position prediction for input responsiveness
- **UI**: React components for trading interface and leaderboard display
- **Memory**: Minimal client state (server is single source of truth)

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