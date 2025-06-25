import express from 'express'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import cors from 'cors'
import { GameLoop } from './core/GameLoop'
import { PlayerAction } from './types/ServerTypes'

/**
 * Space4X Game Server
 * 
 * Authoritative server running at 100ms tick rate
 * Manages all game state and broadcasts to connected clients
 */
class Space4XServer {
  private app: express.Application
  private server: any
  private io: SocketServer
  private gameLoop: GameLoop
  private port: number
  
  constructor(port: number = 3001) {
    this.port = port
    
    // Create Express app
    this.app = express()
    this.app.use(cors())
    this.app.use(express.json())
    
    // Create HTTP server
    this.server = createServer(this.app)
    
    // Create Socket.IO server
    this.io = new SocketServer(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })
    
    // Create game loop
    this.gameLoop = new GameLoop()
    
    this.setupRoutes()
    this.setupSocketHandlers()
    this.setupGameWorldBroadcast()
  }
  
  /**
   * Set up HTTP routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const gameWorld = this.gameLoop.getGameWorld()
      res.json({
        status: 'ok',
        tick: this.gameLoop.getCurrentTick(),
        players: gameWorld.getPlayerCount(),
        bots: gameWorld.getBotCount(),
        uptime: process.uptime()
      })
    })
    
    // Game stats endpoint
    this.app.get('/stats', (req, res) => {
      const gameWorld = this.gameLoop.getGameWorld()
      res.json({
        tick: this.gameLoop.getCurrentTick(),
        players: gameWorld.getPlayerCount(),
        bots: gameWorld.getBotCount(),
        tickRate: this.gameLoop.getTickManager().getTickRate()
      })
    })
  }
  
  /**
   * Set up Socket.IO event handlers
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`)
      
      // Handle player join
      socket.on('join_game', (data: { playerName: string }) => {
        try {
          const { playerName } = data
          const gameWorld = this.gameLoop.getGameWorld()
          
          // Add player to game world
          const player = gameWorld.addPlayer(socket.id, playerName || `Player-${socket.id.slice(0, 6)}`)
          
          // Send initial game state to new player
          socket.emit('game_joined', {
            playerId: player.id,
            playerName: player.name
          })
          
          console.log(`Player ${playerName} joined the game`)
        } catch (error) {
          console.error('Error handling join_game:', error)
          socket.emit('error', { message: 'Failed to join game' })
        }
      })
      
      // Handle player actions
      socket.on('player_action', (action: PlayerAction) => {
        try {
          const gameWorld = this.gameLoop.getGameWorld()
          const currentTick = this.gameLoop.getCurrentTick()
          
          const result = gameWorld.processPlayerAction(socket.id, action, currentTick)
          
          if (!result.success) {
            socket.emit('action_error', { 
              error: result.error,
              action: action.type 
            })
          }
        } catch (error) {
          console.error('Error handling player_action:', error)
          socket.emit('error', { message: 'Failed to process action' })
        }
      })
      
      // Handle disconnection
      socket.on('disconnect', () => {
        try {
          const gameWorld = this.gameLoop.getGameWorld()
          gameWorld.removePlayer(socket.id)
          console.log(`Client disconnected: ${socket.id}`)
        } catch (error) {
          console.error('Error handling disconnect:', error)
        }
      })
    })
  }
  
  /**
   * Set up game world broadcasting to all clients
   */
  private setupGameWorldBroadcast(): void {
    const gameWorld = this.gameLoop.getGameWorld()
    
    gameWorld.setBroadcastCallback((gameState) => {
      // Broadcast to all connected clients
      this.io.emit('game_state', gameState)
    })
  }
  
  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      // Start the game loop
      await this.gameLoop.start()
      
      // Start the HTTP server
      this.server.listen(this.port, () => {
        console.log(`🚀 Space4X server v1.0.1 running on port ${this.port}`)
        console.log(`📊 Health check: http://localhost:${this.port}/health`)
        console.log(`📈 Stats: http://localhost:${this.port}/stats`)
        console.log(`🎮 WebSocket server ready for connections`)
      })
    } catch (error) {
      console.error('Failed to start server:', error)
      process.exit(1)
    }
  }
  
  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    console.log('Stopping Space4X server...')
    
    // Stop the game loop
    this.gameLoop.stop()
    
    // Close all socket connections
    this.io.close()
    
    // Close HTTP server
    this.server.close()
    
    console.log('Server stopped')
  }
}

// Handle graceful shutdown
const server = new Space4XServer()

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...')
  server.stop().then(() => process.exit(0))
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...')
  server.stop().then(() => process.exit(0))
})

// Start the server
server.start().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})