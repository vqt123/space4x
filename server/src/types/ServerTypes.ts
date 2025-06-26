/**
 * Server-side Vector3 implementation (no Three.js dependency)
 */
export class Vector3 {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0
  ) {}
  
  clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z)
  }
  
  copy(v: Vector3): Vector3 {
    this.x = v.x
    this.y = v.y
    this.z = v.z
    return this
  }
  
  add(v: Vector3): Vector3 {
    this.x += v.x
    this.y += v.y
    this.z += v.z
    return this
  }
  
  sub(v: Vector3): Vector3 {
    this.x -= v.x
    this.y -= v.y
    this.z -= v.z
    return this
  }
  
  multiplyScalar(scalar: number): Vector3 {
    this.x *= scalar
    this.y *= scalar
    this.z *= scalar
    return this
  }
  
  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
  }
  
  distanceTo(v: Vector3): number {
    const dx = this.x - v.x
    const dy = this.y - v.y
    const dz = this.z - v.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }
  
  normalize(): Vector3 {
    const length = this.length()
    if (length === 0) return this
    return this.multiplyScalar(1 / length)
  }
  
  lerp(v: Vector3, alpha: number): Vector3 {
    this.x += (v.x - this.x) * alpha
    this.y += (v.y - this.y) * alpha
    this.z += (v.z - this.z) * alpha
    return this
  }
  
  static lerp(v1: Vector3, v2: Vector3, alpha: number): Vector3 {
    return new Vector3(
      v1.x + (v2.x - v1.x) * alpha,
      v1.y + (v2.y - v1.y) * alpha,
      v1.z + (v2.z - v1.z) * alpha
    )
  }
  
  toArray(): [number, number, number] {
    return [this.x, this.y, this.z]
  }
  
  fromArray(array: [number, number, number]): Vector3 {
    this.x = array[0]
    this.y = array[1]
    this.z = array[2]
    return this
  }
}

/**
 * Server-side game entity interfaces
 */
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

export interface ServerPlayer {
  id: string // Socket ID
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
  lastActionTick: number
  name: string
}

export interface ServerBot {
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
  lastActionTick: number
}

export interface UpgradeHub {
  id: number
  position: Vector3
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

/**
 * Network message interfaces
 */
export interface PlayerAction {
  type: 'TRADE' | 'TRAVEL' | 'UPGRADE_CARGO'
  targetId?: number
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

/**
 * Serialized state for network transmission
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

export interface HubState {
  id: number
  position: [number, number, number]
  name: string
}

/**
 * Action result for validation
 */
export interface ActionResult {
  success: boolean
  error?: string
  newState?: Partial<ServerPlayer>
}