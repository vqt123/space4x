import { 
  Vector3, 
  TradingPort, 
  UpgradeHub, 
  ServerPlayer, 
  ServerBot, 
  GameStateUpdate,
  StaticDataUpdate,
  DynamicStateUpdate,
  PlayerState,
  BotState,
  PortState,
  HubState,
  LeaderboardEntry,
  PlayerAction,
  ActionResult
} from '../types/ServerTypes'
import { TickManager } from './TickManager'
import { BotSystem } from '../systems/BotSystem'
import { 
  calculateTradeProfit, 
  calculateTravelCost, 
  findNearestPorts,
  isAtPort,
  isAtHub,
  executeTrade,
  getCargoHoldUpgradeCost,
  FIXED_TRADE_COST,
  SHIP_TYPES
} from '../utils/GameUtils'

/**
 * GameWorld - Central authoritative game state management
 */
export class GameWorld {
  private players: Map<string, ServerPlayer> = new Map()
  private bots: ServerBot[] = []
  private ports: TradingPort[] = []
  private upgradeHubs: UpgradeHub[] = []
  private leaderboard: LeaderboardEntry[] = []
  private botSystem?: BotSystem
  
  // WebSocket broadcast callbacks (set by server)
  private broadcastCallback?: (data: GameStateUpdate) => void
  private staticDataCallback?: (socketId: string, data: StaticDataUpdate) => void
  private dynamicStateCallback?: (data: DynamicStateUpdate) => void
  
  constructor() {}
  
  /**
   * Initialize the game world with ports and bots
   */
  async initialize(): Promise<void> {
    console.log('Initializing game world...')
    
    // Generate trading ports
    this.generatePorts(500, 50)
    
    // Generate upgrade hubs
    this.generateUpgradeHubs(50, 50)
    
    // Initialize bots
    this.initializeBots(10)
    
    // Initialize bot system
    this.botSystem = new BotSystem(this.bots, this.ports)
    
    console.log(`Initialized: ${this.ports.length} ports, ${this.upgradeHubs.length} hubs, ${this.bots.length} bots`)
  }
  
  /**
   * Update all game systems each tick
   */
  update(tick: number): void {
    // Update bots
    this.updateBots(tick)
    
    // Update players
    this.updatePlayers(tick)
    
    // Update leaderboard
    this.updateLeaderboard()
  }
  
  /**
   * Add a new player to the game
   */
  addPlayer(socketId: string, name: string): ServerPlayer {
    const startPort = this.ports[Math.floor(Math.random() * this.ports.length)]
    
    const player: ServerPlayer = {
      id: socketId,
      name,
      position: startPort.position.clone(),
      currentPort: startPort,
      destinationPort: null,
      startPosition: null,
      progress: 0,
      speed: 3,
      isMoving: false,
      actionPoints: 500,
      credits: 0,
      totalProfit: 0,
      cargoHolds: 50, // Starting cargo holds
      shipType: SHIP_TYPES[0], // Merchant Freighter
      lastActionTick: 0
    }
    
    this.players.set(socketId, player)
    console.log(`Player ${name} (${socketId}) joined the game`)
    
    return player
  }
  
  /**
   * Remove a player from the game
   */
  removePlayer(socketId: string): void {
    const player = this.players.get(socketId)
    if (player) {
      console.log(`Player ${player.name} (${socketId}) left the game`)
      this.players.delete(socketId)
    }
  }
  
  /**
   * Process a player action
   */
  processPlayerAction(socketId: string, action: PlayerAction, currentTick: number): ActionResult {
    const player = this.players.get(socketId)
    if (!player) {
      return { success: false, error: 'Player not found' }
    }
    
    // Check cooldown
    if (!TickManager.canPerformAction(player.lastActionTick, currentTick)) {
      const ticksRemaining = TickManager.getTicksUntilAction(player.lastActionTick, currentTick)
      return { 
        success: false, 
        error: `Action on cooldown for ${ticksRemaining} more ticks` 
      }
    }
    
    switch (action.type) {
      case 'TRADE':
        return this.processTradeAction(player, currentTick)
      
      case 'TRAVEL':
        if (action.targetId === undefined) {
          return { success: false, error: 'Target port ID required for travel' }
        }
        return this.processTravelAction(player, action.targetId, currentTick)
      
      case 'UPGRADE_CARGO':
        return this.processUpgradeAction(player, currentTick)
      
      default:
        return { success: false, error: 'Unknown action type' }
    }
  }
  
