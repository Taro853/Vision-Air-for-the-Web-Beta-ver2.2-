
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Slide, SlideElement } from "../types";

const DEFAULT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-2.5-flash-image";
const PRO_IMAGE_MODEL = "gemini-3-pro-image-preview";

// --- Cost Management / Rate Limiting ---
const STORAGE_USAGE_KEY = 'vision_air_ai_usage';
const DAILY_LIMIT = 100; // 1日あたりのAI呼び出し上限回数

const checkRateLimit = (): boolean => {
    try {
        const today = new Date().toDateString();
        const usageData = localStorage.getItem(STORAGE_USAGE_KEY);
        let usage = usageData ? JSON.parse(usageData) : { date: today, count: 0 };

        // 日付が変わっていたらリセット
        if (usage.date !== today) {
            usage = { date: today, count: 0 };
        }

        if (usage.count >= DAILY_LIMIT) {
            console.warn("AI Usage limit reached for today.");
            return false;
        }
        
        return true;
    } catch (e) {
        return true; // エラー時はブロックしない（UX優先）
    }
};

const incrementUsage = () => {
    try {
        const today = new Date().toDateString();
        const usageData = localStorage.getItem(STORAGE_USAGE_KEY);
        let usage = usageData ? JSON.parse(usageData) : { date: today, count: 0 };

        if (usage.date !== today) {
            usage = { date: today, count: 0 };
        }
        
        usage.count += 1;
        localStorage.setItem(STORAGE_USAGE_KEY, JSON.stringify(usage));
    } catch (e) {
        console.error("Failed to update usage stats", e);
    }
};

export interface SlideGenerationSettings {
  topic: string;
  mood?: string;
  targetAudience?: string;
  colorScheme?: string;
  fontTheme?: string;
  includeShapes?: boolean;
  includeImages?: boolean;
  slideCount: number;
  useWebImages: boolean;
}

export interface DesignSystem {
    name: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
    };
    fontFamily: string;
    shapeStyle: {
        borderRadius: string;
        borderWidth: number;
        opacity: number;
        shadow: boolean;
    };
    backgroundGradient?: string;
}

export const ensureApiKey = async (): Promise<boolean> => {
    const w = window as any;
    if (w.aistudio && w.aistudio.hasSelectedApiKey) {
        const hasKey = await w.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await w.aistudio.openSelectKey();
            return await w.aistudio.hasSelectedApiKey(); 
        }
        return true;
    }
    return !!process.env.API_KEY;
};

const cleanJson = (text: string): string => {
  if (!text) return "[]";
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n|\n```$/g, "");
  }
  return cleaned;
};

// --- Design System Generation (v4 Upgrade) ---
export const generateDesignSystem = async (contentSummary: string): Promise<DesignSystem[]> => {
    if (!checkRateLimit()) return [];
    if (!process.env.API_KEY) return [];
    
    incrementUsage();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
    プレゼンテーションのコンテンツ内容: "${contentSummary}"
    この内容に最適なデザインシステムを3つ提案してください。
    
    1. Professional/Trust (信頼感)
    2. Modern/Creative (創造性)
    3. Bold/Impact (インパクト)
    
    各システムには、配色(hex)、フォント(Google Fonts互換名)、形状スタイル、背景を含めます。
    JSON形式で配列として返してください。
    `;

    try {
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            colors: {
                                type: Type.OBJECT,
                                properties: {
                                    primary: { type: Type.STRING },
                                    secondary: { type: Type.STRING },
                                    accent: { type: Type.STRING },
                                    background: { type: Type.STRING },
                                    text: { type: Type.STRING },
                                }
                            },
                            fontFamily: { type: Type.STRING },
                            shapeStyle: {
                                type: Type.OBJECT,
                                properties: {
                                    borderRadius: { type: Type.STRING },
                                    borderWidth: { type: Type.NUMBER },
                                    opacity: { type: Type.NUMBER },
                                    shadow: { type: Type.BOOLEAN },
                                }
                            },
                            backgroundGradient: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        
        return JSON.parse(cleanJson(response.text || "[]"));
    } catch (e) {
        console.error("Design system generation failed", e);
        return [];
    }
};

