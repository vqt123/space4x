import { io, Socket } from 'socket.io-client'
import { GameStateUpdate, PlayerAction, ClientGameState } from '../types/ClientTypes'

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
        
        // Game state updates from server
        this.socket.on('game_state', (gameStateUpdate: GameStateUpdate) => {
          this.handleGameStateUpdate(gameStateUpdate)
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
   * Handle game state update from server
   */
  private handleGameStateUpdate(update: GameStateUpdate): void {
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