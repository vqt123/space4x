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
  ActionResult,
  EnemyNPCState
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
  private enemies: EnemyNPCState[] = []
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
    
    // Initialize enemy NPCs
    this.initializeEnemies(5)
    
    // Initialize bot system
    this.botSystem = new BotSystem(this.bots, this.ports)
    
    console.log(`Initialized: ${this.ports.length} ports, ${this.upgradeHubs.length} hubs, ${this.bots.length} bots, ${this.enemies.length} enemies`)
  }
  
  /**
   * Update all game systems each tick
   */
  update(tick: number): void {
    // Update bots
    this.updateBots(tick)
    
    // Update players
    this.updatePlayers(tick)
    
    // Update enemies
    this.updateEnemies(tick)
    
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
      lastActionTick: 0,
      shields: 100, // Starting shields (100/500)
      maxShields: SHIP_TYPES[0].maxShields || 500,
      energy: 200, // Starting energy (200/1000)
      maxEnergy: SHIP_TYPES[0].maxEnergy || 1000
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
      
      case 'ENGAGE_COMBAT':
        if (action.targetId === undefined) {
          return { success: false, error: 'Target enemy ID required for combat' }
        }
        return this.processEngageCombatAction(player, action.targetId, currentTick)
      
      case 'FIRE_BLAST':
        if (action.targetId === undefined) {
          return { success: false, error: 'Target enemy ID required for firing' }
        }
        return this.processFireBlastAction(player, action.targetId, currentTick)
      
      case 'BUY_SHIELDS':
        return this.processBuyShieldsAction(player, currentTick)
      
      case 'BUY_ENERGY':
        return this.processBuyEnergyAction(player, currentTick)
      
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
      enemies: this.serializeEnemies(),
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
      enemies: this.serializeEnemies(),
      ports: this.serializePorts(),
      leaderboard: this.leaderboard
    }
    
    // Log every 10 seconds to show the optimization is working
    if (tick % 100 === 0) {
      console.log(`⚡ Broadcasting dynamic state - Tick ${tick}: ${dynamicState.players.length} players, ${dynamicState.bots.length} bots, ${dynamicState.enemies.length} enemies, ${dynamicState.ports.length} ports`)
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
        lastActionTick: 0,
        shields: 100, // Starting shields (100/500)
        maxShields: SHIP_TYPES[0].maxShields || 500,
        energy: 200, // Starting energy (200/1000)
        maxEnergy: SHIP_TYPES[0].maxEnergy || 1000
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
   * Initialize enemy NPCs
   */
  private initializeEnemies(count: number): void {
    const enemyNames = ['Raider', 'Pirate', 'Marauder', 'Outlaw', 'Bandit', 'Corsair', 'Buccaneer', 'Rogue']
    
    for (let i = 0; i < count; i++) {
      const startPortIndex = Math.floor(Math.random() * this.ports.length)
      const startPort = this.ports[startPortIndex]
      
      // Find a different destination port
      let destPortIndex = startPortIndex
      while (destPortIndex === startPortIndex && this.ports.length > 1) {
        destPortIndex = Math.floor(Math.random() * this.ports.length)
      }
      const destPort = this.ports[destPortIndex]
      
      this.enemies.push({
        id: i,
        name: `${enemyNames[i % enemyNames.length]}-${i + 1}`,
        position: [startPort.position.x, startPort.position.y, startPort.position.z],
        currentPortId: startPort.id,
        destinationPortId: destPort.id,
        progress: 0,
        shields: 75, // Slightly weaker than starting player
        maxShields: 400,
        energy: 150,
        maxEnergy: 800,
        maxEnergyPerBlast: 50,
        credits: Math.floor(Math.random() * 20000) + 25000, // 25000-45000 credits (10x trading profit)
        isInCombat: false
      })
    }
  }

  /**
   * Update all enemies each tick
   */
  private updateEnemies(tick: number): void {
    for (const enemy of this.enemies) {
      this.updateEnemyMovement(enemy, tick)
    }
  }

  /**
   * Update enemy movement between ports
   */
  private updateEnemyMovement(enemy: EnemyNPCState, tick: number): void {
    if (enemy.isInCombat) {
      return // Don't move while in combat
    }

    // Check if any player is within range (20 units) - if so, stop moving
    const nearbyPlayer = this.isPlayerNearEnemy(enemy, 20)
    if (nearbyPlayer) {
      // Stop moving and prepare for potential combat
      return
    }

    const currentPort = this.ports.find(p => p.id === enemy.currentPortId)
    const destPort = this.ports.find(p => p.id === enemy.destinationPortId)
    
    if (!currentPort || !destPort) {
      return
    }

    // If at destination, pick a new random destination
    if (enemy.progress >= 1.0) {
      enemy.currentPortId = enemy.destinationPortId
      enemy.position = [destPort.position.x, destPort.position.y, destPort.position.z]
      enemy.progress = 0
      
      // Pick new random destination (different from current)
      let newDestIndex = enemy.currentPortId
      while (newDestIndex === enemy.currentPortId && this.ports.length > 1) {
        newDestIndex = Math.floor(Math.random() * this.ports.length)
      }
      enemy.destinationPortId = this.ports[newDestIndex].id
      return
    }

    // Move towards destination - much slower than players (1/10th speed)
    const speed = 0.3 // Very slow movement (player speed ~3, so 1/10th)
    const distance = Math.sqrt(
      Math.pow(destPort.position.x - currentPort.position.x, 2) +
      Math.pow(destPort.position.y - currentPort.position.y, 2) +
      Math.pow(destPort.position.z - currentPort.position.z, 2)
    )
    const travelTime = distance / speed
    const progressDelta = 0.1 / travelTime // 0.1 seconds per tick

    enemy.progress = Math.min(1.0, enemy.progress + progressDelta)

    // Update position based on progress
    const startPos = currentPort.position
    const endPos = destPort.position
    enemy.position = [
      startPos.x + (endPos.x - startPos.x) * enemy.progress,
      startPos.y + (endPos.y - startPos.y) * enemy.progress,
      startPos.z + (endPos.z - startPos.z) * enemy.progress
    ]
  }

  /**
   * Check if any player is near an enemy (within specified range)
   */
  private isPlayerNearEnemy(enemy: EnemyNPCState, range: number): ServerPlayer | null {
    for (const player of this.players.values()) {
      const distance = Math.sqrt(
        Math.pow(player.position.x - enemy.position[0], 2) +
        Math.pow(player.position.y - enemy.position[1], 2) +
        Math.pow(player.position.z - enemy.position[2], 2)
      )
      if (distance <= range) {
        return player
      }
    }
    return null
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
        id: entity.id,
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
   * Serialize enemies for network transmission
   */
  private serializeEnemies(): EnemyNPCState[] {
    return this.enemies.map(enemy => ({
      id: enemy.id,
      name: enemy.name,
      position: enemy.position, // Already an array in EnemyNPCState
      currentPortId: enemy.currentPortId,
      destinationPortId: enemy.destinationPortId,
      progress: enemy.progress,
      shields: enemy.shields,
      maxShields: enemy.maxShields,
      energy: enemy.energy,
      maxEnergy: enemy.maxEnergy,
      maxEnergyPerBlast: enemy.maxEnergyPerBlast,
      credits: enemy.credits,
      isInCombat: enemy.isInCombat,
      combatTargetId: enemy.combatTargetId
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

  /**
   * Process engage combat action - initiate combat with an enemy
   */
  private processEngageCombatAction(player: ServerPlayer, enemyId: number, currentTick: number): ActionResult {
    // Find the target enemy
    const enemy = this.enemies.find(e => e.id === enemyId)
    if (!enemy) {
      return { success: false, error: 'Enemy not found' }
    }

    // Check if enemy is within engagement range (10 AP worth of distance)
    const distance = Math.sqrt(
      Math.pow(player.position.x - enemy.position[0], 2) +
      Math.pow(player.position.y - enemy.position[1], 2) +
      Math.pow(player.position.z - enemy.position[2], 2)
    )
    
    const engagementRange = 10 // 10 AP worth of distance
    if (distance > engagementRange) {
      return { success: false, error: 'Enemy too far away for combat engagement' }
    }

    // Check if player has enough AP for engagement (10 AP cost)
    const engagementCost = 10
    if (player.actionPoints < engagementCost) {
      return { success: false, error: 'Insufficient action points for combat engagement' }
    }

    // Set both player and enemy as in combat
    enemy.isInCombat = true
    enemy.combatTargetId = player.id
    player.actionPoints -= engagementCost
    player.lastActionTick = currentTick

    console.log(`${player.name} engaged ${enemy.name} in combat!`)

    return { 
      success: true,
      newState: {
        actionPoints: player.actionPoints,
        inCombat: true
      }
    }
  }

  /**
   * Process fire blast action - attack an enemy with energy blast
   */
  private processFireBlastAction(player: ServerPlayer, enemyId: number, currentTick: number): ActionResult {
    // Find the target enemy
    const enemy = this.enemies.find(e => e.id === enemyId)
    if (!enemy) {
      return { success: false, error: 'Enemy not found' }
    }

    // Check if enemy is the one player is in combat with
    if (!enemy.isInCombat || enemy.combatTargetId !== player.id) {
      return { success: false, error: 'Not in combat with this enemy' }
    }

    // Check if player has enough energy for blast (50 energy per blast)
    const blastEnergyCost = 50
    if (player.energy < blastEnergyCost) {
      return { success: false, error: 'Insufficient energy for blast' }
    }

    // Check if player has enough AP for blast action (10 AP cost)
    const blastAPCost = 10
    if (player.actionPoints < blastAPCost) {
      return { success: false, error: 'Insufficient action points for blast' }
    }

    // Calculate damage (1 shield = 2 energy damage, so 50 energy = 25 shield damage)
    const shieldDamage = Math.floor(blastEnergyCost / 2)
    
    // Apply damage to enemy
    enemy.shields = Math.max(0, enemy.shields - shieldDamage)
    player.energy -= blastEnergyCost
    player.actionPoints -= blastAPCost
    player.lastActionTick = currentTick

    console.log(`${player.name} fired energy blast at ${enemy.name} for ${shieldDamage} shield damage!`)

    // Check if enemy is defeated
    if (enemy.shields <= 0) {
      // Player wins - take enemy's credits
      const creditsWon = enemy.credits
      player.credits += creditsWon
      player.totalProfit += creditsWon

      // End combat
      enemy.isInCombat = false
      enemy.combatTargetId = undefined

      // Reset enemy (respawn with some shields and credits)
      enemy.shields = Math.floor(enemy.maxShields * 0.3) // 30% shields
      enemy.credits = Math.floor(Math.random() * 15000) + 20000 // 20000-35000 credits (maintains 10x balance)

      console.log(`${player.name} defeated ${enemy.name} and won ${creditsWon} credits!`)

      return { 
        success: true,
        newState: {
          energy: player.energy,
          actionPoints: player.actionPoints,
          credits: player.credits,
          totalProfit: player.totalProfit,
          combatWon: true,
          creditsWon
        }
      }
    }

    return { 
      success: true,
      newState: {
        energy: player.energy,
        actionPoints: player.actionPoints,
        enemyShields: enemy.shields
      }
    }
  }

  /**
   * Process buy shields action - purchase shields at a hub
   */
  private processBuyShieldsAction(player: ServerPlayer, currentTick: number): ActionResult {
    // Find nearest hub
    const nearestHub = this.upgradeHubs
      .map(hub => ({ ...hub, distance: player.position.distanceTo(hub.position) }))
      .sort((a, b) => (a as any).distance - (b as any).distance)[0]
    
    if (!nearestHub || !isAtHub(player.position, nearestHub)) {
      return { success: false, error: 'Not at upgrade hub' }
    }

    // Check if shields are already full
    if (player.shields >= player.maxShields) {
      return { success: false, error: 'Shields are already at maximum capacity' }
    }

    // Calculate how many shields to buy (buy in increments of 10, max to fill up)
    const shieldsNeeded = player.maxShields - player.shields
    const shieldsToBuy = Math.min(10, shieldsNeeded)
    const costPerShield = 5 // 5 credits per shield point
    const totalCost = shieldsToBuy * costPerShield

    // Check if player can afford it
    if (player.credits < totalCost) {
      return { success: false, error: `Insufficient credits. Need ${totalCost} credits for ${shieldsToBuy} shields` }
    }

    // Check action points (10 AP cost)
    if (player.actionPoints < 10) {
      return { success: false, error: 'Insufficient action points for shield purchase' }
    }

    // Execute purchase
    player.credits -= totalCost
    player.shields += shieldsToBuy
    player.actionPoints -= 10
    player.lastActionTick = currentTick

    console.log(`${player.name} bought ${shieldsToBuy} shields for ${totalCost} credits at ${nearestHub.name}`)

    return { 
      success: true,
      newState: {
        shields: player.shields,
        credits: player.credits,
        actionPoints: player.actionPoints
      }
    }
  }

  /**
   * Process buy energy action - purchase energy at a hub
   */
  private processBuyEnergyAction(player: ServerPlayer, currentTick: number): ActionResult {
    // Find nearest hub
    const nearestHub = this.upgradeHubs
      .map(hub => ({ ...hub, distance: player.position.distanceTo(hub.position) }))
      .sort((a, b) => (a as any).distance - (b as any).distance)[0]
    
    if (!nearestHub || !isAtHub(player.position, nearestHub)) {
      return { success: false, error: 'Not at upgrade hub' }
    }

    // Check if energy is already full
    if (player.energy >= player.maxEnergy) {
      return { success: false, error: 'Energy is already at maximum capacity' }
    }

    // Calculate how much energy to buy (buy in increments of 50, max to fill up)
    const energyNeeded = player.maxEnergy - player.energy
    const energyToBuy = Math.min(50, energyNeeded)
    const costPerEnergy = 2 // 2 credits per energy point
    const totalCost = energyToBuy * costPerEnergy

    // Check if player can afford it
    if (player.credits < totalCost) {
      return { success: false, error: `Insufficient credits. Need ${totalCost} credits for ${energyToBuy} energy` }
    }

    // Check action points (10 AP cost)
    if (player.actionPoints < 10) {
      return { success: false, error: 'Insufficient action points for energy purchase' }
    }

    // Execute purchase
    player.credits -= totalCost
    player.energy += energyToBuy
    player.actionPoints -= 10
    player.lastActionTick = currentTick

    console.log(`${player.name} bought ${energyToBuy} energy for ${totalCost} credits at ${nearestHub.name}`)

    return { 
      success: true,
      newState: {
        energy: player.energy,
        credits: player.credits,
        actionPoints: player.actionPoints
      }
    }
  }
}