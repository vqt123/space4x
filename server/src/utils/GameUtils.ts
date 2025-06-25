import { Vector3, TradingPort, UpgradeHub, ShipType } from '../types/ServerTypes'

/**
 * Server-side game utility functions
 * Migrated from client-side utils with server Vector3 implementation
 */

export const FIXED_TRADE_COST = 10 // All trades cost 10 action points

export const SHIP_TYPES: ShipType[] = [
  {
    id: 'merchant_freighter',
    name: 'Merchant Freighter',
    startingCargoHolds: 50,
    maxCargoHolds: 200,
    travelCostMultiplier: 1.0,
    purchaseCost: 0, // Starting ship
    description: 'Balanced trading vessel with expandable cargo capacity'
  },
  {
    id: 'scout_courier',
    name: 'Scout Courier',
    startingCargoHolds: 25,
    maxCargoHolds: 100,
    travelCostMultiplier: 0.7,
    purchaseCost: 5000,
    description: 'Fast ship with limited cargo but excellent speed'
  },
  {
    id: 'heavy_hauler',
    name: 'Heavy Hauler',
    startingCargoHolds: 75,
    maxCargoHolds: 300,
    travelCostMultiplier: 1.5,
    purchaseCost: 15000,
    description: 'High-capacity vessel for serious bulk trading'
  },
  {
    id: 'mega_freighter',
    name: 'Mega Freighter',
    startingCargoHolds: 100,
    maxCargoHolds: 500,
    travelCostMultiplier: 2.0,
    purchaseCost: 40000,
    description: 'Massive ship for industrial-scale cargo operations'
  }
]

/**
 * Calculate profit from trading at a port
 */
export function calculateTradeProfit(port: TradingPort, cargoHolds: number): number {
  // Port efficiency based on remaining cargo (0-1)
  const portEfficiency = port.remainingCargo / port.maxCargo
  
  // Cargo holds that can be filled (limited by ship capacity and available cargo)
  const cargoHoldsFilled = Math.min(cargoHolds, port.remainingCargo)
  
  // Profit per cargo hold = efficiency * 100 credits
  // At 100% efficiency: 100 credits per hold
  // At 50% efficiency: 50 credits per hold, etc.
  const profitPerHold = portEfficiency * 100
  const totalProfit = Math.floor(cargoHoldsFilled * profitPerHold)
  
  return totalProfit
}

/**
 * Calculate travel cost based on distance and ship type
 */
export function calculateTravelCost(distance: number, shipType?: ShipType): number {
  const baseCost = Math.ceil(distance) // 1 action point per unit of distance
  const multiplier = shipType ? shipType.travelCostMultiplier : 1.0
  return Math.ceil(baseCost * multiplier)
}

/**
 * Find nearest ports to a position
 */
export function findNearestPorts(
  position: Vector3, 
  allPorts: TradingPort[], 
  excludePortId?: number,
  count: number = 3
): TradingPort[] {
  return allPorts
    .filter(port => excludePortId === undefined || port.id !== excludePortId)
    .map(port => ({
      ...port,
      distance: position.distanceTo(port.position)
    }))
    .sort((a, b) => (a as any).distance - (b as any).distance)
    .slice(0, count)
}

/**
 * Find nearest upgrade hub to a position
 */
export function findNearestUpgradeHub(position: Vector3, hubs: UpgradeHub[]): UpgradeHub | null {
  if (hubs.length === 0) return null
  
  return hubs
    .map(hub => ({ ...hub, distance: position.distanceTo(hub.position) }))
    .sort((a, b) => (a as any).distance - (b as any).distance)[0]
}

/**
 * Calculate cost for cargo hold upgrade
 */
export function getCargoHoldUpgradeCost(currentHolds: number): number {
  // Escalating costs for cargo hold upgrades
  // Each upgrade costs more than the previous one
  // Starting from first upgrade (51st hold) costs 1000, then exponentially increasing
  const upgradeNumber = currentHolds - 49 // First upgrade is when going from 50 to 51
  return Math.floor(1000 * Math.pow(1.1, upgradeNumber))
}

/**
 * Check if a position is within distance of a target
 */
export function isWithinDistance(pos1: Vector3, pos2: Vector3, maxDistance: number): boolean {
  return pos1.distanceTo(pos2) <= maxDistance
}

/**
 * Check if an entity is at a specific port
 */
export function isAtPort(position: Vector3, port: TradingPort, tolerance: number = 0.25): boolean {
  return isWithinDistance(position, port.position, tolerance)
}

/**
 * Check if an entity is at a specific hub
 */
export function isAtHub(position: Vector3, hub: UpgradeHub, tolerance: number = 0.25): boolean {
  return isWithinDistance(position, hub.position, tolerance)
}

/**
 * Execute a trade at a port (modifies port cargo)
 */
export function executeTrade(port: TradingPort, cargoHolds: number): { profit: number; cargoExtracted: number } {
  const profit = calculateTradeProfit(port, cargoHolds)
  const cargoExtracted = Math.min(cargoHolds, port.remainingCargo)
  
  // Reduce port cargo
  port.remainingCargo = Math.max(0, port.remainingCargo - cargoExtracted)
  
  return { profit, cargoExtracted }
}

/**
 * Calculate movement interpolation between two positions
 */
export function interpolateMovement(start: Vector3, end: Vector3, progress: number): Vector3 {
  return Vector3.lerp(start, end, Math.min(1, Math.max(0, progress)))
}

/**
 * Get port efficiency as percentage
 */
export function getPortEfficiency(port: TradingPort): number {
  return port.remainingCargo / port.maxCargo
}

/**
 * Get port efficiency color category
 */
export function getPortEfficiencyCategory(port: TradingPort): 'green' | 'yellow' | 'orange' | 'red' {
  const efficiency = getPortEfficiency(port)
  if (efficiency > 0.75) return 'green'    // 75-100%
  if (efficiency > 0.50) return 'yellow'   // 50-75%
  if (efficiency > 0.25) return 'orange'   // 25-50%
  return 'red'                             // 0-25%
}