  /**
   * Set broadcast callback for sending state to clients
   */
  setBroadcastCallback(callback: (data: GameStateUpdate) => void): void {
    this.broadcastCallback = callback
  }

  /**
   * Set optimized broadcast callbacks for static and dynamic data
   */
  setOptimizedBroadcastCallbacks(
    staticDataCallback: (socketId: string, data: StaticDataUpdate) => void,
    dynamicStateCallback: (data: DynamicStateUpdate) => void
  ): void {
    this.staticDataCallback = staticDataCallback
    this.dynamicStateCallback = dynamicStateCallback
  }
  
  /**
   * Broadcast current game state to all clients (legacy method)
   */
  broadcastState(tick: number): void {
    if (!this.broadcastCallback) return
    
    const gameState: GameStateUpdate = {
      tick,
      timestamp: Date.now(),
      players: this.serializePlayers(tick),
      bots: this.serializeBots(),
      ports: this.serializePorts(),
      hubs: this.serializeHubs(),
      leaderboard: this.leaderboard
    }
    
    this.broadcastCallback(gameState)
  }

  /**
   * Broadcast only dynamic state (optimized for regular updates)
   */
  broadcastDynamicState(tick: number): void {
    if (!this.dynamicStateCallback) return
    
    const dynamicState: DynamicStateUpdate = {
      type: 'dynamic_state',
      tick,
      timestamp: Date.now(),
      players: this.serializePlayers(tick),
      bots: this.serializeBots(),
      leaderboard: this.leaderboard
    }
    
    // Log every 10 seconds to show the optimization is working
    if (tick % 100 === 0) {
      console.log(`⚡ Broadcasting dynamic state - Tick ${tick}: ${dynamicState.players.length} players, ${dynamicState.bots.length} bots (no ports/hubs)`)
    }
    
    this.dynamicStateCallback(dynamicState)
  }

  /**
   * Send static data to a specific client (called when they join)
   */
  sendStaticDataToPlayer(socketId: string): void {
    if (!this.staticDataCallback) return
    
    const staticData: StaticDataUpdate = {
      type: 'static_data',
      ports: this.serializePorts(),
      hubs: this.serializeHubs()
    }
    
    console.log(`🔧 Sending static data to ${socketId}: ${staticData.ports.length} ports, ${staticData.hubs.length} hubs`)
    this.staticDataCallback(socketId, staticData)
  }
  
  /**
   * Get player count
   */
  getPlayerCount(): number {
    return this.players.size
  }
  
  /**
   * Get bot count  
   */
  getBotCount(): number {
    return this.bots.length
  }
  
