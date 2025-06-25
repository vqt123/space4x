/**
 * TickManager - Handles precise timing for 100ms server ticks
 */
export class TickManager {
  private tickCount: number = 0
  private isRunning: boolean = false
  private tickInterval: NodeJS.Timeout | null = null
  private readonly TICK_RATE_MS = 100 // 100ms = 10 TPS
  
  private onTickCallbacks: ((tick: number) => void)[] = []
  
  constructor() {
    this.tickCount = 0
  }
  
  /**
   * Start the tick system
   */
  start(): void {
    if (this.isRunning) {
      console.warn('TickManager is already running')
      return
    }
    
    this.isRunning = true
    this.tickInterval = setInterval(() => {
      this.tick()
    }, this.TICK_RATE_MS)
    
    console.log(`TickManager started with ${this.TICK_RATE_MS}ms intervals`)
  }
  
  /**
   * Stop the tick system
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }
    
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
      this.tickInterval = null
    }
    
    this.isRunning = false
    console.log('TickManager stopped')
  }
  
  /**
   * Execute a single tick
   */
  private tick(): void {
    this.tickCount++
    
    // Execute all registered tick callbacks
    for (const callback of this.onTickCallbacks) {
      try {
        callback(this.tickCount)
      } catch (error) {
        console.error(`Error in tick callback:`, error)
      }
    }
  }
  
  /**
   * Register a callback to be called every tick
   */
  onTick(callback: (tick: number) => void): void {
    this.onTickCallbacks.push(callback)
  }
  
  /**
   * Remove a tick callback
   */
  offTick(callback: (tick: number) => void): void {
    const index = this.onTickCallbacks.indexOf(callback)
    if (index !== -1) {
      this.onTickCallbacks.splice(index, 1)
    }
  }
  
  /**
   * Get current tick count
   */
  getCurrentTick(): number {
    return this.tickCount
  }
  
  /**
   * Get tick rate in milliseconds
   */
  getTickRate(): number {
    return this.TICK_RATE_MS
  }
  
  /**
   * Check if enough ticks have passed for an action cooldown
   * Actions require 5 ticks (500ms) between uses
   */
  static canPerformAction(lastActionTick: number, currentTick: number): boolean {
    return (currentTick - lastActionTick) >= 5
  }
  
  /**
   * Calculate ticks remaining for cooldown
   */
  static getTicksUntilAction(lastActionTick: number, currentTick: number): number {
    const ticksSince = currentTick - lastActionTick
    return Math.max(0, 5 - ticksSince)
  }
  
  /**
   * Get milliseconds remaining for cooldown
   */
  static getMsUntilAction(lastActionTick: number, currentTick: number): number {
    return this.getTicksUntilAction(lastActionTick, currentTick) * 100
  }
}