import React, { useEffect, useState } from 'react'

interface CooldownBarProps {
  lastActionTime: number
  cooldownDuration?: number
}

export function CooldownBar({ lastActionTime, cooldownDuration = 500 }: CooldownBarProps) {
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    const updateProgress = () => {
      const elapsed = Date.now() - lastActionTime
      const newProgress = Math.min(elapsed / cooldownDuration, 1)
      setProgress(newProgress)
    }
    
    updateProgress()
    const interval = setInterval(updateProgress, 16) // ~60fps
    
    return () => clearInterval(interval)
  }, [lastActionTime, cooldownDuration])
  
  const isOnCooldown = progress < 1
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      zIndex: 1000,
      opacity: isOnCooldown ? 1 : 0,
      transition: 'opacity 0.2s'
    }}>
      <div style={{
        width: `${progress * 100}%`,
        height: '100%',
        backgroundColor: '#ff8800',
        transition: 'width 0.016s linear'
      }} />
    </div>
  )
}