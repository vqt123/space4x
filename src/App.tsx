import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { Vector3 } from 'three'
import * as THREE from 'three'
import React, { useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react'

interface TradingPort {
  id: number
  position: Vector3
  name: string
  baseProfit: number
  currentProfitMultiplier: number
  tradeCost: number
}

interface Bot {
  id: number
  position: Vector3
  currentPort: TradingPort
  destinationPort: TradingPort
  progress: number
  speed: number
  actionPoints: number
  totalProfit: number
  name: string
}

interface Player {
  position: Vector3
  currentPort: TradingPort
  destinationPort: TradingPort | null
  progress: number
  speed: number
  isMoving: boolean
  actionPoints: number
  totalProfit: number
}

interface TradeOption {
  port: TradingPort
  distance: number
  travelCost: number
  profit: number
  totalCost: number
  profitPerAction: number
}

function generatePortsInSphere(count: number, radius: number): TradingPort[] {
  const ports: TradingPort[] = []
  
  for (let i = 0; i < count; i++) {
    let position: Vector3
    
    do {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(1 - 2 * Math.random())
      const r = Math.pow(Math.random(), 1/3) * radius
      
      position = new Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      )
    } while (position.length() > radius)
    
    ports.push({
      id: i,
      position,
      name: `Port ${String.fromCharCode(65 + Math.floor(i / 26))}${i % 26 + 1}`,
      baseProfit: Math.floor(Math.random() * 80) + 40, // 40-120 base profit
      currentProfitMultiplier: 1.0, // Starts at 100%
      tradeCost: Math.floor(Math.random() * 15) + 10 // 10-25 action cost to trade
    })
  }
  
  return ports
}

function calculateTradeProfit(port: TradingPort): number {
  return Math.floor(port.baseProfit * port.currentProfitMultiplier)
}

function calculateTravelCost(distance: number): number {
  return Math.ceil(distance) // 1 action point per unit of distance
}

