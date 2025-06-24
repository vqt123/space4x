import { useRef, useMemo } from 'react'
import { Vector3 } from 'three'
import * as THREE from 'three'

interface TravelLineProps {
  start: Vector3
  end: Vector3
  color?: string
  opacity?: number
}

export function TravelLine({ start, end, color = "#ff6600", opacity = 0.8 }: TravelLineProps) {
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