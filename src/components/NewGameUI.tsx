import { } from 'react'
import { PlayerState, TradeOption } from '../types/ClientTypes'

interface NewGameUIProps {
  player: PlayerState | undefined
  tradeOptions: TradeOption[]
  closestHub: { hub: any; distance: number } | null
  isConnected: boolean
  cooldownRemaining: number
  onTrade: () => void
  onTravel: (portId: number) => void
  onUpgrade: () => void
  onEngageCombat: (enemyId: number) => void
  onFireBlast: (enemyId: number) => void
  onBuyShields: () => void
  onBuyEnergy: () => void
  onHubTravel: (hubId: number) => void
  onPortHover?: (portId: number) => void
  onPortHoverEnd?: () => void
}

function getProfitTradeColor(efficiency: number): string {
  if (efficiency > 0.75) return '#00ff88' // Green: 75-100%
  if (efficiency > 0.50) return '#ffff00' // Yellow: 50-75%
  if (efficiency > 0.25) return '#ff8800' // Orange: 25-50%
  return '#ff4444' // Red: 0-25%
}

export function NewGameUI({ 
  player, 
  tradeOptions, 
  closestHub,
  isConnected, 
  cooldownRemaining,
  onTrade, 
  onTravel,
  onUpgrade,
  onEngageCombat,
  onFireBlast,
  onBuyShields,
  onBuyEnergy,
  onHubTravel,
  onPortHover,
  onPortHoverEnd
}: NewGameUIProps) {
  
  if (!isConnected) {
    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        textAlign: 'center'
      }}>
        <h3>Connecting to Space4X Server...</h3>
        <p>Please wait while we establish connection.</p>
      </div>
    )
  }
  
  if (!player) {
    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        textAlign: 'center'
      }}>
        <h3>Loading Player Data...</h3>
        <p style={{ fontSize: '12px', color: '#aaa', marginTop: '10px' }}>
          If this takes more than a few seconds, try pressing 'C' to toggle camera
        </p>
      </div>
    )
  }
  
  const isOnCooldown = cooldownRemaining > 0
  
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
      
      {/* Connection Status */}
      <div style={{ 
        marginBottom: '15px', 
        padding: '5px 10px', 
        background: isConnected ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)', 
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        {isConnected ? '🟢 Connected to Server' : '🔴 Disconnected'}
      </div>
      
      {/* Player Stats */}
      <div style={{ marginBottom: '20px', padding: '10px', background: 'rgba(0, 255, 136, 0.1)', borderRadius: '4px' }}>
        <div><strong>Player:</strong> {player.name}</div>
        <div><strong>Ship:</strong> {player.shipType.name}</div>
        <div><strong>Cargo Holds:</strong> {player.cargoHolds}/{player.shipType.maxCargoHolds}</div>
        <div><strong>Shields:</strong> <span style={{ color: '#00aaff' }}>{player.shields || 100}/{player.maxShields || 500}</span></div>
        <div><strong>Energy:</strong> <span style={{ color: '#ffaa00' }}>{player.energy || 200}/{player.maxEnergy || 1000}</span></div>
        <div><strong>Action Points:</strong> {player.actionPoints}</div>
        <div><strong>Credits:</strong> {player.credits}</div>
        <div><strong>Total Profit:</strong> {player.totalProfit}</div>
        {isOnCooldown && (
          <div style={{ color: '#ff8800' }}>
            <strong>Cooldown:</strong> {Math.ceil(cooldownRemaining / 100)} ticks
          </div>
        )}
      </div>
      
      {/* Movement Status */}
      {player.isMoving && (
        <div style={{ 
          marginBottom: '20px',
          padding: '10px',
          background: 'rgba(255, 102, 0, 0.1)',
          borderRadius: '4px',
          color: '#ff6600'
        }}>
          <strong>🚀 Traveling...</strong><br/>
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
      )}
      
      {/* Closest Hub Section */}
      {closestHub && (
        <>
          <h4 style={{ color: '#00aaff', margin: '15px 0 10px 0' }}>
            Closest Hub:
          </h4>
          
          <div style={{ 
            margin: '10px 0', 
            padding: '12px', 
            background: 'rgba(0, 170, 255, 0.15)',
            border: '1px solid #00aaff',
            borderRadius: '6px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <strong style={{ color: '#00aaff' }}>
                  🏭 {closestHub.hub.name}
                </strong>
                <div style={{ fontSize: '12px', color: '#aaa' }}>
                  Distance: {closestHub.distance.toFixed(1)} units
                </div>
                <div style={{ margin: '8px 0', fontSize: '14px' }}>
                  <div style={{ color: '#00aaff', fontSize: '14px' }}>
                    ⚡ Instant teleport to hub for upgrades
                  </div>
                </div>
              </div>
              <div>
                {player && Math.sqrt(
                  Math.pow(closestHub.hub.position[0] - player.position[0], 2) +
                  Math.pow(closestHub.hub.position[1] - player.position[1], 2) +
                  Math.pow(closestHub.hub.position[2] - player.position[2], 2)
                ) < 0.25 ? (
                  // At hub - show upgrade and purchase buttons
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button 
                      onClick={onUpgrade}
                      disabled={!player || player.actionPoints < 10}
                      style={{
                        background: (player && player.actionPoints >= 10) ? '#00ff88' : '#666',
                        color: (player && player.actionPoints >= 10) ? 'black' : '#ccc',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: (player && player.actionPoints >= 10) ? 'pointer' : 'not-allowed',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      Upgrade Cargo
                    </button>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        onClick={onBuyShields}
                        disabled={!player || player.actionPoints < 10 || player.shields >= player.maxShields || player.credits < 50}
                        style={{
                          background: (player && player.actionPoints >= 10 && player.shields < player.maxShields && player.credits >= 50) ? '#00aaff' : '#666',
                          color: (player && player.actionPoints >= 10 && player.shields < player.maxShields && player.credits >= 50) ? 'white' : '#ccc',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: (player && player.actionPoints >= 10 && player.shields < player.maxShields && player.credits >= 50) ? 'pointer' : 'not-allowed',
                          fontSize: '10px'
                        }}
                      >
                        +10🛡 (50¢)
                      </button>
                      <button 
                        onClick={onBuyEnergy}
                        disabled={!player || player.actionPoints < 10 || player.energy >= player.maxEnergy || player.credits < 100}
                        style={{
                          background: (player && player.actionPoints >= 10 && player.energy < player.maxEnergy && player.credits >= 100) ? '#ffaa00' : '#666',
                          color: (player && player.actionPoints >= 10 && player.energy < player.maxEnergy && player.credits >= 100) ? 'black' : '#ccc',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: (player && player.actionPoints >= 10 && player.energy < player.maxEnergy && player.credits >= 100) ? 'pointer' : 'not-allowed',
                          fontSize: '10px'
                        }}
                      >
                        +50⚡ (100¢)
                      </button>
                    </div>
                  </div>
                ) : (
                  // Not at hub - show teleport button
                  <button 
                    onClick={() => onHubTravel(closestHub.hub.id)}
                    disabled={!player || player.actionPoints < 5}
                    style={{
                      background: (player && player.actionPoints >= 5) ? '#00aaff' : '#666',
                      color: (player && player.actionPoints >= 5) ? 'white' : '#ccc',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: (player && player.actionPoints >= 5) ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold'
                    }}
                  >
                    Teleport (5 AP)
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Trade Options */}
      <h4 style={{ color: '#00ff88', margin: '15px 0 10px 0' }}>
        Trade Options:
      </h4>
      
      {tradeOptions.length === 0 ? (
        <div style={{ 
          color: '#aaa', 
          textAlign: 'center', 
          padding: '20px',
          fontStyle: 'italic' 
        }}>
          No trade options available
        </div>
      ) : (
        tradeOptions.map((option, index) => {
          const isCurrentPort = index === 0 && option.distance === 0
          const canAfford = player.actionPoints >= option.totalCost
          const canAct = !isOnCooldown && canAfford
          
          return (
            <div 
              key={option.port.id} 
              style={{ 
                margin: '10px 0', 
                padding: '12px', 
                background: isCurrentPort ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                border: isCurrentPort ? '1px solid #00ff88' : '1px solid transparent',
                borderRadius: '6px',
                opacity: canAct ? 1 : 0.6,
                cursor: 'pointer'
              }}
              onMouseEnter={() => onPortHover?.(option.port.id)}
              onMouseLeave={() => onPortHoverEnd?.()}
            >
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
                    <div style={{ 
                      fontWeight: 'bold', 
                      color: getProfitTradeColor(option.port.efficiency), 
                      fontSize: '16px' 
                    }}>
                      💰 Profit/Trade: {option.profitPerAction.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#888' }}>
                      Cargo: {option.port.remainingCargo}/{option.port.maxCargo} 
                      ({(option.port.efficiency * 100).toFixed(1)}%)
                    </div>
                  </div>
                </div>
                <div>
                  {isCurrentPort ? (
                    (
                      // Regular port trade
                      <button 
                        onClick={onTrade}
                        disabled={!canAct}
                        style={{
                          background: canAct ? '#00ff88' : '#666',
                          color: canAct ? 'black' : '#ccc',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: canAct ? 'pointer' : 'not-allowed',
                          fontWeight: 'bold'
                        }}
                      >
                        Trade (10 AP)
                      </button>
                    )
                  ) : option.port.name.startsWith('⚔️') ? (
                    // Enemy combat options
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <button 
                        onClick={() => onEngageCombat(option.port.id - 10000)} // Convert back to enemy ID
                        disabled={!canAct || player.actionPoints < 10}
                        style={{
                          background: (canAct && player.actionPoints >= 10) ? '#ff4444' : '#666',
                          color: (canAct && player.actionPoints >= 10) ? 'white' : '#ccc',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: (canAct && player.actionPoints >= 10) ? 'pointer' : 'not-allowed',
                          fontSize: '12px'
                        }}
                      >
                        Engage (10 AP)
                      </button>
                      <button 
                        onClick={() => onFireBlast(option.port.id - 10000)} // Convert back to enemy ID
                        disabled={!canAct || player.actionPoints < 10 || (player.energy || 200) < 50}
                        style={{
                          background: (canAct && player.actionPoints >= 10 && (player.energy || 200) >= 50) ? '#ffaa00' : '#666',
                          color: (canAct && player.actionPoints >= 10 && (player.energy || 200) >= 50) ? 'black' : '#ccc',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: (canAct && player.actionPoints >= 10 && (player.energy || 200) >= 50) ? 'pointer' : 'not-allowed',
                          fontSize: '12px'
                        }}
                      >
                        Fire Blast (10 AP, 50 E)
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => onTravel(option.port.id)}
                      disabled={!canAct}
                      style={{
                        background: canAct ? '#0088ff' : '#666',
                        color: canAct ? 'white' : '#ccc',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: canAct ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Travel ({option.totalCost} AP)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })
      )}
      
      {/* Low Action Points Warning */}
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