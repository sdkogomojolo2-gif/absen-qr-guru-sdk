import jsPDF from 'jspdf';
import { CardTemplateId, Student, SystemSettings } from '../types';

export type CardThemeId = 'wave' | 'geometric' | 'classic' | 'minimalist';
export type CardColorId = 'blue' | 'emerald' | 'ruby' | 'purple' | 'amber' | 'monochrome';
export type CardFontId = 'sans' | 'rounded' | 'serif' | 'mono';

export interface CardCustomizationOptions {
  theme: CardThemeId;
  color: CardColorId;
  font: CardFontId;
  templateId?: CardTemplateId;
  signatureType?: 'none' | 'qr_digital' | 'signature_stamp' | 'both';
  showSchoolLogo?: boolean;
}

export interface CardPresetTemplateDef {
  id: CardTemplateId;
  name: string;
  tagline: string;
  category: string;
  colorLabel: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  description: string;
  lanyardColor: string;
}

export const CARD_PRESET_TEMPLATES: Record<string, CardPresetTemplateDef> = {
  navy_gold: {
    id: 'navy_gold',
    name: 'Biru Navy & Emas (Resmi Kemdikbud)',
    tagline: 'Standar Nasional Resmi - Sangat Elegan & Rapi',
    category: 'Standar Nasional',
    colorLabel: 'Navy Blue & Gold Foil',
    primaryHex: '#0f2b5c',
    secondaryHex: '#c59b27',
    accentHex: '#1e3a8a',
    description: 'Format resmi standar Kemdikbud dengan logo Tut Wuri Handayani, pasfoto 3x4 berlis emas, susunan biodata rapi, QR presensi berbingkai fokus, dan stempel pengesahan kepala sekolah.',
    lanyardColor: '#0f2b5c',
  },
  emerald_gold: {
    id: 'emerald_gold',
    name: 'Zamrud Hijau & Emas (Klasik Prestise)',
    tagline: 'Nuansa Prestise Akademik - Berwibawa & Sejuk',
    category: 'Klasik Akademik',
    colorLabel: 'Forest Emerald & Champagne',
    primaryHex: '#064e3b',
    secondaryHex: '#d97706',
    accentHex: '#047857',
    description: 'Kombinasi hijau zamrud elegan dengan aksen lis emas, logo pendidikan Indonesia, struktur biodata rapi dengan kontras tinggi dan mudah terbaca scanner.',
    lanyardColor: '#064e3b',
  },
  modern_minimalis: {
    id: 'modern_minimalis',
    name: 'Modern Eksekutif (Slate & Biru Safir)',
    tagline: 'Gaya Kontemporer Rapi - Minimalis & Bersih',
    category: 'Modern Minimalis',
    colorLabel: 'Charcoal Slate & Sapphire',
    primaryHex: '#1e293b',
    secondaryHex: '#2563eb',
    accentHex: '#0f172a',
    description: 'Desain modern tanpa ornamen berlebih. Memiliki hierarki tipografi tajam, pasfoto dengan outline halus, QR code presisi tinggi, dan footer validitas yang tertata.',
    lanyardColor: '#1e293b',
  },
};

export const getCardPresetTemplate = (id?: string): CardPresetTemplateDef => {
  if (id === 'emerald_gold' || id === 'nusantara') return CARD_PRESET_TEMPLATES.emerald_gold;
  if (id === 'modern_minimalis' || id === 'pelita') return CARD_PRESET_TEMPLATES.modern_minimalis;
  return CARD_PRESET_TEMPLATES.navy_gold;
};

export interface ColorDef {
  id: CardColorId;
  name: string;
  primary: string;
  primaryRgb: [number, number, number];
  secondary: string;
  secondaryRgb: [number, number, number];
  light: string;
  lightRgb: [number, number, number];
  border: string;
  borderRgb: [number, number, number];
  darkText: string;
  bgBadge: string;
  photoBorder: string;
  dotColor: string;
  bgClass: string;
}

