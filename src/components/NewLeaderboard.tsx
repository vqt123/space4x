import { } from 'react'
import { LeaderboardEntry } from '../types/ClientTypes'

interface NewLeaderboardProps {
  leaderboard: LeaderboardEntry[]
  myPlayerId?: string
}

export function NewLeaderboard({ leaderboard, myPlayerId }: NewLeaderboardProps) {
  if (leaderboard.length === 0) {
    return null
  }

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 20,
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '20px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      minWidth: '300px',
      maxHeight: '400px',
      overflowY: 'auto'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#00ff88' }}>Leaderboard</h3>
      
      <div style={{ fontSize: '12px', marginBottom: '10px', color: '#aaa' }}>
        Real-time rankings
      </div>
      
      {leaderboard.map((entry) => {
        const isMe = !entry.isBot && entry.name.includes(myPlayerId || '')
        const isBot = entry.isBot
        
        return (
          <div 
            key={`${entry.isBot ? 'bot' : 'player'}-${entry.id}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              margin: '4px 0',
              background: isMe 
                ? 'rgba(0, 136, 255, 0.2)' 
                : isBot 
                  ? 'rgba(255, 136, 0, 0.1)' 
                  : 'rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              border: isMe ? '1px solid #0088ff' : '1px solid transparent'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ 
                minWidth: '24px', 
                textAlign: 'center',
                fontWeight: 'bold',
                color: entry.rank <= 3 
                  ? entry.rank === 1 ? '#ffd700' 
                    : entry.rank === 2 ? '#c0c0c0' 
                    : '#cd7f32'
                  : 'white'
              }}>
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
              </div>
              
              <div style={{ marginLeft: '10px', flex: 1 }}>
                <div style={{ 
                  fontWeight: isMe ? 'bold' : 'normal',
                  color: isMe ? '#0088ff' : isBot ? '#ff8800' : 'white'
                }}>
                  {isBot ? '🤖 ' : '👤 '}{entry.name}
                  {isMe && ' (You)'}
                </div>
                <div style={{ fontSize: '11px', color: '#aaa' }}>
                  {entry.actionPoints} AP remaining
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                fontWeight: 'bold',
                color: '#00ff88'
              }}>
                {entry.totalProfit.toLocaleString()}
              </div>
              <div style={{ fontSize: '10px', color: '#aaa' }}>
                credits
              </div>
            </div>
          </div>
        )
      })}
      
      <div style={{ 
        marginTop: '10px', 
        paddingTop: '10px', 
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        fontSize: '11px', 
        color: '#666' 
      }}>
        Updates every 100ms
      </div>
    </div>
  )
}