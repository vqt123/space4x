import { Vector3 } from 'three'
import { TradingPort, TradeOption, UpgradeHub, Upgrade } from './types'

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
      currentProfitMultiplier: 1.0, // Starts at 100%
      tradeCost: Math.floor(Math.random() * 15) + 10 // 10-25 action cost to trade
    })
  }
  
  return ports
}

export function calculateTradeProfit(port: TradingPort, playerUpgrades: Record<number, number> = {}): number {
  const baseProfit = Math.floor(port.baseProfit * port.currentProfitMultiplier)
  
  // Calculate total upgrade bonus
  let upgradeBonus = 0
  Object.entries(playerUpgrades).forEach(([upgradeId, level]) => {
    const upgrade = UPGRADE_DEFINITIONS.find(u => u.id === parseInt(upgradeId))
    if (upgrade && level > 0) {
      // Each upgrade gives 5% more profit per level
      upgradeBonus += parseInt(upgradeId) * 5
    }
  })
  
  return Math.floor(baseProfit * (1 + upgradeBonus / 100))
}

export function calculateTravelCost(distance: number): number {
  return Math.ceil(distance) // 1 action point per unit of distance
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

export function calculateTradeOptions(currentPort: TradingPort, allPorts: TradingPort[], playerUpgrades: Record<number, number> = {}): TradeOption[] {
  const nearestPorts = findNearestPorts(currentPort, allPorts)
  
  // Current port option (no travel)
  const currentProfit = calculateTradeProfit(currentPort, playerUpgrades)
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
    const distance = port.distance
    const travelCost = calculateTravelCost(distance)
    const profit = calculateTradeProfit(port, playerUpgrades)
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

export const UPGRADE_DEFINITIONS: Upgrade[] = [
  { id: 1, name: "Trade Optimization I", description: "Increase trade profit by 5%", cost: 500, maxLevel: 1, type: "profit" },
  { id: 2, name: "Trade Optimization II", description: "Increase trade profit by 10%", cost: 1200, maxLevel: 1, type: "profit" },
  { id: 3, name: "Trade Optimization III", description: "Increase trade profit by 15%", cost: 2000, maxLevel: 1, type: "profit" },
  { id: 4, name: "Trade Optimization IV", description: "Increase trade profit by 20%", cost: 3000, maxLevel: 1, type: "profit" },
  { id: 5, name: "Trade Optimization V", description: "Increase trade profit by 25%", cost: 4200, maxLevel: 1, type: "profit" },
  { id: 6, name: "Trade Optimization VI", description: "Increase trade profit by 30%", cost: 5600, maxLevel: 1, type: "profit" },
  { id: 7, name: "Trade Optimization VII", description: "Increase trade profit by 35%", cost: 7200, maxLevel: 1, type: "profit" },
  { id: 8, name: "Trade Optimization VIII", description: "Increase trade profit by 40%", cost: 9000, maxLevel: 1, type: "profit" },
  { id: 9, name: "Trade Optimization IX", description: "Increase trade profit by 45%", cost: 11000, maxLevel: 1, type: "profit" },
  { id: 10, name: "Trade Optimization X", description: "Increase trade profit by 50%", cost: 13200, maxLevel: 1, type: "profit" },
  { id: 11, name: "Trade Optimization XI", description: "Increase trade profit by 55%", cost: 15600, maxLevel: 1, type: "profit" },
  { id: 12, name: "Trade Optimization XII", description: "Increase trade profit by 60%", cost: 18200, maxLevel: 1, type: "profit" },
  { id: 13, name: "Trade Optimization XIII", description: "Increase trade profit by 65%", cost: 21000, maxLevel: 1, type: "profit" },
  { id: 14, name: "Trade Optimization XIV", description: "Increase trade profit by 70%", cost: 24000, maxLevel: 1, type: "profit" },
  { id: 15, name: "Trade Optimization XV", description: "Increase trade profit by 75%", cost: 27200, maxLevel: 1, type: "profit" },
  { id: 16, name: "Trade Optimization XVI", description: "Increase trade profit by 80%", cost: 30600, maxLevel: 1, type: "profit" },
  { id: 17, name: "Trade Optimization XVII", description: "Increase trade profit by 85%", cost: 34200, maxLevel: 1, type: "profit" },
  { id: 18, name: "Trade Optimization XVIII", description: "Increase trade profit by 90%", cost: 38000, maxLevel: 1, type: "profit" },
  { id: 19, name: "Trade Optimization XIX", description: "Increase trade profit by 95%", cost: 42000, maxLevel: 1, type: "profit" },
  { id: 20, name: "Trade Optimization XX", description: "Increase trade profit by 100%", cost: 46200, maxLevel: 1, type: "profit" }
]