# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Space4X is a strategic space game built with React, Three.js, and TypeScript. The game features a 3D universe with autonomous trading entities and will eventually include player interaction.

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

**Universe Generation**: The game generates 500 trading ports randomly distributed within a 100x100x100 unit spherical space using spherical coordinates with uniform volume distribution.

**Autonomous Entities**: Bots are autonomous agents that continuously travel between randomly selected trading ports at 1 unit/second speed. Each bot maintains state for current position, origin port, destination port, and travel progress.

**3D Rendering**: Built on @react-three/fiber (React Three.js) with instanced meshes for performance when rendering hundreds of objects. Currently uses individual meshes for ports due to instanced mesh initialization issues.

### Key Components

- **Scene**: Main 3D scene container that generates the universe and manages lighting
- **TradingPorts**: Renders 500 ports as green emissive spheres (0.5 radius)
- **Bots**: Manages autonomous entities as orange cones with real-time movement using useFrame
- **TravelLine**: Renders semi-transparent orange lines showing bot travel paths
- **generatePortsInSphere**: Utility for uniform spherical distribution of trading ports

### Technical Details

**Game Loop**: Uses Three.js useFrame hook for real-time animation at 60fps. Bot positions are interpolated using Vector3.lerpVectors() for smooth movement.

**Camera Setup**: Positioned at [150, 150, 150] with 75° FOV to view the entire universe. OrbitControls allow user navigation with zoom limits (30-400 units).

**Performance**: Currently renders ports as individual meshes (500 React elements) instead of instanced mesh due to initialization timing issues with useLayoutEffect.

## Known Issues

- TradingPorts component has commented-out instanced mesh implementation due to initialization problems
- Individual mesh rendering for 500 ports may impact performance on lower-end devices

## Future Development

The codebase is structured to support:
- Player ship implementation (similar to Bot system)
- UI overlay for game controls
- Trading mechanics between ports
- Navigation system (finding nearest ports)

## Related Documentation

- **DESIGN.md**: Living design document with game vision, mechanics, and principles
- **TODO.md**: Development roadmap with prioritized tasks and current status