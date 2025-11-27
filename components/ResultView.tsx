import { useRef, useMemo, useEffect } from "react";
import Button from "./common/Button";
import { StartOverIcon } from "./common/Icon";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface ResultViewProps {
  generatedImage: string;
  downloadUrl: string;
  onStartOver: () => void;
}

// ========================= SHADERS (same as CameraView / PhotoEditor / DualResult) =========================

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
    vec3 softCyan   = vec3(0.10, 0.80, 1.00);
    vec3 warmOrange = vec3(1.20, 0.45, 0.08);
    vec3 whiteGlow  = vec3(1.0);

    float lowBand  = smoothstep(0.05, 0.45, v);
    float midBand  = smoothstep(0.25, 0.75, v);
    float highBand = smoothstep(0.55, 1.0, v);

    vec3 col = mix(deepBlue, midBlue, lowBand);

    float orangeMask = smoothstep(0.30, 0.70, v);
    col = mix(col, warmOrange, orangeMask * 0.45);

    float midBlob = exp(-4.0 * pow(v - 0.5, 2.0));
    col += warmOrange * midBlob * 0.22;

    vec3 cyanBand = mix(softCyan, whiteGlow, smoothstep(0.75, 1.0, v));
    col = mix(col, cyanBand, highBand * 0.55);

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

const ResultView = ({ generatedImage, downloadUrl, onStartOver }: ResultViewProps) => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(
    downloadUrl
  )}&qzone=1&bgcolor=ffffff`;

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      {/* 🔮 Shader background (same as other screens) */}
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

      {/* Foreground content on top of gradient */}
      <div className="absolute inset-0 z-10 flex flex-col">
        {/* Image container — scaled & moved up slightly */}
        <div className="flex-grow w-full relative flex items-center justify-center p-4 overflow-hidden -translate-y-[8%]">
          <img
            src={generatedImage}
            alt="Generated fashion photo"
            className="max-w-full max-h-full object-contain   shadow-lg scale-[0.7]"
          />
        </div>

        {/* Footer containing QR and Button — shifted up a little */}
        <div className="flex-shrink-0 w-full relative p-4 flex flex-col items-center justify-center gap-3 -translate-y-[50%]">
          {/* QR code + text — moved further up */}
          <div className="flex flex-col items-center justify-center gap-3 mb-[3%] -translate-y-[20%]">
            <p className="font-semibold text-white">Scan to Download</p>
            <div className="bg-white p-2 rounded-lg shadow-lg">
              <img
                src={qrCodeUrl}
                alt="QR code to download image"
                width="82"
                height="82"
              />
            </div>
          </div>

          {/* Button — same position tweak as before */}
          <div className="-translate-y-[3%]">
            <Button
              onClick={onStartOver}
              variant="secondary"
              aria-label="Start over"
            >
              <StartOverIcon className="w-5 h-5 mr-2" />
              Start Over
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultView;
