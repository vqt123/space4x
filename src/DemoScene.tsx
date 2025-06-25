import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function DemoScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    cube: THREE.Mesh
    isMouseDown: boolean
    lastMouseX: number
    lastMouseY: number
    cameraRotationX: number
    cameraRotationY: number
    cameraDistance: number
  } | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const width = canvas.clientWidth || 800
    const height = canvas.clientHeight || 600

    // Create scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x222222)

    // Create camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    const cameraDistance = 5
    camera.position.set(0, 0, cameraDistance)

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ 
      canvas,
      antialias: true
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)

    // Create a simple cube
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00ff88,
      wireframe: false
    })
    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)

    // Add some lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(1, 1, 1)
    scene.add(directionalLight)

    // Mouse controls
    let isMouseDown = false
    let isRightMouseDown = false
    let lastMouseX = 0
    let lastMouseY = 0
    let cameraRotationX = 0
    let cameraRotationY = 0
    let cameraOffset = new THREE.Vector3(0, 0, 0)

    const handleMouseDown = (event: MouseEvent) => {
      event.preventDefault()
      if (event.button === 0) { // Left mouse button
        isMouseDown = true
        lastMouseX = event.clientX
        lastMouseY = event.clientY
      } else if (event.button === 2) { // Right mouse button
        isRightMouseDown = true
        lastMouseX = event.clientX
        lastMouseY = event.clientY
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault()
      const deltaX = event.clientX - lastMouseX
      const deltaY = event.clientY - lastMouseY
      
      if (isMouseDown) {
        // Left mouse - rotate camera
        cameraRotationY -= deltaX * 0.01
        cameraRotationX -= deltaY * 0.01
        cameraRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, cameraRotationX))
      } else if (isRightMouseDown) {
        // Right mouse - pan camera
        const panSpeed = 0.01 * cameraDistance
        cameraOffset.x -= deltaX * panSpeed
        cameraOffset.y += deltaY * panSpeed
      }
      
      lastMouseX = event.clientX
      lastMouseY = event.clientY
      
      // Update camera position
      const x = Math.cos(cameraRotationY) * Math.cos(cameraRotationX) * cameraDistance
      const y = Math.sin(cameraRotationX) * cameraDistance
      const z = Math.sin(cameraRotationY) * Math.cos(cameraRotationX) * cameraDistance
      
      camera.position.set(x + cameraOffset.x, y + cameraOffset.y, z + cameraOffset.z)
      camera.lookAt(cameraOffset)
    }

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 0) {
        isMouseDown = false
      } else if (event.button === 2) {
        isRightMouseDown = false
      }
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const newDistance = cameraDistance + event.deltaY * 0.01
      const clampedDistance = Math.max(2, Math.min(20, newDistance))
      
      // Update camera position with new distance
      const x = Math.cos(cameraRotationY) * Math.cos(cameraRotationX) * clampedDistance
      const y = Math.sin(cameraRotationX) * clampedDistance
      const z = Math.sin(cameraRotationY) * Math.cos(cameraRotationX) * clampedDistance
      
      camera.position.set(x + cameraOffset.x, y + cameraOffset.y, z + cameraOffset.z)
      camera.lookAt(cameraOffset)
      
      // Update stored distance
      cameraDistance = clampedDistance
    }

    // Disable context menu on right click
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault()
    }
    
    // Add event listeners
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('wheel', handleWheel)
    canvas.addEventListener('contextmenu', handleContextMenu)

    // Store references for cleanup
    sceneRef.current = {
      scene,
      camera,
      renderer,
      cube,
      isMouseDown,
      lastMouseX,
      lastMouseY,
      cameraRotationX,
      cameraRotationY,
      cameraDistance
    }

    // Animation loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      
      // Rotate the cube
      cube.rotation.x += 0.01
      cube.rotation.y += 0.01
      
      // Render
      renderer.render(scene, camera)
    }
    animate()

    // Handle window resize
    const handleResize = () => {
      const newWidth = canvas.clientWidth || 800
      const newHeight = canvas.clientHeight || 600
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('resize', handleResize)
      
      renderer.dispose()
      geometry.dispose()
      material.dispose()
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#111' }}>
      <canvas 
        ref={canvasRef}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%', 
          height: '100%', 
          display: 'block'
        }} 
      />
      
      {/* Instructions */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '14px',
        background: 'rgba(0,0,0,0.7)',
        padding: '10px',
        borderRadius: '4px'
      }}>
        <div>🖱️ Left drag - rotate camera</div>
        <div>🖱️ Right drag - pan camera</div>
        <div>🎡 Scroll - zoom</div>
        <div>📦 Watch cube rotation smoothness</div>
      </div>
      
      {/* Back to game button */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
      }}>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            background: '#00ff88',
            color: 'black',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ← Back to Game
        </button>
      </div>
    </div>
  )
}

export default DemoScene