export const CARD_COLORS: Record<CardColorId, ColorDef> = {
  blue: {
    id: 'blue',
    name: 'Biru Samudra',
    primary: '#1e40af',
    primaryRgb: [30, 64, 175],
    secondary: '#2563eb',
    secondaryRgb: [37, 99, 235],
    light: '#93c5fd',
    lightRgb: [147, 197, 253],
    border: '#1e3a8a',
    borderRgb: [30, 58, 138],
    darkText: '#172554',
    bgBadge: '#eff6ff',
    photoBorder: '#38bdf8',
    dotColor: '#2563eb',
    bgClass: 'bg-blue-600',
  },
  emerald: {
    id: 'emerald',
    name: 'Hijau Zamrud',
    primary: '#065f46',
    primaryRgb: [6, 95, 70],
    secondary: '#059669',
    secondaryRgb: [5, 150, 105],
    light: '#6ee7b7',
    lightRgb: [110, 231, 183],
    border: '#064e3b',
    borderRgb: [6, 78, 59],
    darkText: '#022c22',
    bgBadge: '#ecfdf5',
    photoBorder: '#34d399',
    dotColor: '#059669',
    bgClass: 'bg-emerald-600',
  },
  ruby: {
    id: 'ruby',
    name: 'Merah Ruby',
    primary: '#991b1b',
    primaryRgb: [153, 27, 27],
    secondary: '#dc2626',
    secondaryRgb: [220, 38, 38],
    light: '#fca5a5',
    lightRgb: [252, 165, 165],
    border: '#7f1d1d',
    borderRgb: [127, 29, 29],
    darkText: '#450a0a',
    bgBadge: '#fef2f2',
    photoBorder: '#f87171',
    dotColor: '#dc2626',
    bgClass: 'bg-rose-600',
  },
  purple: {
    id: 'purple',
    name: 'Ungu Royal',
    primary: '#5b21b6',
    primaryRgb: [91, 33, 182],
    secondary: '#7c3aed',
    secondaryRgb: [124, 58, 237],
    light: '#c4b5fd',
    lightRgb: [196, 181, 253],
    border: '#4c1d95',
    borderRgb: [76, 29, 149],
    darkText: '#2e1065',
    bgBadge: '#faf5ff',
    photoBorder: '#a78bfa',
    dotColor: '#7c3aed',
    bgClass: 'bg-purple-600',
  },
  amber: {
    id: 'amber',
    name: 'Emas Mewah',
    primary: '#92400e',
    primaryRgb: [146, 64, 14],
    secondary: '#d97706',
    secondaryRgb: [217, 119, 6],
    light: '#fcd34d',
    lightRgb: [252, 211, 77],
    border: '#78350f',
    borderRgb: [120, 53, 15],
    darkText: '#451a03',
    bgBadge: '#fffbeb',
    photoBorder: '#fbbf24',
    dotColor: '#d97706',
    bgClass: 'bg-amber-600',
  },
  monochrome: {
    id: 'monochrome',
    name: 'Hitam Obsidian',
    primary: '#1e293b',
    primaryRgb: [30, 41, 59],
    secondary: '#475569',
    secondaryRgb: [71, 85, 105],
    light: '#cbd5e1',
    lightRgb: [203, 213, 225],
    border: '#0f172a',
    borderRgb: [15, 23, 42],
    darkText: '#020617',
    bgBadge: '#f8fafc',
    photoBorder: '#94a3b8',
    dotColor: '#475569',
    bgClass: 'bg-slate-800',
  },
};

export interface ThemeDef {
  id: CardThemeId;
  name: string;
  desc: string;
  icon: string;
}

