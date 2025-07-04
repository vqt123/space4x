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
  shields: number
  maxShields: number
  energy: number
  maxEnergy: number
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
  shields: number
  maxShields: number
  energy: number
  maxEnergy: number
}

export interface PortState {
  id: number
  position: [number, number, number]
  name: string
  remainingCargo: number
  maxCargo: number
  efficiency: number
}

export interface HubState {
  id: number
  position: [number, number, number]
  name: string
}

export interface LeaderboardEntry {
  id: string | number  // string for players (socket ID), number for bots
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
  maxShields: number
  maxEnergy: number
  maxEnergyPerBlast: number
}

// Original full game state update (kept for backwards compatibility)
export interface GameStateUpdate {
  tick: number
  timestamp: number
  players: PlayerState[]
  bots: BotState[]
  ports: PortState[]
  hubs: HubState[]
  leaderboard: LeaderboardEntry[]
}

// New optimized message types
export interface StaticDataUpdate {
  type: 'static_data'
  ports: PortState[]
  hubs: HubState[]
}

export interface DynamicStateUpdate {
  type: 'dynamic_state'
  tick: number
  timestamp: number
  players: PlayerState[]
  bots: BotState[]
  ports: PortState[]
  leaderboard: LeaderboardEntry[]
}

export interface PlayerAction {
  type: 'TRADE' | 'TRAVEL' | 'HUB_TRAVEL' | 'UPGRADE_CARGO' | 'ENGAGE_COMBAT' | 'FIRE_BLAST' | 'BUY_SHIELDS' | 'BUY_ENERGY'
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

export interface EnemyNPCState {
  id: number
  name: string
  position: [number, number, number]
  currentPortId: number
  destinationPortId: number
  progress: number
  shields: number
  maxShields: number
  energy: number
  maxEnergy: number
  maxEnergyPerBlast: number
  credits: number
  isInCombat: boolean
  combatTargetId?: string | number
}

/**
 * Client-side game state (interpolated from server updates)
 */
export interface ClientGameState {
  connected: boolean
  tick: number
  players: Map<string, PlayerState>
  bots: Map<number, BotState>
  enemies: Map<number, EnemyNPCState>
  ports: Map<number, PortState>
  hubs: Map<number, HubState>
  leaderboard: LeaderboardEntry[]
  myPlayerId?: string
  serverVersion?: string
}