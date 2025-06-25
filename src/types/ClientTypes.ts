/**
 * Client-side types for receiving server data
 * These match the server's serialized state interfaces
 */

export interface PlayerState {
  id: string
  name: string
  position: [number, number, number]
  currentPortId: number
  destinationPortId?: number
  progress: number
  isMoving: boolean
  actionPoints: number
  credits: number
  totalProfit: number
  cargoHolds: number
  shipType: ShipType
  cooldownRemaining: number
}

export interface BotState {
  id: number
  name: string
  position: [number, number, number]
  currentPortId: number
  destinationPortId: number
  progress: number
  actionPoints: number
  totalProfit: number
  cargoHolds: number
  shipType: ShipType
}

export interface PortState {
  id: number
  position: [number, number, number]
  name: string
  remainingCargo: number
  maxCargo: number
  efficiency: number
}

export interface LeaderboardEntry {
  rank: number
  name: string
  totalProfit: number
  actionPoints: number
  isBot: boolean
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

export interface GameStateUpdate {
  tick: number
  timestamp: number
  players: PlayerState[]
  bots: BotState[]
  ports: PortState[]
  leaderboard: LeaderboardEntry[]
}

export interface PlayerAction {
  type: 'TRADE' | 'TRAVEL' | 'UPGRADE_CARGO'
  targetId?: number
}

export interface TradeOption {
  port: PortState
  distance: number
  travelCost: number
  profit: number
  totalCost: number
  profitPerAction: number
}

/**
 * Client-side game state (interpolated from server updates)
 */
export interface ClientGameState {
  connected: boolean
  tick: number
  players: Map<string, PlayerState>
  bots: Map<number, BotState>
  ports: Map<number, PortState>
  leaderboard: LeaderboardEntry[]
  myPlayerId?: string
}