export const CARD_THEMES: Record<CardThemeId, ThemeDef> = {
  wave: {
    id: 'wave',
    name: 'Ombak Topografi',
    desc: 'Kurva dinamis & garis kontur modern',
    icon: 'fa-solid fa-water',
  },
  geometric: {
    id: 'geometric',
    name: 'Geometris Tech',
    desc: 'Sudut poligon tajam & aksen futuristik',
    icon: 'fa-solid fa-shapes',
  },
  classic: {
    id: 'classic',
    name: 'Pita Emas Kerajaan',
    desc: 'Bingkai berornamen & medali kehormatan',
    icon: 'fa-solid fa-award',
  },
  minimalist: {
    id: 'minimalist',
    name: 'Modern Minimalis',
    desc: 'Garis strip samping & tampilan eksekutif',
    icon: 'fa-solid fa-bars-staggered',
  },
};

export interface FontDef {
  id: CardFontId;
  label: string;
  sublabel: string;
  tailwindClass: string;
  jsPdfFont: 'helvetica' | 'times' | 'courier';
}

export const CARD_FONTS: Record<CardFontId, FontDef> = {
  sans: {
    id: 'sans',
    label: 'Modern Sans',
    sublabel: 'Tegas, Bersih & Kontras Tinggi',
    tailwindClass: 'font-sans',
    jsPdfFont: 'helvetica',
  },
  rounded: {
    id: 'rounded',
    label: 'Rounded Modern',
    sublabel: 'Ramah, Segar & Dinamis',
    tailwindClass: 'font-sans tracking-tight',
    jsPdfFont: 'helvetica',
  },
  serif: {
    id: 'serif',
    label: 'Klasik Serif',
    sublabel: 'Resmi, Anggun & Berwibawa',
    tailwindClass: 'font-serif',
    jsPdfFont: 'times',
  },
  mono: {
    id: 'mono',
    label: 'Monospace Tech',
    sublabel: 'Presisi, Futuristik & Digital',
    tailwindClass: 'font-mono',
    jsPdfFont: 'courier',
  },
};

/**
 * Helper to draw Tut Wuri Handayani vector emblem in jsPDF
 */
function drawTutWuriHandayaniPDF(
  doc: jsPDF,
  cx: number,
  cy: number,
  r: number,
  primaryColor: [number, number, number],
  goldColor: [number, number, number]
) {
  // Circular frame background
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.setLineWidth(0.3);
  doc.circle(cx, cy, r, 'FD');

  // Wings / Garuda Shield
  doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.triangle(cx - r * 0.7, cy + r * 0.1, cx, cy - r * 0.4, cx + r * 0.7, cy + r * 0.1, 'F');

  // Open Book
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(cx - r * 0.45, cy + r * 0.1, r * 0.9, r * 0.35, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.15);
  doc.line(cx, cy + r * 0.1, cx, cy + r * 0.45);

  // Flame of Knowledge
  doc.setFillColor(220, 38, 38);
  doc.circle(cx, cy - r * 0.3, r * 0.2, 'F');
}

/**
 * Helper to draw realistic digital cursive signature in blue ink
 */
function drawDigitalSignaturePDF(doc: jsPDF, startX: number, baselineY: number) {
  doc.setDrawColor(30, 58, 138); // Navy ink
  doc.setLineWidth(0.3);
  doc.line(startX, baselineY + 1.5, startX + 3, baselineY - 2.5);
  doc.line(startX + 3, baselineY - 2.5, startX + 6, baselineY + 1.5);
  doc.line(startX + 6, baselineY + 1.5, startX + 10, baselineY - 3.2);
  doc.line(startX + 10, baselineY - 3.2, startX + 15, baselineY + 1);
  doc.line(startX + 15, baselineY + 1, startX + 22, baselineY - 1);
  doc.setLineWidth(0.2);
  doc.line(startX + 1, baselineY + 2.4, startX + 23, baselineY + 2);
}

/**
 * Draw official customizable student card in jsPDF with strict coordinate bounding
 * Formatted for standard portrait ID-1: width 53.98 mm x height 85.6 mm
 */
