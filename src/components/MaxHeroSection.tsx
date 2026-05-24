import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { motion } from 'framer-motion';

export default function MaxHeroSection() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-neutral-950 text-white flex items-center justify-center px-6">
      {/* Background Interactive 3D Canvas Context */}
      <div className="absolute inset-0 z-0 h-full w-full opacity-40">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 10, 5]} intensity={2} />
          <Sphere args={[1, 100, 200]} scale={2.4}>
            <MeshDistortMaterial color="#4f46e5" attach="material" distort={0.4} speed={2} roughness={0.2} />
          </Sphere>
          <OrbitControls enableZoom={false} />
        </Canvas>
      </div>

      {/* Modern High-Impact Copy Layout */}
      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
        <motion.span 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide bg-white/5 border border-white/10 backdrop-blur-md"
        >
          ✨ Next-Gen Web Optimization Engine
        </motion.span>
        
        <motion.h1 
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.2 }}
          className="text-6xl md:text-8xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-neutral-200 to-neutral-500"
        >
          Antigravity UI Engine
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl mx-auto text-lg text-neutral-400 font-normal leading-relaxed"
        >
          Automated layout synthesis, zero-latency WebGL components, and continuous token synchronization via custom server pipelines.
        </motion.p>
      </div>
    </section>
  );
}
