import QRCode from 'qrcode';
import { Student, QRPayload, SystemSettings } from '../types';

/**
 * Creates verification text / payload for Headmaster Digital Signature QR Code
 */
export const createKepsekSignatureQRPayload = (settings: Partial<SystemSettings>): string => {
  const school = settings.schoolName || 'SDK Ogomojolo';
  const kepsek = settings.headmasterName || 'RAHMAT, S.Pd., M.Pd';
  const nip = settings.headmasterNip || '19851204 200903 1 002';
  const year = settings.academicYear || '2025/2026';
  
  return `TTE-KEMDIKBUD-RESMI\nSekolah: ${school}\nPejabat Penandatangan: ${kepsek}\nNIP: ${nip}\nPerihal: Pengesahan Kartu Identitas Guru & PTK\nTahun Ajaran: ${year}\nStatus: TERVERIFIKASI DIGITAL (DOKUMEN SAH)`;
};

/**
 * Creates standardized QR payload string for a student
 */
export const createStudentQRPayload = (student: Student): string => {
  const payload: QRPayload = {
    app: 'AbsensiSiswaQR',
    nis: student.nis,
    name: student.name,
    classRoom: student.classRoom
  };
  return JSON.stringify(payload);
};

/**
 * Converts text or JSON string into Data URL image string for QR code
 */
export const generateQRCodeDataURL = async (text: string): Promise<string> => {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#0f172a', // slate-900
        light: '#ffffff'
      }
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return '';
  }
};

/**
 * Parses scanned string payload into student identifier or object
 */
export const parseQRPayload = (rawText: string): { nis: string; name?: string } => {
  const trimmed = rawText.trim();
  
  // Attempt JSON parsing
  try {
    const obj = JSON.parse(trimmed);
    if (obj && typeof obj === 'object') {
      if (obj.nis) {
        return { nis: String(obj.nis), name: obj.name };
      }
    }
  } catch {
    // Not JSON, fallback to raw string treating it as NIS directly
  }

  return { nis: trimmed };
};
