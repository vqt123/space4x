import { io, Socket } from 'socket.io-client'
import { GameStateUpdate, StaticDataUpdate, DynamicStateUpdate, PlayerAction, ClientGameState } from '../types/ClientTypes'

/**
 * WebSocket client for connecting to Space4X server
 */
export class WebSocketClient {
  private socket: Socket | null = null
  private gameState: ClientGameState
  private onStateUpdateCallbacks: ((state: ClientGameState) => void)[] = []
  private serverUrl: string
  
  constructor(serverUrl: string = 'http://localhost:3001') {
    this.serverUrl = serverUrl
    this.gameState = {
      connected: false,
      tick: 0,
      players: new Map(),
      bots: new Map(),
      ports: new Map(),
      hubs: new Map(),
      leaderboard: []
    }
  }
  
  /**
   * Connect to the server
   */
  connect(playerName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrl)
        
        // Connection successful
        this.socket.on('connect', () => {
          console.log('Connected to Space4X server')
          this.gameState.connected = true
          
          // Join the game
          this.socket!.emit('join_game', { playerName })
        })
        
        // Game joined successfully
        this.socket.on('game_joined', (data: { playerId: string, playerName: string }) => {
          console.log(`Joined game as ${data.playerName} (${data.playerId})`)
          this.gameState.myPlayerId = data.playerId
          resolve()
        })
        
        // Legacy game state updates from server (backwards compatibility)
        this.socket.on('game_state', (gameStateUpdate: GameStateUpdate) => {
          this.handleGameStateUpdate(gameStateUpdate)
        })
        
        // Static data (ports and hubs) - received once when joining
        this.socket.on('static_data', (staticData: StaticDataUpdate) => {
          this.handleStaticDataUpdate(staticData)
        })
        
        // Dynamic state (players, bots, leaderboard) - received every 100ms
        this.socket.on('dynamic_state', (dynamicState: DynamicStateUpdate) => {
          this.handleDynamicStateUpdate(dynamicState)
        })
        
        // Action errors
        this.socket.on('action_error', (error: { error: string, action: string }) => {
          console.warn(`Action error (${error.action}): ${error.error}`)
        })
        
        // General errors
        this.socket.on('error', (error: { message: string }) => {
          console.error('Server error:', error.message)
        })
        
        // Connection lost
        this.socket.on('disconnect', () => {
          console.log('Disconnected from server')
          this.gameState.connected = false
          this.notifyStateUpdate()
        })
        
        // Connection error
        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error)
          reject(error)
        })
        
      } catch (error) {
        reject(error)
      }
    })
  }
  
  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.gameState.connected = false
    this.notifyStateUpdate()
  }
  
  /**
   * Send player action to server
   */
  sendAction(action: PlayerAction): void {
    if (!this.socket || !this.gameState.connected) {
      console.warn('Cannot send action: not connected to server')
      return
    }
    
    this.socket.emit('player_action', action)
  }
  
  /**
   * Get current game state
   */
  getGameState(): ClientGameState {
    return this.gameState
  }
  
  /**
   * Register callback for state updates
   */
  onStateUpdate(callback: (state: ClientGameState) => void): void {
    this.onStateUpdateCallbacks.push(callback)
  }
  
  /**
   * Remove state update callback
   */
  offStateUpdate(callback: (state: ClientGameState) => void): void {
    const index = this.onStateUpdateCallbacks.indexOf(callback)
    if (index !== -1) {
      this.onStateUpdateCallbacks.splice(index, 1)
    }
  }
  
  /**
   * Handle game state update from server (legacy method - backwards compatibility)
   */
  private handleGameStateUpdate(update: GameStateUpdate): void {
    // Debug: Log update frequency
    if (update.tick % 50 === 0) { // Log every 5 seconds
      console.log(`Server update: Tick ${update.tick}, Players: ${update.players.length}, Bots: ${update.bots.length}`)
    }
    
    // Update tick
    this.gameState.tick = update.tick
    
    // Update players
    this.gameState.players.clear()
    for (const player of update.players) {
      this.gameState.players.set(player.id, player)
    }
    
    // Update bots
    this.gameState.bots.clear()
    for (const bot of update.bots) {
      this.gameState.bots.set(bot.id, bot)
    }
    
    // Update ports
    this.gameState.ports.clear()
    for (const port of update.ports) {
      this.gameState.ports.set(port.id, port)
    }
    
    // Update hubs
    this.gameState.hubs.clear()
    for (const hub of update.hubs) {
      this.gameState.hubs.set(hub.id, hub)
    }
    
    // Update leaderboard
    this.gameState.leaderboard = update.leaderboard
    
    // Notify all callbacks
    this.notifyStateUpdate()
  }

  /**
   * Handle static data update from server (ports and hubs - received once on join)
   */
  private handleStaticDataUpdate(update: StaticDataUpdate): void {
    console.log(`🔧 OPTIMIZATION: Received static data ONCE: ${update.ports.length} ports, ${update.hubs.length} hubs`)
    
    // Update ports
    this.gameState.ports.clear()
    for (const port of update.ports) {
      this.gameState.ports.set(port.id, port)
    }
    
    // Update hubs
    this.gameState.hubs.clear()
    for (const hub of update.hubs) {
      this.gameState.hubs.set(hub.id, hub)
    }
    
    // Notify all callbacks
    this.notifyStateUpdate()
  }

  /**
   * Handle dynamic state update from server (players, bots, leaderboard - received every 100ms)
   */
  private handleDynamicStateUpdate(update: DynamicStateUpdate): void {
    // Debug: Log update frequency (less verbose than legacy)
    if (update.tick % 100 === 0) { // Log every 10 seconds
      console.log(`⚡ OPTIMIZATION: Dynamic update every 100ms - Tick ${update.tick}: ${update.players.length} players, ${update.bots.length} bots (ports/hubs NOT sent!)`)
    }
    
    // Update tick
    this.gameState.tick = update.tick
    
    // Update players
    this.gameState.players.clear()
    for (const player of update.players) {
      this.gameState.players.set(player.id, player)
    }
    
    // Update bots
    this.gameState.bots.clear()
    for (const bot of update.bots) {
      this.gameState.bots.set(bot.id, bot)
    }
    
    // Update leaderboard
    this.gameState.leaderboard = update.leaderboard
    
    // Notify all callbacks
    this.notifyStateUpdate()
  }
  
  /**
   * Notify all callbacks of state update
   */
  private notifyStateUpdate(): void {
    for (const callback of this.onStateUpdateCallbacks) {
      try {
        callback(this.gameState)
      } catch (error) {
        console.error('Error in state update callback:', error)
      }
    }
  }
  
  /**
   * Get my player state
   */
  getMyPlayer() {
    if (!this.gameState.myPlayerId) return undefined
    return this.gameState.players.get(this.gameState.myPlayerId)
  }
  
  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.gameState.connected
  }
}