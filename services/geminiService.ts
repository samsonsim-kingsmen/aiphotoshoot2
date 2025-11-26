import { GoogleGenAI, Modality } from "@google/genai";

const BASE_PROMPT_PRE = `Generate a new image in a vertical, portrait aspect ratio (9:16). The main subject's face must be centrally composed and fully visible within the frame, ensuring it is not cut off at the edges. Analyze the person or people in this photo. It is absolutely crucial that the final image contains the exact same number of people as the original photo; do not add or remove anyone. You must retain ALL of each person's original features, including their face, skin tone, and gender presentation. Pay special attention to the hair; the hairstyle and hair color for every person must be preserved *exactly* as they appear in the original photo. Do NOT alter their facial features or makeup. The only changes should be to their clothing and the background scene. The final image must not contain any text, logos, or words.`;

const themeVariants = {
  /* ============================
     🌈 1970s — PAST
     ============================ */

  "1970s Funk": {
    backgrounds: [
      "a retro diner with polished chrome counters and a classic checkerboard floor, glowing under warm vintage lighting",
      "a lively city street lined with glowing theatre marquees and neon signage",
      "an old-school recording studio with rich wooden panels, analog equipment, and soft amber lights"
    ],
    outfits: [
      "a boldly patterned flared ensemble made with glossy, high-shine fabrics that catch the light",
      "a metallic-toned outfit paired with iconic platform shoes and a dramatic wide collar",
      "a silky satin two-piece suit featuring vibrant geometric prints and exaggerated proportions"
    ],
    accessories: [
      "tinted retro sunglasses with oversized frames",
      "chunky gold jewelry that adds confident flair",
      "a patterned scarf or belt styled for a touch of expressive funk energy"
    ]
  },

  "1970s Disco": {
    backgrounds: [
      "a nostalgic roller rink illuminated by multicolored spotlights reflecting across the glossy floor",
      "a shimmering dance floor crowned with a mirrored disco ball scattering light in all directions",
      "a nightclub stage filled with bright backlights and haze, evoking classic disco glamour"
    ],
    outfits: [
      "a shimmering jumpsuit made of reflective fabric that moves dramatically under stage lighting",
      "a bold metallic outfit with an open neckline and flowing lines",
      "a two-piece ensemble adorned with sequins that sparkle from every angle"
    ],
    accessories: [
      "mirror-inspired jewelry with dazzling highlights",
      "glitter accents or makeup reflecting the era’s iconic aesthetic",
      "a wide, attention-grabbing statement belt cinched at the waist"
    ]
  },

  "1970s Bohemian": {
    backgrounds: [
      "a cozy artist loft filled with draped tapestries, handcrafted rugs, and warm natural textures",
      "a serene garden patio with fluttering fabrics and dappled sunlight",
      "a vintage living room decorated with thriving houseplants and woven textiles"
    ],
    outfits: [
      "a flowing linen ensemble with soft, layered drapes",
      "a beautifully patterned outfit featuring delicate embroidery and artisanal details",
      "an earth-toned attire crafted with rich woven textures and natural fibers"
    ],
    accessories: [
      "unique, handmade jewelry created from natural materials",
      "a woven shoulder bag that complements the earthy palette",
      "a lightweight fabric wrap that adds comfortable elegance"
    ]
  },

  "1970s Hippy": {
    backgrounds: [
      "a peaceful meadow glowing warmly at sunset",
      "a relaxed festival field dotted with colorful tents and wandering crowds",
      "a cozy beach bonfire scene at dusk with flickering firelight"
    ],
    outfits: [
      "a soft cotton tie-dye outfit in swirling vibrant colors",
      "a patchwork denim look paired with a classic fringed top",
      "light, breathable woven clothing accented with earthy beads"
    ],
    accessories: [
      "classic round sunglasses in true hippy style",
      "layers of colorful beaded necklaces",
      "a collection of hand-woven bracelets stacked with intention"
    ]
  },

  /* ============================
     🚀 2070s — FUTURE
     ============================ */

  "2070s Cyberpunk": {
    backgrounds: [
      "a bustling futuristic city street lined with towering digital billboards and rapid autonomous delivery drones",
      "a neon-lit subway station filled with animated holographic signage and sleek architecture",
      "a modern café operated by efficient robotic servers with glowing tabletop interfaces"
    ],
    outfits: [
      "a sleek techwear ensemble with reflective seam lines and functional utility panels",
      "a layered futurist streetwear suit trimmed with polished metallic accents",
      "an asymmetric jacket featuring embedded glowing circuitry details"
    ],
    accessories: [
      "a sophisticated digital wrist interface device",
      "minimalist visor-style glasses with subtle illumination",
      "a glowing luminescent tattoo that pulses softly with light"
    ]
  },

  "2070s Cyborg": {
    backgrounds: [
      "an advanced training facility equipped with robotic fitness systems and reactive sensor walls",
      "a pristine medical laboratory filled with automated machines and translucent display monitors",
      "a minimalist corporate workspace controlled entirely by AI-driven systems"
    ],
    outfits: [
      "a fitted biomechanical suit composed of lightweight alloy plates and flexible joints",
      "a streamlined synthetic armor set featuring soft, articulated plating",
      "a durable composite suit constructed with carbon-mesh reinforcement"
    ],
    accessories: [
      "a slim neural-interface headband designed for seamless control",
      "a subtle mechanical limb augmentation",
      "a small integrated light implant emitting a soft glow"
    ]
  },

  "2070s Y3K": {
    backgrounds: [
      "a high-end gallery showcasing interactive holographic installations and sculptural displays",
      "a luxurious next-gen airport lounge featuring self-moving seating and adaptive smart windows",
      "a futuristic storefront where digital garments float as projected holograms"
    ],
    outfits: [
      "a sculptural monochrome outfit defined by clean, architectural silhouettes",
      "a precise, minimal silver ensemble with elegant folded structures",
      "a structured ensemble crafted from advanced matte-performance fabrics"
    ],
    accessories: [
      "bold geometric jewelry in sleek futuristic shapes",
      "a transparent visor with a polished, modern curve",
      "a seamless, minimalist belt designed for utility and style"
    ]
  },

  "2070s Holographic": {
    backgrounds: [
      "a grand shopping atrium illuminated by shifting ambient holographic projections",
      "a state-of-the-art performance hall featuring fully holographic artists",
      "a tranquil futuristic park glowing with bioluminescent plants and reflective surfaces"
    ],
    outfits: [
      "an ethereal iridescent layered outfit that ripples with movement",
      "a reflective gradient-toned suit that mimics liquid metal",
      "a semi-transparent glowing ensemble emitting a soft internal radiance"
    ],
    accessories: [
      "a delicate holographic pendant that refracts light",
      "minimalist transparent armbands with clean futuristic lines",
      "subtle shimmering accent details layered for depth"
    ]
  }
};

