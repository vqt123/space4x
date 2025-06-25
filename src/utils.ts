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
    
    ports.push({
      id: i,
      position,
      name: `Port ${String.fromCharCode(65 + Math.floor(i / 26))}${i % 26 + 1}`,
      baseProfit: Math.floor(Math.random() * 80) + 40, // 40-120 base profit
      remainingCargo: 5000, // All ports start with full cargo
      maxCargo: 5000,
      tradeCost: Math.floor(Math.random() * 15) + 10 // 10-25 action cost to trade
    })
  }
  
  return ports
}

export function calculateTradeProfit(port: TradingPort, cargoHolds: number): number {
  // Port efficiency based on remaining cargo
  const portEfficiency = port.remainingCargo / port.maxCargo
  const baseProfit = Math.floor(port.baseProfit * portEfficiency)
  
  // Cargo holds that can be filled (limited by ship capacity and available cargo)
  const cargoHoldsFilled = Math.min(cargoHolds, port.remainingCargo)
  
  // Profit per cargo hold
  const profitPerHold = baseProfit / 100 // Normalize to 100 holds base
  const totalProfit = Math.floor(cargoHoldsFilled * profitPerHold)
  
  return totalProfit
}

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
    totalCost: currentPort.tradeCost,
    profitPerAction: currentProfit / currentPort.tradeCost
  }
  
  // Travel options
  const travelOptions: TradeOption[] = nearestPorts.map(port => {
    const distance = currentPort.position.distanceTo(port.position)
    const travelCost = calculateTravelCost(distance, shipType)
    const profit = calculateTradeProfit(port, cargoHolds)
    const totalCost = travelCost + port.tradeCost
    
    return {
      port,
      distance,
      travelCost,
      profit,
      totalCost,
      profitPerAction: totalCost > 0 ? profit / totalCost : 0
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
    startingCargoHolds: 2,
    maxCargoHolds: 8,
    travelCostMultiplier: 1.0,
    purchaseCost: 0, // Starting ship
    description: 'Balanced trading vessel with expandable cargo capacity'
  },
  {
    id: 'scout_courier',
    name: 'Scout Courier',
    startingCargoHolds: 1,
    maxCargoHolds: 4,
    travelCostMultiplier: 0.7,
    purchaseCost: 5000,
    description: 'Fast ship with limited cargo but excellent speed'
  },
  {
    id: 'heavy_hauler',
    name: 'Heavy Hauler',
    startingCargoHolds: 4,
    maxCargoHolds: 12,
    travelCostMultiplier: 1.5,
    purchaseCost: 15000,
    description: 'High-capacity vessel for serious bulk trading'
  },
  {
    id: 'mega_freighter',
    name: 'Mega Freighter',
    startingCargoHolds: 6,
    maxCargoHolds: 20,
    travelCostMultiplier: 2.0,
    purchaseCost: 40000,
    description: 'Massive ship for industrial-scale cargo operations'
  }
]

export function getCargoHoldUpgradeCost(currentHolds: number): number {
  // Escalating costs: 1000, 2000, 3500, 5500, 8000, 11000, etc.
  return 1000 + (currentHolds - 1) * 1500 + Math.pow(currentHolds - 1, 2) * 250
}