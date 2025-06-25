import { Vector3 } from 'three'
import { TradingPort, TradeOption, UpgradeHub, ShipType } from './types'

export function generatePortsInSphere(count: number, radius: number): TradingPort[] {
  const ports: TradingPort[] = []
  
  for (let i = 0; i < count; i++) {
    let position: Vector3
    
    do {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(1 - 2 * Math.random())
      const r = Math.pow(Math.random(), 1/3) * radius
      
      position = new Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      )
    } while (position.length() > radius)
    
    const maxCargo = Math.floor(Math.random() * 2001) + 1000 // Random 1000-3000 cargo
    ports.push({
      id: i,
      position,
      name: `Port ${String.fromCharCode(65 + Math.floor(i / 26))}${i % 26 + 1}`,
      remainingCargo: maxCargo, // Starts at full capacity
      maxCargo: maxCargo
    })
  }
  
  return ports
}

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

export const FIXED_TRADE_COST = 10 // All trades cost 10 action points

export function calculateTravelCost(distance: number, shipType?: ShipType): number {
  const baseCost = Math.ceil(distance) // 1 action point per unit of distance
  const multiplier = shipType ? shipType.travelCostMultiplier : 1.0
  return Math.ceil(baseCost * multiplier)
}

export function findNearestPorts(currentPort: TradingPort, allPorts: TradingPort[], count: number = 3): TradingPort[] {
  return allPorts
    .filter(port => port.id !== currentPort.id)
    .map(port => ({
      ...port,
      distance: currentPort.position.distanceTo(port.position)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
}

export function calculateTradeOptions(currentPort: TradingPort, allPorts: TradingPort[], cargoHolds: number, shipType?: ShipType): TradeOption[] {
  const nearestPorts = findNearestPorts(currentPort, allPorts)
  
  // Current port option (no travel)
  const currentProfit = calculateTradeProfit(currentPort, cargoHolds)
  const currentOption: TradeOption = {
    port: currentPort,
    distance: 0,
    travelCost: 0,
    profit: currentProfit,
    totalCost: FIXED_TRADE_COST,
    profitPerAction: currentProfit / FIXED_TRADE_COST
  }
  
  // Travel options
  const travelOptions: TradeOption[] = nearestPorts.map(port => {
    const distance = currentPort.position.distanceTo(port.position)
    const travelCost = calculateTravelCost(distance, shipType)
    const profit = calculateTradeProfit(port, cargoHolds)
    const totalCost = travelCost + FIXED_TRADE_COST
    
    return {
      port,
      distance,
      travelCost,
      profit,
      totalCost,
      profitPerAction: profit / FIXED_TRADE_COST // Profit/Trade ratio (excludes travel cost)
    }
  })
  
  return [currentOption, ...travelOptions]
}

export function generateUpgradeHubs(count: number, radius: number): UpgradeHub[] {
  const hubs: UpgradeHub[] = []
  
  for (let i = 0; i < count; i++) {
    let position: Vector3
    
    do {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(1 - 2 * Math.random())
      const r = Math.pow(Math.random(), 1/3) * radius
      
      position = new Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      )
    } while (position.length() > radius)
    
    hubs.push({
      id: i,
      position,
      name: `Hub ${String.fromCharCode(65 + Math.floor(i / 26))}${i % 26 + 1}`
    })
  }
  
  return hubs
}

export function findNearestUpgradeHub(position: Vector3, hubs: UpgradeHub[]): UpgradeHub | null {
  if (hubs.length === 0) return null
  
  return hubs
    .map(hub => ({ ...hub, distance: position.distanceTo(hub.position) }))
    .sort((a, b) => a.distance - b.distance)[0]
}

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

export function getCargoHoldUpgradeCost(currentHolds: number): number {
  // Escalating costs for cargo hold upgrades
  // Each upgrade costs more than the previous one
  // Starting from first upgrade (51st hold) costs 1000, then exponentially increasing
  const upgradeNumber = currentHolds - 49 // First upgrade is when going from 50 to 51
  return Math.floor(1000 * Math.pow(1.1, upgradeNumber))
}