  /**
   * Generate trading ports in sphere
   */
  private generatePorts(count: number, radius: number): void {
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
      
      const maxCargo = Math.floor(Math.random() * 2001) + 1000 // 1000-3000
      
      this.ports.push({
        id: i,
        position,
        name: `Port ${String.fromCharCode(65 + Math.floor(i / 26))}${i % 26 + 1}`,
        remainingCargo: maxCargo,
        maxCargo: maxCargo
      })
    }
  }
  
  /**
   * Generate upgrade hubs
   */
  private generateUpgradeHubs(count: number, radius: number): void {
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(1 - 2 * Math.random())
      const r = Math.pow(Math.random(), 1/3) * radius
      
      const position = new Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      )
      
      this.upgradeHubs.push({
        id: i,
        position,
        name: `Hub ${String.fromCharCode(65 + i)}`
      })
    }
  }
  
  /**
   * Initialize AI bots
   */
  private initializeBots(count: number): void {
    const botNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa']
    
    for (let i = 0; i < count; i++) {
      const startPort = this.ports[Math.floor(Math.random() * this.ports.length)]
      
      this.bots.push({
        id: i,
        position: startPort.position.clone(),
        currentPort: startPort,
        destinationPort: startPort,
        progress: 0,
        speed: 3,
        actionPoints: 500,
        totalProfit: 0,
        name: botNames[i] || `Bot-${i}`,
        shipType: SHIP_TYPES[0], // Same as player for now
        cargoHolds: 25,
        lastActionTick: 0
      })
    }
  }
  
  /**
   * Update all bots each tick
   */
  private updateBots(tick: number): void {
    if (this.botSystem) {
      this.botSystem.updateBots(tick)
    }
  }
  
  /**
   * Update all players each tick
   */
  private updatePlayers(tick: number): void {
    for (const player of this.players.values()) {
      this.updatePlayerMovement(player)
    }
  }
  
  /**
   * Update player movement
   */
  private updatePlayerMovement(player: ServerPlayer): void {
    if (!player.isMoving || !player.destinationPort || !player.startPosition) {
      return
    }
    
    const distance = player.startPosition.distanceTo(player.destinationPort.position)
    const travelTime = distance / player.speed
    
    // Increase progress (assuming 100ms tick rate)
    const progressDelta = 0.1 / travelTime // 0.1 seconds per tick
    player.progress = Math.min(1, player.progress + progressDelta)
    
    // Update position via interpolation
    player.position = Vector3.lerp(player.startPosition, player.destinationPort.position, player.progress)
    
    // Check if movement is complete
    if (player.progress >= 1) {
      this.completePlayerMovement(player)
    }
  }
  
  /**
   * Complete player movement
   */
  private completePlayerMovement(player: ServerPlayer): void {
    if (!player.destinationPort || !player.startPosition) return
    
    // Snap to exact destination
    player.position = player.destinationPort.position.clone()
    player.currentPort = player.destinationPort
    
    // Calculate and deduct costs
    const distance = player.startPosition.distanceTo(player.destinationPort.position)
    const travelCost = calculateTravelCost(distance, player.shipType)
    const totalCost = travelCost + FIXED_TRADE_COST
    
    // Deduct action points
    player.actionPoints = Math.max(0, player.actionPoints - totalCost)
    
    // Execute automatic trade at destination
    const tradeResult = executeTrade(player.currentPort, player.cargoHolds)
    player.credits += tradeResult.profit
    player.totalProfit += tradeResult.profit
    
    // Reset movement state
    player.destinationPort = null
    player.startPosition = null
    player.progress = 0
    player.isMoving = false
    
    console.log(`Player ${player.name} arrived at ${player.currentPort.name}, traded for ${tradeResult.profit} profit`)
  }
  
  /**
   * Update leaderboard rankings
   */
  private updateLeaderboard(): void {
    const allEntities = [
      ...Array.from(this.players.values()).map(p => ({ ...p, isBot: false })),
      ...this.bots.map(b => ({ ...b, isBot: true }))
    ]
    
    this.leaderboard = allEntities
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .map((entity, index) => ({
        rank: index + 1,
        name: entity.name,
        totalProfit: entity.totalProfit,
        actionPoints: entity.actionPoints,
        isBot: entity.isBot
      }))
  }
  
  /**
   * Serialize players for network transmission
   */
  private serializePlayers(currentTick: number): PlayerState[] {
    return Array.from(this.players.values()).map(player => ({
      id: player.id,
      name: player.name,
      position: player.position.toArray(),
      currentPortId: player.currentPort.id,
      destinationPortId: player.destinationPort?.id,
      progress: player.progress,
      isMoving: player.isMoving,
      actionPoints: player.actionPoints,
      credits: player.credits,
      totalProfit: player.totalProfit,
      cargoHolds: player.cargoHolds,
      shipType: player.shipType,
      cooldownRemaining: TickManager.getMsUntilAction(player.lastActionTick, currentTick)
    }))
  }
  
  /**
   * Serialize bots for network transmission
   */
  private serializeBots(): BotState[] {
    return this.bots.map(bot => ({
      id: bot.id,
      name: bot.name,
      position: bot.position.toArray(),
      currentPortId: bot.currentPort.id,
      destinationPortId: bot.destinationPort.id,
      progress: bot.progress,
      actionPoints: bot.actionPoints,
      totalProfit: bot.totalProfit,
      cargoHolds: bot.cargoHolds,
      shipType: bot.shipType
    }))
  }
  
  /**
   * Serialize ports for network transmission
   */
  private serializePorts(): PortState[] {
    return this.ports.map(port => ({
      id: port.id,
      position: port.position.toArray(),
      name: port.name,
      remainingCargo: port.remainingCargo,
      maxCargo: port.maxCargo,
      efficiency: port.remainingCargo / port.maxCargo
    }))
  }
  
  /**
   * Serialize hubs for network transmission
   */
  private serializeHubs(): HubState[] {
    return this.upgradeHubs.map(hub => ({
      id: hub.id,
      position: hub.position.toArray(),
      name: hub.name
    }))
  }
  
  /**
   * Process trade action
   */
  private processTradeAction(player: ServerPlayer, currentTick: number): ActionResult {
    // Check if player is at current port
    if (!isAtPort(player.position, player.currentPort)) {
      return { success: false, error: 'Not at trading port' }
    }
    
    // Check if player has enough action points
    if (player.actionPoints < FIXED_TRADE_COST) {
      return { success: false, error: 'Insufficient action points' }
    }
    
    // Execute trade
    const tradeResult = executeTrade(player.currentPort, player.cargoHolds)
    
    // Update player state
    player.actionPoints -= FIXED_TRADE_COST
    player.credits += tradeResult.profit
    player.totalProfit += tradeResult.profit
    player.lastActionTick = currentTick
    
    return { 
      success: true, 
      newState: {
        actionPoints: player.actionPoints,
        credits: player.credits,
        totalProfit: player.totalProfit
      }
    }
  }
  
  /**
   * Process travel action
   */
  private processTravelAction(player: ServerPlayer, targetPortId: number, currentTick: number): ActionResult {
    // Find target port
    const targetPort = this.ports.find(port => port.id === targetPortId)
    if (!targetPort) {
      return { success: false, error: 'Target port not found' }
    }
    
    // Calculate travel cost
    const distance = player.position.distanceTo(targetPort.position)
    const travelCost = calculateTravelCost(distance, player.shipType)
    const totalCost = travelCost + FIXED_TRADE_COST // Travel + Trade cost
    
    // Check if player can afford it
    if (player.actionPoints < totalCost) {
      return { success: false, error: 'Insufficient action points for travel and trade' }
    }
    
    // Set up travel
    player.destinationPort = targetPort
    player.startPosition = player.position.clone()
    player.progress = 0
    player.isMoving = true
    player.lastActionTick = currentTick
    
    return { 
      success: true,
      newState: {
        destinationPort: player.destinationPort,
        isMoving: player.isMoving,
        progress: player.progress
      }
    }
  }
  
  /**
   * Process upgrade action
   */
  private processUpgradeAction(player: ServerPlayer, currentTick: number): ActionResult {
    // Find nearest hub
    const nearestHub = this.upgradeHubs
      .map(hub => ({ ...hub, distance: player.position.distanceTo(hub.position) }))
      .sort((a, b) => (a as any).distance - (b as any).distance)[0]
    
    if (!nearestHub || !isAtHub(player.position, nearestHub)) {
      return { success: false, error: 'Not at upgrade hub' }
    }
    
    // Check if player can upgrade
    if (player.cargoHolds >= player.shipType.maxCargoHolds) {
      return { success: false, error: 'Maximum cargo holds reached' }
    }
    
    // Calculate upgrade cost
    const upgradeCost = getCargoHoldUpgradeCost(player.cargoHolds)
    
    // Check if player can afford it
    if (player.credits < upgradeCost) {
      return { success: false, error: 'Insufficient credits for upgrade' }
    }
    
    // Execute upgrade
    player.credits -= upgradeCost
    player.cargoHolds += 1
    player.lastActionTick = currentTick
    
    return { 
      success: true,
      newState: {
        credits: player.credits,
        cargoHolds: player.cargoHolds
      }
    }
  }
}