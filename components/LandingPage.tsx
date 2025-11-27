import React, { useEffect, useMemo, useRef } from "react";
import Button from "./common/Button";
import { SparklesIcon } from "./common/Icon";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ✅ Import assets from public (or src/assets if you move them there)
import screensaverVideo from "/screensaver.mp4";
import titleImg from "/Title.png";

interface LandingPageProps {
  onEnter: () => void;
}

/* ================= Shaders ================= */
const vert = /* glsl */ `
  varying vec2 vUv;
  void main () {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const frag = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform vec2  uResolution;
  uniform float uTime;

  uniform sampler2D uTexture;
  uniform vec2  uImageScale;
  uniform vec2  uImageOffset;
  uniform float uMaskLow;
  uniform float uMaskHigh;

  uniform vec3  uRingColorA;
  uniform vec3  uRingColorB;
  uniform float uRingWidth;
  uniform float uGlowStrength;
  uniform int   uGlowSteps;

  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main () {
    vec2 fragCoord = vUv * uResolution;
    vec2 uv = fragCoord / uResolution.xy;

    float noice = snoise(vec2(uv.x * 3.4 - 2.0, uv.y - uTime/10.0) * 0.5);
    vec2 circleParams = vec2(cos(noice) + 4.0, abs(sin(noice) + 2.5));
    float circleRatio = circleParams.y / circleParams.x;

    float circle = pow(circleParams.y,
                       -abs(length((fragCoord + fragCoord - uResolution.xy) / uResolution.y) - circleRatio) * 20.0)
                   * atan(uTime) * 1.3;

    circle += 2.0 * pow(circleParams.y,
                        -abs(length((fragCoord + fragCoord - uResolution.xy) / uResolution.y
                            - circleRatio * vec2(cos(uTime), sin(uTime))) ) * circleParams.x);

    vec3 bgCol = circle * vec3(circleParams * 0.1, 0.5);

    vec2 tUV = (vUv - 0.5);
    tUV *= uImageScale;
    tUV += 0.5 + uImageOffset;
    vec3 img = texture2D(uTexture, tUV).rgb;

    float mask = smoothstep(uMaskLow, uMaskHigh, circle);
    vec3 baseCol = mix(bgCol, img, mask);

    float edge = uMaskHigh;
    float w    = max(0.0001, uRingWidth);
    float ring = smoothstep(edge - w, edge, circle)
               - smoothstep(edge, edge + w, circle);

    float glow = 0.0;
    for (int i = 0; i < 8; i++) {
      if (i >= uGlowSteps) break;
      float t  = float(i + 1);
      float iw = w * (1.0 + t * 1.5);
      float layer = smoothstep(edge - iw, edge, circle)
                  - smoothstep(edge, edge + iw, circle);
      glow += layer / (t*t + 1.0);
    }

    float hueMix = clamp(noice * 0.5 + 0.5, 0.0, 1.0);
    vec3 ringCol = mix(uRingColorA, uRingColorB, hueMix);

    vec3 col = baseCol
             + ringCol * ring * 1.2
             + ringCol * glow * uGlowStrength;

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ================= Plane (Video) ================= */
function SimplexCirclePlane() {
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const { viewport, size } = useThree();

  // ✅ Create video element and use imported src
  const video = useMemo(() => {
    const el = document.createElement("video");
    el.src = screensaverVideo; // ← use imported path
    el.crossOrigin = "anonymous";
    el.loop = true;
    el.muted = true;
    el.playsInline = true;
    el.preload = "auto";
    return el;
  }, []);

  const videoTexture = useMemo(() => {
    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
  }, [video]);

  const uniforms = useMemo(
    () => ({
      uResolution:   { value: new THREE.Vector2(size.width, size.height) },
      uTime:         { value: 0 },
      uTexture:      { value: videoTexture },
      uImageScale:   { value: new THREE.Vector2(0.4, 1.06) },
      uImageOffset:  { value: new THREE.Vector2(0.0, 0.05) },
      uMaskLow:      { value: 0.15 },
      uMaskHigh:     { value: 0.35 },
      uRingColorA:   { value: new THREE.Color("#4cc9f0") },
      uRingColorB:   { value: new THREE.Color("#ff7f11") },
      uRingWidth:    { value: 0.02 },
      uGlowStrength: { value: 0.8 },
      uGlowSteps:    { value: 5 },
    }),
    [videoTexture, size.width, size.height]
  );

  useEffect(() => {
    video.play().catch((err) => {
      console.warn("Autoplay blocked:", err);
    });
    return () => {
      video.pause();
    };
  }, [video]);

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
  }, [size.width, size.height, uniforms]);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime();
    if (video.readyState >= 2) {
      videoTexture.needsUpdate = true;
    }
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

/* ================= Page ================= */
const LandingPage = ({ onEnter }: LandingPageProps) => {
  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <Canvas
        className="absolute inset-0 z-0"
        orthographic
        frameloop="always"
        dpr={[1, 2]}
        gl={{ antialias: true }}
        style={{ pointerEvents: "none" }}
        camera={{ position: [0, 0, 10], zoom: 1 }}
      >
        <color attach="background" args={["#000"]} />
        <SimplexCirclePlane />
      </Canvas>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-8 text-white">
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fadeIn { animation: fadeIn 1s ease-in-out; }
        `}</style>

        <div className="relative mb-8 animate-fadeIn" />

        {/* ✅ Use imported title image */}
        <img src={titleImg} alt="Title" />
        <p className="text-white max-w-md mt-6 mb-10">Step through the portal.</p>

        <Button
          onClick={onEnter}
          className={`
            px-10 py-3 rounded-full border border-white text-white font-semibold
            bg-white/10 hover:bg-white/15
            transition-all duration-300 transform hover:scale-110
            shadow-[0_0_10px_3px_rgba(255,255,255,0.9),
                    0_0_25px_10px_rgba(255,255,255,0.7),
                    0_0_50px_20px_rgba(255,255,255,0.5)]
          `}
        >
          Enter
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;
