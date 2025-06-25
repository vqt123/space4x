import * as THREE from 'three'
import { ClientGameState, PlayerState, BotState, PortState, HubState } from '../types/ClientTypes'

/**
 * Pure Three.js renderer for Space4X client
 */
export class ThreeRenderer {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private canvas: HTMLCanvasElement
  
  // Object pools for efficient rendering
  private portMeshes: Map<number, THREE.Mesh> = new Map()
  private playerMeshes: Map<string, THREE.Mesh> = new Map()
  private botMeshes: Map<number, THREE.Mesh> = new Map()
  private hubMeshes: Map<number, THREE.Mesh> = new Map()
  private travelLines: Map<string, THREE.Line> = new Map()
  
  // Materials (reused)
  private portMaterial: THREE.MeshStandardMaterial
  private playerMaterial: THREE.MeshStandardMaterial
  private botMaterial: THREE.MeshStandardMaterial
  private hubMaterial: THREE.MeshStandardMaterial
  private lineMaterial: THREE.LineBasicMaterial
  
  // Geometries (reused)
  private sphereGeometry: THREE.SphereGeometry
  private boxGeometry: THREE.BoxGeometry
  private coneGeometry: THREE.ConeGeometry
  
  // Camera control
  private cameraDistance: number = 80
  private cameraTarget: THREE.Vector3 = new THREE.Vector3()
  
  // FPS tracking
  private frameCount: number = 0
  private lastTime: number = 0
  private fps: number = 0
  
  // Interpolation for smooth movement
  private interpolationData: Map<string, {
    currentPos: THREE.Vector3
    targetPos: THREE.Vector3
    lastUpdateTime: number
  }> = new Map()
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    
    console.log('ThreeRenderer constructor - canvas size:', canvas.clientWidth, canvas.clientHeight)
    
    // Create scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x000011) // Dark space background
    
    // Ensure canvas has dimensions
    const width = canvas.clientWidth || canvas.offsetWidth || 800
    const height = canvas.clientHeight || canvas.offsetHeight || 600
    
    console.log('ThreeRenderer using dimensions:', width, height)
    
    // Create camera - simple setup like working test
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    this.camera.position.set(0, 0, 50)  // Better distance for space view
    this.camera.lookAt(0, 0, 0)
    
    console.log('Camera positioned at:', this.camera.position)
    console.log('Camera looking at origin')
    
