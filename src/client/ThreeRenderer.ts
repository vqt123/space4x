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
  private hoverLine: THREE.Line | null = null
  
  // Materials (reused)
  private portMaterial: THREE.MeshStandardMaterial
  private playerMaterial: THREE.MeshStandardMaterial
  private botMaterial: THREE.MeshStandardMaterial
  private hubMaterial: THREE.MeshStandardMaterial
  private lineMaterial: THREE.LineBasicMaterial
  private hoverLineMaterial: THREE.LineBasicMaterial
  
  // Geometries (reused)
  private sphereGeometry: THREE.SphereGeometry
  private boxGeometry: THREE.BoxGeometry
  private coneGeometry: THREE.ConeGeometry
  
  // Camera control
  private cameraDistance: number = 30
  private freeCameraMode: boolean = false
  private followPlayerId: string | null = null
  
  // Mouse controls for free camera
  private isMouseDown: boolean = false
  private isRightMouseDown: boolean = false
  private lastMouseX: number = 0
  private lastMouseY: number = 0
  private cameraRotationX: number = 0
  private cameraRotationY: number = 0
  private cameraOffset: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
  
  // Interpolation toggle for testing
  private useInterpolation: boolean = true
  
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
  private lastInterpolationTime: number = 0
  private debugPlayerId: string | null = null
  
  // Test cube for smooth animation comparison
  private testCube: THREE.Mesh | null = null
  
  // FPS display element
  private fpsElement: HTMLDivElement | null = null
  
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
    
    // Create camera - exactly like demo scene
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    this.camera.position.set(0, 0, this.cameraDistance)
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
    
    // Create reusable geometries - smaller sizes for better scale
    this.sphereGeometry = new THREE.SphereGeometry(0.8, 6, 4)  // Smaller ports
    this.boxGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)  // Smaller cube hubs
    this.coneGeometry = new THREE.ConeGeometry(0.6, 1.5, 6)  // Smaller ships
    
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
    this.hoverLineMaterial = new THREE.LineBasicMaterial({ color: 0xff8800, opacity: 0.9, transparent: true, linewidth: 2 })
    
    this.setupLighting()
    this.setupTestCube()
    this.setupFPSDisplay()
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
   * Set up test cube for smooth animation comparison - exactly like demo scene
   */
  private setupTestCube(): void {
    // Test cube disabled for normal gameplay
    // Uncomment below to re-enable for debugging
    /*
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00ff88, // Same green as demo scene
      wireframe: false
    })
    this.testCube = new THREE.Mesh(geometry, material)
    this.testCube.position.set(0, 0, 0) // Center position like demo
    this.scene.add(this.testCube)
    console.log('Test cube added at center (0, 0, 0) - should rotate smoothly')
    */
  }
  
  /**
   * Set up FPS display as overlay on canvas
   */
  private setupFPSDisplay(): void {
    this.fpsElement = document.createElement('div')
    this.fpsElement.style.position = 'absolute'
    this.fpsElement.style.top = '10px'
    this.fpsElement.style.right = '10px'
    this.fpsElement.style.background = 'rgba(0, 0, 0, 0.8)'
    this.fpsElement.style.color = '#00ff88'
    this.fpsElement.style.padding = '8px 12px'
    this.fpsElement.style.borderRadius = '4px'
    this.fpsElement.style.fontFamily = 'monospace'
    this.fpsElement.style.fontSize = '16px'
    this.fpsElement.style.fontWeight = 'bold'
    this.fpsElement.style.border = '1px solid rgba(255,255,255,0.3)'
    this.fpsElement.style.zIndex = '1000'
    this.fpsElement.style.pointerEvents = 'none' // Don't interfere with mouse events
    this.fpsElement.textContent = '0 FPS'
    
    // Add to canvas parent
    const canvasParent = this.canvas.parentElement
    if (canvasParent) {
      canvasParent.appendChild(this.fpsElement)
    }
  }
  
  
  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.handleResize()
    })
    
    // Handle mouse wheel for zoom - exactly like demo scene
    this.canvas.addEventListener('wheel', (event) => {
      event.preventDefault()
      this.cameraDistance += event.deltaY * 0.01
      this.cameraDistance = Math.max(2, Math.min(20, this.cameraDistance))
      
      // Update camera position immediately like demo
      if (this.freeCameraMode) {
        const x = Math.cos(this.cameraRotationY) * Math.cos(this.cameraRotationX) * this.cameraDistance
        const y = Math.sin(this.cameraRotationX) * this.cameraDistance
        const z = Math.sin(this.cameraRotationY) * Math.cos(this.cameraRotationX) * this.cameraDistance
        this.camera.position.set(x + this.cameraOffset.x, y + this.cameraOffset.y, z + this.cameraOffset.z)
        this.camera.lookAt(this.cameraOffset)
      } else {
        this.camera.position.set(this.cameraOffset.x, this.cameraOffset.y, this.cameraDistance + this.cameraOffset.z)
        this.camera.lookAt(this.cameraOffset)
      }
    })
    
    // Handle mouse controls for camera
    this.canvas.addEventListener('mousedown', (event) => {
      event.preventDefault()
      if (event.button === 0) { // Left mouse button
        this.isMouseDown = true
        this.lastMouseX = event.clientX
        this.lastMouseY = event.clientY
      } else if (event.button === 2) { // Right mouse button
        this.isRightMouseDown = true
        this.lastMouseX = event.clientX
        this.lastMouseY = event.clientY
      }
    })
    
    this.canvas.addEventListener('mousemove', (event) => {
      event.preventDefault()
      const deltaX = event.clientX - this.lastMouseX
      const deltaY = event.clientY - this.lastMouseY
      
      if (this.isMouseDown) {
        // Left mouse - rotate camera
        this.cameraRotationY -= deltaX * 0.01
        this.cameraRotationX -= deltaY * 0.01
        this.cameraRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.cameraRotationX))
      } else if (this.isRightMouseDown) {
        // Right mouse - pan camera
        const panSpeed = 0.01 * this.cameraDistance
        this.cameraOffset.x -= deltaX * panSpeed
        this.cameraOffset.y += deltaY * panSpeed
      }
      
      this.lastMouseX = event.clientX
      this.lastMouseY = event.clientY
    })
    
    this.canvas.addEventListener('mouseup', (event) => {
      event.preventDefault()
      if (event.button === 0) {
        this.isMouseDown = false
      } else if (event.button === 2) {
        this.isRightMouseDown = false
      }
    })
    
    // Also handle mouse leave to stop dragging
    this.canvas.addEventListener('mouseleave', () => {
      this.isMouseDown = false
      this.isRightMouseDown = false
    })
    
    // Disable context menu on right click
    this.canvas.addEventListener('contextmenu', (event) => {
      event.preventDefault()
    })
    
    // Note: Keyboard toggle is handled in NewApp.tsx to avoid duplication
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
    // Set debug player ID for interpolation logging
    if (gameState.myPlayerId && !this.debugPlayerId) {
      this.debugPlayerId = gameState.myPlayerId
      console.log('Set debug player ID:', this.debugPlayerId)
    }
    
    // Store player ID for camera following
    if (gameState.myPlayerId) {
      this.followPlayerId = gameState.myPlayerId
    }
    
    this.updatePorts(gameState.ports)
    this.updatePlayers(gameState.players)
    this.updateBots(gameState.bots)
    this.updateHubs(gameState.hubs)
    // Don't update camera here - it's updated in render loop
  }
  
  /**
   * Toggle interpolation on/off for testing
   */
  toggleInterpolation(): void {
    this.useInterpolation = !this.useInterpolation
    console.log(`Object interpolation: ${this.useInterpolation ? 'ON' : 'OFF'}`)
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
      
      // Update position with or without interpolation
      const targetPos = new THREE.Vector3(player.position[0], player.position[1], player.position[2])
      
      if (this.useInterpolation) {
        this.setTargetPosition(playerId, targetPos)
      } else {
        // Direct position update - no interpolation
        mesh.position.copy(targetPos)
      }
      
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
        mesh.scale.set(0.9, 0.9, 0.9) // Slightly smaller than player
        this.scene.add(mesh)
        this.botMeshes.set(botId, mesh)
      }
      
      // Update position with or without interpolation
      const targetPos = new THREE.Vector3(bot.position[0], bot.position[1], bot.position[2])
      
      if (this.useInterpolation) {
        this.setTargetPosition(botId.toString(), targetPos)
      } else {
        // Direct position update - no interpolation
        mesh.position.copy(targetPos)
      }
      
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
   * Toggle between follow camera and free camera
   */
  toggleCameraMode(): void {
    this.freeCameraMode = !this.freeCameraMode
    console.log(`Camera mode toggled: ${this.freeCameraMode ? 'FREE' : 'FOLLOW'}`)
    
    if (this.freeCameraMode) {
      // Initialize free camera position
      this.cameraRotationX = 0
      this.cameraRotationY = 0
      this.camera.position.set(0, 0, this.cameraDistance)
      this.camera.lookAt(0, 0, 0)
      console.log('Free camera initialized - you can now drag with mouse to look around')
    } else {
      console.log('Follow camera mode - camera follows your player')
    }
  }

  /**
   * Update camera - no interpolation, direct positioning
   */
  private updateCamera(): void {
    if (this.freeCameraMode) {
      // Free camera mode - use mouse controls
      const x = Math.cos(this.cameraRotationY) * Math.cos(this.cameraRotationX) * this.cameraDistance
      const y = Math.sin(this.cameraRotationX) * this.cameraDistance
      const z = Math.sin(this.cameraRotationY) * Math.cos(this.cameraRotationX) * this.cameraDistance
      
      this.camera.position.set(x + this.cameraOffset.x, y + this.cameraOffset.y, z + this.cameraOffset.z)
      this.camera.lookAt(this.cameraOffset)
    } else {
      // Follow camera mode - position camera behind player pointing toward center
      if (this.followPlayerId) {
        const playerMesh = this.playerMeshes.get(this.followPlayerId)
        if (playerMesh) {
          // Get player position
          const playerPos = playerMesh.position
          
          // Position camera behind player looking toward center
          // Direction from center to player (outward)
          const centerToPlayer = playerPos.clone().normalize()
          // Position camera behind player along this direction
          this.camera.position.copy(playerPos).add(centerToPlayer.multiplyScalar(this.cameraDistance))
          this.camera.position.add(this.cameraOffset)
          
          // Look toward the center of the universe
          this.camera.lookAt(this.cameraOffset)
        }
      } else {
        // No player to follow - default position looking at center
        this.camera.position.set(this.cameraOffset.x, this.cameraOffset.y, this.cameraDistance + this.cameraOffset.z)
        this.camera.lookAt(this.cameraOffset)
      }
    }
  }
  
  /**
   * Render the scene
   */
  render(): void {
    // Update camera every frame for smooth movement
    this.updateCamera()
    
    // Update interpolation for smooth movement (only if enabled)
    if (this.useInterpolation) {
      this.updateInterpolation()
    }
    
    // Animate test cube for smooth comparison
    if (this.testCube) {
      this.testCube.rotation.x += 0.01
      this.testCube.rotation.y += 0.01
    }
    
    // Render the scene
    this.renderer.render(this.scene, this.camera)
    
    // Track FPS
    this.frameCount++
    const now = performance.now()
    if (now - this.lastTime >= 1000) { // Update every second
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime))
      this.frameCount = 0
      this.lastTime = now
      
      // Update FPS display
      if (this.fpsElement) {
        const color = this.fps < 30 ? '#ff4444' : this.fps < 50 ? '#ffaa00' : '#00ff88'
        this.fpsElement.style.color = color
        this.fpsElement.textContent = `${this.fps} FPS`
      }
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
    const deltaTime = now - (this.lastInterpolationTime || now)
    this.lastInterpolationTime = now
    
    // Frame-rate independent interpolation - much faster
    const interpolationSpeed = Math.min(0.3, deltaTime / 16.66 * 0.15) // Faster, frame-independent
    
    for (const [entityId, data] of this.interpolationData) {
      const timeSinceUpdate = now - data.lastUpdateTime
      
      if (timeSinceUpdate < 1000) { // Only interpolate for 1 second
        const distance = data.currentPos.distanceTo(data.targetPos)
        
        // If we haven't received an update in a while, speed up interpolation
        const urgencyMultiplier = Math.min(2.0, timeSinceUpdate / 100) // Speed up after 100ms
        const finalSpeed = interpolationSpeed * urgencyMultiplier
        
        if (distance < 0.01) {
          data.currentPos.copy(data.targetPos)
        } else {
          data.currentPos.lerp(data.targetPos, Math.min(finalSpeed, 1.0))
        }
        
        // Update mesh position
        const playerMesh = this.playerMeshes.get(entityId)
        const botMesh = this.botMeshes.get(Number(entityId))
        
        if (playerMesh) {
          playerMesh.position.copy(data.currentPos)
        } else if (botMesh) {
          botMesh.position.copy(data.currentPos)
        }
        
        // Debug very choppy movement
        if (distance > 1.0 && entityId === this.debugPlayerId) {
          console.log(`Large jump detected: ${distance.toFixed(2)} units for ${entityId}`)
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
      // For new entities, get current mesh position if it exists
      const playerMesh = this.playerMeshes.get(entityId)
      const botMesh = this.botMeshes.get(Number(entityId))
      const currentMesh = playerMesh || botMesh
      
      const currentPos = currentMesh ? currentMesh.position.clone() : targetPos.clone()
      
      this.interpolationData.set(entityId, {
        currentPos: currentPos,
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
   * Show hover line between player and target port
   */
  showHoverLine(playerPosition: [number, number, number], portPosition: [number, number, number]): void {
    this.hideHoverLine() // Remove existing line first
    
    const points = [
      new THREE.Vector3(playerPosition[0], playerPosition[1], playerPosition[2]),
      new THREE.Vector3(portPosition[0], portPosition[1], portPosition[2])
    ]
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    this.hoverLine = new THREE.Line(geometry, this.hoverLineMaterial)
    this.scene.add(this.hoverLine)
  }
  
  /**
   * Hide hover line
   */
  hideHoverLine(): void {
    if (this.hoverLine) {
      this.scene.remove(this.hoverLine)
      this.hoverLine.geometry.dispose()
      this.hoverLine = null
    }
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
    
    // Clean up test cube
    if (this.testCube) {
      this.scene.remove(this.testCube)
      this.testCube.geometry.dispose()
      if (this.testCube.material instanceof THREE.Material) {
        this.testCube.material.dispose()
      }
    }
    
    // Clean up FPS display
    if (this.fpsElement && this.fpsElement.parentElement) {
      this.fpsElement.parentElement.removeChild(this.fpsElement)
    }
    
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
    this.hoverLineMaterial.dispose()
    
    // Dispose of renderer
    this.renderer.dispose()
  }
}