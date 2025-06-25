import { TickManager } from './TickManager'
import { GameWorld } from './GameWorld'

/**
 * GameLoop - Main server game loop running at 100ms intervals
 */
export class GameLoop {
  private tickManager: TickManager
  private gameWorld: GameWorld
  private isInitialized: boolean = false
  
  constructor() {
    this.tickManager = new TickManager()
    this.gameWorld = new GameWorld()
    
    // Register tick callback
    this.tickManager.onTick((tick) => this.onTick(tick))
  }
  
  /**
   * Initialize and start the game loop
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
    
    console.log('Starting Space4X server game loop...')
    this.tickManager.start()
  }
  
  /**
   * Stop the game loop
   */
  stop(): void {
    console.log('Stopping Space4X server game loop...')
    this.tickManager.stop()
  }
  
  /**
   * Initialize game world
   */
  private async initialize(): Promise<void> {
    console.log('Initializing game world...')
    
    // Initialize game world (ports, hubs, etc.)
    await this.gameWorld.initialize()
    
    this.isInitialized = true
    console.log('Game world initialized')
  }
  
  /**
   * Called every tick (100ms)
   */
  private onTick(tick: number): void {
    try {
      // Update all game systems
      this.gameWorld.update(tick)
      
      // Broadcast only dynamic state to all connected clients (optimized)
      this.gameWorld.broadcastDynamicState(tick)
      
      // Log every 10 seconds (100 ticks)
      if (tick % 100 === 0) {
        const players = this.gameWorld.getPlayerCount()
        const bots = this.gameWorld.getBotCount()
        console.log(`Tick ${tick}: ${players} players, ${bots} bots`)
      }
    } catch (error) {
      console.error(`Error in game loop tick ${tick}:`, error)
    }
  }
  
  /**
   * Get the game world instance
   */
  getGameWorld(): GameWorld {
    return this.gameWorld
  }
  
  /**
   * Get the tick manager instance
   */
  getTickManager(): TickManager {
    return this.tickManager
  }
  
  /**
   * Get current tick count
   */
  getCurrentTick(): number {
    return this.tickManager.getCurrentTick()
  }
}