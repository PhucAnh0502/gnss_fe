import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Stage } from '@react-three/drei';

function Model({ url }) {
  const { scene } = useGLTF(url);
  
  return <primitive object={scene} rotation={[0, Math.PI / 4, 0]} />;
}

export const EarthModel = ({ modelUrl }) => {
  return (
    <div className="w-full h-64 md:h-72">
      <Canvas shadows camera={{ position: [0, 0, 150], fov: 40 }} gl={{ preserveDrawingBuffer: true }}>
        <ambientLight intensity={0.5} />
        
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6} contactShadow={{ opacity: 0.5, blur: 2 }} adjustCamera={true}>
            <Model url={modelUrl} />
          </Stage>
        </Suspense>

        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
};

useGLTF.preload('/models/earth_orbit.glb');