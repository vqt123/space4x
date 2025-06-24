import React from 'react'
import { Stars } from '@react-three/drei'
import { Bot, TradingPort, Player, UpgradeHub } from '../types'
import { Bots } from './Bots'
import { PlayerShip } from './PlayerShip'
import { PlayerMovement } from './PlayerMovement'
import { CameraController } from './CameraController'
import { TravelLine } from './TravelLine'

interface SceneProps {
  ports: TradingPort[]
  upgradeHubs: UpgradeHub[]
  player: Player
  setPlayer: React.Dispatch<React.SetStateAction<Player>>
  setPorts: React.Dispatch<React.SetStateAction<TradingPort[]>>
  onBotsUpdate: (bots: Bot[]) => void
}

export function Scene({ ports, upgradeHubs, player, setPlayer, setPorts, onBotsUpdate }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[100, 100, 100]} intensity={1} />
      <pointLight position={[-100, -100, -100]} intensity={0.5} />
      
      {/* Render all ports as individual meshes */}
      {ports.map(port => (
        <mesh key={port.id} position={port.position}>
          <sphereGeometry args={[0.5, 8, 6]} />
          <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.8} />
        </mesh>
      ))}
      
      {/* Render upgrade hubs as blue cubes */}
      {upgradeHubs.map(hub => (
        <mesh key={hub.id} position={hub.position}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#4488ff" emissive="#4488ff" emissiveIntensity={0.6} />
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