import { useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { Player } from '../types'

interface CameraControllerProps {
  player: Player
}

export function CameraController({ player }: CameraControllerProps) {
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