export const generateSlideContent = async (settings: SlideGenerationSettings): Promise<SlideElement[][]> => {
  if (!checkRateLimit()) {
      alert("本日のAI生成上限に達しました。明日またお試しください。");
      return [];
  }
  if (!process.env.API_KEY) {
    console.warn("API Key not found.");
    return [];
  }

  incrementUsage();
  let model = DEFAULT_MODEL;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const isSingle = settings.slideCount === 1;
  const imageInstruction = settings.includeImages
    ? "画像が必要な箇所には、type: 'image', content: 'placeholder' の要素を配置してください。画像の配置場所は視覚的なバランスを考慮してください。"
    : "画像要素は使用しないでください。";
    
  const shapeInstruction = settings.includeShapes
    ? "「Bento Grid」や「Glassmorphism」などのモダントレンドを取り入れ、矩形(rectangle)や円(circle)を装飾として背景やコンテンツの裏に効果的に配置してください。"
    : "";

  const prompt = `あなたは世界最高峰のアートディレクター兼プレゼンテーションデザイナーです。
  ユーザーのトピック: "${settings.topic}" に基づき、${isSingle ? "1枚の最高品質なスライド" : `${settings.slideCount}枚のストーリー性のあるプレゼンテーション`}を作成してください。
  
  【デザイン要件】
  - 雰囲気: ${settings.mood || 'プロフェッショナルかつ洗練された'}
  - ターゲット: ${settings.targetAudience || '一般'}
  - キャンバス: 960x540
  
  【重要: デザイン品質の向上】
  1. **脱・箇条書き**: 単なるテキストの羅列は禁止です。視覚的な階層構造を作ってください。
  2. **タイポグラフィ**: タイトルは大きく(48px~72px)、太字で。本文は読みやすく(18px~24px)。
  3. **レイアウト**: 左右分割、グリッド配置、中央集中型など、スライドごとにレイアウトを大胆に変えてください。
  
  【要素の指示】
  - ${imageInstruction}
  - ${shapeInstruction}
  - テキストボックスには適切な余白(padding)を持たせてください。

  【出力形式】
  JSON形式の配列の配列 (SlideElement[][]) のみを返してください。
  `;

  try {
    const config: any = {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["text", "rectangle", "circle", "triangle", "star", "diamond", "hexagon", "arrow", "bubble", "image", "table"] },
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
                width: { type: Type.NUMBER },
                height: { type: Type.NUMBER },
                rotation: { type: Type.NUMBER },
                content: { type: Type.STRING },
                style: {
                  type: Type.OBJECT,
                  properties: {
                    backgroundColor: { type: Type.STRING },
                    gradient: { type: Type.STRING },
                    color: { type: Type.STRING },
                    fontSize: { type: Type.NUMBER },
                    fontFamily: { type: Type.STRING },
                    fontWeight: { type: Type.STRING },
                    textAlign: { type: Type.STRING },
                    borderRadius: { type: Type.STRING },
                    borderWidth: { type: Type.NUMBER },
                    borderColor: { type: Type.STRING },
                    opacity: { type: Type.NUMBER },
                    zIndex: { type: Type.NUMBER },
                    shadow: { type: Type.BOOLEAN },
                    shadowColor: { type: Type.STRING },
                    shadowBlur: { type: Type.NUMBER },
                    shadowOffsetX: { type: Type.NUMBER },
                    shadowOffsetY: { type: Type.NUMBER },
                    highlightColor: { type: Type.STRING },
                    writingMode: { type: Type.STRING },
                    padding: { type: Type.NUMBER },
                    letterSpacing: { type: Type.STRING },
                    lineHeight: { type: Type.STRING },
                  }
                }
              },
              required: ["type", "x", "y", "width", "height"]
            }
          }
        }
    };

    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: prompt }] }],
      config: config
    });

    const text = response.text || "[]";
    const rawData = JSON.parse(cleanJson(text));
    
    return rawData.map((slideElements: any[], sIdx: number) => {
        return slideElements.map((item: any, index: number) => ({
            id: `gen-${Date.now()}-${sIdx}-${index}`,
            type: item.type,
            x: Math.min(900, Math.max(0, item.x)),
            y: Math.min(500, Math.max(0, item.y)),
            width: item.width,
            height: item.height,
            rotation: item.rotation || 0,
            content: item.content || "",
            style: {
                ...item.style,
                fontSize: item.type === 'text' ? (item.style?.fontSize || 18) : undefined,
                zIndex: item.type === 'text' ? 10 + index : index, 
                fontFamily: item.style?.fontFamily || '"Noto Sans JP", sans-serif'
            },
            animation: { type: 'fade-in', duration: 0.8, delay: index * 0.1 }
        }));
    });

  } catch (error) {
    console.error("Gemini generation failed:", error);
    return [];
  }
};

