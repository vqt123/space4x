import { Canvas } from '@react-three/fiber'
import React, { useState } from 'react'
import { Bot, TradingPort, Player, TradeOption, UpgradeHub } from './types'
import { generatePortsInSphere, generateUpgradeHubs, calculateTravelCost } from './utils'
import { Scene } from './components/Scene'
import { GameUI } from './components/GameUI'
import { Leaderboard } from './components/Leaderboard'

function App() {
  const [ports, setPorts] = useState<TradingPort[]>(() => generatePortsInSphere(500, 50))
  const [upgradeHubs, setUpgradeHubs] = useState<UpgradeHub[]>(() => generateUpgradeHubs(50, 50))
  const [bots, setBots] = useState<Bot[]>([])
  
  // Initialize player at a random port
  const [player, setPlayer] = useState<Player>(() => {
    const startPort = ports[Math.floor(Math.random() * ports.length)]
    return {
      position: startPort.position.clone(),
      currentPort: startPort,
      destinationPort: null,
      progress: 0,
      speed: 1,
      isMoving: false,
      actionPoints: 500,
      totalProfit: 0,
      upgrades: {}
    }
  })
  
  const handleTravel = (destination: TradingPort) => {
    const distance = player.currentPort.position.distanceTo(destination.position)
    const travelCost = calculateTravelCost(distance)
    const totalCost = travelCost + destination.tradeCost
    
    if (player.actionPoints >= totalCost) {
      setPlayer(prevPlayer => ({
        ...prevPlayer,
        destinationPort: destination,
        progress: 0,
        isMoving: true
      }))
    }
  }
  
  const handleTrade = (option: TradeOption) => {
    if (player.actionPoints >= option.totalCost) {
      // Reduce port profit (diminishing returns) FIRST
      setPorts(prevPorts => 
        prevPorts.map(port => 
          port.id === option.port.id 
            ? { ...port, currentProfitMultiplier: port.currentProfitMultiplier * 0.85 } // 15% reduction
            : port
        )
      )
      
      // Then update player profit and action points
      setPlayer(prevPlayer => {
        // Update current port reference to the modified port
        const updatedCurrentPort = ports.find(p => p.id === prevPlayer.currentPort.id) || prevPlayer.currentPort
        
        return {
          ...prevPlayer,
          totalProfit: prevPlayer.totalProfit + option.profit,
          actionPoints: prevPlayer.actionPoints - option.totalCost,
          currentPort: { ...updatedCurrentPort, currentProfitMultiplier: updatedCurrentPort.currentProfitMultiplier * 0.85 }
        }
      })
    }
  }
  
  const handleUpgrade = (upgradeId: number) => {
    const { UPGRADE_DEFINITIONS } = require('./utils')
    const upgrade = UPGRADE_DEFINITIONS.find((u: any) => u.id === upgradeId)
    if (upgrade && player.totalProfit >= upgrade.cost) {
      setPlayer(prevPlayer => ({
        ...prevPlayer,
        totalProfit: prevPlayer.totalProfit - upgrade.cost,
        upgrades: { ...prevPlayer.upgrades, [upgradeId]: 1 }
      }))
    }
  }
  
  const handleTravelToHub = (hub: UpgradeHub) => {
    const distance = player.position.distanceTo(hub.position)
    const travelCost = calculateTravelCost(distance)
    
    if (player.actionPoints >= travelCost) {
      setPlayer(prevPlayer => ({
        ...prevPlayer,
        destinationPort: null, // Clear port destination
        isMoving: true,
        progress: 0
      }))
      
      // Create a temporary "port" at the hub location for movement system
      const tempHubPort: TradingPort = {
        id: -hub.id, // Negative ID to distinguish from real ports
        position: hub.position,
        name: hub.name,
        baseProfit: 0,
        currentProfitMultiplier: 1,
        tradeCost: 0
      }
      
      setPlayer(prevPlayer => ({
        ...prevPlayer,
        destinationPort: tempHubPort
      }))
    }
  }
  
  const handleBotsUpdate = (newBots: Bot[]) => {
    setBots(newBots)
  }
  
  // Update player's port references when ports change
  React.useEffect(() => {
    setPlayer(prevPlayer => {
      const updatedCurrentPort = ports.find(p => p.id === prevPlayer.currentPort.id)
      const updatedDestinationPort = prevPlayer.destinationPort 
        ? ports.find(p => p.id === prevPlayer.destinationPort!.id) 
        : null
      
      if (updatedCurrentPort) {
        return {
          ...prevPlayer,
          currentPort: updatedCurrentPort,
          destinationPort: updatedDestinationPort || prevPlayer.destinationPort
        }
      }
      return prevPlayer
    })
  }, [ports])
  
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas camera={{ position: [150, 150, 150], fov: 75 }}>
        <Scene ports={ports} upgradeHubs={upgradeHubs} player={player} setPlayer={setPlayer} setPorts={setPorts} onBotsUpdate={handleBotsUpdate} />
      </Canvas>
      <GameUI 
        player={player} 
        ports={ports} 
        upgradeHubs={upgradeHubs}
        onTravel={handleTravel} 
        onTrade={handleTrade}
        onUpgrade={handleUpgrade}
        onTravelToHub={handleTravelToHub}
      />
      <Leaderboard player={player} bots={bots} />
    </div>
  )
}

export default App