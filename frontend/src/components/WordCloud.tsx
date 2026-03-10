import { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { WordData } from '../types'

// Topic color palette - vivid, distinct hues
const TOPIC_COLORS = [
  '#00ffc8', // cyan-green
  '#ff3cac', // hot pink
  '#a78bfa', // violet
  '#fbbf24', // amber
  '#34d399', // emerald
  '#f87171', // red
  '#60a5fa', // blue
]

function fibonacciSphere(n: number, radius: number): THREE.Vector3[] {
  const positions: THREE.Vector3[] = []
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = goldenAngle * i
    positions.push(
      new THREE.Vector3(
        Math.cos(theta) * r * radius,
        y * radius,
        Math.sin(theta) * r * radius
      )
    )
  }
  return positions
}

interface WordMeshProps {
  word: WordData
  position: THREE.Vector3
  color: string
  isHovered: boolean
  onHover: (word: string | null) => void
  animationOffset: number
}

function WordMesh({ word, position, color, isHovered, onHover, animationOffset }: WordMeshProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const basePos = useMemo(() => position.clone(), [position])
  const fontSize = 0.12 + word.weight * 0.38

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime + animationOffset
    // Gentle float
    groupRef.current.position.set(
      basePos.x + Math.sin(t * 0.3 + animationOffset) * 0.04,
      basePos.y + Math.cos(t * 0.4 + animationOffset) * 0.06,
      basePos.z + Math.sin(t * 0.25 + animationOffset * 2) * 0.04
    )
    // Billboard (face camera) is handled by Text component's anchorX/anchorY
    const scale = isHovered ? 1.25 : 1.0
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, scale, 0.12)
    )
  })

  return (
    <group ref={groupRef} position={basePos}>
      <Text
        fontSize={fontSize}
        color={isHovered ? '#ffffff' : color}
        anchorX="center"
        anchorY="middle"
        font={undefined}
        onPointerOver={() => onHover(word.word)}
        onPointerOut={() => onHover(null)}
        depthOffset={isHovered ? -1 : 0}
      >
        {word.word}
        <meshBasicMaterial
          color={isHovered ? '#ffffff' : color}
          opacity={0.4 + word.weight * 0.6}
          transparent
        />
      </Text>
    </group>
  )
}

function CloudParticles({ count }: { count: number }) {
  const mesh = useRef<THREE.Points>(null!)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 2
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [count])

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.02
      mesh.current.rotation.x = state.clock.elapsedTime * 0.01
    }
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.015} color="#7b5ea7" transparent opacity={0.5} sizeAttenuation />
    </points>
  )
}

function GlowRing() {
  const mesh = useRef<THREE.Mesh>(null!)
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.z = state.clock.elapsedTime * 0.08
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.3
    }
  })
  return (
    <mesh ref={mesh}>
      <torusGeometry args={[3.8, 0.008, 8, 120]} />
      <meshBasicMaterial color="#00ffc8" transparent opacity={0.15} />
    </mesh>
  )
}

function GlowRing2() {
  const mesh = useRef<THREE.Mesh>(null!)
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.z = -state.clock.elapsedTime * 0.05
      mesh.current.rotation.y = Math.cos(state.clock.elapsedTime * 0.1) * 0.4
    }
  })
  return (
    <mesh ref={mesh}>
      <torusGeometry args={[4.0, 0.005, 8, 120]} />
      <meshBasicMaterial color="#ff3cac" transparent opacity={0.1} />
    </mesh>
  )
}

interface CloudSceneProps {
  words: WordData[]
  onWordHover: (word: string | null) => void
  hoveredWord: string | null
}

function CloudScene({ words, onWordHover, hoveredWord }: CloudSceneProps) {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null!)

  useMemo(() => {
    camera.position.set(0, 0, 7)
  }, [camera])

  const positions = useMemo(() => fibonacciSphere(words.length, 2.8), [words.length])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.04
    }
  })

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#00ffc8" />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color="#ff3cac" />

      <CloudParticles count={300} />
      <GlowRing />
      <GlowRing2 />

      <group ref={groupRef}>
        {words.map((w, i) => (
          <WordMesh
            key={w.word}
            word={w}
            position={positions[i]}
            color={TOPIC_COLORS[w.topic % TOPIC_COLORS.length]}
            isHovered={hoveredWord === w.word}
            onHover={onWordHover}
            animationOffset={i * 0.37}
          />
        ))}
      </group>

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={14}
        rotateSpeed={0.5}
        zoomSpeed={0.7}
        autoRotate={false}
      />
    </>
  )
}

interface WordCloudProps {
  words: WordData[]
}

export default function WordCloud({ words }: WordCloudProps) {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <CloudScene
          words={words}
          onWordHover={setHoveredWord}
          hoveredWord={hoveredWord}
        />
      </Canvas>

      {hoveredWord && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.75)',
            border: '1px solid rgba(0,255,200,0.3)',
            borderRadius: '4px',
            padding: '6px 18px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: '#00ffc8',
            letterSpacing: '0.12em',
            pointerEvents: 'none',
            backdropFilter: 'blur(8px)',
          }}
        >
          {hoveredWord}
        </div>
      )}
    </div>
  )
}