export const generateImagePromptFromContext = async (slideElements: SlideElement[]): Promise<string> => {
    if (!checkRateLimit()) return "Abstract background";
    if (!process.env.API_KEY) return "Abstract professional background";
    incrementUsage();
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const textContent = slideElements.filter(e => e.type === 'text').map(e => e.content).join(" ");
    const prompt = `以下のスライド内容に最も適した、プレゼンテーション用の高品質な画像生成プロンプト(英語)を作成してください。
    内容: "${textContent.substring(0, 500)}"
    要件: フォトリアル、高解像度、プロフェッショナル、アスペクト比16:9に適した構図。
    出力: プロンプトの文字列のみ。`;

    try {
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: [{ parts: [{ text: prompt }] }]
        });
        return response.text?.trim() || "Modern business presentation background";
    } catch (e) {
        return "Modern business presentation background";
    }
};

export const generateSpeakerNotes = async (slideTextContent: string): Promise<string> => {
    if (!checkRateLimit()) return "※利用上限に達したため生成できませんでした。";
    if (!process.env.API_KEY) return "";
    incrementUsage();

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `以下のスライド内容に基づいて、発表者が話すための原稿（スピーカーノート）を作成してください。約1分。
    Markdown形式で、読みやすく構造化してください。
    スライド内容: ${slideTextContent}`;

    try {
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: [{ parts: [{ text: prompt }] }]
        });
        return response.text?.trim() || "";
    } catch (e) {
        return "";
    }
};

export const generateImage = async (prompt: string, usePro: boolean = false): Promise<string | null> => {
  if (!checkRateLimit()) return null;
  if (!process.env.API_KEY) return null;
  incrementUsage();

  let model = IMAGE_MODEL;
  if (usePro) {
      const hasKey = await ensureApiKey();
      if (hasKey) model = PRO_IMAGE_MODEL;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [{ text: prompt }] },
    });
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
};

export const completeText = async (currentText: string): Promise<string> => {
    if (!checkRateLimit()) return currentText;
    if (!process.env.API_KEY) return currentText;
    incrementUsage();

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const prompt = `
        あなたは優秀な編集者です。以下のテキストに対して指定された変更を行ってください。
        入力: "${currentText}"
        制約: 出力結果の文字列のみを返してください。挨拶や説明は不要です。
        `;
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: [{ parts: [{ text: prompt }] }],
        });
        return response.text?.trim() || currentText;
    } catch (e) { return currentText; }
};

