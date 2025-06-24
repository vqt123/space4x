import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Player } from '../types'

interface PlayerShipProps {
  player: Player
}

export function PlayerShip({ player }: PlayerShipProps) {
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