import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import * as THREE from 'three'
import { Bot, TradingPort } from '../types'
import { calculateTravelCost, calculateTradeProfit } from '../utils'
import { TravelLine } from './TravelLine'

interface BotsProps {
  ports: TradingPort[]
  count?: number
  setPorts: React.Dispatch<React.SetStateAction<TradingPort[]>>
  onBotsUpdate: (bots: Bot[]) => void
}

export function Bots({ ports, count = 10, setPorts, onBotsUpdate }: BotsProps) {
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