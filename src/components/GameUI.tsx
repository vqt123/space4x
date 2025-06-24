import { useMemo } from 'react'
import { Player, TradingPort, TradeOption } from '../types'
import { calculateTradeOptions } from '../utils'

interface GameUIProps {
  player: Player
  ports: TradingPort[]
  onTravel: (destination: TradingPort) => void
  onTrade: (option: TradeOption) => void
}

export function GameUI({ player, ports, onTravel, onTrade }: GameUIProps) {
  const tradeOptions = useMemo(() => 
    calculateTradeOptions(player.currentPort, ports), 
    [player.currentPort, ports]
  )
  
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
      ) : (
        <div>
          <h4 style={{ color: '#00ff88', margin: '15px 0 10px 0' }}>Trade Options:</h4>
          {tradeOptions.map((option, index) => {
            const isCurrentPort = index === 0
            const canAfford = player.actionPoints >= option.totalCost
            
            return (
              <div key={option.port.id} style={{ 
                margin: '10px 0', 
                padding: '12px', 
                background: isCurrentPort ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                border: isCurrentPort ? '1px solid #00ff88' : '1px solid transparent',
                borderRadius: '6px',
                opacity: canAfford ? 1 : 0.6
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
                    {isCurrentPort ? (
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
                        disabled={!canAfford}
                        style={{
                          background: canAfford ? '#0088ff' : '#666',
                          color: canAfford ? 'white' : '#ccc',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: canAfford ? 'pointer' : 'not-allowed'
                        }}
                      >
                        Travel & Trade
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