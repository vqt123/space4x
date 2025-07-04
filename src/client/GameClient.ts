import { WebSocketClient } from './WebSocketClient'
import { ThreeRenderer } from './ThreeRenderer'
import { ClientGameState, PlayerAction, TradeOption, PortState } from '../types/ClientTypes'

/**
 * Main game client that coordinates WebSocket and rendering
 */
export class GameClient {
  private wsClient: WebSocketClient
  private renderer: ThreeRenderer
  private canvas: HTMLCanvasElement
  
  // UI callbacks
  private onStateChangeCallbacks: ((state: ClientGameState) => void)[] = []
  
  constructor(canvas: HTMLCanvasElement, serverUrl?: string) {
    this.canvas = canvas
    this.wsClient = new WebSocketClient(serverUrl)
    this.renderer = new ThreeRenderer(canvas)
    
    this.setupWebSocketCallbacks()
    
    // Start render loop immediately
    this.renderer.startRenderLoop()
  }
  
  /**
   * Set up WebSocket event callbacks
   */
  private setupWebSocketCallbacks(): void {
    this.wsClient.onStateUpdate((gameState) => {
      // Update 3D renderer
      this.renderer.updateGameState(gameState)
      
      // Notify UI callbacks
      this.notifyStateChange(gameState)
    })
  }
  
  /**
   * Connect to server and join game
   */
  async connect(playerName: string): Promise<void> {
    try {
      await this.wsClient.connect(playerName)
      console.log('Game client connected successfully')
    } catch (error) {
      console.error('Failed to connect to game server:', error)
      throw error
    }
  }
  
  /**
   * Disconnect from server
   */
  disconnect(): void {
    this.wsClient.disconnect()
  }
  
  /**
   * Send player action to server
   */
  sendAction(action: PlayerAction): void {
    this.wsClient.sendAction(action)
  }
  
  /**
   * Get current game state
   */
  getGameState(): ClientGameState {
    return this.wsClient.getGameState()
  }
  
  /**
   * Get my player state
   */
  getMyPlayer() {
    return this.wsClient.getMyPlayer()
  }
  
  /**
   * Check if connected to server
   */
  isConnected(): boolean {
    return this.wsClient.isConnected()
  }
  
  /**
   * Force resize of the renderer
   */
  forceResize(): void {
    this.renderer.forceResize()
  }
  
  /**
   * Register callback for state changes
   */
  onStateChange(callback: (state: ClientGameState) => void): void {
    this.onStateChangeCallbacks.push(callback)
  }
  
  /**
   * Remove state change callback
   */
  offStateChange(callback: (state: ClientGameState) => void): void {
    const index = this.onStateChangeCallbacks.indexOf(callback)
    if (index !== -1) {
      this.onStateChangeCallbacks.splice(index, 1)
    }
  }
  
  /**
   * Notify all callbacks of state change
   */
  private notifyStateChange(state: ClientGameState): void {
    for (const callback of this.onStateChangeCallbacks) {
      try {
        callback(state)
      } catch (error) {
        console.error('Error in state change callback:', error)
      }
    }
  }
  
  /**
   * Get the closest hub to the player
   */
  getClosestHub(): { hub: any; distance: number } | null {
    const gameState = this.getGameState()
    const myPlayer = this.getMyPlayer()
    
    if (!myPlayer || !gameState.hubs.size) {
      return null
    }
    
    const playerPos = myPlayer.position
    
    // Find nearest hub from the hubs map (not ports)
    const hubs = Array.from(gameState.hubs.values())
      .map(hub => ({
        hub,
        distance: Math.sqrt(
          Math.pow(hub.position[0] - playerPos[0], 2) +
          Math.pow(hub.position[1] - playerPos[1], 2) +
          Math.pow(hub.position[2] - playerPos[2], 2)
        )
      }))
      .sort((a, b) => a.distance - b.distance)
    
    return hubs.length > 0 ? hubs[0] : null
  }

