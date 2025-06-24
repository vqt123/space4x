# Space4X - Development Roadmap & TODO

## Current Status ✅

- [x] Project setup (React + Vite + Three.js + TypeScript)
- [x] 3D universe with 500 randomly distributed trading ports
- [x] 10 autonomous bots with random movement behavior
- [x] Visual travel lines showing bot destinations
- [x] Camera controls (orbit, zoom, pan)
- [x] Basic lighting and starfield background
- [x] Trading ports sized correctly (0.5 radius)
- [x] Bots render as orange cones, ports as green spheres

## Next Phase: Player Implementation 🚧

Based on discussions, the next step is implementing the player system:

### Player Ship
- [ ] Create player ship component with distinct visual appearance
- [ ] Spawn player at random starting port
- [ ] Track player's current location

### Navigation System  
- [ ] Implement algorithm to find 3 nearest trading ports from current position
- [ ] Create UI component showing current location
- [ ] Create UI component listing 3 nearest destinations with distances
- [ ] Add "Travel" button for each destination option

### Player Movement
- [ ] Implement player travel system at 1 unit/second (same as bots)
- [ ] Add travel progress indicator during movement
- [ ] Update available destinations when player arrives at new port

## Technical Issues to Address 🔧

### Known Problems
- [ ] Fix instanced mesh initialization issues for TradingPorts component
- [ ] Consider performance optimization for 500 individual mesh components

### Code Organization
- [ ] Extract game logic into reusable utilities as complexity grows
- [ ] Add proper TypeScript interfaces for game entities

## Development Notes

- Player will interact only through UI panels, not by clicking 3D objects
- Maintain same travel speed (1 unit/second) for consistency with bots
- UI should show travel time calculations based on distance
- 3D view serves as visualization only, not interaction surface