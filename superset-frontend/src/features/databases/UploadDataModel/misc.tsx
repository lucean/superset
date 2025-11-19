import { csvParse, autoType } from 'd3-dsv';
import { MutableRefObject } from 'react';
import { read, utils } from 'xlsx';

export type TagsColumnRefs = {
  pillName: MutableRefObject<any>;
  typeChip: MutableRefObject<any>;
  actionChip: MutableRefObject<any>;
  resetButton: MutableRefObject<any>;
};

export type PandasType =
  | 'int64'
  | 'float64'
  | 'bool'
  | 'string'
  | 'object'
  | 'datetime64[ns]'
  | 'null';

export const PANDAS_TYPES: PandasType[] = [
  'int64',
  'float64',
  'bool',
  'string',
  'object',
  'datetime64[ns]',
];

export const TYPE_LABELS: Record<PandasType, string> = {
  int64: 'integer',
  float64: 'float',
  bool: 'boolean',
  string: 'text',
  object: 'object',
  'datetime64[ns]': 'datetime',
  null: 'null',
};

function inferType(value: any): PandasType {
  if (value === '' || value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return 'bool';
  if (typeof value === 'number')
    return Number.isInteger(value) ? 'int64' : 'float64';
  if (value instanceof Date && !Number.isNaN(value.getTime()))
    return 'datetime64[ns]';
  if (typeof value === 'string') return 'string';
  return 'object';
}

function toPandasType(values: any[]): PandasType {
  const typeCounts: Record<string, number> = {};
  const nonNullTypes: Set<PandasType> = new Set<PandasType>();
  for (const val of values) {
    const t: PandasType = inferType(val);
    if (t !== 'null') {
      typeCounts[t] = (typeCounts[t] || 0) + 1;
      nonNullTypes.add(t);
    }
  }
  const types: PandasType[] = Array.from(nonNullTypes);
  if (types.length === 0) return 'object';
  if (types.length === 1) return types[0];
  if (
    types.includes('int64') &&
    types.includes('float64') &&
    types.length === 2
  )
    return 'float64';
  return 'object';
}

export function inferSchemaFromRows(
  rows: Record<string, any>[],
  sampleSize = 10,
): Record<string, PandasType> {
  const sample = rows.slice(0, sampleSize);
  if (sample.length === 0) return {};
  const schema: Record<string, PandasType> = {};
  for (const key of Object.keys(sample[0])) {
    const columnValues = sample.map(row => row[key]);
    schema[key] = toPandasType(columnValues);
  }
  return schema;
}

export function inferCsvSchema(
  csvText: string,
  sampleSize = 10,
): Record<string, PandasType> {
  const rows: any[] = csvParse(csvText, autoType);
  return inferSchemaFromRows(rows, sampleSize);
}

export async function inferExcelSchema(
  file: File,
  sampleSize = 10,
  sheetName?: string,
): Promise<Record<string, PandasType>> {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, {
    type: 'array',
    cellDates: true, // Excel dates -> JS Date
  });

  const targetSheetName =
    sheetName && workbook.SheetNames.includes(sheetName)
      ? sheetName
      : workbook.SheetNames[0];

  if (!targetSheetName) {
    return {};
  }

  const worksheet = workbook.Sheets[targetSheetName];
  if (!worksheet) {
    return {};
  }

  const rows: Record<string, any>[] = utils.sheet_to_json(worksheet, {
    raw: true,
  });

  return inferSchemaFromRows(rows, sampleSize);
}
