/**
 * Inventory Parser - Parses CSV files exported from Excel/Google Sheets
 * Supports various column naming conventions and auto-detects fields
 */

export type ParsedProduct = {
  name: string;
  price: number | null;
  description: string | null;
  imageUrl: string | null;
  rawRow: Record<string, string>;
  rowIndex: number;
  errors: string[];
};

export type ParseResult = {
  success: boolean;
  products: ParsedProduct[];
  errors: string[];
  detectedColumns: {
    name: string | null;
    price: string | null;
    description: string | null;
    imageUrl: string | null;
  };
};

// Common column name variations
const NAME_COLUMNS = ['name', 'product', 'product name', 'item', 'item name', 'title', 'product_name'];
const PRICE_COLUMNS = ['price', 'cost', 'amount', 'unit price', 'unit_price', 'retail price', 'selling price', 'sale price'];
const DESCRIPTION_COLUMNS = ['description', 'desc', 'details', 'product description', 'product_description', 'notes', 'info'];
const IMAGE_COLUMNS = ['image', 'image url', 'image_url', 'imageurl', 'picture', 'photo', 'img', 'thumbnail', 'picture url'];

function normalizeColumnName(name: string): string {
  // Remove BOM, special characters, and normalize
  return name
    .replace(/^\uFEFF/, '') // Remove BOM
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width chars
    .toLowerCase()
    .trim()
    .replace(/[_-]/g, ' ');
}

function findMatchingColumn(headers: string[], candidates: string[]): string | null {
  for (const header of headers) {
    const normalized = normalizeColumnName(header);
    if (candidates.includes(normalized)) {
      return header;
    }
  }
  return null;
}

function parsePrice(value: string): number | null {
  if (!value) return null;
  // Remove currency symbols, commas, and whitespace
  const cleaned = value.replace(/[$€£¥,\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function detectDelimiter(lines: string[]): string {
  // Check first few lines for common delimiters
  const firstLine = lines[0] || '';

  // Count potential delimiters
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;

  // Return the most common delimiter
  if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
  if (semicolonCount > commaCount && semicolonCount > tabCount) return ';';
  return ',';
}

function parseLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  result.push(current.trim());
  return result;
}

export function parseCSV(csvContent: string): ParseResult {
  const errors: string[] = [];

  // Strip BOM and other invisible characters from the start
  const cleanedContent = csvContent
    .replace(/^\uFEFF/, '') // Remove UTF-8 BOM
    .replace(/^\uFFFE/, '') // Remove UTF-16 LE BOM
    .replace(/^\uFEFF/, ''); // Remove UTF-16 BE BOM

  const lines = cleanedContent.split(/\r?\n/).filter(line => line.trim());

  if (lines.length < 2) {
    return {
      success: false,
      products: [],
      errors: ['File must have at least a header row and one data row'],
      detectedColumns: { name: null, price: null, description: null, imageUrl: null },
    };
  }

  // Auto-detect delimiter (comma, tab, or semicolon)
  const delimiter = detectDelimiter(lines);

  // Parse header row
  const headers = parseLine(lines[0], delimiter);

  // Auto-detect columns
  const nameCol = findMatchingColumn(headers, NAME_COLUMNS);
  const priceCol = findMatchingColumn(headers, PRICE_COLUMNS);
  const descCol = findMatchingColumn(headers, DESCRIPTION_COLUMNS);
  const imageCol = findMatchingColumn(headers, IMAGE_COLUMNS);

  if (!nameCol) {
    // Try to use first column as name if no match found
    errors.push('Could not auto-detect product name column. Using first column.');
  }

  const detectedColumns = {
    name: nameCol || headers[0],
    price: priceCol,
    description: descCol,
    imageUrl: imageCol,
  };

  const products: ParsedProduct[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i], delimiter);
    const rowErrors: string[] = [];

    // Create raw row object
    const rawRow: Record<string, string> = {};
    headers.forEach((header: string, idx: number) => {
      rawRow[header] = values[idx] || '';
    });

    // Extract fields
    const nameValue = detectedColumns.name ? rawRow[detectedColumns.name] : values[0];
    const priceValue = detectedColumns.price ? rawRow[detectedColumns.price] : null;
    const descValue = detectedColumns.description ? rawRow[detectedColumns.description] : null;
    const imageValue = detectedColumns.imageUrl ? rawRow[detectedColumns.imageUrl] : null;

    // Validate
    if (!nameValue || !nameValue.trim()) {
      rowErrors.push('Missing product name');
    }

    const price = priceValue ? parsePrice(priceValue) : null;
    if (priceValue && price === null) {
      rowErrors.push(`Invalid price format: "${priceValue}"`);
    }

    products.push({
      name: nameValue?.trim() || '',
      price,
      description: descValue?.trim() || null,
      imageUrl: imageValue?.trim() || null,
      rawRow,
      rowIndex: i,
      errors: rowErrors,
    });
  }

  return {
    success: true,
    products,
    errors,
    detectedColumns,
  };
}

export function detectFileType(filename: string): 'csv' | 'unsupported' {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'csv') return 'csv';
  return 'unsupported';
}