  /**
   * Calculate trade options for UI (client-side calculation)
   */
  calculateTradeOptions(): TradeOption[] {
    const gameState = this.getGameState()
    const myPlayer = this.getMyPlayer()
    
    if (!myPlayer || !gameState.ports.size) {
      return []
    }
    
    const options: TradeOption[] = []
    const playerPos = myPlayer.position
    const currentPortId = myPlayer.currentPortId
    
    // Find nearest ports for trading options
    const nearbyPorts = Array.from(gameState.ports.values())
      .filter(port => port.id !== currentPortId) // Exclude current port for travel options
      .map(port => ({
        port,
        distance: Math.sqrt(
          Math.pow(port.position[0] - playerPos[0], 2) +
          Math.pow(port.position[1] - playerPos[1], 2) +
          Math.pow(port.position[2] - playerPos[2], 2)
        )
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5) // Take 5 ports now that hub is separate
    
    // Add current port as trade option if at port
    const currentPort = gameState.ports.get(currentPortId)
    if (currentPort && this.isAtLocation(playerPos, currentPort.position, 0.25)) {
      const profit = this.calculateTradeProfit(currentPort, myPlayer.cargoHolds)
      options.push({
        port: currentPort,
        distance: 0,
        travelCost: 0,
        profit,
        totalCost: 10, // FIXED_TRADE_COST
        profitPerAction: profit / 10
      })
    }
    
    // Add travel options for ports
    for (const { port, distance } of nearbyPorts) {
      const travelCost = this.calculateTravelCost(distance, myPlayer.shipType)
      const profit = this.calculateTradeProfit(port, myPlayer.cargoHolds)
      const totalCost = travelCost + 10 // Travel + Trade
      
      options.push({
        port,
        distance,
        travelCost,
        profit,
        totalCost,
        profitPerAction: profit / 10 // Profit per trade (excluding travel)
      })
    }

    // Find nearby enemies (within 20 units) and add them as combat options
    const allEnemies = Array.from(gameState.enemies.values())
    console.log('🎯 Total enemies in game:', allEnemies.length)
    
    const nearbyEnemies = allEnemies
      .map(enemy => ({
        enemy,
        distance: Math.sqrt(
          Math.pow(enemy.position[0] - playerPos[0], 2) +
          Math.pow(enemy.position[1] - playerPos[1], 2) +
          Math.pow(enemy.position[2] - playerPos[2], 2)
        )
      }))
      .filter(({ distance }) => distance <= 20) // Only show enemies within 20 units
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2) // Show max 2 enemies to avoid clutter
    
    console.log('🎯 Nearby enemies within 20 units:', nearbyEnemies.length)

    // Add nearby enemies as combat options
    for (const { enemy, distance } of nearbyEnemies) {
      const travelCost = this.calculateTravelCost(distance, myPlayer.shipType)
      
      // Create enemy as a special port option for UI display
      const enemyAsPort = {
        id: enemy.id + 10000, // Use high ID to avoid conflicts with ports
        position: enemy.position,
        name: `⚔️ ${enemy.name}`, // Add combat icon
        remainingCargo: 0, // Enemies don't have cargo
        maxCargo: 1,
        efficiency: 1.0 // Full efficiency for combat
      }
      
      options.push({
        port: enemyAsPort,
        distance,
        travelCost,
        profit: enemy.credits, // Potential credits from combat
        totalCost: travelCost,
        profitPerAction: enemy.credits / 10 // Rough estimate
      })
    }
    
    
    return options
  }
  
  /**
   * Calculate trade profit (client-side estimate)
   */
  private calculateTradeProfit(port: PortState, cargoHolds: number): number {
    const cargoHoldsFilled = Math.min(cargoHolds, port.remainingCargo)
    const profitPerHold = port.efficiency * 100
    return Math.floor(cargoHoldsFilled * profitPerHold)
  }
  
  /**
   * Calculate travel cost (client-side estimate)
   */
  private calculateTravelCost(distance: number, shipType: any): number {
    const baseCost = Math.ceil(distance)
    const multiplier = shipType ? shipType.travelCostMultiplier : 1.0
    return Math.ceil(baseCost * multiplier)
  }
  
  /**
   * Check if position is within distance of target
   */
  private isAtLocation(pos1: [number, number, number], pos2: [number, number, number], tolerance: number): boolean {
    const distance = Math.sqrt(
      Math.pow(pos1[0] - pos2[0], 2) +
      Math.pow(pos1[1] - pos2[1], 2) +
      Math.pow(pos1[2] - pos2[2], 2)
    )
    return distance <= tolerance
  }
  

  /**
   * Show hover line between player and port
   */
  showHoverLine(portId: number): void {
    const myPlayer = this.getMyPlayer()
    const gameState = this.getGameState()
    const port = gameState.ports.get(portId)
    
    if (myPlayer && port) {
      this.renderer.showHoverLine(myPlayer.position, port.position)
    }
  }

  /**
   * Hide hover line
   */
  hideHoverLine(): void {
    this.renderer.hideHoverLine()
  }
  
  /**
   * Toggle camera mode
   */
  toggleCameraMode(): void {
    this.renderer.toggleCameraMode()
  }
  
  /**
   * Toggle interpolation for testing
   */
  toggleInterpolation(): void {
    this.renderer.toggleInterpolation()
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    this.disconnect()
    this.renderer.dispose()
  }
}