import { useEffect, useRef, useState } from 'react'
import { GameClient } from './client/GameClient'
import { NewGameUI } from './components/NewGameUI'
import { NewLeaderboard } from './components/NewLeaderboard'
import { CooldownBar } from './components/CooldownBar'
import { ClientGameState, PlayerAction } from './types/ClientTypes'

function NewApp() {
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
  
  // Initialize game client when canvas is ready
  useEffect(() => {
    if (canvasRef.current && !gameClientRef.current) {
      const gameClient = new GameClient(canvasRef.current)
      gameClientRef.current = gameClient
      
      // Set up state update callback
      gameClient.onStateChange((newState) => {
        setGameState(newState)
      })
    }
    
    // Cleanup on unmount
    return () => {
      if (gameClientRef.current) {
        gameClientRef.current.dispose()
        gameClientRef.current = null
      }
    }
  }, [])
  
  // Handle connection
  const handleConnect = async () => {
    if (!gameClientRef.current || !playerName.trim()) return
    
    setIsConnecting(true)
    setConnectionError(null)
    
    try {
      await gameClientRef.current.connect(playerName.trim())
      console.log('Successfully connected to game server')
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
    if (gameClientRef.current) {
      const action: PlayerAction = { type: 'TRADE' }
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
  
  // Connection screen
  if (!gameState.connected && !isConnecting) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
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
    )
  }
  
  // Main game view
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Cooldown bar at top */}
      {myPlayer && (
        <CooldownBar 
          lastActionTime={Date.now() - cooldownRemaining} 
          cooldownDuration={500} 
        />
      )}
      
      {/* Three.js canvas */}
      <canvas 
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'block',
          background: '#000011'
        }} 
      />
      
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
      
      {/* Debug info */}
      {true && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          <div>Tick: {gameState.tick}</div>
          <div>Players: {gameState.players.size}</div>
          <div>Bots: {gameState.bots.size}</div>
          <div>Ports: {gameState.ports.size}</div>
          <button 
            onClick={handleDisconnect}
            style={{
              marginTop: '5px',
              padding: '4px 8px',
              background: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '2px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}

export default NewApp