export const suggestSlideLayout = async (elements: SlideElement[]): Promise<SlideElement[]> => {
    if (!checkRateLimit()) return elements;
    if (!process.env.API_KEY || elements.length === 0) return elements;
    incrementUsage();

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Simplify payload
    const simplifiedEls = elements.map(e => ({
        id: e.id, type: e.type, content: e.content?.substring(0, 30),
        width: e.width, height: e.height, style: { fontSize: e.style.fontSize, textAlign: e.style.textAlign }
    }));

    const prompt = `
    あなたは「デザインアイデア (Design Ideas)」エンジンです。以下のスライド要素を分析し、プロの「デザイン4原則（近接、整列、反復、対比）」に基づいて、劇的にレイアウトを改善してください。
    
    【入力要素】
    ${JSON.stringify(simplifiedEls)}
    
    【キャンバス】960 x 540
    
    【指示】
    1. **画像の扱い**: 画像がある場合、全画面背景、左右分割（スプリットスクリーン）、カード型などを検討してください。
    2. **テキストの整列**: タイトルと本文の階層を明確にし、左揃えや中央揃えを適切に使い分けてください。
    3. **余白**: 要素間の余白（マージン）を十分に取り、窮屈にならないようにしてください。
    4. **装飾**: 必要であれば、要素の背面にある矩形(rectangle)などの位置を調整して、テキストの可読性を高めてください。
    
    【出力】
    要素のIDをキーとし、更新すべきプロパティ(x, y, width, height, styleの一部)を含むJSON配列のみを返してください。
    `;

    try {
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: [{ parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json" }
        });
        
        const layoutData = JSON.parse(cleanJson(response.text || "[]"));
        
        return elements.map(el => {
            const update = layoutData.find((u: any) => u.id === el.id);
            if (update) {
                return {
                    ...el,
                    x: update.x ?? el.x,
                    y: update.y ?? el.y,
                    width: update.width ?? el.width,
                    height: update.height ?? el.height,
                    style: { ...el.style, ...update.style }
                };
            }
            return el;
        });
    } catch (e) {
        console.error("Layout suggestion failed", e);
        return elements;
    }
};

// ... (chatWithVisiot and tools definitions remain the same)
const tools: FunctionDeclaration[] = [
    { name: "changeTheme", description: "Change slide theme/color.", parameters: { type: Type.OBJECT, properties: { themeType: { type: Type.STRING, enum: ["dark", "light", "orange", "blue", "ocean", "sunset", "forest", "midnight"] } }, required: ["themeType"] } },
    { name: "addSlide", description: "Add a new slide.", parameters: { type: Type.OBJECT, properties: { layout: { type: Type.STRING } }, required: [] } },
    { name: "optimizeLayout", description: "Optimize the current slide layout (alignment, spacing).", parameters: { type: Type.OBJECT, properties: {}, required: [] } },
    { name: "suggestLayout", description: "Suggest and apply a better layout for current content.", parameters: { type: Type.OBJECT, properties: { layoutType: { type: Type.STRING, enum: ["two-col", "grid", "hero", "list"] } }, required: ["layoutType"] } },
    { name: "generateSpeakerNotes", description: "Generate speaker notes for the current slide.", parameters: { type: Type.OBJECT, properties: {}, required: [] } },
    { name: "createShape", description: "Create a new shape element.", parameters: { type: Type.OBJECT, properties: { shapeType: { type: Type.STRING }, color: { type: Type.STRING } }, required: ["shapeType"] } },
    { name: "createImage", description: "Generate or add an image.", parameters: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING } }, required: ["prompt"] } },
    { name: "addTable", description: "Add a table.", parameters: { type: Type.OBJECT, properties: { rows: { type: Type.NUMBER }, cols: { type: Type.NUMBER } }, required: ["rows", "cols"] } },
    { name: "updateElementText", description: "Update text content.", parameters: { type: Type.OBJECT, properties: { newText: { type: Type.STRING } }, required: ["newText"] } },
    { name: "rewriteText", description: "Rewrite text (formal, casual, summarize).", parameters: { type: Type.OBJECT, properties: { style: { type: Type.STRING, enum: ["formal", "casual", "summary", "bullet"] } }, required: ["style"] } },
    { name: "changeFont", description: "Change font family.", parameters: { type: Type.OBJECT, properties: { fontName: { type: Type.STRING } }, required: ["fontName"] } },
    { name: "applyWordArt", description: "Apply a complex WordArt style.", parameters: { type: Type.OBJECT, properties: { styleId: { type: Type.STRING } }, required: ["styleId"] } },
    { name: "changeElementColor", description: "Change element color.", parameters: { type: Type.OBJECT, properties: { color: { type: Type.STRING } }, required: ["color"] } },
    { name: "setGradient", description: "Apply gradient background.", parameters: { type: Type.OBJECT, properties: { gradient: { type: Type.STRING } }, required: ["gradient"] } },
    { name: "styleShape", description: "Apply style to shape (shadow, roundness).", parameters: { type: Type.OBJECT, properties: { shadow: { type: Type.BOOLEAN }, roundness: { type: Type.NUMBER } }, required: [] } },
    { name: "styleImage", description: "Apply style to image (filter, frame).", parameters: { type: Type.OBJECT, properties: { filter: { type: Type.STRING }, frame: { type: Type.STRING } }, required: [] } },
    { name: "deleteElement", description: "Delete selected element.", parameters: { type: Type.OBJECT, properties: {}, required: [] } },
    { name: "alignElements", description: "Align selected elements.", parameters: { type: Type.OBJECT, properties: { alignment: { type: Type.STRING, enum: ["left", "center", "right", "top", "middle", "bottom", "distribute-h", "distribute-v"] } }, required: ["alignment"] } },
    { name: "applyAnimation", description: "Apply animation to element.", parameters: { type: Type.OBJECT, properties: { animationType: { type: Type.STRING } }, required: ["animationType"] } },
    { name: "suggestAnimation", description: "Suggest and apply animations for all elements.", parameters: { type: Type.OBJECT, properties: {}, required: [] } },
];

