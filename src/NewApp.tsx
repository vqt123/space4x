import { useEffect, useRef, useState } from 'react'
import { GameClient } from './client/GameClient'
import { NewGameUI } from './components/NewGameUI'
import { NewLeaderboard } from './components/NewLeaderboard'
import { CooldownBar } from './components/CooldownBar'
import { ClientGameState, PlayerAction } from './types/ClientTypes'

function NewApp() {
  console.log('NewApp component rendered')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameClientRef = useRef<GameClient | null>(null)
  
  const [gameState, setGameState] = useState<ClientGameState>({
    connected: false,
    tick: 0,
    players: new Map(),
    bots: new Map(),
    ports: new Map(),
    leaderboard: [],
    myPlayerId: undefined
  })
  
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [fps, setFps] = useState(0)
  
  // Initialize game client when canvas is ready
  useEffect(() => {
    console.log('useEffect triggered - canvasRef.current:', !!canvasRef.current, 'gameClientRef.current:', !!gameClientRef.current)
    
    // Small delay to ensure canvas is rendered
    const timer = setTimeout(() => {
      if (canvasRef.current && !gameClientRef.current) {
        try {
          console.log('Creating GameClient with canvas:', canvasRef.current)
          const gameClient = new GameClient(canvasRef.current)
          gameClientRef.current = gameClient
          console.log('GameClient created successfully')
          
          // Set up state update callback
          gameClient.onStateChange((newState) => {
            setGameState(newState)
          })
        } catch (error) {
          console.error('Failed to create GameClient:', error)
          setConnectionError(`Failed to initialize game client: ${error}`)
        }
      } else {
        console.log('Skipping GameClient creation - canvas:', !!canvasRef.current, 'existing client:', !!gameClientRef.current)
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])
  
  // FPS tracking
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameClientRef.current) {
        const currentFps = gameClientRef.current.getFPS()
        setFps(currentFps)
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameClientRef.current) {
        gameClientRef.current.dispose()
        gameClientRef.current = null
      }
    }
  }, [])
  
  // Handle connection
  const handleConnect = async () => {
    console.log('handleConnect called', { playerName, gameClient: !!gameClientRef.current })
    if (!gameClientRef.current || !playerName.trim()) return
    
    setIsConnecting(true)
    setConnectionError(null)
    
    try {
      console.log('Attempting to connect...')
      await gameClientRef.current.connect(playerName.trim())
      console.log('Successfully connected to game server')
      
      // Force canvas resize after connection (canvas becomes visible)
      setTimeout(() => {
        if (gameClientRef.current) {
          console.log('Triggering force resize after connection')
          gameClientRef.current.forceResize()
        }
      }, 100)
    } catch (error) {
      console.error('Failed to connect:', error)
      setConnectionError(error instanceof Error ? error.message : 'Connection failed')
    } finally {
      setIsConnecting(false)
    }
  }
  
  // Handle disconnect
  const handleDisconnect = () => {
    if (gameClientRef.current) {
      gameClientRef.current.disconnect()
    }
  }
  
  // Handle player actions
  const handleTrade = () => {
    console.log('handleTrade called - gameClient:', !!gameClientRef.current)
    if (gameClientRef.current) {
      const myPlayer = gameClientRef.current.getMyPlayer()
      console.log('Player state:', myPlayer)
      console.log('Player position:', myPlayer?.position)
      console.log('Player currentPortId:', myPlayer?.currentPortId)
      console.log('Player actionPoints:', myPlayer?.actionPoints)
      console.log('Player cooldownRemaining:', myPlayer?.cooldownRemaining)
      
      const action: PlayerAction = { type: 'TRADE' }
      console.log('Sending trade action:', action)
      gameClientRef.current.sendAction(action)
    }
  }
  
  const handleTravel = (targetPortId: number) => {
    if (gameClientRef.current) {
      const action: PlayerAction = { type: 'TRAVEL', targetId: targetPortId }
      gameClientRef.current.sendAction(action)
    }
  }
  
  const handleUpgrade = () => {
    if (gameClientRef.current) {
      const action: PlayerAction = { type: 'UPGRADE_CARGO' }
      gameClientRef.current.sendAction(action)
    }
  }
  
  // Get current player
  const myPlayer = gameClientRef.current?.getMyPlayer()
  
  // Calculate trade options
  const tradeOptions = gameClientRef.current?.calculateTradeOptions() || []
  
  // Calculate cooldown remaining
  const cooldownRemaining = myPlayer?.cooldownRemaining || 0
  
  // Always render the canvas, but show/hide UI based on connection state
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Three.js canvas - always visible */}
      <canvas 
        ref={canvasRef}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%', 
          height: '100%', 
          display: 'block',
          background: '#000011',
          zIndex: 0
        }} 
      />
      
      {/* Connection screen overlay */}
      {!gameState.connected && !isConnecting && (
        
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #000011 0%, #000033 100%)',
          fontFamily: 'monospace'
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '40px',
            borderRadius: '8px',
            textAlign: 'center',
            minWidth: '400px'
          }}>
            <h1 style={{ color: '#00ff88', marginBottom: '30px' }}>🚀 Space4X</h1>
            <p style={{ marginBottom: '20px', color: '#aaa' }}>
              Strategic 3D space trading with competitive AI
            </p>
            <div style={{ marginBottom: '20px', color: '#666', fontSize: '12px' }}>
              Client v1.0.28 | Server v1.0.1
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Enter your pilot name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '16px',
                  fontFamily: 'monospace'
                }}
              />
            </div>
            
            <button
              onClick={handleConnect}
              disabled={!playerName.trim() || isConnecting}
              style={{
                width: '100%',
                padding: '12px',
                background: playerName.trim() ? '#00ff88' : '#666',
                color: playerName.trim() ? 'black' : '#ccc',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: playerName.trim() ? 'pointer' : 'not-allowed',
                fontFamily: 'monospace'
              }}
            >
              {isConnecting ? 'Connecting...' : 'Join Game'}
            </button>
            
            {connectionError && (
              <div style={{
                marginTop: '20px',
                padding: '10px',
                background: 'rgba(255, 68, 68, 0.2)',
                border: '1px solid #ff4444',
                borderRadius: '4px',
                color: '#ff4444'
              }}>
                ❌ {connectionError}
              </div>
            )}
            
            <div style={{ 
              marginTop: '30px', 
              fontSize: '12px', 
              color: '#666' 
            }}>
              Server: localhost:3001
            </div>
          </div>
        </div>
      )}
      
      {/* FPS Meter - always visible */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        color: fps < 30 ? '#ff4444' : fps < 50 ? '#ffaa00' : '#00ff88',
        padding: '8px 12px',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '16px',
        fontWeight: 'bold',
        border: '1px solid rgba(255,255,255,0.3)',
        zIndex: 1000
      }}>
        {fps || 0} FPS
      </div>
      
      {/* Game UI - only show when connected */}
      {gameState.connected && (
        <>
          
          {/* Cooldown bar at top */}
          {myPlayer && (
            <CooldownBar 
              lastActionTime={Date.now() - cooldownRemaining} 
              cooldownDuration={500} 
            />
          )}
      
      
      {/* Game UI */}
      <NewGameUI
        player={myPlayer}
        tradeOptions={tradeOptions}
        isConnected={gameState.connected}
        cooldownRemaining={cooldownRemaining}
        onTrade={handleTrade}
        onTravel={handleTravel}
        onUpgrade={handleUpgrade}
      />
      
      {/* Leaderboard */}
      <NewLeaderboard
        leaderboard={gameState.leaderboard}
        myPlayerId={gameState.myPlayerId}
      />
      
        </>
      )}
    </div>
  )
}

export default NewApp