import { Vector3 } from 'three'

export interface TradingPort {
  id: number
  position: Vector3
  name: string
  remainingCargo: number
  maxCargo: number
}

export interface ShipType {
  id: string
  name: string
  startingCargoHolds: number
  maxCargoHolds: number
  travelCostMultiplier: number
  purchaseCost: number
  description: string
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
  shipType: ShipType
  cargoHolds: number
  lastActionTime?: number
}

export interface UpgradeHub {
  id: number
  position: Vector3
  name: string
}

export interface CargoHoldUpgrade {
  id: number
  name: string
  description: string
  cost: number
}

export interface Player {
  position: Vector3
  currentPort: TradingPort
  destinationPort: TradingPort | null
  startPosition: Vector3 | null
  progress: number
  speed: number
  isMoving: boolean
  actionPoints: number
  credits: number
  totalProfit: number
  cargoHolds: number
  shipType: ShipType
  lastActionTime: number
}

export interface TradeOption {
  port: TradingPort
  distance: number
  travelCost: number
  profit: number
  totalCost: number
  profitPerAction: number
}

export interface HubTravelOption {
  hub: UpgradeHub
  distance: number
  travelCost: number
}