export const chatWithVisiot = async (
  history: {role: string, parts: {text: string}[]}[], 
  userMessage: string, 
  currentSlideContext: Slide,
  userName: string,
  selectedElement: SlideElement | null
): Promise<{ text: string, functionCall?: any }> => {
  if (!checkRateLimit()) return { text: "本日のAI利用上限に達しました。コスト管理のため、明日以降にご利用ください。" };
  if (!process.env.API_KEY) return { text: "API Keyが設定されていません。" };
  
  incrementUsage();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const elementContext = selectedElement 
    ? `現在選択中の要素: Type=${selectedElement.type}, Content="${selectedElement.content}", Style=${JSON.stringify(selectedElement.style)}`
    : "現在選択中の要素: なし";

  const systemInstruction = `
    あなたの名前は「Visiot (ビジオット)」です。ユーザー名: ${userName}。
    あなたは世界最高峰のプレゼンテーションデザインAIアシスタントですが、同時に親切で知識豊富なパートナーでもあります。
    
    【現在の状況】
    ${elementContext}
    スライド要素数: ${currentSlideContext.elements.length}
    スライド背景: ${currentSlideContext.background}
    
    【役割と振る舞い】
    1. **デザイン提案・操作**: スライド作成に関する指示（「青にして」「画像を追加して」）には、Tool(Function)を使用して的確に応えます。
    2. **一般的な質問への対応**: ユーザーがスライド作成と直接関係のない質問（例：「甲府駅の住所は？」「今日の天気は？」）をした場合も、**拒否せずに親切に回答してください**。
       - **重要**: 回答した後、可能であれば「この情報をスライドに追加しましょうか？」や「この場所の地図画像を生成しますか？」のように、プレゼンテーション作成に結びつく提案を付け加えてください。
    3. **ポジティブな姿勢**: 常に肯定的で、クリエイティブな提案を行います。

    【重要: 出力スタイル】
    - 回答はMarkdown形式を使用し、**太字**、リスト、コードブロックなどを活用して見やすく整形してください。
    - 操作が必要な場合は必ず対応するFunctionを呼び出してください。
  `;

  const chat = ai.chats.create({
    model: DEFAULT_MODEL,
    config: {
      systemInstruction: systemInstruction,
      tools: [{ functionDeclarations: tools }]
    },
    history: history.map(h => ({ role: h.role, parts: h.parts }))
  });

  try {
    const result = await chat.sendMessage({ message: userMessage });
    const calls = result.functionCalls;
    if (calls && calls.length > 0) {
        return { text: `承知しました。${calls[0].name} を実行します...`, functionCall: calls[0] };
    }
    return { text: result.text || "すみません、実行できる操作が見つかりませんでした。" };
  } catch (e) {
    console.error(e);
    return { text: "エラーが発生しました。" };
  }
};