function findNearestPorts(currentPort: TradingPort, allPorts: TradingPort[], count: number = 3): TradingPort[] {
  return allPorts
    .filter(port => port.id !== currentPort.id)
    .map(port => ({
      ...port,
      distance: currentPort.position.distanceTo(port.position)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
}

function calculateTradeOptions(currentPort: TradingPort, allPorts: TradingPort[]): TradeOption[] {
  const nearestPorts = findNearestPorts(currentPort, allPorts)
  
  // Current port option (no travel)
  const currentProfit = calculateTradeProfit(currentPort)
  const currentOption: TradeOption = {
    port: currentPort,
    distance: 0,
    travelCost: 0,
    profit: currentProfit,
    totalCost: currentPort.tradeCost,
    profitPerAction: currentProfit / currentPort.tradeCost
  }
  
  // Travel options
  const travelOptions: TradeOption[] = nearestPorts.map(port => {
    const distance = port.distance
    const travelCost = calculateTravelCost(distance)
    const profit = calculateTradeProfit(port)
    const totalCost = travelCost + port.tradeCost
    
    return {
      port,
      distance,
      travelCost,
      profit,
      totalCost,
      profitPerAction: totalCost > 0 ? profit / totalCost : 0
    }
  })
  
  return [currentOption, ...travelOptions]
}

function TradingPorts({ ports }: { ports: TradingPort[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  
  useLayoutEffect(() => {
    if (!meshRef.current) return
    
    ports.forEach((port, i) => {
      const matrix = new THREE.Matrix4()
      matrix.setPosition(port.position)
      meshRef.current.setMatrixAt(i, matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, ports.length]}>
      <sphereGeometry args={[2, 16, 12]} />
      <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={1} />
    </instancedMesh>
  )
}

function TravelLine({ start, end, color = "#ff6600", opacity = 0.8 }: { 
  start: Vector3, 
  end: Vector3,
  color?: string,
  opacity?: number
}) {
  const lineRef = useRef<THREE.Line>(null)
  
  const points = useMemo(() => {
    const points = []
    points.push(new Vector3(start.x, start.y, start.z))
    points.push(new Vector3(end.x, end.y, end.z))
    return points
  }, [start.x, start.y, start.z, end.x, end.y, end.z])
  
  return (
    <group>
      <line ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={points.length}
            array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial 
          color={color} 
          opacity={opacity} 
          transparent 
          depthWrite={false}
        />
      </line>
    </group>
  )
}

function Bots({ ports, count = 10, setPorts, onBotsUpdate }: { 
  ports: TradingPort[], 
  count?: number,
  setPorts: React.Dispatch<React.SetStateAction<TradingPort[]>>,
  onBotsUpdate: (bots: Bot[]) => void
}) {
  const [bots, setBots] = useState<Bot[]>([])
  const meshRef = useRef<THREE.InstancedMesh>(null)
  
  useEffect(() => {
    // Only initialize bots once when ports are first loaded
    if (ports.length > 0 && bots.length === 0) {
      const initialBots: Bot[] = []
      const botNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa']
      
      for (let i = 0; i < count; i++) {
        const startPort = ports[Math.floor(Math.random() * ports.length)]
        const destPort = ports[Math.floor(Math.random() * ports.length)]
        
        initialBots.push({
          id: i,
          position: startPort.position.clone(),
          currentPort: startPort,
          destinationPort: destPort,
          progress: 0,
          speed: 1,
          actionPoints: Math.floor(Math.random() * 200) + 300, // 300-500 starting points
          totalProfit: 0,
          name: botNames[i] || `Bot-${i}`
        })
      }
      setBots(initialBots)
    }
  }, [ports.length, count, bots.length])
  
  useEffect(() => {
    onBotsUpdate(bots)
  }, [bots, onBotsUpdate])
  
  // Update bot port references when ports change (but don't reinitialize bots)
  useEffect(() => {
    if (bots.length > 0) {
      setBots(prevBots => 
        prevBots.map(bot => {
          const updatedCurrentPort = ports.find(p => p.id === bot.currentPort.id) || bot.currentPort
          const updatedDestinationPort = ports.find(p => p.id === bot.destinationPort.id) || bot.destinationPort
          
          return {
            ...bot,
            currentPort: updatedCurrentPort,
            destinationPort: updatedDestinationPort
          }
        })
      )
    }
  }, [ports])
  
  useFrame((_, delta) => {
    setBots(prevBots => {
      return prevBots.map(bot => {
        const distance = bot.currentPort.position.distanceTo(bot.destinationPort.position)
        const travelTime = distance / bot.speed
        const progressDelta = delta / travelTime
        
        let newProgress = bot.progress + progressDelta
        
        if (newProgress >= 1) {
          // Bot arrived at destination - calculate costs and profits
          const destination = bot.destinationPort
          const travelCost = calculateTravelCost(distance)
          const totalCost = travelCost + destination.tradeCost
          const profit = calculateTradeProfit(destination)
          
          // Only trade if bot can afford it
          if (bot.actionPoints >= totalCost) {
            // Reduce port profit after bot trades
            setPorts(prevPorts => 
              prevPorts.map(port => 
                port.id === destination.id 
                  ? { ...port, currentProfitMultiplier: port.currentProfitMultiplier * 0.9 } // Bots cause 10% reduction
                  : port
              )
            )
            
            // Find a new profitable destination
            const affordablePorts = ports.filter(port => {
              const dist = destination.position.distanceTo(port.position)
              const cost = calculateTravelCost(dist) + port.tradeCost
              return port.id !== destination.id && bot.actionPoints - totalCost >= cost
            })
            
            const newDestination = affordablePorts.length > 0 
              ? affordablePorts[Math.floor(Math.random() * affordablePorts.length)]
              : ports[Math.floor(Math.random() * ports.length)]
            
            return {
              ...bot,
              position: destination.position.clone(),
              currentPort: destination,
              destinationPort: newDestination,
              progress: 0,
              actionPoints: bot.actionPoints - totalCost,
              totalProfit: bot.totalProfit + profit
            }
          } else {
            // Bot can't afford to trade, just pick a closer destination
            const nearbyPorts = ports
              .filter(port => port.id !== destination.id)
              .sort((a, b) => 
                destination.position.distanceTo(a.position) - 
                destination.position.distanceTo(b.position)
              )
              .slice(0, 3)
            
            const newDestination = nearbyPorts[Math.floor(Math.random() * nearbyPorts.length)]
            
            return {
              ...bot,
              position: destination.position.clone(),
              currentPort: destination,
              destinationPort: newDestination,
              progress: 0
            }
          }
        }
        
        const newPosition = new Vector3().lerpVectors(
          bot.currentPort.position,
          bot.destinationPort.position,
          newProgress
        )
        
        return {
          ...bot,
          position: newPosition,
          progress: newProgress
        }
      })
    })
  })
  
  useMemo(() => {
    if (!meshRef.current) return
    
    bots.forEach((bot, i) => {
      const matrix = new THREE.Matrix4()
      matrix.setPosition(bot.position)
      meshRef.current!.setMatrixAt(i, matrix)
    })
    
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [bots])
  
  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <coneGeometry args={[0.5, 1.5, 4]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={0.3} />
      </instancedMesh>
      {bots.map((bot) => (
        <TravelLine 
          key={bot.id} 
          start={bot.position} 
          end={bot.destinationPort.position} 
        />
      ))}
    </>
  )
}

function Leaderboard({ player, bots }: { player: Player, bots: Bot[] }) {
  const allPlayers = [
    { name: 'You', profit: player.totalProfit, actionPoints: player.actionPoints, isPlayer: true },
    ...bots.map(bot => ({ name: bot.name, profit: bot.totalProfit, actionPoints: bot.actionPoints, isPlayer: false }))
  ].sort((a, b) => b.profit - a.profit)

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 20,
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      minWidth: '250px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#00ff88' }}>Leaderboard</h3>
      {allPlayers.map((player, index) => (
        <div key={player.name} style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '5px 0',
          borderBottom: index < allPlayers.length - 1 ? '1px solid #333' : 'none',
          background: player.isPlayer ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
          margin: '0 -5px',
          paddingLeft: '5px',
          paddingRight: '5px'
        }}>
          <span style={{ color: player.isPlayer ? '#00ff88' : 'white' }}>
            #{index + 1} {player.name}
          </span>
          <div style={{ textAlign: 'right', fontSize: '12px' }}>
            <div style={{ color: '#00ff88' }}>{player.profit} credits</div>
            <div style={{ color: '#ff6600' }}>{player.actionPoints} AP</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function GameUI({ player, ports, onTravel, onTrade }: { 
  player: Player, 
  ports: TradingPort[], 
  onTravel: (destination: TradingPort) => void,
  onTrade: (option: TradeOption) => void
}) {
  const tradeOptions = useMemo(() => 
    calculateTradeOptions(player.currentPort, ports), 
    [player.currentPort, ports]
  )
  
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 20,
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '20px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      minWidth: '400px',
      maxHeight: '90vh',
      overflowY: 'auto'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#00ff88' }}>Trading Terminal</h3>
      
      {/* Player Stats */}
      <div style={{ marginBottom: '20px', padding: '10px', background: 'rgba(0, 255, 136, 0.1)', borderRadius: '4px' }}>
        <div><strong>Action Points:</strong> {player.actionPoints}</div>
        <div><strong>Total Profit:</strong> {player.totalProfit} credits</div>
        <div><strong>Location:</strong> {player.currentPort.name}</div>
      </div>

      {player.isMoving ? (
        <div style={{ color: '#ff6600' }}>
          <strong>Traveling to {player.destinationPort?.name}</strong><br/>
          <div style={{ 
            background: '#333', 
            height: '10px', 
            borderRadius: '5px', 
            overflow: 'hidden',
            margin: '10px 0'
          }}>
            <div style={{
              background: '#ff6600',
              height: '100%',
              width: `${player.progress * 100}%`,
              transition: 'width 0.1s'
            }} />
          </div>
          Progress: {(player.progress * 100).toFixed(1)}%
        </div>
      ) : (
        <div>
          <h4 style={{ color: '#00ff88', margin: '15px 0 10px 0' }}>Trade Options:</h4>
          {tradeOptions.map((option, index) => {
            const isCurrentPort = index === 0
            const canAfford = player.actionPoints >= option.totalCost
            
            return (
              <div key={option.port.id} style={{ 
                margin: '10px 0', 
                padding: '12px', 
                background: isCurrentPort ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                border: isCurrentPort ? '1px solid #00ff88' : '1px solid transparent',
                borderRadius: '6px',
                opacity: canAfford ? 1 : 0.6
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: isCurrentPort ? '#00ff88' : 'white' }}>
                      {isCurrentPort ? '📍 ' : '🚀 '}{option.port.name}
                    </strong>
                    {!isCurrentPort && (
                      <div style={{ fontSize: '12px', color: '#aaa' }}>
                        Distance: {option.distance.toFixed(1)} units
                      </div>
                    )}
                    <div style={{ margin: '8px 0', fontSize: '14px' }}>
                      <div>💰 Profit: <span style={{ color: '#00ff88' }}>{option.profit}</span> credits</div>
                      <div>⚡ Cost: <span style={{ color: '#ff6600' }}>{option.totalCost}</span> action points</div>
                      <div style={{ fontWeight: 'bold', color: '#ffff00' }}>
                        📊 Profit/Action: {option.profitPerAction.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        Efficiency: {(option.port.currentProfitMultiplier * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  <div>
                    {isCurrentPort ? (
                      <button 
                        onClick={() => onTrade(option)}
                        disabled={!canAfford}
                        style={{
                          background: canAfford ? '#00ff88' : '#666',
                          color: canAfford ? 'black' : '#ccc',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                          fontWeight: 'bold'
                        }}
                      >
                        Trade Here
                      </button>
                    ) : (
                      <button 
                        onClick={() => onTravel(option.port)}
                        disabled={!canAfford}
                        style={{
                          background: canAfford ? '#0088ff' : '#666',
                          color: canAfford ? 'white' : '#ccc',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: canAfford ? 'pointer' : 'not-allowed'
                        }}
                      >
                        Travel & Trade
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {player.actionPoints < 50 && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          background: 'rgba(255, 102, 0, 0.2)', 
          borderRadius: '4px',
          color: '#ff6600'
        }}>
          ⚠️ Running low on action points! Plan your moves carefully.
        </div>
      )}
    </div>
  )
}

function PlayerShip({ player }: { player: Player }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useEffect(() => {
    if (!meshRef.current) return
    meshRef.current.position.copy(player.position)
  }, [player.position])
  
  return (
    <mesh ref={meshRef} position={player.position}>
      <coneGeometry args={[1, 2, 6]} />
      <meshStandardMaterial color="#0088ff" emissive="#0088ff" emissiveIntensity={0.5} />
    </mesh>
  )
}

function CameraController({ player }: { player: Player }) {
  const { camera, gl } = useThree()
  const [zoom, setZoom] = useState(50)
  
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      setZoom(prevZoom => Math.max(10, Math.min(200, prevZoom + event.deltaY * 0.1)))
    }
    
    gl.domElement.addEventListener('wheel', handleWheel, { passive: false })
    return () => gl.domElement.removeEventListener('wheel', handleWheel)
  }, [gl])
  
  useFrame(() => {
    // Calculate direction from player to universe center (0,0,0)
    const universeCenter = new Vector3(0, 0, 0)
    const playerToCenter = universeCenter.clone().sub(player.position).normalize()
    
    // Position camera behind player, in the direction away from universe center
    const cameraOffset = playerToCenter.clone().multiplyScalar(-zoom)
    const targetPosition = player.position.clone().add(cameraOffset)
    
    // Smoothly move camera to target position
    camera.position.lerp(targetPosition, 0.05)
    
    // Look toward the universe center (through the player)
    camera.lookAt(universeCenter)
  })
  
  return null
}

function PlayerMovement({ player, setPlayer, setPorts }: { 
  player: Player, 
  setPlayer: React.Dispatch<React.SetStateAction<Player>>,
  setPorts: React.Dispatch<React.SetStateAction<TradingPort[]>>
}) {
  useFrame((_, delta) => {
    if (player.isMoving && player.destinationPort) {
      setPlayer(prevPlayer => {
        // Double-check that destination port still exists
        if (!prevPlayer.destinationPort || !prevPlayer.isMoving) {
          return prevPlayer
        }
        
        const distance = prevPlayer.currentPort.position.distanceTo(prevPlayer.destinationPort.position)
        const travelTime = distance / prevPlayer.speed
        const progressDelta = delta / travelTime
        
        let newProgress = prevPlayer.progress + progressDelta
        
        if (newProgress >= 1) {
          // Arrived at destination - deduct travel and trade costs, add profit
          const destination = prevPlayer.destinationPort
          const travelCost = calculateTravelCost(prevPlayer.currentPort.position.distanceTo(destination.position))
          const totalCost = travelCost + destination.tradeCost
          const profit = calculateTradeProfit(destination)
          
          // Reduce port profit after trading
          setPorts(prevPorts => 
            prevPorts.map(port => 
              port.id === destination.id 
                ? { ...port, currentProfitMultiplier: port.currentProfitMultiplier * 0.85 }
                : port
            )
          )
          
          return {
            ...prevPlayer,
            position: destination.position.clone(),
            currentPort: destination,
            destinationPort: null,
            progress: 0,
            isMoving: false,
            actionPoints: prevPlayer.actionPoints - totalCost,
            totalProfit: prevPlayer.totalProfit + profit
          }
        }
        
        // Update position during travel
        const newPosition = new Vector3().lerpVectors(
          prevPlayer.currentPort.position,
          prevPlayer.destinationPort.position,
          newProgress
        )
        
        return {
          ...prevPlayer,
          position: newPosition,
          progress: newProgress
        }
      })
    }
  })
  
  return null
}

function Scene({ ports, player, setPlayer, setPorts, onBotsUpdate }: { 
  ports: TradingPort[], 
  player: Player, 
  setPlayer: React.Dispatch<React.SetStateAction<Player>>,
  setPorts: React.Dispatch<React.SetStateAction<TradingPort[]>>,
  onBotsUpdate: (bots: Bot[]) => void
}) {
  
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[100, 100, 100]} intensity={1} />
      <pointLight position={[-100, -100, -100]} intensity={0.5} />
      
      {/* Temporarily comment out instanced mesh to debug */}
      {/* <TradingPorts ports={ports} /> */}
      
      {/* Render all ports as individual meshes */}
      {ports.map(port => (
        <mesh key={port.id} position={port.position}>
          <sphereGeometry args={[0.5, 8, 6]} />
          <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.8} />
        </mesh>
      ))}
      
      <Bots ports={ports} count={10} setPorts={setPorts} onBotsUpdate={onBotsUpdate} />
      <PlayerShip player={player} />
      <PlayerMovement player={player} setPlayer={setPlayer} setPorts={setPorts} />
      <CameraController player={player} />
      
      {/* Player travel line */}
      {player.isMoving && player.destinationPort && (
        <TravelLine 
          start={player.position} 
          end={player.destinationPort.position} 
          color="#0088ff"
          opacity={1}
        />
      )}
      
      <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
    </>
  )
}

function App() {
  const [ports, setPorts] = useState<TradingPort[]>(() => generatePortsInSphere(500, 50))
  const [bots, setBots] = useState<Bot[]>([])
  
  // Initialize player at a random port
  const [player, setPlayer] = useState<Player>(() => {
    const startPort = ports[Math.floor(Math.random() * ports.length)]
    return {
      position: startPort.position.clone(),
      currentPort: startPort,
      destinationPort: null,
      progress: 0,
      speed: 1,
      isMoving: false,
      actionPoints: 500,
      totalProfit: 0
    }
  })
  
  const handleTravel = (destination: TradingPort) => {
    const distance = player.currentPort.position.distanceTo(destination.position)
    const travelCost = calculateTravelCost(distance)
    const totalCost = travelCost + destination.tradeCost
    
    if (player.actionPoints >= totalCost) {
      setPlayer(prevPlayer => ({
        ...prevPlayer,
        destinationPort: destination,
        progress: 0,
        isMoving: true
      }))
    }
  }
  
  const handleTrade = (option: TradeOption) => {
    if (player.actionPoints >= option.totalCost) {
      // Reduce port profit (diminishing returns) FIRST
      setPorts(prevPorts => 
        prevPorts.map(port => 
          port.id === option.port.id 
            ? { ...port, currentProfitMultiplier: port.currentProfitMultiplier * 0.85 } // 15% reduction
            : port
        )
      )
      
      // Then update player profit and action points
      setPlayer(prevPlayer => {
        // Update current port reference to the modified port
        const updatedCurrentPort = ports.find(p => p.id === prevPlayer.currentPort.id) || prevPlayer.currentPort
        
        return {
          ...prevPlayer,
          totalProfit: prevPlayer.totalProfit + option.profit,
          actionPoints: prevPlayer.actionPoints - option.totalCost,
          currentPort: { ...updatedCurrentPort, currentProfitMultiplier: updatedCurrentPort.currentProfitMultiplier * 0.85 }
        }
      })
    }
  }
  
  const handleBotsUpdate = (newBots: Bot[]) => {
    setBots(newBots)
  }
  
  // Update player's port references when ports change
  React.useEffect(() => {
    setPlayer(prevPlayer => {
      const updatedCurrentPort = ports.find(p => p.id === prevPlayer.currentPort.id)
      const updatedDestinationPort = prevPlayer.destinationPort 
        ? ports.find(p => p.id === prevPlayer.destinationPort!.id) 
        : null
      
      if (updatedCurrentPort) {
        return {
          ...prevPlayer,
          currentPort: updatedCurrentPort,
          destinationPort: updatedDestinationPort || prevPlayer.destinationPort
        }
      }
      return prevPlayer
    })
  }, [ports])
  
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas camera={{ position: [150, 150, 150], fov: 75 }}>
        <Scene ports={ports} player={player} setPlayer={setPlayer} setPorts={setPorts} onBotsUpdate={handleBotsUpdate} />
      </Canvas>
      <GameUI 
        player={player} 
        ports={ports} 
        onTravel={handleTravel} 
        onTrade={handleTrade}
      />
      <Leaderboard player={player} bots={bots} />
    </div>
  )
}

export default App