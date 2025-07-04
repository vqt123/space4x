import React from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { Player, TradingPort } from '../types'
import { calculateTravelCost, calculateTradeProfit, FIXED_TRADE_COST } from '../utils'

interface PlayerMovementProps {
  player: Player
  setPlayer: React.Dispatch<React.SetStateAction<Player>>
  setPorts: React.Dispatch<React.SetStateAction<TradingPort[]>>
}

export function PlayerMovement({ player, setPlayer, setPorts }: PlayerMovementProps) {
  useFrame((_, delta) => {
    if (player.isMoving && player.destinationPort) {
      setPlayer(prevPlayer => {
        // Double-check that destination port still exists
        if (!prevPlayer.destinationPort || !prevPlayer.isMoving) {
          return prevPlayer
        }
        
        const startPosition = prevPlayer.startPosition || prevPlayer.position
        const distance = startPosition.distanceTo(prevPlayer.destinationPort.position)
        const travelTime = distance / prevPlayer.speed
        const progressDelta = delta / travelTime
        
        let newProgress = prevPlayer.progress + progressDelta
        
        if (newProgress >= 1) {
          // Arrived at destination
          const destination = prevPlayer.destinationPort
          const travelCost = calculateTravelCost(distance, prevPlayer.shipType)
          
          // Check if this is a hub (negative ID) or a port
          if (destination.id < 0) {
            // Traveling to upgrade hub - just deduct travel cost, no trading
            // Find the nearest actual port to set as current port
            const nearestPort = prevPlayer.currentPort // Keep the last port as reference
            return {
              ...prevPlayer,
              position: destination.position.clone(),
              currentPort: nearestPort, // Keep reference to last port
              destinationPort: null,
              startPosition: null,
              progress: 0,
              isMoving: false,
              actionPoints: prevPlayer.actionPoints - travelCost
            }
          } else {
            // Traveling to regular port - trade automatically
            const totalCost = travelCost + FIXED_TRADE_COST
            const profit = calculateTradeProfit(destination, prevPlayer.cargoHolds)
            
            // Reduce port cargo after trading
            setPorts(prevPorts => 
              prevPorts.map(port => 
                port.id === destination.id 
                  ? { ...port, remainingCargo: Math.max(0, port.remainingCargo - prevPlayer.cargoHolds) }
                  : port
              )
            )
            
            return {
              ...prevPlayer,
              position: destination.position.clone(),
              currentPort: destination,
              destinationPort: null,
              startPosition: null,
              progress: 0,
              isMoving: false,
              actionPoints: prevPlayer.actionPoints - totalCost,
              credits: prevPlayer.credits + profit,
              totalProfit: prevPlayer.totalProfit + profit
            }
          }
        }
        
        // Update position during travel
        const newPosition = new Vector3().lerpVectors(
          startPosition,
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