import React, { useEffect, useRef, useState } from 'react'
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
  const [cameraMode, setCameraMode] = useState('FOLLOW')
  const [myPlayer, setMyPlayer] = useState<any>(undefined)
  const [gameClientReady, setGameClientReady] = useState(false)
  const [lastActionTime, setLastActionTime] = useState(0)
  
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
          setGameClientReady(true)
          
          // Set up state update callback
          gameClient.onStateChange((newState) => {
            setGameState(newState)
            // Update player state separately to trigger React re-renders
            const newPlayer = gameClient.getMyPlayer()
            setMyPlayer(newPlayer)
          })
          
          // Set up keyboard listener for camera toggle and interpolation
          const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'c' || event.key === 'C') {
              gameClient.toggleCameraMode()
              setCameraMode(prev => prev === 'FOLLOW' ? 'FREE' : 'FOLLOW')
            } else if (event.key === 'i' || event.key === 'I') {
              gameClient.toggleInterpolation()
            }
          }
          window.addEventListener('keydown', handleKeyDown)
          
          
          return () => {
            window.removeEventListener('keydown', handleKeyDown)
          }
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
  
  // FPS tracking is now handled by ThreeRenderer
  
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
    console.log('🎯 handleConnect called', { playerName, gameClient: !!gameClientRef.current })
    if (!playerName.trim()) {
      console.log('❌ Cannot connect: missing playerName')
      return
    }
    
    // Wait for GameClient to be created if it's not ready yet
    if (!gameClientRef.current) {
      console.log('⏳ GameClient not ready, waiting...')
      // Wait up to 2 seconds for GameClient to be created
      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 100))
        if (gameClientRef.current) break
      }
      
      if (!gameClientRef.current) {
        console.log('❌ GameClient still not ready after waiting')
        setConnectionError('Game client failed to initialize')
        return
      }
      console.log('✅ GameClient is now ready')
    }
    
    setIsConnecting(true)
    setConnectionError(null)
    console.log('🔄 Set isConnecting=true, connectionError=null')
    
    try {
      console.log('🚀 Attempting to connect...')
      await gameClientRef.current.connect(playerName.trim())
      console.log('✅ Successfully connected to game server')
      
      // Force canvas resize after connection (canvas becomes visible)
      setTimeout(() => {
        if (gameClientRef.current) {
          console.log('📐 Triggering force resize after connection')
          gameClientRef.current.forceResize()
        }
      }, 100)
    } catch (error) {
      console.error('❌ Failed to connect:', error)
      setConnectionError(error instanceof Error ? error.message : 'Connection failed')
      console.log('🔄 Set connectionError:', error instanceof Error ? error.message : 'Connection failed')
    } finally {
      console.log('🔄 Setting isConnecting=false')
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
      setLastActionTime(Date.now())
    }
  }
  
  const handleTravel = (targetPortId: number) => {
    if (gameClientRef.current) {
      const action: PlayerAction = { type: 'TRAVEL', targetId: targetPortId }
      gameClientRef.current.sendAction(action)
      setLastActionTime(Date.now())
    }
  }
  
  const handleUpgrade = () => {
    if (gameClientRef.current) {
      const action: PlayerAction = { type: 'UPGRADE_CARGO' }
      gameClientRef.current.sendAction(action)
      setLastActionTime(Date.now())
    }
  }
  
  // Auto-connect when game client is ready
  useEffect(() => {
    if (gameClientReady && !gameState.connected && !isConnecting) {
      const randomName = `Pilot${Math.floor(Math.random() * 10000)}`
      setPlayerName(randomName)
      console.log('🚀 Auto-connecting with username:', randomName)
      // Small delay to ensure everything is set up
      setTimeout(() => {
        console.log('🎮 Calling handleConnect for auto-connection')
        handleConnect()
      }, 1000)
    }
  }, [gameClientReady, gameState.connected, isConnecting])
  
  
  // Calculate trade options
  const tradeOptions = gameClientRef.current?.calculateTradeOptions() || []
  
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
              Client v1.0.60 | Server v1.0.2
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
            
            <div style={{ 
              marginTop: '10px'
            }}>
              <a 
                href="/demo" 
                style={{ 
                  color: '#00ff88', 
                  fontSize: '12px',
                  textDecoration: 'none'
                }}
              >
                🔧 Demo Scene (test Three.js)
              </a>
            </div>
          </div>
        </div>
      )}
      
      {/* Camera Mode Indicator - positioned below FPS meter */}
      <div style={{
        position: 'absolute',
        top: 60,
        right: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        color: cameraMode === 'FREE' ? '#00ff88' : '#ffaa00',
        padding: '8px 12px',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '14px',
        fontWeight: 'bold',
        border: '1px solid rgba(255,255,255,0.3)',
        zIndex: 999  // Lower than FPS meter
      }}>
        CAM: {cameraMode}
        <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>
          L-drag=rotate, R-drag=pan
        </div>
        <div style={{ fontSize: '10px', color: '#aaa' }}>
          C=cam, I=interp
        </div>
      </div>
      
      {/* Game UI - always show, handles its own loading states */}
      <NewGameUI
        player={myPlayer}
        tradeOptions={tradeOptions}
        isConnected={gameState.connected}
        cooldownRemaining={0}
        onTrade={handleTrade}
        onTravel={handleTravel}
        onUpgrade={handleUpgrade}
        onPortHover={(portId) => gameClientRef.current?.showHoverLine(portId)}
        onPortHoverEnd={() => gameClientRef.current?.hideHoverLine()}
      />
      
      {/* Cooldown bar and leaderboard - only show when connected */}
      {gameState.connected && (
        <>
          {/* Cooldown bar at top */}
          {myPlayer && (
            <CooldownBar 
              lastActionTime={lastActionTime} 
              cooldownDuration={500} 
            />
          )}
          
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