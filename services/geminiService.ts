import { GoogleGenAI, Modality } from "@google/genai";

const BASE_PROMPT_PRE = `Generate a new image in a vertical, portrait aspect ratio (9:16). The main subject's face must be centrally composed and fully visible within the frame, ensuring it is not cut off at the edges. Analyze the person or people in this photo. It is absolutely crucial that the final image contains the exact same number of people as the original photo; do not add or remove anyone. You must retain ALL of each person's original features, including their face, skin tone, and gender presentation. Pay special attention to the hair; the hairstyle and hair color for every person must be preserved *exactly* as they appear in the original photo. Do NOT alter their facial features or makeup. The only changes should be to their clothing and the background scene. The final image must not contain any text, logos, or words.`;

const themeVariants = {
    "1970s Disco": {
      backgrounds: [
        "a vibrant nightclub with a sparkling disco ball and neon lights",
        "a retro roller rink with a brightly lit, flashing floor",
        "a glamorous city street at night with vintage cars reflecting the city lights"
      ],
      outfits: [
        "a dazzling sequined jumpsuit with dramatic flared legs",
        "a chic metallic halter top paired with high-waisted, wide-leg pants",
        "a shimmering, shiny wrap dress that catches the light"
      ],
      accessories: [
        "bold, oversized hoop earrings",
        "a chunky, eye-catching statement necklace",
        "sky-high platform heels"
      ]
    },
    "1970s Funk": {
      backgrounds: [
        "an urban city street with vibrant, colorful graffiti murals",
        "a lively music stage with dramatic, bright spotlights",
        "a cool, retro-style room with a shag carpet and bold, funky furniture"
      ],
      outfits: [
        "a brightly colored suit with flamboyant wide-leg pants",
        "a groovy patterned shirt with a large collar and classic bell-bottoms",
        "a bold-print dress cinched with a wide statement belt"
      ],
      accessories: [
        "fashionable, oversized sunglasses",
        "a stylish, wide-brimmed hat",
        "chunky, confidence-boosting platform shoes"
      ]
    },
    "1970s Bohemian": {
      backgrounds: [
        "a sun-drenched, airy room filled with lush plants and artistic macrame wall hangings",
        "a dreamy field of wildflowers during the golden hour of sunset",
        "a cozy and eclectic living room decorated with vintage textiles and artisan crafts"
      ],
      outfits: [
        "a comfortable linen outfit with elegant, layered drapes",
        "a unique patterned ensemble featuring intricate embroidery",
        "stylish, earth-tone attire with rich, woven textures"
      ],
      accessories: [
        "beautiful, unique handmade jewelry",
        "a chic, intricately woven bag",
        "a versatile and stylish fabric wrap"
      ]
    },
    "1970s Hippy": {
      backgrounds: [
        "a peaceful, serene meadow at sunset",
        "a bustling festival field dotted with tents and vibrant flags",
        "a relaxing beach bonfire scene at dusk"
      ],
      outfits: [
        "a classic tie-dye outfit made from soft, comfortable cotton",
        "a cool patchwork denim jacket paired with a fringed top",
        "light, airy woven clothing adorned with beads"
      ],
      accessories: [
        "iconic round sunglasses",
        "layers of colorful, beaded necklaces",
        "a collection of hand-woven bracelets"
      ]
    },
    "2070s Cyberpunk": {
      backgrounds: [
        "a futuristic city street with towering digital billboards and autonomous delivery drones",
        "a busy subway station filled with interactive holographic signage",
        "a high-tech café with efficient robotic servers and glowing tabletop screens"
      ],
      outfits: [
        "a functional techwear outfit with sleek, reflective seams",
        "a layered streetwear suit with sharp metallic trim",
        "a stylish, asymmetric jacket with glowing, integrated lines"
      ],
      accessories: [
        "a sophisticated digital wrist device",
        "cool, minimalist visor glasses",
        "a subtle, luminescent tattoo"
      ]
    },
    "2070s Cyborg": {
      backgrounds: [
        "a cutting-edge gym with advanced robotic trainers and interactive sensor walls",
        "a sterile, modern hospital lab with fully automated machines",
        "a minimalist office environment with AI-controlled workstations"
      ],
      outfits: [
        "a form-fitting biomechanical suit with polished alloy panels",
        "lightweight synthetic armor with soft, articulated plating",
        "a durable composite suit made with a carbon mesh"
      ],
      accessories: [
        "a slim, elegant neural interface band",
        "a non-intrusive mechanical limb piece",
        "a discreet, glowing light implant"
      ]
    },
    "2070s Y3K": {
      backgrounds: [
        "a sophisticated art gallery featuring interactive holographic art",
        "a luxurious airport lounge with self-moving chairs and smart windows",
        "a high-end storefront displaying floating, projected clothing"
      ],
      outfits: [
        "a sculptural, monochrome outfit with clean, architectural lines",
        "a minimal silver ensemble with precise, elegant folds",
        "structured attire made from a high-tech, matte fabric"
      ],
      accessories: [
        "bold, geometric jewelry",
        "a sleek, transparent visor",
        "a seamless, modern belt"
      ]
    },
    "2070s Holographic": {
      backgrounds: [
        "a grand mall atrium with shifting, ambient light projections",
        "a state-of-the-art concert hall with stunning holographic performers",
        "a serene park at night with glowing, bioluminescent plants"
      ],
      outfits: [
        "an ethereal, iridescent layered outfit that shimmers with movement",
        "a reflective suit with gradient tones that mimic liquid metal",
        "a semi-transparent attire that emits a soft, internal glow"
      ],
      accessories: [
        "a delicate holographic pendant",
        "minimalist, transparent armbands",
        "subtle, shimmering accent details"
      ]
    }
};

const getRandomElement = <T>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
};

const generateDynamicPrompt = (theme: string, era: '1970s' | '2070s'): string => {
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

    if (era === '1970s') {
        prompt += `The lighting should be soft and warm, reminiscent of vintage film photography. The final image should have the distinct look of an aged photograph with subtle film grain, capturing a nostalgic vibe.`
    } else { // 2070s
        prompt += `The lighting should be clean and sharp, highlighting the details of the fashion and technology. The final image should look like a professional, polished fashion photo from a futuristic editorial.`
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
  Expressive: { "1970s": { Bohemian: 3, Funk: 1 }, "2070s": { Holographic: 2 } },
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

export const generateFashionImage = async (base64ImageData: string, theme: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const era = retroThemes.includes(theme) ? '1970s' : '2070s';
    const selectedPrompt = generateDynamicPrompt(theme, era as '1970s' | '2070s');

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64ImageData,
                        mimeType: 'image/jpeg',
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

    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    if (imagePart && imagePart.inlineData) {
        return imagePart.inlineData.data;
    }

    throw new Error("No image was generated by the API.");
};