    // Create renderer optimized for performance
    this.renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: false,  // Disable for performance
      alpha: false,
      powerPreference: "high-performance"
    })
    
    // Debug WebGL context
    const gl = this.renderer.getContext()
    console.log('WebGL context:', gl)
    console.log('WebGL version:', gl.getParameter(gl.VERSION))
    console.log('WebGL vendor:', gl.getParameter(gl.VENDOR))
    console.log('WebGL renderer:', gl.getParameter(gl.RENDERER))
    
    // Ensure renderer uses the full canvas
    this.renderer.setPixelRatio(window.devicePixelRatio || 1)
    
    // Set space background
    this.renderer.setClearColor(0x000011, 1) // Dark space
    this.renderer.clear()
    
    this.renderer.setSize(width, height)
    // Disable shadows for performance
    this.renderer.shadowMap.enabled = false
    
    // Debug renderer state
    console.log('Renderer info:', this.renderer.info)
    console.log('Renderer capabilities:', this.renderer.capabilities)
    
    // Create reusable geometries - low poly for performance
    this.sphereGeometry = new THREE.SphereGeometry(2, 6, 4)  // Low poly ports
    this.boxGeometry = new THREE.BoxGeometry(4, 4, 4)  // Simple cube hubs
    this.coneGeometry = new THREE.ConeGeometry(1.5, 4, 6)  // Low poly ships
    
    // Create reusable materials - use BasicMaterial for performance
    this.portMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88
    })
    
    this.playerMaterial = new THREE.MeshBasicMaterial({
      color: 0x0088ff
    })
    
    this.botMaterial = new THREE.MeshBasicMaterial({
      color: 0xff8800
    })
    
    this.hubMaterial = new THREE.MeshBasicMaterial({
      color: 0x4488ff
    })
    
    this.lineMaterial = new THREE.LineBasicMaterial({ color: 0x0088ff, opacity: 0.8, transparent: true })
    
    this.setupLighting()
    this.setupStars()
    this.setupEventListeners()
    
    console.log('ThreeRenderer initialized with', this.scene.children.length, 'objects')
  }
  
  /**
   * Set up scene lighting - minimal for performance
   */
  private setupLighting(): void {
    // Single ambient light for BasicMaterial
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
    this.scene.add(ambientLight)
  }
  
  /**
   * Set up starfield background
   */
  private setupStars(): void {
    const starsGeometry = new THREE.BufferGeometry()
    const starsCount = 200
    const positions = new Float32Array(starsCount * 3)
    
    for (let i = 0; i < starsCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 600
      positions[i + 1] = (Math.random() - 0.5) * 600
      positions[i + 2] = (Math.random() - 0.5) * 600
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.8,
      sizeAttenuation: true
    })
    
    const stars = new THREE.Points(starsGeometry, starsMaterial)
    this.scene.add(stars)
  }
  
  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.handleResize()
    })
    
    // Handle mouse wheel for zoom
    this.canvas.addEventListener('wheel', (event) => {
      event.preventDefault()
      this.cameraDistance += event.deltaY * 0.05
      this.cameraDistance = Math.max(20, Math.min(200, this.cameraDistance))
    })
  }
  
  /**
   * Handle window resize
   */
  private handleResize(): void {
    const width = this.canvas.clientWidth || this.canvas.offsetWidth || 800
    const height = this.canvas.clientHeight || this.canvas.offsetHeight || 600
    
    console.log('ThreeRenderer resize to:', width, height)
    
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }
  
  /**
   * Force resize check - call when canvas becomes visible
   */
  forceResize(): void {
    console.log('ThreeRenderer forceResize called')
    this.handleResize()
  }
  
  /**
   * Update scene with new game state
   */
  updateGameState(gameState: ClientGameState): void {
    this.updatePorts(gameState.ports)
    this.updatePlayers(gameState.players)
    this.updateBots(gameState.bots)
    this.updateHubs(gameState.hubs)
    this.updateCamera(gameState)
  }
  
  /**
   * Update port meshes
   */
  private updatePorts(ports: Map<number, PortState>): void {
    // Add/update port meshes
    for (const [portId, port] of ports) {
      let mesh = this.portMeshes.get(portId)
      
      if (!mesh) {
        mesh = new THREE.Mesh(this.sphereGeometry, this.portMaterial)
        // No shadows for performance
        // No shadows for performance
        this.scene.add(mesh)
        this.portMeshes.set(portId, mesh)
      }
      
      // Update position
      mesh.position.set(port.position[0], port.position[1], port.position[2])
      
      // Update color based on efficiency - simplified for performance
      if (port.efficiency > 0.75) {
        mesh.material = this.portMaterial
      } else {
        // Use single red material for low efficiency
        if (!mesh.userData.lowEffMaterial) {
          mesh.userData.lowEffMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 })
        }
        mesh.material = mesh.userData.lowEffMaterial
      }
    }
    
    // Remove old port meshes
    for (const [portId, mesh] of this.portMeshes) {
      if (!ports.has(portId)) {
        this.scene.remove(mesh)
        this.portMeshes.delete(portId)
      }
    }
  }
  
  /**
   * Update player meshes
   */
  private updatePlayers(players: Map<string, PlayerState>): void {
    // Add/update player meshes
    for (const [playerId, player] of players) {
      let mesh = this.playerMeshes.get(playerId)
      
      if (!mesh) {
        mesh = new THREE.Mesh(this.coneGeometry, this.playerMaterial)
        // No shadows for performance
        this.scene.add(mesh)
        this.playerMeshes.set(playerId, mesh)
      }
      
      // Update position with interpolation
      const targetPos = new THREE.Vector3(player.position[0], player.position[1], player.position[2])
      this.setTargetPosition(playerId, targetPos)
      
      // Point towards center (0,0,0)
      mesh.lookAt(0, 0, 0)
      
      // Update travel line if moving
      this.updateTravelLine(playerId, player)
    }
    
    // Remove old player meshes
    for (const [playerId, mesh] of this.playerMeshes) {
      if (!players.has(playerId)) {
        this.scene.remove(mesh)
        this.playerMeshes.delete(playerId)
        
        // Remove travel line
        const line = this.travelLines.get(playerId)
        if (line) {
          this.scene.remove(line)
          this.travelLines.delete(playerId)
        }
      }
    }
  }
  
  /**
   * Update bot meshes
   */
  private updateBots(bots: Map<number, BotState>): void {
    // Add/update bot meshes
    for (const [botId, bot] of bots) {
      let mesh = this.botMeshes.get(botId)
      
      if (!mesh) {
        mesh = new THREE.Mesh(this.coneGeometry, this.botMaterial)
        // No shadows for performance
        mesh.scale.set(0.8, 0.8, 0.8) // Slightly smaller than player
        this.scene.add(mesh)
        this.botMeshes.set(botId, mesh)
      }
      
      // Update position with interpolation
      const targetPos = new THREE.Vector3(bot.position[0], bot.position[1], bot.position[2])
      this.setTargetPosition(botId.toString(), targetPos)
      
      // Point towards center (0,0,0)
      mesh.lookAt(0, 0, 0)
    }
    
    // Remove old bot meshes
    for (const [botId, mesh] of this.botMeshes) {
      if (!bots.has(botId)) {
        this.scene.remove(mesh)
        this.botMeshes.delete(botId)
      }
    }
  }
  
  /**
   * Update hub meshes
   */
  private updateHubs(hubs: Map<number, HubState>): void {
    // Add/update hub meshes
    for (const [hubId, hub] of hubs) {
      let mesh = this.hubMeshes.get(hubId)
      
      if (!mesh) {
        mesh = new THREE.Mesh(this.boxGeometry, this.hubMaterial.clone())
        // No shadows for performance
        // No shadows for performance
        this.scene.add(mesh)
        this.hubMeshes.set(hubId, mesh)
      }
      
      // Update position
      mesh.position.set(hub.position[0], hub.position[1], hub.position[2])
      
      // Rotate slowly for visual effect
      mesh.rotation.x += 0.01
      mesh.rotation.y += 0.01
    }
    
    // Remove old hub meshes
    for (const [hubId, mesh] of this.hubMeshes) {
      if (!hubs.has(hubId)) {
        this.scene.remove(mesh)
        this.hubMeshes.delete(hubId)
      }
    }
  }
  
  /**
   * Update travel line for moving entities
   */
  private updateTravelLine(entityId: string, player: PlayerState): void {
    const existingLine = this.travelLines.get(entityId)
    
    if (player.isMoving && player.destinationPortId !== undefined) {
      // Create or update travel line
      const points = [
        new THREE.Vector3(player.position[0], player.position[1], player.position[2]),
        // We need to get destination position from ports - for now just show current position
        new THREE.Vector3(player.position[0], player.position[1], player.position[2])
      ]
      
      if (existingLine) {
        // Update existing line
        const geometry = existingLine.geometry as THREE.BufferGeometry
        geometry.setFromPoints(points)
      } else {
        // Create new line
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const line = new THREE.Line(geometry, this.lineMaterial)
        this.scene.add(line)
        this.travelLines.set(entityId, line)
      }
    } else if (existingLine) {
      // Remove travel line if not moving
      this.scene.remove(existingLine)
      this.travelLines.delete(entityId)
    }
  }
  
  /**
   * Update camera to follow player
   */
  private updateCamera(gameState: ClientGameState): void {
    if (gameState.myPlayerId) {
      const myPlayer = gameState.players.get(gameState.myPlayerId)
      if (myPlayer) {
        this.cameraTarget.set(myPlayer.position[0], myPlayer.position[1], myPlayer.position[2])
      }
    }
    
    // Position camera at distance from target, always looking toward center
    const direction = new THREE.Vector3(0, 0, 0).sub(this.cameraTarget).normalize()
    this.camera.position.copy(this.cameraTarget).add(direction.multiplyScalar(this.cameraDistance))
    this.camera.lookAt(0, 0, 0)
  }
  
  /**
   * Render the scene
   */
  render(): void {
    // Update interpolation for smooth movement
    this.updateInterpolation()
    
    // Render the scene
    this.renderer.render(this.scene, this.camera)
    
    // Track FPS
    this.frameCount++
    const now = performance.now()
    if (now - this.lastTime >= 1000) { // Update every second
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime))
      this.frameCount = 0
      this.lastTime = now
    }
  }
  

  /**
   * Start the render loop
   */
  startRenderLoop(): void {
    console.log('Starting render loop')
    this.lastTime = performance.now()
    const animate = () => {
      requestAnimationFrame(animate)
      this.render()
    }
    animate()
  }
  
  /**
   * Update interpolation for smooth movement
   */
  private updateInterpolation(): void {
    const now = performance.now()
    const interpolationSpeed = 0.1 // Adjust for smoothness vs responsiveness
    
    for (const [entityId, data] of this.interpolationData) {
      if (now - data.lastUpdateTime < 500) { // Only interpolate recent updates
        // Lerp towards target position
        data.currentPos.lerp(data.targetPos, interpolationSpeed)
        
        // Update mesh position
        const playerMesh = this.playerMeshes.get(entityId)
        const botMesh = this.botMeshes.get(Number(entityId))
        
        if (playerMesh) {
          playerMesh.position.copy(data.currentPos)
        } else if (botMesh) {
          botMesh.position.copy(data.currentPos)
        }
      }
    }
  }
  
  /**
   * Set target position for interpolation
   */
  private setTargetPosition(entityId: string, targetPos: THREE.Vector3): void {
    const existing = this.interpolationData.get(entityId)
    const now = performance.now()
    
    if (existing) {
      existing.targetPos.copy(targetPos)
      existing.lastUpdateTime = now
    } else {
      this.interpolationData.set(entityId, {
        currentPos: targetPos.clone(),
        targetPos: targetPos.clone(),
        lastUpdateTime: now
      })
    }
  }
  
  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    // Clean up hub meshes
    for (const mesh of this.hubMeshes.values()) {
      this.scene.remove(mesh)
    }
    this.hubMeshes.clear()
    
    // Dispose of geometries
    this.sphereGeometry.dispose()
    this.boxGeometry.dispose()
    this.coneGeometry.dispose()
    
    // Dispose of materials
    this.portMaterial.dispose()
    this.playerMaterial.dispose()
    this.botMaterial.dispose()
    this.hubMaterial.dispose()
    this.lineMaterial.dispose()
    
    // Dispose of renderer
    this.renderer.dispose()
  }
}