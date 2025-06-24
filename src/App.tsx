import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { Vector3 } from 'three'
import * as THREE from 'three'
import React, { useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react'

interface TradingPort {
  id: number
  position: Vector3
  name: string
}

interface Bot {
  id: number
  position: Vector3
  currentPort: TradingPort
  destinationPort: TradingPort
  progress: number
  speed: number
}

interface Player {
  position: Vector3
  currentPort: TradingPort
  destinationPort: TradingPort | null
  progress: number
  speed: number
  isMoving: boolean
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
      name: `Port ${String.fromCharCode(65 + Math.floor(i / 26))}${i % 26 + 1}`
    })
  }
  
  return ports
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

function TravelLine({ start, end }: { start: Vector3, end: Vector3 }) {
  const lineRef = useRef<THREE.BufferGeometry>(null)
  
  useEffect(() => {
    if (!lineRef.current) return
    const positions = new Float32Array([
      start.x, start.y, start.z,
      end.x, end.y, end.z
    ])
    lineRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  }, [start, end])
  
  return (
    <line>
      <bufferGeometry ref={lineRef} />
      <lineBasicMaterial color="#ff6600" opacity={0.3} transparent />
    </line>
  )
}

function Bots({ ports, count = 10 }: { ports: TradingPort[], count?: number }) {
  const [bots, setBots] = useState<Bot[]>([])
  const meshRef = useRef<THREE.InstancedMesh>(null)
  
  useEffect(() => {
    const initialBots: Bot[] = []
    for (let i = 0; i < count; i++) {
      const startPort = ports[Math.floor(Math.random() * ports.length)]
      const destPort = ports[Math.floor(Math.random() * ports.length)]
      
      initialBots.push({
        id: i,
        position: startPort.position.clone(),
        currentPort: startPort,
        destinationPort: destPort,
        progress: 0,
        speed: 1
      })
    }
    setBots(initialBots)
  }, [ports, count])
  
  useFrame((_, delta) => {
    setBots(prevBots => {
      return prevBots.map(bot => {
        const distance = bot.currentPort.position.distanceTo(bot.destinationPort.position)
        const travelTime = distance / bot.speed
        const progressDelta = delta / travelTime
        
        let newProgress = bot.progress + progressDelta
        
        if (newProgress >= 1) {
          const newDestination = ports[Math.floor(Math.random() * ports.length)]
          return {
            ...bot,
            position: bot.destinationPort.position.clone(),
            currentPort: bot.destinationPort,
            destinationPort: newDestination,
            progress: 0
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

function GameUI({ player, ports, onTravel }: { 
  player: Player, 
  ports: TradingPort[], 
  onTravel: (destination: TradingPort) => void 
}) {
  const nearestPorts = useMemo(() => 
    findNearestPorts(player.currentPort, ports), 
    [player.currentPort, ports]
  )
  
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 20,
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '20px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      minWidth: '300px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#00ff88' }}>Navigation</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Current Location:</strong><br/>
        {player.currentPort.name}<br/>
        <small style={{ color: '#aaa' }}>
          Position: ({player.currentPort.position.x.toFixed(1)}, {player.currentPort.position.y.toFixed(1)}, {player.currentPort.position.z.toFixed(1)})
        </small>
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
          <strong>Nearest Destinations:</strong>
          {nearestPorts.map((port: any) => (
            <div key={port.id} style={{ 
              margin: '10px 0', 
              padding: '10px', 
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px'
            }}>
              <div style={{ marginBottom: '5px' }}>
                <strong>{port.name}</strong><br/>
                <small style={{ color: '#aaa' }}>
                  Distance: {port.distance.toFixed(1)} units ({port.distance.toFixed(1)}s travel time)
                </small>
              </div>
              <button 
                onClick={() => onTravel(port)}
                style={{
                  background: '#0088ff',
                  color: 'white',
                  border: 'none',
                  padding: '5px 15px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Travel
              </button>
            </div>
          ))}
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

function PlayerMovement({ player, setPlayer }: { player: Player, setPlayer: React.Dispatch<React.SetStateAction<Player>> }) {
  useFrame((_, delta) => {
    if (player.isMoving && player.destinationPort) {
      setPlayer(prevPlayer => {
        const distance = prevPlayer.currentPort.position.distanceTo(prevPlayer.destinationPort!.position)
        const travelTime = distance / prevPlayer.speed
        const progressDelta = delta / travelTime
        
        let newProgress = prevPlayer.progress + progressDelta
        
        if (newProgress >= 1) {
          // Arrived at destination
          return {
            ...prevPlayer,
            position: prevPlayer.destinationPort!.position.clone(),
            currentPort: prevPlayer.destinationPort!,
            destinationPort: null,
            progress: 0,
            isMoving: false
          }
        }
        
        // Update position during travel
        const newPosition = new Vector3().lerpVectors(
          prevPlayer.currentPort.position,
          prevPlayer.destinationPort!.position,
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

function Scene({ ports, player, setPlayer }: { ports: TradingPort[], player: Player, setPlayer: React.Dispatch<React.SetStateAction<Player>> }) {
  
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
      
      <Bots ports={ports} count={10} />
      <PlayerShip player={player} />
      <PlayerMovement player={player} setPlayer={setPlayer} />
      
      {/* Player travel line */}
      {player.isMoving && player.destinationPort && (
        <TravelLine 
          start={player.position} 
          end={player.destinationPort.position} 
        />
      )}
      
      <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
    </>
  )
}

function App() {
  const ports = useMemo(() => generatePortsInSphere(500, 50), [])
  
  // Initialize player at a random port
  const [player, setPlayer] = useState<Player>(() => {
    const startPort = ports[Math.floor(Math.random() * ports.length)]
    return {
      position: startPort.position.clone(),
      currentPort: startPort,
      destinationPort: null,
      progress: 0,
      speed: 1,
      isMoving: false
    }
  })
  
  const handleTravel = (destination: TradingPort) => {
    setPlayer(prevPlayer => ({
      ...prevPlayer,
      destinationPort: destination,
      progress: 0,
      isMoving: true
    }))
  }
  
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas camera={{ position: [150, 150, 150], fov: 75 }}>
        <Scene ports={ports} player={player} setPlayer={setPlayer} />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={30}
          maxDistance={400}
        />
      </Canvas>
      <GameUI player={player} ports={ports} onTravel={handleTravel} />
    </div>
  )
}

export default App