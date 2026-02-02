
import { Project, Slide, SlideElement, TableData } from '../types';

const createId = () => Math.random().toString(36).substr(2, 9);

// --- Element Helpers ---

const createRect = (x: number, y: number, w: number, h: number, color: string, radius: string = '0px', opacity: number = 1, rotation: number = 0): SlideElement => ({
    id: createId(), type: 'rectangle', x, y, width: w, height: h, rotation, content: '',
    style: { backgroundColor: color, borderRadius: radius, opacity, zIndex: 0 }
});

const createCircle = (x: number, y: number, size: number, color: string, opacity: number = 1): SlideElement => ({
    id: createId(), type: 'circle', x, y, width: size, height: size, rotation: 0, content: '',
    style: { backgroundColor: color, opacity, borderRadius: '50%', zIndex: 0 }
});

const createText = (content: string, x: number, y: number, w: number, h: number, fontSize: number, fontWeight: string, color: string, align: 'left' | 'center' | 'right' = 'left', extra: any = {}): SlideElement => ({
    id: createId(), type: 'text', x, y, width: w, height: h, rotation: 0, content, 
    style: { fontSize, fontWeight, color, textAlign: align, fontFamily: '"Noto Sans JP", sans-serif', zIndex: 10, ...extra }
});

const createTable = (x: number, y: number, w: number, h: number, rows: number, cols: number, bg: string, border: string, headerColor?: string): SlideElement => {
    const data: string[][] = Array(rows).fill(0).map((_, r) => Array(cols).fill(0).map((_, c) => r === 0 ? `項目 ${c+1}` : `データ ${r}-${c+1}`));
    return {
        id: createId(), type: 'table', x, y, width: w, height: h, rotation: 0, content: '',
        tableData: { rows, cols, data, hasHeader: true },
        style: { 
            backgroundColor: bg, borderColor: border, borderWidth: 1, 
            headerColor: headerColor || bg, fontSize: 14, color: '#333' 
        }
    };
};

const createPlaceholderImage = (x: number, y: number, w: number, h: number, label: string = 'Image'): SlideElement => ({
    id: createId(), type: 'image', x, y, width: w, height: h, rotation: 0, content: 'placeholder',
    style: { backgroundColor: '#f1f5f9', objectFit: 'cover', borderRadius: '4px', zIndex: 1 }
});

// --- Layout Generators ---

type LayoutType = 'title' | 'agenda' | 'content_left' | 'content_right' | 'three_col' | 'big_statement' | 'chart' | 'comparison' | 'team' | 'grid' | 'thank_you' | 'ringi' | 'report_summary';

interface SlideConfig {
    title: string;
    subtitle?: string;
    layout: LayoutType;
}

interface TemplateTheme {
    bg: string;
    primary: string;
    secondary: string;
    text: string;
    sub: string;
    accent: string;
    font: string;
    decor: string;
}

const generateDecor = (theme: TemplateTheme, slideIdx: number): SlideElement[] => {
    const els: SlideElement[] = [];
    const { primary, secondary, accent, decor } = theme;

    if (decor === 'tech') {
        els.push(createRect(0, 0, 960, 6, primary));
        els.push(createRect(0, 534, 960, 6, secondary));
    } else if (decor === 'clean-jp') {
        els.push(createRect(40, 80, 880, 1, `${primary}40`));
    } else if (decor === 'solid-bar') {
        els.push(createRect(0, 40, 20, 500, primary));
    }
    return els;
};

