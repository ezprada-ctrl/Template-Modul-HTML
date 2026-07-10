import type { ModuleData, DraftSlide } from './types';

// In production (Vercel), the backend lives on a different host (Render),
// so it's supplied via VITE_API_BASE at build time. In local dev, fall back
// to whatever hostname the page was loaded from (not a hardcoded
// "localhost") so this still works when a teammate on the same LAN opens
// the app via the dev machine's IP instead of "localhost".
const BASE = import.meta.env.VITE_API_BASE
  || `${window.location.protocol}//${window.location.hostname}:5800`;

export async function extractPptx(file: File): Promise<DraftSlide[]> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/api/extract-pptx`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Gagal ekstrak PPTX');
  const data = await res.json();
  return data.slides.map((s: any) => ({ ...s, reviewed: false }));
}

export async function generateHtml(module: ModuleData): Promise<string> {
  const res = await fetch(`${BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(module),
  });
  if (!res.ok) throw new Error('Gagal generate HTML');
  return res.text();
}

export async function listDrafts(): Promise<string[]> {
  const res = await fetch(`${BASE}/api/drafts`);
  const data = await res.json();
  return data.drafts;
}

export async function loadDraft(name: string): Promise<ModuleData> {
  const res = await fetch(`${BASE}/api/drafts/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error('Draft tidak ditemukan');
  return res.json();
}

export async function saveDraft(name: string, module: ModuleData): Promise<void> {
  await fetch(`${BASE}/api/drafts/${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(module),
  });
}

export function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Downscale + re-encode as JPEG before embedding as base64. Raw photos (from
// a phone or Unsplash-style stock photos) are often several MB — embedded
// as-is in the module JSON, that pushes requests to /api/generate and
// /api/drafts past Vercel's ~4.5MB request body limit (Hobby plan), causing
// silent "Failed to fetch" / "Gagal menyimpan" errors. Capping the longest
// side keeps typical images down to a few hundred KB.
export function compressImageToDataUri(file: File, maxDim = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round(height * (maxDim / width));
          width = maxDim;
        } else {
          width = Math.round(width * (maxDim / height));
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      URL.revokeObjectURL(objectUrl);
      if (!ctx) {
        reject(new Error('Canvas tidak didukung di browser ini'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal membaca gambar'));
    };
    img.src = objectUrl;
  });
}
