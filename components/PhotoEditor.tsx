import { useRef, useMemo, useEffect } from "react";
import Button from "./common/Button";
import { SparklesIcon, RetakeIcon, StartOverIcon, CameraIcon } from "./common/Icon";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface PhotoEditorProps {
  capturedImage: string;
  onRetake: () => void;
  onGenerate: () => void;
  error?: string | null;
}

/* ========================= SHADERS (same as CameraView) ========================= */

const vert = /* glsl */ `
  varying vec2 vUv;
  void main () {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/* Blobby deep blue / cyan / orange gradient with cleaner orange */
const frag = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform vec2  uResolution;
  uniform float uTime;

  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz; 
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float f = 0.0;
    float a = 0.7;
    mat2 m = mat2(1.5, 1.1, -1.1, 1.5);
    for (int i = 0; i < 3; i++) {
      f += a * snoise(p);
      p = m * p * 0.75;
      a *= 0.5;
    }
    return f;
  }

  void main () {
    vec2 uv = vUv - 0.5;
    uv.x *= uResolution.x / uResolution.y;

    float t = uTime * 0.55;

    float n = fbm(uv * 1.2 + vec2(t * 0.2, -t * 0.15));
    float v = clamp(n * 0.5 + 0.5, 0.0, 1.0);

    // Palette
    vec3 deepBlue   = vec3(0.02, 0.06, 0.16);
    vec3 midBlue    = vec3(0.05, 0.20, 0.50);
    vec3 softCyan   = vec3(0.10, 0.80, 1.00);   // more blue than green
    vec3 warmOrange = vec3(1.20, 0.45, 0.08);   // rich orange, not yellow
    vec3 whiteGlow  = vec3(1.0);

    // Blobby bands
    float lowBand  = smoothstep(0.05, 0.45, v);
    float midBand  = smoothstep(0.25, 0.75, v);
    float highBand = smoothstep(0.55, 1.0, v);

    // Start: deep blue to mid blue
    vec3 col = mix(deepBlue, midBlue, lowBand);

    // Midtones: overlay orange without killing the blue completely
    float orangeMask = smoothstep(0.30, 0.70, v);
    col = mix(col, warmOrange, orangeMask * 0.45);

    // Orange "bloom" in mid band
    float midBlob = exp(-4.0 * pow(v - 0.5, 2.0));
    col += warmOrange * midBlob * 0.22;

    // Highlights: push towards cyan/white
    vec3 cyanBand = mix(softCyan, whiteGlow, smoothstep(0.75, 1.0, v));
    col = mix(col, cyanBand, highBand * 0.55);

    // Radial falloff to keep edges darker
    float r = length(uv);
    float radial = smoothstep(1.05, 0.2, r);
    col *= (0.6 + radial * 0.7);

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ========================= PLANE ========================= */

function GlowPlane() {
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const { viewport, size } = useThree();

  const uniforms = useMemo(
    () => ({
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uTime: { value: 0 },
    }),
    [size.width, size.height]
  );

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
  }, [size.width, size.height, uniforms]);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
      />
    </mesh>
  );
}

/* ========================= PHOTO EDITOR ========================= */

const PhotoEditor = ({
  capturedImage,
  onRetake,
  onGenerate,
  error,
}: PhotoEditorProps) => {
  return (
    <div className="w-full h-full relative bg-black overflow-hidden">
      {/* 📏 Match CTA button styling from CameraView */}
      <style>{`
        .capture-cta {
          font-size: clamp(1rem, 2.4vh, 1.6rem);
          padding-block: 1.4vh;
        }

        .capture-cta-icon {
          width: 3vh;
          height: 3vh;
        }
      `}</style>

      {/* 🔮 Shader background (same as CameraView) */}
      <Canvas
        className="absolute inset-0 z-0"
        orthographic
        dpr={[1, 2]}
        gl={{ antialias: true }}
        camera={{ position: [0, 0, 10], zoom: 1 }}
        style={{ pointerEvents: "none" }}
      >
        <GlowPlane />
      </Canvas>

      {/* 📸 Captured photo (same size/position as live camera) */}
      <div className="absolute inset-0 flex items-end justify-center z-10">
        <div className="relative h-[65%] aspect-[9/16] mb-[45%] overflow-hidden rounded-xl">
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* 🔘 Controls */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[10%] z-20 flex flex-col sm:flex-row items-center gap-4">
        {error && (
          <p className="text-red-300 text-center text-sm mb-2 sm:mb-0 sm:absolute sm:-top-8">
            {error}
          </p>
        )}

        {/* Retake button — same width & label size logic as Capture */}
  
        <div style={{ width: "10vh" }}>
          <Button
            onClick={onRetake}
            aria-label="Journey through time"
            className="capture-cta w-full"
            style={{ fontSize: "2vh" }}
          >
         
              <StartOverIcon  className="capture-cta-icon mr-2" />
          </Button>
        </div>

        {/* Generate button — same width & label size logic as Capture */}
        <div style={{ width: "30vh" }}>
          <Button
            onClick={onGenerate}
            aria-label="Journey through time"
            className="capture-cta w-full"
            style={{ fontSize: "2vh" }}
          >
            <SparklesIcon className="capture-cta-icon mr-2" />
            Journey through time
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PhotoEditor;
