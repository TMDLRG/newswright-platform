import * as path from 'path';
import * as fs from 'fs';
import { generateDocx, generateAllDocx } from './exporter-docx';
import { parseDocument, parseAllDocuments } from './parser';
import { PACKAGE_DIR } from './types';

describe('DOCX Exporter — Single Document', () => {
  test('generates valid .docx buffer from Executive Summary', async () => {
    const filename = '01_Executive_Summary.md';
    const raw = fs.readFileSync(path.join(PACKAGE_DIR, filename), 'utf-8');
    const doc = parseDocument(raw, filename);

    const buffer = await generateDocx(doc);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);

    // DOCX files start with PK (ZIP signature)
    expect(buffer[0]).toBe(0x50); // 'P'
    expect(buffer[1]).toBe(0x4b); // 'K'
  });

  test('generates valid .docx from Financial Model Addendum (table-heavy)', async () => {
    const filename = '04_Financial_Model_Addendum.md';
    const raw = fs.readFileSync(path.join(PACKAGE_DIR, filename), 'utf-8');
    const doc = parseDocument(raw, filename);

    const buffer = await generateDocx(doc);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });

  test('generates valid .docx from Operating Model (largest document)', async () => {
    const filename = '09_Operating_Model.md';
    const raw = fs.readFileSync(path.join(PACKAGE_DIR, filename), 'utf-8');
    const doc = parseDocument(raw, filename);

    const buffer = await generateDocx(doc);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(500);
  });

  test('generated .docx has reasonable size (not empty)', async () => {
    const filename = '01_Executive_Summary.md';
    const raw = fs.readFileSync(path.join(PACKAGE_DIR, filename), 'utf-8');
    const doc = parseDocument(raw, filename);

    const buffer = await generateDocx(doc);

    // A document with content should be at least a few KB
    expect(buffer.length).toBeGreaterThan(2000);
  });
});

describe('DOCX Exporter — All 21 Documents', () => {
  test('generates all 21 .docx files without errors', async () => {
    const documents = parseAllDocuments(PACKAGE_DIR);
    expect(documents.length).toBe(21);

    const results = await generateAllDocx(documents);

    expect(Object.keys(results).length).toBe(21);

    for (const doc of documents) {
      const result = results[doc.id];
      expect(result).toBeDefined();
      expect(result.filename).toMatch(/\.docx$/);
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(100);
      // Valid ZIP/DOCX signature
      expect(result.buffer[0]).toBe(0x50);
      expect(result.buffer[1]).toBe(0x4b);
    }
  }, 30000);

  test('each generated .docx has unique content (not all same size)', async () => {
    const documents = parseAllDocuments(PACKAGE_DIR);
    const results = await generateAllDocx(documents);

    const sizes = Object.values(results).map(r => r.buffer.length);
    const uniqueSizes = new Set(sizes);

    // With 21 documents of different lengths, we should have many unique sizes
    expect(uniqueSizes.size).toBeGreaterThan(10);
  }, 30000);
});
