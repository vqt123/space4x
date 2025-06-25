import { ServerBot, TradingPort, Vector3 } from '../types/ServerTypes'
import { TickManager } from '../core/TickManager'
import { 
  calculateTradeProfit, 
  calculateTravelCost, 
  findNearestPorts,
  isAtPort,
  executeTrade,
  getPortEfficiency,
  FIXED_TRADE_COST
} from '../utils/GameUtils'

/**
 * BotSystem - Server-side AI bot behavior and decision making
 */
export class BotSystem {
  private bots: ServerBot[]
  private ports: TradingPort[]
  
  constructor(bots: ServerBot[], ports: TradingPort[]) {
    this.bots = bots
    this.ports = ports
  }
  
  /**
   * Update all bots for the current tick
   */
  updateBots(currentTick: number): void {
    for (const bot of this.bots) {
      this.updateBot(bot, currentTick)
    }
  }
  
  /**
   * Update a single bot's AI behavior
   */
  private updateBot(bot: ServerBot, currentTick: number): void {
    // Update movement if bot is traveling
    if (bot.progress < 1 && bot.destinationPort.id !== bot.currentPort.id) {
      this.updateBotMovement(bot)
    } else {
      // Bot has arrived, reset movement state
      if (bot.progress >= 1) {
        this.completeBotMovement(bot)
      }
      
      // Make AI decisions if cooldown allows
      if (TickManager.canPerformAction(bot.lastActionTick, currentTick)) {
        this.makeBotDecision(bot, currentTick)
      }
    }
  }
  
  /**
   * Update bot movement towards destination
   */
  private updateBotMovement(bot: ServerBot): void {
    const startPos = bot.currentPort.position
    const endPos = bot.destinationPort.position
    const distance = startPos.distanceTo(endPos)
    const travelTime = distance / bot.speed
    
    // Increase progress (assuming 100ms tick rate)
    const progressDelta = 0.1 / travelTime // 0.1 seconds per tick
    bot.progress = Math.min(1, bot.progress + progressDelta)
    
    // Update position via interpolation
    bot.position = Vector3.lerp(startPos, endPos, bot.progress)
  }
  
  /**
   * Complete bot movement when reaching destination
   */
  private completeBotMovement(bot: ServerBot): void {
    // Snap to exact destination
    bot.position = bot.destinationPort.position.clone()
    bot.currentPort = bot.destinationPort
    bot.progress = 0
    
    // Deduct travel cost from action points
    const distance = bot.currentPort.position.distanceTo(bot.destinationPort.position)
    const travelCost = calculateTravelCost(distance, bot.shipType)
    bot.actionPoints = Math.max(0, bot.actionPoints - travelCost)
  }
  
  /**
   * Make AI decision for bot behavior
   */
  private makeBotDecision(bot: ServerBot, currentTick: number): void {
    // Check if bot is at current port
    if (!isAtPort(bot.position, bot.currentPort)) {
      return // Bot is not at a port, can't take actions
    }
    
    const currentPort = this.findPortById(bot.currentPort.id)
    if (!currentPort) return
    
    const efficiency = getPortEfficiency(currentPort)
    
    // Bot strategy: Trade if efficiency > 50% and can afford, otherwise find better port
    if (efficiency > 0.5 && bot.actionPoints >= FIXED_TRADE_COST) {
      // Execute trade
      this.executeBotTrade(bot, currentPort, currentTick)
    } else {
      // Find better port to travel to
      this.findBetterPortForBot(bot, currentTick)
    }
  }
  
  /**
   * Execute a trade for the bot
   */
  private executeBotTrade(bot: ServerBot, port: TradingPort, currentTick: number): void {
    if (bot.actionPoints < FIXED_TRADE_COST) return
    
    const tradeResult = executeTrade(port, bot.cargoHolds)
    
    // Update bot state
    bot.actionPoints -= FIXED_TRADE_COST
    bot.totalProfit += tradeResult.profit
    bot.lastActionTick = currentTick
    
    console.log(`Bot ${bot.name} traded at ${port.name} for ${tradeResult.profit} profit`)
  }
  
  /**
   * Find a better port for the bot to travel to
   */
  private findBetterPortForBot(bot: ServerBot, currentTick: number): void {
    // Find nearest ports with good efficiency
    const nearbyPorts = findNearestPorts(bot.position, this.ports, bot.currentPort.id, 5)
    
    // Filter for ports with better efficiency than current
    const currentEfficiency = getPortEfficiency(bot.currentPort)
    const betterPorts = nearbyPorts.filter(port => {
      const portEfficiency = getPortEfficiency(port)
      const travelCost = calculateTravelCost(bot.position.distanceTo(port.position), bot.shipType)
      
      // Only consider if we can afford travel + trade and efficiency is better
      return portEfficiency > currentEfficiency && 
             bot.actionPoints >= (travelCost + FIXED_TRADE_COST)
    })
    
    if (betterPorts.length > 0) {
      // Choose the most efficient port that we can afford
      const bestPort = betterPorts
        .sort((a, b) => getPortEfficiency(b) - getPortEfficiency(a))[0]
      
      this.setBotDestination(bot, bestPort, currentTick)
    } else {
      // No better ports available, just go to nearest port with any cargo
      const portsWithCargo = nearbyPorts.filter(port => port.remainingCargo > 0)
      if (portsWithCargo.length > 0) {
        this.setBotDestination(bot, portsWithCargo[0], currentTick)
      }
    }
  }
  
  /**
   * Set bot destination and start travel
   */
  private setBotDestination(bot: ServerBot, destinationPort: TradingPort, currentTick: number): void {
    const distance = bot.position.distanceTo(destinationPort.position)
    const travelCost = calculateTravelCost(distance, bot.shipType)
    
    // Check if bot can afford the travel
    if (bot.actionPoints < travelCost) {
      return // Can't afford travel
    }
    
    bot.destinationPort = destinationPort
    bot.progress = 0
    bot.lastActionTick = currentTick
    
    console.log(`Bot ${bot.name} traveling from ${bot.currentPort.name} to ${destinationPort.name}`)
  }
  
  /**
   * Find port by ID
   */
  private findPortById(portId: number): TradingPort | undefined {
    return this.ports.find(port => port.id === portId)
  }
  
  /**
   * Get bot statistics for debugging
   */
  getBotStats(): { 
    totalProfit: number, 
    averageActionPoints: number, 
    activelyTrading: number, 
    traveling: number 
  } {
    const totalProfit = this.bots.reduce((sum, bot) => sum + bot.totalProfit, 0)
    const averageActionPoints = this.bots.reduce((sum, bot) => sum + bot.actionPoints, 0) / this.bots.length
    const activelyTrading = this.bots.filter(bot => 
      isAtPort(bot.position, bot.currentPort) && 
      getPortEfficiency(bot.currentPort) > 0.5
    ).length
    const traveling = this.bots.filter(bot => bot.progress > 0 && bot.progress < 1).length
    
    return {
      totalProfit,
      averageActionPoints,
      activelyTrading,
      traveling
    }
  }
}