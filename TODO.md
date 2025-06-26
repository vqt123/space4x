# Space4X - Development Roadmap & TODO

## Recent Completed Tasks (December 2024)

### UI Improvements & Bug Fixes ✅ COMPLETED
- [x] **Fixed Duplicate Keys**: Added unique ID fields to LeaderboardEntry interface to fix React key warnings
- [x] **Cooldown Bar Enhancement**: Implemented client-side cooldown animation (500ms) independent of server state
- [x] **Camera Positioning**: Fixed camera to position behind player while looking toward universe center
- [x] **Port Display Expansion**: Increased trade options from 3 to 5 nearest ports
- [x] **Hover Line Preview**: Added orange line visualization when hovering over port trade options
- [x] **Real-time Port Updates**: Fixed port statistics not updating after trades by including ports in dynamic state broadcasts
- [x] **Error Propagation**: Removed null checks to allow early error detection and easier debugging

### Technical Debt Resolution ✅ COMPLETED
- [x] **Server-Client Type Sync**: Synchronized LeaderboardEntry and DynamicStateUpdate interfaces between server and client
- [x] **WebSocket Optimization**: Implemented proper dynamic state updates including port data every 100ms
- [x] **Client State Management**: Fixed React state updates to trigger proper re-renders for port statistics

## Current Priority: Client-Server Architecture Conversion

### Phase 1: Server Foundation 🚀 (IN PROGRESS)

#### High Priority - Week 1
- [x] **Architecture Documentation**: Update DESIGN.md with client-server specs
- [ ] **TODO Roadmap**: Document conversion phases and milestones  
- [ ] **Development Workflow**: Update CLAUDE.md with server/client workflow
- [ ] **Server Directory**: Create server project structure
- [ ] **Server Dependencies**: Set up package.json with Socket.io, Express, TypeScript
- [ ] **Core Game Loop**: Implement 100ms tick-based server game loop
- [ ] **Tick Manager**: Precise timing and tick counting system
- [ ] **Server Types**: Migrate and adapt game interfaces for server use

#### Medium Priority - Week 1-2
- [ ] **Game State Management**: Central GameWorld class for all entity state
- [ ] **Systems Architecture**: Modular systems (Movement, Trading, Economy, Cooldown)
- [ ] **Bot Migration**: Move bot AI logic from client to server
- [ ] **5-Tick Cooldowns**: Implement 500ms (5 server ticks) action cooldowns
- [ ] **WebSocket Server**: Socket.io server with player connection handling
- [ ] **Message Protocol**: Define client-server communication interface
- [ ] **Server-side Leaderboard**: Real-time ranking calculation and management

### Phase 2: Client Conversion 🎯 (UPCOMING)

#### High Priority - Week 2-3
- [ ] **Remove React Three Fiber**: Strip out RTF and Drei dependencies
- [ ] **Pure Three.js Renderer**: Direct Three.js scene management
- [ ] **WebSocket Client**: Client-side Socket.io integration
- [ ] **Game State Interpolation**: Smooth movement between server updates
- [ ] **Client Prediction**: Responsive input handling with lag compensation

#### Medium Priority - Week 3
- [ ] **UI Separation**: React components for interface only (no game logic)
- [ ] **Message Handling**: Client-side server message processing
- [ ] **Visual Feedback**: Client-side cooldown and action validation
- [ ] **Performance Optimization**: Efficient rendering and state updates

### Phase 3: Integration & Testing 🧪 (UPCOMING)

#### High Priority - Week 3-4
- [ ] **Full Integration**: Connect client and server systems
- [ ] **Multiplayer Testing**: Multiple client connections
- [ ] **State Synchronization**: Ensure client-server consistency
- [ ] **Error Handling**: Disconnection and reconnection logic

#### Medium Priority - Week 4
- [ ] **Performance Tuning**: Optimize tick rate and message frequency
- [ ] **Security Validation**: Server-side action validation
- [ ] **Admin Tools**: Server monitoring and management
- [ ] **Documentation**: Complete setup and deployment guides

## Technical Specifications

### Server Requirements
- **Node.js**: 18+ with TypeScript support
- **Game Loop**: 100ms ticks (10 TPS)
- **Action Cooldown**: 500ms (5 ticks)
- **WebSocket**: Socket.io for real-time communication
- **State Authority**: Server validates all player actions
- **Bot AI**: Server-side intelligent trading with proper cooldowns

### Client Requirements
- **3D Rendering**: Pure Three.js (remove React Three Fiber)
- **UI Framework**: React for interface components only
- **Communication**: WebSocket client for server sync
- **Rendering**: 60fps independent of server tick rate
- **Interpolation**: Smooth movement between server updates

### Message Protocol
```typescript
// Client → Server
interface PlayerAction {
  type: 'TRADE' | 'TRAVEL' | 'UPGRADE_CARGO'
  targetId?: number
}

// Server → Client (every 100ms)
interface GameStateUpdate {
  tick: number
  timestamp: number
  players: PlayerState[]
  bots: BotState[]
  ports: PortState[]
  leaderboard: LeaderboardEntry[]
}
```

## Legacy Implementation Notes (Pre-Conversion)

### Completed Ship System Features
- **Ship Types**: Merchant Freighter, Scout Courier, Heavy Hauler, Mega Freighter
- **Cargo System**: Ship-based cargo capacity and port cargo depletion
- **Travel Costs**: Ship-dependent travel cost multipliers
- **Upgrade Hubs**: Cargo hold upgrades and ship purchasing locations
- **Dynamic Economy**: Port efficiency based on remaining cargo

### System Integration Points
- Ship selection affects travel costs and cargo capacity
- Port efficiency drives strategic decisions about routes
- Upgrade hubs serve as strategic decision points for resource allocation
- Bot AI respects cooldowns and makes strategic trading decisions

## Development Environment

### Repository Structure (Target)
```
space4x/
├── client/          # Pure Three.js + React UI
├── server/          # Node.js + Socket.io game server  
├── shared/          # Common types and constants
└── docs/           # Architecture and setup documentation
```

### Current Structure (Legacy)
```
space4x/
├── src/            # React Three Fiber application
├── DESIGN.md       # Updated with client-server architecture
├── TODO.md         # This conversion roadmap
└── CLAUDE.md       # Development workflow (to be updated)
```

## Success Metrics
- [ ] Multiple clients can connect simultaneously
- [ ] Server maintains 100ms tick rate under load
- [ ] Client renders at 60fps with smooth interpolation
- [ ] All game mechanics work identically to single-player version
- [ ] Server-side bot AI behaves strategically with proper cooldowns
- [ ] Leaderboard updates in real-time across all clients