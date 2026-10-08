// Penulis .xlsx minimal - cukup untuk laporan Command Center yang dibuka di
// Excel: beberapa sheet, baris judul tebal & dibekukan, lebar kolom, teks
// terbungkus. Sengaja bukan pustaka spreadsheet: @zip.js sudah ada (dipakai
// export SCORM), dan .xlsx itu cuma ZIP berisi beberapa berkas XML.
//
// Semua sel ditulis sebagai TEKS (inline string). Itu disengaja: NIP 18 digit
// yang ditulis sebagai angka dipotong Excel jadi notasi ilmiah - masalah yang
// sama yang dulu harus diakali di ekspor CSV (lihat toCsv di CommandCenter).

export interface XlsxSheet {
  name: string;
  rows: string[][];        // baris pertama = judul kolom
  widths?: number[];       // lebar per kolom, satuan karakter
}

function escXml(s: string): string {
  return s
    // Karakter kontrol selain tab/baris baru bikin Excel menolak berkasnya.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function kolom(i: number): string {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

// Nama sheet: maks 31 karakter, tanpa : \ / ? * [ ]
function namaSheet(n: string, i: number): string {
  return (n.replace(/[:\\/?*[\]]/g, ' ').trim().slice(0, 31)) || `Sheet${i + 1}`;
}

function sheetXml(sh: XlsxSheet): string {
  const cols = sh.widths?.length
    ? '<cols>' + sh.widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('') + '</cols>'
    : '';
  const rows = sh.rows.map((r, ri) =>
    `<row r="${ri + 1}">` + r.map((v, ci) =>
      `<c r="${kolom(ci)}${ri + 1}" t="inlineStr" s="${ri === 0 ? 1 : 2}"><is><t xml:space="preserve">${escXml(v ?? '')}</t></is></c>`
    ).join('') + '</row>').join('');
  const lebar = Math.max(1, ...sh.rows.map(r => r.length));
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    + '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
    + cols + `<sheetData>${rows}</sheetData>`
    + (sh.rows.length > 1 ? `<autoFilter ref="A1:${kolom(lebar - 1)}${sh.rows.length}"/>` : '')
    + '</worksheet>';
}

const STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
  + '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>'
  + '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'
  + '<fill><patternFill patternType="solid"><fgColor rgb="FF1F3A68"/><bgColor indexed="64"/></patternFill></fill></fills>'
  + '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>'
  + '<border><left style="thin"><color rgb="FFD0D5DE"/></left><right style="thin"><color rgb="FFD0D5DE"/></right>'
  + '<top style="thin"><color rgb="FFD0D5DE"/></top><bottom style="thin"><color rgb="FFD0D5DE"/></bottom><diagonal/></border></borders>'
  + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
  + '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
  + '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>'
  + '<xf numFmtId="49" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>'
  + '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';

export async function buatXlsx(sheets: XlsxSheet[]): Promise<Blob> {
  const { ZipWriter, BlobWriter, TextReader } = await import('@zip.js/zip.js');
  const w = new ZipWriter(new BlobWriter('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'));
  const nama = sheets.map((s, i) => namaSheet(s.name, i));
  await w.add('[Content_Types].xml', new TextReader(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
    + sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')
    + '</Types>'));
  await w.add('_rels/.rels', new TextReader(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
    + '</Relationships>'));
  await w.add('xl/workbook.xml', new TextReader(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
    + nama.map((n, i) => `<sheet name="${escXml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')
    + '</sheets>'
    + (sheets.some(s => s.rows.length > 1)
      ? '<definedNames>' + sheets.map((s, i) => s.rows.length > 1
          ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${escXml(nama[i]).replace(/'/g, "''")}'!$A$1:$${kolom(Math.max(1, ...s.rows.map(r => r.length)) - 1)}$${s.rows.length}</definedName>`
          : '').join('') + '</definedNames>'
      : '')
    + '</workbook>'));
  await w.add('xl/_rels/workbook.xml.rels', new TextReader(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')
    + `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`
    + '</Relationships>'));
  await w.add('xl/styles.xml', new TextReader(STYLES));
  for (let i = 0; i < sheets.length; i++) {
    await w.add(`xl/worksheets/sheet${i + 1}.xml`, new TextReader(sheetXml(sheets[i])));
  }
  return w.close();
}
