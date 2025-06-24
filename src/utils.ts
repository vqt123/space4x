import { Vector3 } from 'three'
import { TradingPort, TradeOption } from './types'

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

export function calculateTradeProfit(port: TradingPort): number {
  return Math.floor(port.baseProfit * port.currentProfitMultiplier)
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

export function calculateTradeOptions(currentPort: TradingPort, allPorts: TradingPort[]): TradeOption[] {
  const nearestPorts = findNearestPorts(currentPort, allPorts)
  
  // Current port option (no travel)
  const currentProfit = calculateTradeProfit(currentPort)
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
    const profit = calculateTradeProfit(port)
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