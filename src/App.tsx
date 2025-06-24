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

function Scene() {
  const ports = useMemo(() => generatePortsInSphere(500, 50), [])
  
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
      
      <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
    </>
  )
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [150, 150, 150], fov: 75 }}>
        <Scene />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={30}
          maxDistance={400}
        />
      </Canvas>
    </div>
  )
}

export default App