// 数据访问层：CloudBase PG（app.rdb()，PostgREST 风格）
// 接口签名与本地 JSON 版 server/src/db.ts 对齐（readStore/writeStore/nextId），
// 差异仅在返回 Promise——路由层需要 await。
import CloudBase from '@cloudbase/node-sdk';

const app = CloudBase.init({
  env: process.env.TCB_ENV || 'zys-personal-env-d3ew4cz73a493b1',
  region: process.env.TCB_REGION || 'ap-singapore',
  accessKey: process.env.CLOUDBASE_APIKEY,
});

// 官方 3.18.3 的 types/index.d.ts 未声明 rdb（实现有、类型没跟上），这里用断言取用。
// database 参数映射到 PG schema（Accept-Profile 头），表建在 public schema，
// 不传会默认用环境 ID 当 schema 导致 "Invalid schema" 错误。
const rdb = (app as unknown as { rdb: (options: { database: string }) => RdbClient }).rdb({ database: 'public' });

// PostgREST 风格查询构造器（链式 thenable，await 后得 { data, error }）
interface RdbClient {
  from: (table: string) => QueryBuilder;
}
interface QueryBuilder {
  select: (columns?: string) => FilterBuilder;
  insert: (values: Record<string, unknown> | Record<string, unknown>[], options?: { count?: 'exact' | 'planned' | 'estimated' }) => Executable;
  upsert: (values: Record<string, unknown> | Record<string, unknown>[], options?: { onConflict?: string; ignoreDuplicates?: boolean }) => Executable;
  update: (values: Record<string, unknown>) => FilterBuilder;
  delete: () => FilterBuilder;
}
interface FilterBuilder extends Executable {
  eq: (col: string, val: unknown) => FilterBuilder;
  order: (col: string, opts?: { ascending?: boolean }) => FilterBuilder;
  limit: (n: number) => FilterBuilder;
}
interface Executable extends Promise<QueryResult> {}
interface QueryResult {
  data: unknown[] | null;
  error: { message: string; details?: string; hint?: string } | null;
}


// 列名映射：接口层的 camelCase 字段 <-> PG 表的 snake_case 列
const COLUMN_MAP: Record<string, Record<string, string>> = {
  days: { dayNumber: 'day_number', cityEn: 'city_en', contentJson: 'content_json', sortOrder: 'sort_order' },
  expenses: { subCategory: 'sub_category', splitCount: 'split_count', perPerson: 'per_person' },
  checklist: { sortOrder: 'sort_order' },
  bookings: { needReservation: 'need_reservation', bookingLink: 'booking_link', sortOrder: 'sort_order' },
};

function toDb(table: string, record: Record<string, unknown>): Record<string, unknown> {
  const map = COLUMN_MAP[table] || {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(record)) {
    out[map[k] || k] = v;
  }
  return out;
}

function fromDb(table: string, record: Record<string, unknown>): Record<string, unknown> {
  const map = COLUMN_MAP[table] || {};
  const reverse: Record<string, string> = {};
  for (const [camel, snake] of Object.entries(map)) reverse[snake] = camel;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(record)) {
    out[reverse[k] || k] = v;
  }
  return out;
}

// ===== 读：整表查询（数据量小，全量拉取后由路由层做内存过滤，与本地版行为一致） =====
export async function readList<T = Record<string, unknown>>(table: string): Promise<T[]> {
  const { data, error } = await rdb.from(table).select('*');
  if (error) throw new Error(`readList(${table}): ${error.message}`);
  return (data || []).map(r => fromDb(table, r as Record<string, unknown>) as T);
}

// ===== 写：按 id 全量替换 =====
export async function upsert<T extends { id: number }>(table: string, record: T): Promise<void> {
  const dbRecord = toDb(table, record as unknown as Record<string, unknown>);
  // PostgREST upsert：冲突时按主键整行替换
  // 注意：insert() 不支持 upsert 选项，必须用独立的 upsert() 方法
  const { error } = await rdb.from(table).upsert(dbRecord, { onConflict: 'id' });
  if (error) throw new Error(`upsert(${table}): ${error.message}`);
}

export async function removeById(table: string, id: number): Promise<void> {
  const { error } = await rdb.from(table).delete().eq('id', id);
  if (error) throw new Error(`removeById(${table}): ${error.message}`);
}

// ===== trip_info：单行 JSONB =====
export async function readTripInfo(): Promise<unknown | null> {
  const { data, error } = await rdb.from('trip_info').select('data');
  if (error) throw new Error(`readTripInfo: ${error.message}`);
  const rows = (data || []) as { data: unknown }[];
  return rows.length > 0 ? rows[0].data : null;
}

export async function writeTripInfo(data: unknown): Promise<void> {
  const { error } = await rdb.from('trip_info').upsert({ id: 1, data }, { onConflict: 'id' });
  if (error) throw new Error(`writeTripInfo: ${error.message}`);
}

// ===== ID 生成：毫秒时间戳（与本地版 nextId 一致，13 位） =====
let idCounter = Date.now();
export function nextId(): number {
  return ++idCounter;
}
