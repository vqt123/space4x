import { Player, Bot } from '../types'

interface LeaderboardProps {
  player: Player
  bots: Bot[]
}

export function Leaderboard({ player, bots }: LeaderboardProps) {
  const allPlayers = [
    { name: 'You', profit: player.totalProfit, actionPoints: player.actionPoints, isPlayer: true },
    ...bots.map(bot => ({ name: bot.name, profit: bot.totalProfit, actionPoints: bot.actionPoints, isPlayer: false }))
  ].sort((a, b) => b.profit - a.profit)

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 20,
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      minWidth: '250px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#00ff88' }}>Leaderboard</h3>
      {allPlayers.map((player, index) => (
        <div key={player.name} style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '5px 0',
          borderBottom: index < allPlayers.length - 1 ? '1px solid #333' : 'none',
          background: player.isPlayer ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
          margin: '0 -5px',
          paddingLeft: '5px',
          paddingRight: '5px'
        }}>
          <span style={{ color: player.isPlayer ? '#00ff88' : 'white' }}>
            #{index + 1} {player.name}
          </span>
          <div style={{ textAlign: 'right', fontSize: '12px' }}>
            <div style={{ color: '#00ff88' }}>{player.profit} credits</div>
            <div style={{ color: '#ff6600' }}>{player.actionPoints} AP</div>
          </div>
        </div>
      ))}
    </div>
  )
}