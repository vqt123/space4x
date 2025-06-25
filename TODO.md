# Space4X - Development Roadmap & TODO

## Current Implementation: Ship Types & Cargo Economy System

### Phase 1: Core Ship System ⏳

#### High Priority
- [ ] **Ship Type Definitions**: Create ship interfaces and data structures
- [ ] **Player Ship State**: Add ship type to player interface and initialization
- [ ] **Ship-Based Travel Costs**: Implement travel cost multipliers per ship type
- [ ] **Cargo Capacity System**: Add cargo capacity to ship definitions

#### Medium Priority  
- [ ] **Port Cargo Tracking**: Replace efficiency multiplier with cargo capacity system
- [ ] **Cargo Depletion Logic**: Ships extract cargo equal to their capacity per trade
- [ ] **Dynamic Port Efficiency**: efficiency = remaining_cargo / 5000
- [ ] **Cargo Regeneration**: Ports slowly regenerate cargo over time

### Phase 2: Ship Purchasing & Upgrades 🚀

#### High Priority
- [ ] **Ship Purchase Interface**: Add ship buying options at upgrade hubs
- [ ] **Ship Cost System**: Define credit costs for each ship type
- [ ] **Ship Switching Logic**: Allow player to change ships at hubs

#### Medium Priority
- [ ] **Bot Ship Variety**: Assign different ship types to AI bots
- [ ] **Ship Visual Differentiation**: Different 3D models/colors per ship type
- [ ] **Ship Stats Display**: Show current ship info in UI

### Phase 3: Enhanced Competition 🎯

#### Low Priority
- [ ] **Bot Ship Strategy**: Bots choose optimal ship types for their strategies
- [ ] **Advanced Cargo Logic**: Multiple cargo types and specializations
- [ ] **Ship Progression Path**: Clear upgrade pathway from Scout → Mega Freighter

## Ship Type Specifications

### Merchant Freighter (Starting Ship)
- **Cargo Capacity**: 100 units
- **Travel Cost Multiplier**: 1.0x (base)
- **Purchase Cost**: N/A (starting ship)
- **Strategy**: Balanced early-game trading

### Scout Courier
- **Cargo Capacity**: 50 units  
- **Travel Cost Multiplier**: 0.7x (30% faster)
- **Purchase Cost**: 5,000 credits
- **Strategy**: Quick runs, exploration, low-efficiency ports

### Heavy Hauler
- **Cargo Capacity**: 300 units
- **Travel Cost Multiplier**: 1.5x (50% slower)
- **Purchase Cost**: 15,000 credits
- **Strategy**: High-efficiency ports, fewer but bigger trades

### Mega Freighter
- **Cargo Capacity**: 500 units
- **Travel Cost Multiplier**: 2.0x (100% slower)
- **Purchase Cost**: 40,000 credits
- **Strategy**: Dominating high-value routes, end-game optimization

## Implementation Notes

- Replace current `currentProfitMultiplier` system with `remainingCargo` tracking
- Ship travel costs = `base_distance_cost * ship_travel_multiplier`
- Profit per trade = `min(ship_cargo_capacity, port_remaining_cargo) * base_profit_per_unit`
- Port efficiency display = `(remaining_cargo / 5000) * 100%`
- Cargo regeneration = +100 units per game cycle (when framecount % 60 === 0)

## Current System Integration

This builds on the existing upgrade hub system - players can now purchase ships AND trade optimization upgrades at the same locations, creating strategic decision points about resource allocation.