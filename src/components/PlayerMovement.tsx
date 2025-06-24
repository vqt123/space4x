import React from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { Player, TradingPort } from '../types'
import { calculateTravelCost, calculateTradeProfit } from '../utils'

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
        
        const distance = prevPlayer.currentPort.position.distanceTo(prevPlayer.destinationPort.position)
        const travelTime = distance / prevPlayer.speed
        const progressDelta = delta / travelTime
        
        let newProgress = prevPlayer.progress + progressDelta
        
        if (newProgress >= 1) {
          // Arrived at destination
          const destination = prevPlayer.destinationPort
          const travelCost = calculateTravelCost(prevPlayer.currentPort.position.distanceTo(destination.position))
          
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
              progress: 0,
              isMoving: false,
              actionPoints: prevPlayer.actionPoints - travelCost
            }
          } else {
            // Traveling to regular port - trade automatically
            const totalCost = travelCost + destination.tradeCost
            const profit = calculateTradeProfit(destination, prevPlayer.upgrades)
            
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