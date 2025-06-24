# Space4X - Living Design Document

## Current Game State

Space4X is a 3D space game featuring autonomous trading entities in a spherical universe.

## Game Universe

### Spatial Design
- **Scale**: 100x100x100 unit spherical space
- **Density**: 500 trading ports uniformly distributed
- **Visualization**: 3D view with orbit camera controls

### Trading Ports
- **Representation**: Green glowing spheres (0.5 unit radius)
- **Naming**: Alphanumeric system (Port A1, A2... Z26)
- **Distribution**: Randomly placed using spherical coordinates

### Autonomous Traffic
- **NPCs**: 10 autonomous bots
- **Behavior**: Random movement between ports at 1 unit/second
- **Visual Feedback**: Orange travel lines showing current destinations
- **Appearance**: Orange cone-shaped entities

## Planned Player Features (Discussed)

### Core Mechanics
- **Navigation**: Player will select from 3 nearest trading ports as destinations
- **Travel**: Player ship travels at 1 unit/second (same as bots)
- **UI-driven Interaction**: No direct 3D clicking, all interaction through standard web UI

### Interface Design
- Player interacts only with UI panels, not directly with 3D scene
- 3D view serves as visualization, not interaction surface

## Technical Architecture

### Current Implementation
- **Framework**: React + Three.js + TypeScript + Vite
- **Rendering**: Individual meshes for ports (instanced mesh had initialization issues)
- **Animation**: useFrame hook for 60fps bot movement
- **Camera**: Positioned at [150, 150, 150] with orbit controls

### Performance Considerations
- 500 individual React mesh components for ports
- Real-time animation for 10 moving bots
- Travel line rendering for each bot