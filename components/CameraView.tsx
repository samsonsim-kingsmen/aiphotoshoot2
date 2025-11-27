import { useRef, useEffect, useState, useMemo } from "react";
import Button from "./common/Button";
import { CameraIcon, NoCameraIcon } from "./common/Icon";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface CameraViewProps {
  onCapture: (imageDataUrl: string) => void;
}

/* ========================= SHADERS ========================= */

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

/* ========================= MAIN VIEW ========================= */

const CameraView = ({ onCapture }: CameraViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please check permissions.");
      }
    };
    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const target = 9 / 16;
    const aspect = vw / vh;

    let sWidth, sHeight, sx, sy;

    if (aspect > target) {
      sHeight = vh;
      sWidth = sHeight * target;
      sx = (vw - sWidth) / 2.0;
      sy = 0.0;
    } else {
      sWidth = vw;
      sHeight = sWidth / target;
      sx = 0.0;
      sy = (vh - sHeight) / 2.0;
    }

    canvas.width = sWidth;
    canvas.height = sHeight;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

    onCapture(canvas.toDataURL("image/jpeg"));
  };

  const handleCaptureClick = () => {
    if (countdown !== null) return;

    let count = 5;
    setCountdown(count);

    timerRef.current = setInterval(() => {
      count--;
      setCountdown(count > 0 ? count : null);

      if (count === 0) {
        clearInterval(timerRef.current!);
        capture();
      }
    }, 1000);
  };

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black p-4">
        <NoCameraIcon className="w-16 h-16 mb-4 text-red-500" />
        <p className="text-center text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-black overflow-hidden">
      {/* 🔮 Shader background */}
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

      {/* 📷 Camera video */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none z-20">
        <div className="relative h-[65%] aspect-[9/16] mb-[45%] overflow-hidden rounded-xl pointer-events-auto">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover -scale-x-100"
          />
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* ⏱ Countdown */}
      {countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30">
          <span className="text-9xl text-white font-orbitron drop-shadow-lg">
            {countdown}
          </span>
        </div>
      )}

      {/* 🔘 Button */}
      <div className="absolute bottom-[10%] left-0 right-0 p-4 flex justify-center z-30">
        <Button onClick={handleCaptureClick} disabled={countdown !== null}>
          <CameraIcon className="w-6 h-6 mr-2" />
          Capture
        </Button>
      </div>
    </div>
  );
};

export default CameraView;