export const drawCustomizedCardPDF = (
  doc: jsPDF,
  x: number,
  y: number,
  cardWidth: number,
  cardHeight: number,
  student: Student,
  schoolName: string,
  photoDataUrl: string | undefined,
  qrDataUrl: string | undefined,
  options: CardCustomizationOptions,
  settings?: SystemSettings,
  schoolLogoDataUrl?: string,
  kepsekQrDataUrl?: string,
  kepsekSignatureDataUrl?: string,
  kabupatenLogoDataUrl?: string
) => {
  const rawTpl = options.templateId || settings?.defaultCardTemplate || 'navy_gold';
  let templateId = rawTpl;
  if (rawTpl === 'seraphic') templateId = 'navy_gold';
  if (rawTpl === 'nusantara') templateId = 'emerald_gold';
  if (rawTpl === 'pelita') templateId = 'modern_minimalis';

  const finalSchoolName = (schoolName || settings?.schoolName || 'SD INPRES 2 ULATAN').toUpperCase();
  const schoolCity = settings?.schoolCity || 'Paser';
  const schoolRegency = settings?.schoolRegency || (schoolCity ? `PEMERINTAH KABUPATEN ${schoolCity.toUpperCase()}` : 'PEMERINTAH KABUPATEN PASER');
  const schoolDepartment = settings?.schoolDepartment || 'DINAS PENDIDIKAN DAN KEBUDAYAAN';

  let cardTitle = settings?.cardTitle || 'KARTU IDENTITAS GURU & PRESENSI DIGITAL';
  if (/siswa|pelajar/i.test(cardTitle)) {
    cardTitle = 'KARTU IDENTITAS GURU & PRESENSI DIGITAL';
  }

  let cardValidityText = settings?.cardValidityText || 'KARTU RESMI GURU • BERLAKU SELAMA BERTUGAS';
  if (/siswa|pelajar/i.test(cardValidityText)) {
    cardValidityText = 'KARTU RESMI GURU • BERLAKU SELAMA BERTUGAS';
  }

  const headmasterName = settings?.headmasterName || 'Drs. H. Mulyadi, M.Pd';
  const headmasterNip = settings?.headmasterNip || '19680512 199403 1 005';
  const academicYear = settings?.academicYear || '2025/2026';

  // Theme palettes: professional, elegant, neat
  let primary: [number, number, number] = [15, 43, 92]; // Navy #0f2b5c
  let gold: [number, number, number] = [197, 155, 39]; // Gold #c59b27
  let darkText: [number, number, number] = [15, 23, 42];

  if (templateId === 'emerald_gold') {
    primary = [6, 78, 59]; // Forest Emerald #064e3b
    gold = [217, 119, 6]; // Amber Gold #d97706
    darkText = [6, 44, 34];
  } else if (templateId === 'modern_minimalis') {
    primary = [30, 41, 59]; // Slate #1e293b
    gold = [37, 99, 235]; // Royal Blue #2563eb
    darkText = [15, 23, 42];
  }

  // 1. Base White Card Body & Drop Shadow / Border
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, cardWidth, cardHeight, 2.5, 2.5, 'FD');

  // 2. Top Lanyard Punch Guide
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.18);
  doc.roundedRect(x + cardWidth / 2 - 4.5, y + 0.8, 9, 1.5, 0.75, 0.75, 'FD');

  // 3. Top Header Banner
  const headerTop = y + 2.8;
  const headerHeight = 12.2;
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(x, headerTop, cardWidth, headerHeight, 'F');

  // Logo Kiri Header: Logo Pemerintah Kabupaten (atau Tut Wuri jika belum diubah)
  const finalKabLogo =
    kabupatenLogoDataUrl ||
    (settings?.logoKabupatenUrl?.startsWith('data:image') ? settings.logoKabupatenUrl : undefined);

  const leftLogoSize = 7.6;
  const leftLogoX = x + 1.4;
  const leftLogoY = headerTop + (headerHeight - leftLogoSize) / 2;

  if (finalKabLogo) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(gold[0], gold[1], gold[2]);
      doc.setLineWidth(0.2);
      doc.circle(leftLogoX + leftLogoSize / 2, leftLogoY + leftLogoSize / 2, leftLogoSize / 2, 'FD');
      const format = finalKabLogo.includes('image/jpeg') || finalKabLogo.includes('image/jpg') ? 'JPEG' : 'PNG';
      doc.addImage(finalKabLogo, format, leftLogoX + 0.6, leftLogoY + 0.6, leftLogoSize - 1.2, leftLogoSize - 1.2);
    } catch {
      drawTutWuriHandayaniPDF(doc, x + 5.2, headerTop + headerHeight / 2, 2.6, primary, gold);
    }
  } else {
    drawTutWuriHandayaniPDF(doc, x + 5.2, headerTop + headerHeight / 2, 2.6, primary, gold);
  }

  // Institution Header Texts
  const rightLogoW = schoolLogoDataUrl ? 8.5 : 0;
  const maxHeaderW = cardWidth - 11.5 - rightLogoW;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(2.8);
  doc.setTextColor(241, 245, 249);
  doc.text(schoolRegency, x + 9.5, headerTop + 2.8, { maxWidth: maxHeaderW });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(2.7);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text(schoolDepartment, x + 9.5, headerTop + 5.0, { maxWidth: maxHeaderW });

  doc.setFontSize(4.8);
  doc.setTextColor(255, 255, 255);
  doc.text(finalSchoolName, x + 9.5, headerTop + 8.2, { maxWidth: maxHeaderW });

  doc.setFontSize(3.0);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text(cardTitle, x + 9.5, headerTop + 10.8, { maxWidth: maxHeaderW });

  // Draw School Logo on Right of Header if provided
  if (schoolLogoDataUrl) {
    try {
      const logoBoxSize = 7.6;
      const logoBoxX = x + cardWidth - logoBoxSize - 2.5;
      const logoBoxY = headerTop + (headerHeight - logoBoxSize) / 2;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(gold[0], gold[1], gold[2]);
      doc.setLineWidth(0.2);
      doc.roundedRect(logoBoxX, logoBoxY, logoBoxSize, logoBoxSize, 1.2, 1.2, 'FD');
      doc.addImage(schoolLogoDataUrl, 'PNG', logoBoxX + 0.6, logoBoxY + 0.6, logoBoxSize - 1.2, logoBoxSize - 1.2);
    } catch {
      // ignore logo draw error
    }
  }

  // Metallic Ribbon Divider
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.35);
  doc.line(x, headerTop + headerHeight, x + cardWidth, headerTop + headerHeight);

  // 4. Middle Section: Photo & Biodata
  const photoX = x + 3.5;
  const photoY = headerTop + headerHeight + 2.2;
  const photoW = 17.5;
  const photoH = 23.5; // Standard 3:4 passport aspect ratio

  // Photo Frame
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(photoX, photoY, photoW, photoH, 1.2, 1.2, 'FD');

  const photoSrc = photoDataUrl || student.photo || student.avatarUrl;
  if (photoSrc) {
    try {
      doc.addImage(photoSrc, 'JPEG', photoX + 0.35, photoY + 0.35, photoW - 0.7, photoH - 0.7);
    } catch {
      doc.setFontSize(3.2);
      doc.setTextColor(148, 163, 184);
      doc.text('FOTO GURU', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
    }
  } else {
    doc.setFontSize(3.2);
    doc.setTextColor(148, 163, 184);
    doc.text('FOTO GURU', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
  }

  // Biodata Column (Right of Photo)
  const infoX = x + 23;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(3.0);
  doc.setTextColor(100, 116, 139);
  doc.text('NAMA GURU', infoX, photoY + 2.3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.0);
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(student.name.toUpperCase(), infoX, photoY + 5.6, { maxWidth: 28 });

  // Subtle separator line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(infoX, photoY + 8.8, x + cardWidth - 3.5, photoY + 8.8);

  // Data rows: NIP, NUPTK, Jabatan, Berlaku sampai
  const nipDisplay = student.nip || student.nis || '-';
  const nuptkDisplay = student.nuptk || student.nisn || '-';
  const positionDisplay = student.position || student.subject || student.classRoom || 'Guru / PTK';
  const validityDisplay = 'selama menjabat disekolah ini';

  const labelW = 12.0;
  const colonX = infoX + labelW;
  const valX = colonX + 1.8;
  const maxValW = (x + cardWidth - 3.5) - valX;

  // Row 1: NIP
  doc.setFontSize(3.6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('NIP', infoX, photoY + 12.0);
  doc.text(':', colonX, photoY + 12.0);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(nipDisplay, valX, photoY + 12.0, { maxWidth: maxValW });

  // Row 2: NUPTK
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('NUPTK', infoX, photoY + 15.2);
  doc.text(':', colonX, photoY + 15.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(nuptkDisplay, valX, photoY + 15.2, { maxWidth: maxValW });

  // Row 3: Jabatan
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Jabatan', infoX, photoY + 18.4);
  doc.text(':', colonX, photoY + 18.4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(positionDisplay, valX, photoY + 18.4, { maxWidth: maxValW });

  // Row 4: Berlaku sampai
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Berlaku sampai', infoX, photoY + 21.6);
  doc.text(':', colonX, photoY + 21.6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(3.0);
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(validityDisplay, valX, photoY + 21.6, { maxWidth: maxValW });

  // 5. Middle Horizontal Divider
  const midDividerY = photoY + photoH + 2.0;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(x + 3.5, midDividerY, x + cardWidth - 3.5, midDividerY);

  // 6. Lower Section: QR Code & Kepala Sekolah Pengesahan
  const signatureType = options.signatureType !== undefined
    ? options.signatureType
    : (settings?.headmasterSignatureType || 'none');

  if (signatureType === 'none') {
    // Mode Fokus Barcode Absen Penuh (Tanpa TTD/Barcode Kepsek)
    const qrSize = 23.5;
    const qrX = x + (cardWidth - qrSize) / 2;
    const qrY = midDividerY + 2.0;

    // White rounded card box for QR Code
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(qrX, qrY, qrSize, qrSize, 1.2, 1.2, 'FD');

    if (qrDataUrl) {
      try {
        doc.addImage(qrDataUrl, 'PNG', qrX + 0.6, qrY + 0.6, qrSize - 1.2, qrSize - 1.2);
      } catch {
        // qr fallback
      }
    }

    // Centered label below QR Code
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(3.8);
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.text('PINDAI UNTUK PRESENSI', x + cardWidth / 2, qrY + qrSize + 2.8, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(3.0);
    doc.setTextColor(100, 116, 139);
    doc.text(`ID GURU: ${nipDisplay}`, x + cardWidth / 2, qrY + qrSize + 5.5, { align: 'center' });
  } else {
    // Mode 2-Kolom: QR Presensi + Pengesahan Kepala Sekolah
    const qrX = x + 3.5;
    const qrY = midDividerY + 2.0;
    const qrSize = 17.5;

    // QR Container Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.roundedRect(qrX, qrY, qrSize, qrSize, 1.0, 1.0, 'FD');

    if (qrDataUrl) {
      try {
        doc.addImage(qrDataUrl, 'PNG', qrX + 0.4, qrY + 0.4, qrSize - 0.8, qrSize - 0.8);
      } catch {
        // qr fallback
      }
    }

    // QR Label below
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(3.2);
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.text('PINDAI PRESENSI', qrX + qrSize / 2, qrY + qrSize + 2.6, { align: 'center' });

    // Right Side: Kepala Sekolah Signature & Official Stamp / QR Code
    const signCenterX = x + 37.5;
    const signBaseY = qrY + 1.2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(3.0);
    doc.setTextColor(100, 116, 139);
    doc.text(`${schoolCity}, ${academicYear}`, signCenterX, signBaseY, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(3.5);
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.text('Kepala Sekolah,', signCenterX, signBaseY + 2.8, { align: 'center' });

    if (signatureType === 'qr_digital') {
      // Render Headmaster Digital Signature QR Code (Clean, no stamp watermark)
      if (kepsekQrDataUrl) {
        try {
          const kQrSize = 7.8;
          const kQrX = signCenterX - kQrSize / 2;
          const kQrY = signBaseY + 3.4;
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.18);
          doc.rect(kQrX - 0.3, kQrY - 0.3, kQrSize + 0.6, kQrSize + 0.6, 'FD');
          doc.addImage(kepsekQrDataUrl, 'PNG', kQrX, kQrY, kQrSize, kQrSize);
        } catch {
          drawDigitalSignaturePDF(doc, signCenterX - 11, signBaseY + 7.2);
        }
      } else {
        drawDigitalSignaturePDF(doc, signCenterX - 11, signBaseY + 7.2);
      }
    } else if (signatureType === 'both') {
      // Both QR Digital and Signature / Stamp
      const kQrSize = 6.8;
      const kQrX = signCenterX - 10.5;
      const kQrY = signBaseY + 3.8;

      if (kepsekQrDataUrl) {
        try {
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.18);
          doc.rect(kQrX - 0.3, kQrY - 0.3, kQrSize + 0.6, kQrSize + 0.6, 'FD');
          doc.addImage(kepsekQrDataUrl, 'PNG', kQrX, kQrY, kQrSize, kQrSize);
        } catch {
          // fallback
        }
      }

      if (kepsekSignatureDataUrl) {
        try {
          const isJpeg = kepsekSignatureDataUrl.includes('image/jpeg') || kepsekSignatureDataUrl.includes('image/jpg');
          doc.addImage(kepsekSignatureDataUrl, isJpeg ? 'JPEG' : 'PNG', signCenterX - 2.5, signBaseY + 3.8, 13, 6.8);
        } catch {
          drawDigitalSignaturePDF(doc, signCenterX - 2, signBaseY + 7.2);
        }
      } else {
        drawDigitalSignaturePDF(doc, signCenterX - 2, signBaseY + 7.2);
      }
    } else {
      // Signature mode: image or vector cursive
      if (kepsekSignatureDataUrl) {
        try {
          const isJpeg = kepsekSignatureDataUrl.includes('image/jpeg') || kepsekSignatureDataUrl.includes('image/jpg');
          doc.addImage(kepsekSignatureDataUrl, isJpeg ? 'JPEG' : 'PNG', signCenterX - 9, signBaseY + 3.6, 18, 8.0);
        } catch {
          drawDigitalSignaturePDF(doc, signCenterX - 11, signBaseY + 7.2);
        }
      } else {
        drawDigitalSignaturePDF(doc, signCenterX - 11, signBaseY + 7.2);
      }
    }

    // Headmaster Name (Underlined)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.0);
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.text(headmasterName, signCenterX, signBaseY + 13.0, { align: 'center' });

    const nameWidth = doc.getTextWidth(headmasterName);
    doc.setDrawColor(darkText[0], darkText[1], darkText[2]);
    doc.setLineWidth(0.22);
    doc.line(signCenterX - nameWidth / 2, signBaseY + 13.5, signCenterX + nameWidth / 2, signBaseY + 13.5);

    // Headmaster NIP
    const rawNip = headmasterNip || '-';
    const nipLabel = rawNip.startsWith('NIP') ? rawNip : `NIP. ${rawNip}`;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(3.0);
    doc.setTextColor(100, 116, 139);
    doc.text(nipLabel, signCenterX, signBaseY + 16.2, { align: 'center' });
  }

  // 7. Bottom Security Band / Footer Ribbon
  const footerH = 4.0;
  const footerY = y + cardHeight - footerH;
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(x, footerY, cardWidth, footerH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(3.0);
  doc.setTextColor(255, 255, 255);
  doc.text(
    cardValidityText,
    x + cardWidth / 2,
    footerY + 2.7,
    { align: 'center' }
  );

  // Outer Card Border
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, cardWidth, cardHeight, 2.5, 2.5, 'D');
};
