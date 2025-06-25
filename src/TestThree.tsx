import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function TestThree() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    console.log('TestThree: Setting up scene')
    
    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0000ff) // Blue background
    
    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 5
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true 
    })
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    
    // Add a simple cube
    const geometry = new THREE.BoxGeometry(2, 2, 2)
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xff0000,
      wireframe: true 
    })
    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.position.set(1, 1, 1)
    scene.add(directionalLight)
    
    console.log('TestThree: Scene has', scene.children.length, 'objects')
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      
      // Rotate the cube
      cube.rotation.x += 0.01
      cube.rotation.y += 0.01
      
      renderer.render(scene, camera)
    }
    
    console.log('TestThree: Starting animation')
    animate()
    
    // Handle resize
    const handleResize = () => {
      camera.aspect = canvas.clientWidth / canvas.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    }
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])
  
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <h1 style={{ 
        position: 'absolute', 
        top: 20, 
        left: 20, 
        color: 'white',
        zIndex: 10 
      }}>
        Three.js Test Page
      </h1>
      <canvas 
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
    </div>
  )
}

export default TestThree