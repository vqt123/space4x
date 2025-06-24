import { Vector3 } from 'three'

export interface TradingPort {
  id: number
  position: Vector3
  name: string
  baseProfit: number
  currentProfitMultiplier: number
  tradeCost: number
}

export interface Bot {
  id: number
  position: Vector3
  currentPort: TradingPort
  destinationPort: TradingPort
  progress: number
  speed: number
  actionPoints: number
  totalProfit: number
  name: string
}

export interface Player {
  position: Vector3
  currentPort: TradingPort
  destinationPort: TradingPort | null
  progress: number
  speed: number
  isMoving: boolean
  actionPoints: number
  totalProfit: number
}

export interface TradeOption {
  port: TradingPort
  distance: number
  travelCost: number
  profit: number
  totalCost: number
  profitPerAction: number
}