const generateSlideElements = (config: SlideConfig, theme: TemplateTheme, idx: number): SlideElement[] => {
    const els: SlideElement[] = [...generateDecor(theme, idx)];
    const { title, subtitle, layout } = config;
    const { primary, text, sub, accent, font } = theme;

    // Common Title logic
    if (layout !== 'title') {
        els.push(createText(title, 60, 30, 800, 50, 28, 'bold', primary, 'left', { fontFamily: font }));
    }

    switch (layout) {
        case 'title':
            els.push(createText(title, 80, 200, 800, 120, 64, 'bold', text, 'center', { fontFamily: font }));
            if (subtitle) els.push(createText(subtitle, 180, 340, 600, 60, 24, 'normal', sub, 'center'));
            break;

        case 'ringi': // 稟議書スタイル
            els.push(createTable(60, 100, 840, 400, 5, 2, '#fff', '#000', '#f0f0f0'));
            const table = els[els.length-1];
            if(table.tableData) {
                table.tableData.data = [
                    ["件名", "新規プロジェクトの件"],
                    ["目的", "市場シェアの拡大のため"],
                    ["期間", "2024年4月1日 〜 2025年3月31日"],
                    ["予算", "¥5,000,000"],
                    ["備考", "特になし"]
                ];
                table.tableData.hasHeader = false;
            }
            break;

        case 'report_summary': // 報告書サマリー
            els.push(createText("■ 概要", 60, 100, 800, 30, 18, 'bold', text));
            els.push(createText("本四半期の売上は前年同期比120%を達成しました。", 60, 140, 840, 60, 16, 'normal', text));
            els.push(createText("■ 詳細データ", 60, 220, 800, 30, 18, 'bold', text));
            els.push(createTable(60, 260, 840, 200, 4, 4, '#fff', '#ccc', '#f8fafc'));
            break;

        case 'agenda':
            [0, 1, 2, 3].forEach(i => {
                els.push(createText(`0${i+1}`, 100, 150 + i * 80, 60, 50, 36, 'bold', `${primary}40`, 'right'));
                els.push(createText(`議題 ${i+1}`, 180, 155 + i * 80, 600, 40, 24, 'bold', text, 'left'));
                els.push(createRect(180, 200 + i * 80, 600, 1, `${sub}30`));
            });
            break;
            
        case 'content_left':
            els.push(createText("ここに詳細な説明文を入力してください。\n箇条書きを使用すると読みやすくなります。", 60, 150, 400, 300, 18, 'normal', text, 'left', { lineHeight: '1.8' }));
            els.push(createPlaceholderImage(500, 150, 400, 300, 'Visual'));
            break;
    }

    return els;
};

// --- Definitions ---

const THEMES: Record<string, TemplateTheme> = {
    'jp-business': { bg: '#ffffff', primary: '#1e3a8a', secondary: '#93C5FD', text: '#333333', sub: '#666666', accent: '#dc2626', font: '"Noto Sans JP", sans-serif', decor: 'clean-jp' },
    'modern-blue': { bg: '#ffffff', primary: '#3B82F6', secondary: '#93C5FD', text: '#1E293B', sub: '#64748B', accent: '#2563EB', font: 'Inter', decor: 'tech' },
};

const SCENARIOS: Record<string, SlideConfig[]> = {
    'proposal': [
        { title: "企画提案書", subtitle: "2024年度 新規事業計画", layout: "title" },
        { title: "目次", layout: "agenda" },
        { title: "現状分析", layout: "report_summary" },
        { title: "提案内容", layout: "content_left" },
        { title: "予算・スケジュール", layout: "ringi" },
    ],
    'report': [
        { title: "月次報告書", subtitle: "2024年10月度", layout: "title" },
        { title: "ハイライト", layout: "report_summary" },
        { title: "詳細", layout: "content_left" },
    ]
};

// Generate list
const generatedTemplates: any[] = [];
Object.entries(THEMES).forEach(([themeKey, themeVal]) => {
    Object.entries(SCENARIOS).forEach(([scenKey, scenVal]) => {
        generatedTemplates.push({
            id: `${themeKey}-${scenKey}`,
            name: `${themeKey === 'jp-business' ? '日本式ビジネス' : 'モダン'} - ${scenKey === 'proposal' ? '企画書' : '報告書'}`,
            theme: themeVal,
            scenarioKey: scenKey 
        });
    });
});

export const TEMPLATES: Project[] = generatedTemplates.map(t => {
    const configList = SCENARIOS[t.scenarioKey];
    const slides: Slide[] = configList.map((cfg, idx) => ({
        id: createId(),
        background: t.theme.bg,
        elements: generateSlideElements(cfg, t.theme, idx),
        themeColors: [t.theme.primary, t.theme.accent, t.theme.secondary]
    }));

    return {
        id: t.id,
        name: t.name,
        width: 960,
        height: 540,
        createdAt: Date.now(),
        lastModified: Date.now(),
        slides: slides
    };
});
