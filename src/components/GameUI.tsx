import React, { useMemo } from 'react'
import { Player, TradingPort, TradeOption, UpgradeHub, HubTravelOption } from '../types'
import { calculateTradeOptions, findNearestUpgradeHub, getCargoHoldUpgradeCost, calculateTravelCost, FIXED_TRADE_COST } from '../utils'

interface GameUIProps {
  player: Player
  ports: TradingPort[]
  upgradeHubs: UpgradeHub[]
  onTravel: (destination: TradingPort) => void
  onTrade: (option: TradeOption) => void
  onCargoHoldUpgrade?: () => void
  onTravelToHub?: (hub: UpgradeHub) => void
}

function getProfitTradeColor(port: TradingPort): string {
  const efficiency = port.remainingCargo / port.maxCargo
  if (efficiency > 0.75) return '#00ff88' // Green: 75-100%
  if (efficiency > 0.50) return '#ffff00' // Yellow: 50-75%
  if (efficiency > 0.25) return '#ff8800' // Orange: 25-50%
  return '#ff4444' // Red: 0-25%
}

export function GameUI({ player, ports, upgradeHubs, onTravel, onTrade, onCargoHoldUpgrade, onTravelToHub }: GameUIProps) {
  const tradeOptions = useMemo(() => 
    calculateTradeOptions(player.currentPort, ports, player.cargoHolds, player.shipType, player.position), 
    [player.currentPort, ports, player.cargoHolds, player.shipType, player.position]
  )
  
  const nearestHub = useMemo(() => 
    findNearestUpgradeHub(player.position, upgradeHubs),
    [player.position, upgradeHubs]
  )
  
  const isAtHub = nearestHub && player.position.distanceTo(nearestHub.position) < 0.25
  const isAtPort = player.currentPort && player.position.distanceTo(player.currentPort.position) < 0.25
  
  // Check if player is on cooldown
  const [isOnCooldown, setIsOnCooldown] = React.useState(false)
  React.useEffect(() => {
    const checkCooldown = () => {
      const timeSinceLastAction = Date.now() - player.lastActionTime
      setIsOnCooldown(timeSinceLastAction < 500)
    }
    
    checkCooldown()
    const interval = setInterval(checkCooldown, 50) // Check every 50ms for smooth UI
    
    return () => clearInterval(interval)
  }, [player.lastActionTime])
  
  const cargoHoldUpgrade = useMemo(() => {
    const canUpgrade = player.cargoHolds < player.shipType.maxCargoHolds
    const cost = canUpgrade ? getCargoHoldUpgradeCost(player.cargoHolds) : 0
    return { canUpgrade, cost }
  }, [player.cargoHolds, player.shipType.maxCargoHolds])
  
  const hubTravelOption = useMemo((): HubTravelOption | null => {
    if (!nearestHub) return null
    const distance = player.position.distanceTo(nearestHub.position)
    return {
      hub: nearestHub,
      distance,
      travelCost: calculateTravelCost(distance, player.shipType)
    }
  }, [nearestHub, player.position, player.shipType])
  
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 20,
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '20px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      minWidth: '400px',
      maxHeight: '90vh',
      overflowY: 'auto'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#00ff88' }}>Trading Terminal</h3>
      
      {/* Player Stats */}
      <div style={{ marginBottom: '20px', padding: '10px', background: 'rgba(0, 255, 136, 0.1)', borderRadius: '4px' }}>
        <div><strong>Ship:</strong> {player.shipType.name}</div>
        <div><strong>Cargo Holds:</strong> {player.cargoHolds}/{player.shipType.maxCargoHolds}</div>
        <div><strong>Action Points:</strong> {player.actionPoints}</div>
        <div><strong>Credits:</strong> {player.credits}</div>
        <div><strong>Total Profit:</strong> {player.totalProfit}</div>
        <div><strong>Location:</strong> {player.currentPort.name}</div>
      </div>
      
      {/* Upgrade Hub Section */}
      {nearestHub && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '10px', 
          background: isAtHub ? 'rgba(68, 136, 255, 0.2)' : 'rgba(68, 136, 255, 0.1)', 
          borderRadius: '4px',
          border: isAtHub ? '2px solid #4488ff' : '1px solid rgba(68, 136, 255, 0.3)'
        }}>
          <div style={{ color: '#4488ff', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
            🔧 {isAtHub ? 'At Upgrade Hub' : 'Nearest Upgrade Hub'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div><strong>{nearestHub.name}</strong></div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>
                Distance: {player.position.distanceTo(nearestHub.position).toFixed(1)} units
              </div>
            </div>
            {!isAtHub && hubTravelOption && onTravelToHub && (
              <button
                onClick={() => onTravelToHub(nearestHub)}
                disabled={player.actionPoints < hubTravelOption.travelCost}
                style={{
                  background: player.actionPoints >= hubTravelOption.travelCost ? '#4488ff' : '#666',
                  color: player.actionPoints >= hubTravelOption.travelCost ? 'white' : '#ccc',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: player.actionPoints >= hubTravelOption.travelCost ? 'pointer' : 'not-allowed',
                  fontSize: '12px'
                }}
              >
                Travel ({hubTravelOption.travelCost} AP)
              </button>
            )}
          </div>
          
          {isAtHub && cargoHoldUpgrade.canUpgrade && (
            <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '4px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4488ff' }}>
                Available Upgrade:
              </div>
              <div style={{ margin: '5px 0' }}>
                <strong>Cargo Hold Expansion</strong>
              </div>
              <div style={{ fontSize: '11px', color: '#ccc', marginBottom: '8px' }}>
                Add +1 cargo hold
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#ff6600' }}>
                  Cost: {cargoHoldUpgrade.cost} credits
                </div>
                <button
                  onClick={() => onCargoHoldUpgrade?.()}
                  disabled={!onCargoHoldUpgrade || player.credits < cargoHoldUpgrade.cost || isOnCooldown}
                  style={{
                    background: isOnCooldown ? '#444' : (player.credits >= cargoHoldUpgrade.cost ? '#4488ff' : '#666'),
                    color: isOnCooldown ? '#888' : (player.credits >= cargoHoldUpgrade.cost ? 'white' : '#ccc'),
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: (player.credits >= cargoHoldUpgrade.cost && !isOnCooldown) ? 'pointer' : 'not-allowed',
                    fontSize: '12px'
                  }}
                >
                  Upgrade
                </button>
              </div>
            </div>
          )}
          
          {isAtHub && !cargoHoldUpgrade.canUpgrade && (
            <div style={{ marginTop: '8px', color: '#00ff88', fontSize: '12px' }}>
              ✅ Maximum cargo holds reached!
            </div>
          )}
        </div>
      )}

      {player.isMoving ? (
        <div style={{ color: '#ff6600' }}>
          <strong>Traveling to {player.destinationPort?.name}</strong><br/>
          <div style={{ 
            background: '#333', 
            height: '10px', 
            borderRadius: '5px', 
            overflow: 'hidden',
            margin: '10px 0'
          }}>
            <div style={{
              background: '#ff6600',
              height: '100%',
              width: `${player.progress * 100}%`,
              transition: 'width 0.1s'
            }} />
          </div>
          Progress: {(player.progress * 100).toFixed(1)}%
        </div>
      ) : !isAtPort && !isAtHub ? (
        <div style={{ color: '#ff6600', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
          <strong>🚀 In Transit</strong><br/>
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>
            Travel to a location to trade or upgrade
          </div>
        </div>
      ) : (
        <div>
          {isAtHub && (
            <div style={{ 
              marginBottom: '15px', 
              padding: '10px', 
              background: 'rgba(68, 136, 255, 0.1)', 
              borderRadius: '4px',
              border: '1px solid rgba(68, 136, 255, 0.3)',
              textAlign: 'center'
            }}>
              <div style={{ color: '#4488ff', fontSize: '14px', fontWeight: 'bold' }}>
                🔧 At Upgrade Hub - View Nearby Ports
              </div>
              <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
                Travel to a port to trade
              </div>
            </div>
          )}
          <h4 style={{ color: '#00ff88', margin: '15px 0 10px 0' }}>
            {isAtHub ? 'Nearby Trade Options:' : 'Trade Options:'}
          </h4>
          {tradeOptions.map((option, index) => {
            const isCurrentPort = index === 0
            const canAfford = player.actionPoints >= option.totalCost
            const canTrade = isAtPort
            const canTravel = canAfford // Can travel from anywhere if you can afford it
            
            return (
              <div key={option.port.id} style={{ 
                margin: '10px 0', 
                padding: '12px', 
                background: isCurrentPort && isAtPort ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                border: isCurrentPort && isAtPort ? '1px solid #00ff88' : '1px solid transparent',
                borderRadius: '6px',
                opacity: (isCurrentPort ? canTrade && canAfford : canTravel) ? 1 : 0.6
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: isCurrentPort ? '#00ff88' : 'white' }}>
                      {isCurrentPort ? '📍 ' : '🚀 '}{option.port.name}
                    </strong>
                    {!isCurrentPort && (
                      <div style={{ fontSize: '12px', color: '#aaa' }}>
                        Distance: {option.distance.toFixed(1)} units
                      </div>
                    )}
                    <div style={{ margin: '8px 0', fontSize: '14px' }}>
                      <div style={{ fontWeight: 'bold', color: getProfitTradeColor(option.port), fontSize: '16px' }}>
                        💰 Profit/Trade: {option.profitPerAction.toFixed(1)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        Cargo: {option.port.remainingCargo}/{option.port.maxCargo}
                      </div>
                    </div>
                  </div>
                  <div>
                    {isCurrentPort && isAtPort ? (
                      <button 
                        onClick={() => onTrade(option)}
                        disabled={!canAfford || isOnCooldown}
                        style={{
                          background: isOnCooldown ? '#444' : (canAfford ? '#00ff88' : '#666'),
                          color: isOnCooldown ? '#888' : (canAfford ? 'black' : '#ccc'),
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: (canAfford && !isOnCooldown) ? 'pointer' : 'not-allowed',
                          fontWeight: 'bold'
                        }}
                      >
                        Trade ({FIXED_TRADE_COST} AP)
                      </button>
                    ) : (
                      <button 
                        onClick={() => onTravel(option.port)}
                        disabled={!canTravel || isOnCooldown}
                        style={{
                          background: isOnCooldown ? '#444' : (canTravel ? '#0088ff' : '#666'),
                          color: isOnCooldown ? '#888' : (canTravel ? 'white' : '#ccc'),
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: (canTravel && !isOnCooldown) ? 'pointer' : 'not-allowed'
                        }}
                      >
                        Travel ({option.totalCost} AP)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {player.actionPoints < 50 && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          background: 'rgba(255, 102, 0, 0.2)', 
          borderRadius: '4px',
          color: '#ff6600'
        }}>
          ⚠️ Running low on action points! Plan your moves carefully.
        </div>
      )}
    </div>
  )
}