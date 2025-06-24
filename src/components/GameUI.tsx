import { useMemo } from 'react'
import { Player, TradingPort, TradeOption, UpgradeHub, HubTravelOption } from '../types'
import { calculateTradeOptions, findNearestUpgradeHub, UPGRADE_DEFINITIONS, calculateTravelCost } from '../utils'

interface GameUIProps {
  player: Player
  ports: TradingPort[]
  upgradeHubs: UpgradeHub[]
  onTravel: (destination: TradingPort) => void
  onTrade: (option: TradeOption) => void
  onUpgrade?: (upgradeId: number) => void
  onTravelToHub?: (hub: UpgradeHub) => void
}

export function GameUI({ player, ports, upgradeHubs, onTravel, onTrade, onUpgrade, onTravelToHub }: GameUIProps) {
  const tradeOptions = useMemo(() => 
    calculateTradeOptions(player.currentPort, ports, player.upgrades), 
    [player.currentPort, ports, player.upgrades]
  )
  
  const nearestHub = useMemo(() => 
    findNearestUpgradeHub(player.position, upgradeHubs),
    [player.position, upgradeHubs]
  )
  
  const isAtHub = nearestHub && player.position.distanceTo(nearestHub.position) < 2
  const isAtPort = player.currentPort && player.position.distanceTo(player.currentPort.position) < 2
  
  const nextUpgrade = useMemo(() => {
    const ownedUpgrades = Object.keys(player.upgrades).length
    return UPGRADE_DEFINITIONS[ownedUpgrades] || null
  }, [player.upgrades])
  
  const hubTravelOption = useMemo((): HubTravelOption | null => {
    if (!nearestHub) return null
    const distance = player.position.distanceTo(nearestHub.position)
    return {
      hub: nearestHub,
      distance,
      travelCost: calculateTravelCost(distance)
    }
  }, [nearestHub, player.position])
  
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
        <div><strong>Action Points:</strong> {player.actionPoints}</div>
        <div><strong>Total Profit:</strong> {player.totalProfit} credits</div>
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
          
          {isAtHub && nextUpgrade && (
            <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '4px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4488ff' }}>
                Available Upgrade:
              </div>
              <div style={{ margin: '5px 0' }}>
                <strong>{nextUpgrade.name}</strong>
              </div>
              <div style={{ fontSize: '11px', color: '#ccc', marginBottom: '8px' }}>
                {nextUpgrade.description}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#ff6600' }}>
                  Cost: {nextUpgrade.cost} credits
                </div>
                <button
                  onClick={() => onUpgrade?.(nextUpgrade.id)}
                  disabled={!onUpgrade || player.totalProfit < nextUpgrade.cost}
                  style={{
                    background: player.totalProfit >= nextUpgrade.cost ? '#4488ff' : '#666',
                    color: player.totalProfit >= nextUpgrade.cost ? 'white' : '#ccc',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: player.totalProfit >= nextUpgrade.cost ? 'pointer' : 'not-allowed',
                    fontSize: '12px'
                  }}
                >
                  Upgrade
                </button>
              </div>
            </div>
          )}
          
          {isAtHub && !nextUpgrade && (
            <div style={{ marginTop: '8px', color: '#00ff88', fontSize: '12px' }}>
              ✅ All upgrades purchased!
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
            const canTrade = isAtPort && !isAtHub
            
            return (
              <div key={option.port.id} style={{ 
                margin: '10px 0', 
                padding: '12px', 
                background: isCurrentPort && !isAtHub ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                border: isCurrentPort && !isAtHub ? '1px solid #00ff88' : '1px solid transparent',
                borderRadius: '6px',
                opacity: canTrade && canAfford ? 1 : 0.6
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
                      <div>💰 Profit: <span style={{ color: '#00ff88' }}>{option.profit}</span> credits</div>
                      <div>⚡ Cost: <span style={{ color: '#ff6600' }}>{option.totalCost}</span> action points</div>
                      <div style={{ fontWeight: 'bold', color: '#ffff00' }}>
                        📊 Profit/Action: {option.profitPerAction.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        Efficiency: {(option.port.currentProfitMultiplier * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  <div>
                    {isCurrentPort && !isAtHub ? (
                      <button 
                        onClick={() => onTrade(option)}
                        disabled={!canAfford}
                        style={{
                          background: canAfford ? '#00ff88' : '#666',
                          color: canAfford ? 'black' : '#ccc',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                          fontWeight: 'bold'
                        }}
                      >
                        Trade Here
                      </button>
                    ) : (
                      <button 
                        onClick={() => onTravel(option.port)}
                        disabled={!canTrade || !canAfford}
                        style={{
                          background: canTrade && canAfford ? '#0088ff' : '#666',
                          color: canTrade && canAfford ? 'white' : '#ccc',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: canTrade && canAfford ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {isAtHub ? 'Travel to Port' : 'Travel & Trade'}
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