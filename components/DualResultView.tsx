import { useState, useRef, useMemo, useEffect } from "react";
import html2canvas from "html2canvas";
import { ClockIcon, DownloadIcon, RetakeIcon } from "./common/Icon";
import Button from "./common/Button";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ✅ Import media first
import titleImg from "/Title.png";
import logoImg from "/Logo.png";
import outputBg from "/outputbg.png";

interface DualResultViewProps {
  image1: string;
  image2: string;
  retroTheme: string;
  futureTheme: string;
  onCapture: (compositeImage: string) => void;
  onRetake: () => void; // ✅ new prop
  error: string | null;
}

// ========================= Vertical text utility =========================

const VerticalText = ({
  text,
  reverse = false,
  className,
}: {
  text: string;
  reverse?: boolean;
  className?: string;
}) => {
  return (
    <div
      className={`flex items-center whitespace-nowrap gap-1 ${
        reverse ? "flex-col-reverse" : "flex-col"
      } ${className || ""}`}
    >
      {text
        .toUpperCase()
        .split("")
        .map((char, index) => (
          <span key={index} className="leading-none tracking-widest">
            {char}
          </span>
        ))}
    </div>
  );
};

// ========================= SHADERS (copied from PhotoEditor) =========================

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

// ========================= Plane for shader bg =========================

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

// ========================= DualResultView =========================

const DualResultView = ({
  image1,
  image2,
  retroTheme,
  futureTheme,
  onCapture,
  onRetake,
  error,
}: DualResultViewProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const handleCaptureClick = async () => {
    if (!captureRef.current || isCapturing) return;

    setIsCapturing(true);

    try {
      const canvas = await html2canvas(captureRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });

      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      onCapture(imageDataUrl);
    } catch (err) {
      console.error("Failed to capture element:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  // ✅ White border re-added around capsules
  const capsuleBaseClasses =
    "w-full h-full rounded-full bg-cover bg-center transition-all duration-300 ease-in-out overflow-hidden relative border-4 border-white/60";

  return (
    <div className="w-full h-full relative bg-black overflow-hidden">
      {/* 🔮 Shader background (IDENTICAL pattern to PhotoEditor) */}
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

      {/* 📦 Capture area centered on top of shader, shifted up slightly */}
      <div className="absolute inset-0 flex items-center justify-center z-10 transform -translate-y-[8%]">
        <div
          ref={captureRef}
          className="relative w-[70%] h-[70%] flex items-center justify-center overflow-hidden"
          style={{
            backgroundImage: `url(${outputBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Title */}
          <div className="absolute top-6 left-0 right-0 z-20 flex justify-center transform -translate-y-[15%]">
            <img src={titleImg} className="transform scale-[0.7]" alt="Title" />
          </div>

          {/* Capsules and labels */}
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Left capsule (Retro) */}
            <div
              className="absolute w-[41.4%] h-[50.6%] -translate-x-[35%] -translate-y-[15%] scale-85"
              aria-label="Retro-themed image on the left"
            >
              {/* Retro label — smaller + closer */}
              <div className="absolute top-1/2 -left-8 -translate-y-1/2">
                <VerticalText
                  text={retroTheme}
                  className="text-white font-orbitron text-sm opacity-80"
                />
              </div>

              <div className="relative w-full h-full rounded-full">
                <div
                  className={capsuleBaseClasses}
                  style={{ backgroundImage: `url(${image1})` }}
                />
              </div>
            </div>

            {/* Right capsule (Future) */}
            <div
              className="absolute w-[41.4%] h-[50.6%] translate-x-[35%] translate-y-[30%] scale-85"
              aria-label="Futuristic-themed image on the right"
            >
              <div className="relative w-full h-full rounded-full">
                <div
                  className={capsuleBaseClasses}
                  style={{ backgroundImage: `url(${image2})` }}
                />
              </div>

              {/* Future label — smaller + closer */}
              <div className="absolute top-1/2 -right-8 -translate-y-1/2">
                <VerticalText
                  text={futureTheme}
                  className="text-white font-orbitron text-sm opacity-80"
                />
              </div>
            </div>
          </div>

          {/* Logo inside capture area — bottom-left */}
          <div className="absolute bottom-2 left-2 z-30">
            <img
              src={logoImg}
              alt="Logo"
              className="scale-[0.2] origin-bottom-left"
            />
          </div>
        </div>
      </div>

      {/* 🔘 Retake + Download buttons */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[10%] z-20 flex flex-col items-center gap-2">
        {error && (
          <p className="text-red-300 text-center text-sm mb-1">{error}</p>
        )}

        <div className="flex gap-4 transform scale-[0.8]">
          <Button
            onClick={onRetake}
            variant="secondary"
            aria-label="Retake photo"
          >
            <RetakeIcon className="w-5 h-5 mr-2" />
            Retake
          </Button>

          <Button onClick={handleCaptureClick} disabled={isCapturing}>
            {isCapturing ? (
              <>
                <ClockIcon className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <DownloadIcon className="w-5 h-5 mr-2" />
                Download
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DualResultView;
