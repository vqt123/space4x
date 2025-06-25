import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import * as THREE from 'three'
import { Bot, TradingPort } from '../types'
import { calculateTravelCost, calculateTradeProfit, FIXED_TRADE_COST } from '../utils'
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
        
        initialBots.push({
          id: i,
          position: startPort.position.clone(),
          currentPort: startPort,
          destinationPort: startPort, // Start at same port (not traveling)
          progress: 0,
          speed: 3,
          actionPoints: 500, // Same as player
          totalProfit: 0,
          name: botNames[i] || `Bot-${i}`,
          shipType: { id: 'standard', name: 'Standard', startingCargoHolds: 25, maxCargoHolds: 100, travelCostMultiplier: 1.0, purchaseCost: 0, description: 'Basic bot ship' },
          cargoHolds: 25
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
    const currentTime = Date.now()
    
    setBots(prevBots => {
      return prevBots.map(bot => {
        // Check cooldown (0.5 seconds = 500ms)
        const timeSinceLastAction = currentTime - (bot.lastActionTime || 0)
        const canAct = timeSinceLastAction >= 500
        
        // If bot is not moving, check if it should trade or move
        if (bot.currentPort.id === bot.destinationPort.id && canAct) {
          const currentPort = ports.find(p => p.id === bot.currentPort.id) || bot.currentPort
          const efficiency = currentPort.remainingCargo / currentPort.maxCargo
          
          // Trade at current port if efficiency > 50% (not orange yet) and can afford
          if (efficiency > 0.5 && bot.actionPoints >= FIXED_TRADE_COST) {
            const profit = calculateTradeProfit(currentPort, bot.cargoHolds)
            
            // Execute trade
            setPorts(prevPorts => 
              prevPorts.map(port => 
                port.id === currentPort.id 
                  ? { ...port, remainingCargo: Math.max(0, port.remainingCargo - bot.cargoHolds) }
                  : port
              )
            )
            
            return {
              ...bot,
              currentPort: currentPort,
              actionPoints: bot.actionPoints - FIXED_TRADE_COST,
              totalProfit: bot.totalProfit + profit,
              lastActionTime: currentTime
            }
          } else {
            // Find closest port to move to
            const otherPorts = ports.filter(p => p.id !== bot.currentPort.id)
            const closestPort = otherPorts.reduce((closest, port) => {
              const dist = bot.currentPort.position.distanceTo(port.position)
              const closestDist = bot.currentPort.position.distanceTo(closest.position)
              return dist < closestDist ? port : closest
            }, otherPorts[0])
            
            const travelCost = calculateTravelCost(
              bot.currentPort.position.distanceTo(closestPort.position)
            )
            
            // Only move if can afford travel + at least one trade
            if (bot.actionPoints >= travelCost + FIXED_TRADE_COST) {
              return {
                ...bot,
                destinationPort: closestPort,
                progress: 0,
                lastActionTime: currentTime
              }
            }
          }
        } else {
          // Bot is traveling
          const distance = bot.currentPort.position.distanceTo(bot.destinationPort.position)
          const travelTime = distance / bot.speed
          const progressDelta = delta / travelTime
          
          let newProgress = bot.progress + progressDelta
          
          if (newProgress >= 1) {
            // Arrived at destination
            const travelCost = calculateTravelCost(distance)
            
            return {
              ...bot,
              position: bot.destinationPort.position.clone(),
              currentPort: bot.destinationPort,
              destinationPort: bot.destinationPort, // Stay at this port to trade
              progress: 0,
              actionPoints: bot.actionPoints - travelCost
            }
          } else {
            // Continue traveling
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
          }
        }
        
        // Return unchanged bot if no actions taken
        return bot
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