const getRandomElement = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

const generateDynamicPrompt = (
  theme: string,
  era: "1970s" | "2070s"
): string => {
  const key = `${era} ${theme}` as keyof typeof themeVariants;
  const variants = themeVariants[key];

  if (!variants) {
    throw new Error(`Variants for theme "${key}" not found.`);
  }

  const background = getRandomElement(variants.backgrounds);
  const outfit = getRandomElement(variants.outfits);
  const accessory = getRandomElement(variants.accessories);

  let prompt = `${BASE_PROMPT_PRE} Your task is to place them into a high-fashion photoshoot inspired by the ${era} ${theme} aesthetic. `;
  prompt += `Dress them in cohesive, stylish, gender-neutral high-fashion attire, specifically a ${outfit} accessorized with a ${accessory}. `;
  prompt += `The setting is a ${background}. `;

  if (era === "1970s") {
    prompt += `The lighting should be soft and warm, reminiscent of vintage film photography. The final image should have the distinct look of an aged photograph with subtle film grain, capturing a nostalgic vibe.`;
  } else {
    // 2070s
    prompt += `The lighting should be clean and sharp, highlighting the details of the fashion and technology. The final image should look like a professional, polished fashion photo from a futuristic editorial.`;
  }

  return prompt;
};

export const keywordMap = {
  Bold: { "1970s": { Funk: 3, Disco: 1 }, "2070s": { Cyberpunk: 2 } },
  Creative: { "1970s": { Bohemian: 3 }, "2070s": { Holographic: 2, Y3K: 1 } },
  Dreamy: { "1970s": { Hippy: 3, Bohemian: 1 }, "2070s": { Holographic: 2 } },
  Glam: { "1970s": { Disco: 3, Funk: 1 }, "2070s": { Holographic: 2 } },
  Calm: { "1970s": { Hippy: 3, Bohemian: 1 }, "2070s": { Y3K: 2 } },
  Vibrant: { "1970s": { Funk: 3, Disco: 1 }, "2070s": { Cyberpunk: 2 } },
  Expressive: {
    "1970s": { Bohemian: 3, Funk: 1 },
    "2070s": { Holographic: 2 },
  },
  Rebellious: { "1970s": { Funk: 3, Hippy: 1 }, "2070s": { Cyberpunk: 2 } },
  Visionary: { "1970s": { Bohemian: 3 }, "2070s": { Y3K: 2, Holographic: 1 } },
  Analytical: { "1970s": {}, "2070s": { Cyborg: 3, Y3K: 2 } },
  Techy: { "1970s": {}, "2070s": { Cyborg: 3, Cyberpunk: 2, Y3K: 1 } },
  Luminous: { "1970s": { Disco: 1 }, "2070s": { Holographic: 3, Y3K: 1 } },
  Soulful: { "1970s": { Hippy: 3, Bohemian: 2 }, "2070s": { Y3K: 1 } },
  Confident: { "1970s": { Disco: 3, Funk: 1 }, "2070s": { Cyberpunk: 2 } },
};

export const retroThemes = ["Hippy", "Bohemian", "Funk", "Disco"];
export const futureThemes = ["Y3K", "Cyberpunk", "Holographic", "Cyborg"];

export const generateFashionImage = async (
  base64ImageData: string,
  theme: string
): Promise<string> => {
  const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  });

  const era = retroThemes.includes(theme) ? "1970s" : "2070s";
  const selectedPrompt = generateDynamicPrompt(theme, era as "1970s" | "2070s");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64ImageData,
            mimeType: "image/jpeg",
          },
        },
        {
          text: selectedPrompt,
        },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData
  );
  if (imagePart && imagePart.inlineData) {
    return imagePart.inlineData.data;
  }

  throw new Error("No image was generated by the API.");
};
