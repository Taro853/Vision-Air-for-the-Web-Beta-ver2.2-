
export type ElementType = 'text' | 'rectangle' | 'circle' | 'triangle' | 'star' | 'diamond' | 'hexagon' | 'arrow' | 'bubble' | 'image' | 'table' | 'path';

export type AnimationType = 
  | 'none' 
  | 'fade-in' 
  | 'slide-up' 
  | 'slide-down' 
  | 'slide-left' 
  | 'slide-right' 
  | 'zoom-in' 
  | 'zoom-out'
  | 'pop'
  | 'rotate-in'
  | 'bounce-in'
  | 'flip-in-x'
  | 'flip-in-y'
  | 'rubber-band'
  | 'swing'
  | 'wobble';

export type AnimationEasing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier(0.175, 0.885, 0.32, 1.275)';

export interface TableData {
  rows: number;
  cols: number;
  data: string[][];
  hasHeader?: boolean;
}

export interface SlideElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content?: string;
  tableData?: TableData;
  pathData?: string; // For pen drawing
  animation?: {
    type: AnimationType;
    duration: number;
    delay: number;
    step?: number;
    easing?: AnimationEasing;
    loop?: boolean;
  };
  style: {
    backgroundColor?: string;
    gradient?: string;
    gradientType?: 'linear' | 'radial';
    gradientAngle?: number;
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'underline' | 'line-through';
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    writingMode?: 'horizontal-tb' | 'vertical-rl';
    
    // Borders & Outlines
    border?: string; 
    borderWidth?: number;
    borderColor?: string;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    borderRadius?: string;
    
    // Text Specific Extras
    outlineColor?: string;
    outlineWidth?: number;
    highlightColor?: string;
    highlightPadding?: number;
    padding?: number;
    
    // Effects
    opacity?: number;
    zIndex?: number;
    shadow?: boolean;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    
    // Blend & Glass
    mixBlendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion';
    backdropBlur?: number;
    
    // Filters
    filterBlur?: number;
    filterBrightness?: number;
    filterContrast?: number;
    filterGrayscale?: number;
    filterSepia?: number;
    filterSaturate?: number;
    filterHueRotate?: number;
    filterInvert?: number;

    // Image Specific
    objectFit?: 'cover' | 'contain' | 'fill';
    maskImage?: string;
    
    // Table specific
    cellPadding?: number;
    cellPaddingX?: number;
    cellPaddingY?: number;
    headerColor?: string;
    headerTextColor?: string;
    stripeColor?: string;
    tableStriped?: boolean;
    tableBorderCollapse?: 'collapse' | 'separate';
    tableShowGrid?: boolean;
    
    // Advanced Text
    textShadow?: string;
    WebkitTextStroke?: string;
    backgroundClip?: string;
    WebkitBackgroundClip?: string;
    WebkitTextFillColor?: string;
    letterSpacing?: string;
    lineHeight?: string;
    borderBottom?: string;
    
    // WordArt Special
    wordArtId?: string;
    
    // Transform Extras
    transform?: string;
    skewX?: number;
    skewY?: number;
    flipX?: boolean;
    flipY?: boolean;

    // Shape Specific Details (Arrow, Bubble)
    shapeDetail1?: number; // e.g., Arrow Head Size, Bubble Tail X
    shapeDetail2?: number; // e.g., Arrow Shaft Width, Bubble Tail Y
    
    // Path Specific
    strokeLinecap?: 'butt' | 'round' | 'square';
    strokeLinejoin?: 'round' | 'bevel' | 'miter';
  };
  locked?: boolean;
}

export interface Slide {
  id: string;
  elements: SlideElement[];
  background: string;
  backgroundGradient?: string;
  notes?: string;
  themeColors?: string[];
}

export interface Project {
  id: string;
  name: string;
  width: number;
  height: number;
  createdAt: number;
  lastModified: number;
  slides: Slide[];
  thumbnail?: string;
  themeId?: string;
  isDeleted?: boolean;
  isFavorite?: boolean; // New Property
}

export interface LicenseFeatures {
    aiGeneration: boolean;
    exportPptx: boolean;
    cloudSync: boolean;
    advancedEditing: boolean;
}

export interface UserProfile {
  name: string;
  avatar?: string;
  role: string;
  usageGoal: string;
  appTheme: 'classic' | 'modern' | 'dark';
  fontPairing: 'sans' | 'serif' | 'modern';
  aiCreativity: 'low' | 'medium' | 'high';
  customPalette?: string[];
  isSetup: boolean;
  licenseKey?: string; 
  plan?: 'express-suite' | 'express-pro' | 'enterprise' | 'academic' | 'free' | 'pro' | 'express'; // Legacy 'pro'/'express' kept for compatibility
  features?: LicenseFeatures; // 機能制限フラグ
}

export interface LicenseData {
  key: string;
  maxDevices: number;
  currentUsage: number;
  boundAccounts: string[];
  isActive: boolean;
  createdAt: number;
  plan: 'express-suite' | 'express-pro' | 'enterprise' | 'academic'; 
  ownerName?: string; // 所有者名
  features?: LicenseFeatures; // エンタープライズ用機能設定
  expiryDate?: number; // 有効期限 (タイムスタンプ), undefinedなら無期限
}

export interface AppSettings {
  language: 'ja' | 'en';
  autoSave: boolean;
  undoHistoryLimit: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showRuler: boolean;
  defaultSlideSize: '16:9' | '4:3' | '1:1' | 'A4';
  zoomStep: number;
  uiTheme: 'light' | 'dark' | 'system';
  canvasShadow: boolean;
  uiDensity: 'comfortable' | 'compact';
  toolbarPosition: 'top' | 'bottom';
  aiCreativity: 'low' | 'medium' | 'high';
  aiModel: 'gemini-2.5-flash';
  autoGenerateAltText: boolean;
  suggestDesign: boolean;
  exportQuality: 'high' | 'medium' | 'low';
  includeNotesInExport: boolean;
  autoPlayDelay: number;
  transitionDefault: AnimationType;
  showPointer: boolean;
  enableLaserPointer: boolean;
  workspaceBackground: 'gray' | 'dark' | 'white' | 'dots'; 
}

export const APP_CONSTANTS = {
    HISTORY_LIMIT: 50,
    DEFAULT_SLIDE_DURATION: 0.5,
    ANIMATION_DELAY_STEP: 0.1,
    CANVAS_PADDING: 40,
};

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'ja',
  autoSave: true,
  undoHistoryLimit: 50,
  showGrid: true,
  snapToGrid: true,
  gridSize: 20,
  showRuler: false,
  defaultSlideSize: '16:9',
  zoomStep: 10,
  uiTheme: 'light',
  canvasShadow: true,
  uiDensity: 'comfortable',
  toolbarPosition: 'top',
  aiCreativity: 'medium',
  aiModel: 'gemini-2.5-flash',
  autoGenerateAltText: true,
  suggestDesign: true,
  exportQuality: 'high',
  includeNotesInExport: false,
  autoPlayDelay: 5,
  transitionDefault: 'fade-in',
  showPointer: false,
  enableLaserPointer: true,
  workspaceBackground: 'gray',
};
