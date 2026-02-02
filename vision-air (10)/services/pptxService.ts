
import pptxgen from "pptxgenjs";
import { Project, Slide, SlideElement } from "../types";

// ピクセルからインチへの変換係数 (96dpiを想定)
const PX_TO_INCH = 1 / 96;

export const exportToPptx = async (project: Project) => {
  try {
    const pptx = new pptxgen();
    
    // プロジェクトメタデータ設定
    pptx.title = project.name || "Untitled Presentation";
    pptx.subject = "Vision Air Presentation";
    
    // スライドサイズ設定 (Vision Airのデフォルトは 960x540 (16:9))
    pptx.defineLayout({ name: 'CUSTOM', width: project.width * PX_TO_INCH, height: project.height * PX_TO_INCH });
    pptx.layout = 'CUSTOM';

    for (const slide of project.slides) {
      const pSlide = pptx.addSlide();
      
      // 背景色設定 (安全なアクセス)
      if (slide.background) {
        pSlide.background = { color: slide.background.replace('#', '') };
      } else {
        pSlide.background = { color: 'FFFFFF' };
      }

      // ノート
      if (slide.notes) {
          pSlide.addNotes(slide.notes);
      }

      // 要素のレンダリング
      const sortedElements = [...slide.elements].sort((a, b) => (a.style.zIndex || 0) - (b.style.zIndex || 0));

      for (const el of sortedElements) {
        const x = (el.x || 0) * PX_TO_INCH;
        const y = (el.y || 0) * PX_TO_INCH;
        const w = (el.width || 100) * PX_TO_INCH;
        const h = (el.height || 100) * PX_TO_INCH;
        
        const commonProps = {
            x, y, w, h,
            rotate: el.rotation || 0,
        };

        const safeColor = (color?: string, def = '000000') => color ? color.replace('#', '') : def;

        if (el.type === 'text') {
          const alignMap: Record<string, 'left'|'center'|'right'|'justify'> = {
              'left': 'left', 'center': 'center', 'right': 'right', 'justify': 'justify'
          };
          
          const cleanText = el.content?.replace(/<[^>]*>/g, '') || '';
          
          pSlide.addText(cleanText, {
              ...commonProps,
              color: safeColor(el.style.color, '334155'),
              fontSize: (el.style.fontSize || 16) * 0.75,
              bold: el.style.fontWeight === 'bold' || el.style.fontWeight === '700' || el.style.fontWeight === '900',
              italic: el.style.fontStyle === 'italic',
              underline: el.style.textDecoration?.includes('underline'),
              align: alignMap[el.style.textAlign || 'left'] || 'left',
              fontFace: 'Arial',
              // 背景色が透明でない場合のみfillを設定
              fill: (el.style.backgroundColor && el.style.backgroundColor !== 'transparent') ? { color: safeColor(el.style.backgroundColor) } : undefined,
          });
        } else if (el.type === 'image') {
            if (el.content && el.content !== 'placeholder' && el.content.startsWith('data:image')) {
                pSlide.addImage({
                    data: el.content,
                    ...commonProps,
                    sizing: { type: 'contain', w, h }
                });
            } else if (el.type === 'image') {
                // プレースホルダーまたは画像なしの場合、枠を表示
                pSlide.addShape(pptx.ShapeType.rect, {
                    ...commonProps,
                    fill: { color: 'F1F5F9' },
                    line: { color: 'CBD5E1', width: 1, dashType: 'dash' }
                });
                pSlide.addText("Image", { ...commonProps, align: 'center', color: '94A3B8', fontSize: 10 });
            }
        } else if (el.type === 'rectangle') {
            pSlide.addShape(pptx.ShapeType.rect, {
                ...commonProps,
                fill: { color: safeColor(el.style.backgroundColor, 'CCCCCC'), transparency: (1 - (el.style.opacity ?? 1)) * 100 },
                line: el.style.borderWidth ? { color: safeColor(el.style.borderColor, '000000'), width: el.style.borderWidth } : undefined
            });
        } else if (el.type === 'circle') {
            pSlide.addShape(pptx.ShapeType.ellipse, {
                ...commonProps,
                fill: { color: safeColor(el.style.backgroundColor, 'CCCCCC'), transparency: (1 - (el.style.opacity ?? 1)) * 100 },
                line: el.style.borderWidth ? { color: safeColor(el.style.borderColor, '000000'), width: el.style.borderWidth } : undefined
            });
        } else if (el.type === 'triangle') {
             pSlide.addShape(pptx.ShapeType.triangle, {
                ...commonProps,
                fill: { color: safeColor(el.style.backgroundColor, 'CCCCCC'), transparency: (1 - (el.style.opacity ?? 1)) * 100 },
            });
        } else if (el.type === 'table' && el.tableData) {
            const rows = el.tableData.data.map((rowArr) => {
                return rowArr.map(cellText => ({
                    text: cellText,
                    options: {
                        fill: el.style.backgroundColor ? safeColor(el.style.backgroundColor) : undefined,
                        color: safeColor(el.style.color, '000000'),
                        border: { pt: el.style.borderWidth || 1, color: safeColor(el.style.borderColor, '000000') }
                    }
                }));
            });
            pSlide.addTable(rows, {
                ...commonProps,
                colW: w / (el.tableData.cols || 1)
            });
        }
      }
    }

    // ファイル生成と保存
    await pptx.writeFile({ fileName: `${project.name || 'presentation'}.pptx` });
  } catch (error) {
    console.error("PPTX Export Error:", error);
    throw error;
  }
};
