// 云函数版后端：HTTP 访问（Web 函数），Express 监听 9000 端口
// 路由与本地版 server/src/index.ts 完全一致，差异：
//  1. 数据存 CloudBase PG（app.rdb()），不再是 JSON 文件
//  2. 附件存云存储，下载走本函数的代理路由（客户端 BASE_URL 契约不变）
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import CloudBase from '@cloudbase/node-sdk';
import { readList, upsert, removeById, readTripInfo, writeTripInfo, nextId } from './db.js';

const app = CloudBase.init({
  env: process.env.TCB_ENV || 'zys-personal-env-d3ew4cz73a493b1',
  region: process.env.TCB_REGION || 'ap-singapore',
  // 凭证从环境变量 CLOUDBASE_APIKEY 读取（service 级，绕过安全规则）
  // 这里不显式传，normalizeConfig 会自动取 process.env.CLOUDBASE_APIKEY
});
// 命名冲突：上面 CloudBase 实例叫 app，下面 Express 实例改叫 server

const server = express();
const port = 9000;

server.use(cors());
server.use(express.json({ limit: '50mb' }));
server.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
server.get('/api/v1/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 临时调试路由：验证 CLOUDBASE_APIKEY 是否注入 + PG 连通性（定位后删除）
server.get('/api/v1/debug', async (_req, res) => {
  const out: Record<string, unknown> = {
    hasApiKey: Boolean(process.env.CLOUDBASE_APIKEY),
    apiKeyLength: (process.env.CLOUDBASE_APIKEY || '').length,
    env: process.env.TCB_ENV,
  };
  try {
    const { data, error } = await (app as unknown as { rdb: (o: { database: string }) => { from: (t: string) => { select: (c?: string) => Promise<{ data: unknown[]; error: { message: string } | null }> } } }).rdb({ database: 'public' }).from('trip_info').select('data');
    out.rdbError = error ? error.message : null;
    out.rowCount = data ? data.length : null;
    res.json(out);
  } catch (e) {
    out.exception = e instanceof Error ? `${e.message}` : String(e);
    res.status(500).json(out);
  }
});

// ===== Trip Config =====
server.get('/api/v1/trip-info', async (_req, res) => {
  try {
    const data = await readTripInfo();
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (e) {
    console.error('GET /trip-info failed:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

server.put('/api/v1/trip-info', async (req, res) => {
  try {
    await writeTripInfo(req.body);
    res.json({ success: true });
  } catch (e) {
    console.error('PUT /trip-info failed:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ===== Days =====
interface DayRecord { id: number; day_number: number; date: string; weekday: string; city: string; city_en: string; content_json: string; sort_order: number; }

server.get('/api/v1/days', async (_req, res) => {
  try {
    const days = await readList<DayRecord>('days');
    days.sort((a, b) => a.sort_order - b.sort_order);
    res.json(days);
  } catch (e) {
    console.error('GET /days failed:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

server.get('/api/v1/days/:id', async (req, res) => {
  try {
    const days = await readList<DayRecord>('days');
    const day = days.find(d => d.id === Number(req.params.id));
    if (!day) return res.status(404).json({ error: 'Not found' });
    res.json(day);
  } catch (e) {
    console.error('GET /days/:id failed:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

server.put('/api/v1/days/:id/content', async (req, res) => {
  try {
    const days = await readList<DayRecord>('days');
    const idx = days.findIndex(d => d.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const { content_json } = req.body;
    days[idx].content_json = typeof content_json === 'string' ? content_json : JSON.stringify(content_json);
    await upsert('days', days[idx]);
    res.json({ success: true });
  } catch (e) {
    console.error('PUT /days/:id/content failed:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ===== Expenses =====
interface ExpenseRecord { id: number; date: string; category: string; sub_category: string; amount: number; currency: string; split_count: number; per_person: number; note: string; }

server.get('/api/v1/expenses', async (_req, res) => {
  try {
    res.json(await readList<ExpenseRecord>('expenses'));
  } catch (e) {
    console.error('GET /expenses failed:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

server.post('/api/v1/expenses', async (req, res) => {
  try {
    const { date, category, sub_category, amount, currency, split_count, note } = req.body;
    const per_person = Number((amount / (split_count || 6)).toFixed(2));
    const newExpense: ExpenseRecord = { id: nextId(), date, category, sub_category, amount, currency: currency || 'EUR', split_count: split_count || 6, per_person, note: note || '' };
    await upsert('expenses', newExpense);
    res.json({ id: newExpense.id, per_person });
  } catch (e) {
    console.error('POST /expenses failed:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

server.put('/api/v1/expenses/:id', async (req, res) => {
  try {
    const expenses = await readList<ExpenseRecord>('expenses');
    const idx = expenses.findIndex(e => e.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const { date, category, sub_category, amount, currency, split_count, note } = req.body;
    expenses[idx] = { ...expenses[idx], date, category, sub_category, amount, currency, split_count, per_person: Number((amount / split_count).toFixed(2)), note: note || '' };
    await upsert('expenses', expenses[idx]);
    res.json({ success: true });
  } catch (e) {
    console.error('PUT /expenses/:id failed:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

server.delete('/api/v1/expenses/:id', async (req, res) => {
  try {
    await removeById('expenses', Number(req.params.id));
    res.json({ success: true });
  } catch (e) {
    console.error('DELETE /expenses/:id failed:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ===== Checklist =====
interface ChecklistRecord { id: number; label: string; checked: number; sort_order: number; category?: string; }

server.get('/api/v1/checklist', async (_req, res) => {
  try {
    const items = await readList<ChecklistRecord>('checklist');
    items.sort((a, b) => a.sort_order - b.sort_order);
    res.json(items);
  } catch (e) {
    console.error('GET /checklist failed:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

server.post('/api/v1/checklist', async (req, res) => {
  try {
    const items = await readList<ChecklistRecord>('checklist');
    const { label, category } = req.body;
    const maxOrder = items.reduce((max, i) => Math.max(max, i.sort_order), 0);
    const newItem: ChecklistRecord = { id: nextId(), label, checked: 0, category: category || '杂物', sort_order: maxOrder + 1 };
    await upsert('checklist', newItem);
    res.json({ id: newItem.id });
  } catch (e) {
    console.error('POST /checklist failed:', e);
    res.status(500).json({ error: 'Internal error', detail: e instanceof Error ? e.message : String(e) });
  }
});

server.put('/api/v1/checklist/:id', async (req, res) => {
  try {
    const items = await readList<ChecklistRecord>('checklist');
    const idx = items.findIndex(i => i.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const { label, checked, category, sort_order } = req.body;
    items[idx] = { ...items[idx], label, checked: checked ? 1 : 0, category, sort_order };
    await upsert('checklist', items[idx]);
    res.json({ success: true });
  } catch (e) {
    console.error('PUT /checklist/:id failed:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

server.delete('/api/v1/checklist/:id', async (req, res) => {
  try {
    await removeById('checklist', Number(req.params.id));
    res.json({ success: true });
  } catch (e) {
    console.error('DELETE /checklist/:id failed:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ===== Bookings =====
interface BookingAttachment { id: number; name: string; type: string; size: number; path: string; fileId?: string; }
interface BookingRecord { id: number; city: string; date: string; attraction: string; price: string; need_reservation: number; booking_link: string; note: string; sort_order: number; category: string; attachments?: BookingAttachment[]; }

server.get('/api/v1/bookings', async (_req, res) => {
  try {
    const items = await readList<BookingRecord>('bookings');
    items.sort((a, b) => a.sort_order - b.sort_order);
    res.json(items);
  } catch (e) {
    console.error('GET /bookings failed:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

server.post('/api/v1/bookings', async (req, res) => {
  try {
    const items = await readList<BookingRecord>('bookings');
    const { city, date, attraction, price, need_reservation, booking_link, note, category } = req.body;
    const maxOrder = items.reduce((max, i) => Math.max(max, i.sort_order), 0);
    const newItem: BookingRecord = { id: nextId(), city, date, attraction, price: price || '', need_reservation: need_reservation ? 1 : 0, booking_link: booking_link || '', note: note || '', sort_order: maxOrder + 1, category: category || '景点' };
    await upsert('bookings', newItem);
    res.json({ id: newItem.id });
  } catch (e) {
    console.error('POST /bookings failed:', e);
    res.status(500).json({ error: 'Internal error', detail: e instanceof Error ? e.message : String(e) });
  }
});

server.put('/api/v1/bookings/:id', async (req, res) => {
  try {
    const items = await readList<BookingRecord>('bookings');
    const idx = items.findIndex(i => i.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const { city, date, attraction, price, need_reservation, booking_link, note, category } = req.body;
    items[idx] = { ...items[idx], city, date, attraction, price, need_reservation: need_reservation ? 1 : 0, booking_link: booking_link || '', note: note || '', category: category || items[idx].category || '景点' };
    await upsert('bookings', items[idx]);
    res.json({ success: true });
  } catch (e) {
    console.error('PUT /bookings/:id failed:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

server.delete('/api/v1/bookings/:id', async (req, res) => {
  try {
    const items = await readList<BookingRecord>('bookings');
    const deleted = items.find(i => i.id === Number(req.params.id));
    if (deleted?.attachments?.length) {
      // 同时删除云存储上的附件文件（尽力而为，不阻塞删除）
      try {
        await app.deleteFile({ fileList: deleted.attachments.map(a => cloudFileId(a.path)) });
      } catch (e) {
        console.error('delete booking attachment files failed:', e);
      }
    }
    await removeById('bookings', Number(req.params.id));
    res.json({ success: true });
  } catch (e) {
    console.error('DELETE /bookings/:id failed:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ===== Booking Attachments（预定附件，存云存储） =====
// 仅允许图片和 PDF，单文件 20MB
const ALLOWED_MIME = /^(image\/(png|jpe?g|gif|webp|heic|heif)|application\/pdf)$/i;
const ALLOWED_EXT = /\.(png|jpe?g|gif|webp|heic|heif|pdf)$/i;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.test(file.mimetype) || ALLOWED_EXT.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持图片和 PDF 文件'));
    }
  },
});

// 云存储目录：attachments/<时间戳-随机串>.<扩展名>
// path 字段（存 PG、返回给客户端）与本地版同为相对路径形态 "/files/<文件名>"，
// 客户端 BASE_URL + path 契约不变；云函数用 /files/<文件名> 代理下载。
// fileId 存云存储 fileID（cloud://…），删除文件时直接用
function cloudPathFor(originalname: string): string {
  const ext = (originalname.match(ALLOWED_EXT)?.[0] || '').toLowerCase();
  return `attachments/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
}

function cloudFileId(path: string): string {
  // path 形如 /files/<文件名> -> attachments/<文件名>（云存储相对路径即可用于删除/取链接）
  const name = path.split('/').pop() || '';
  return `attachments/${name}`;
}

// multer 报错（类型不允许/超限等）转成友好 JSON，而不是默认的 500 HTML
function uploadErrorHandler(err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction): void {
  const message = err instanceof Error ? err.message : '上传失败';
  const status = message.includes('仅支持') ? 400 : 500;
  res.status(status).json({ error: message });
}

server.post('/api/v1/bookings/:id/attachments', upload.array('files', 10), (async (req: express.Request, res: express.Response) => {
  try {
    const items = await readList<BookingRecord>('bookings');
    const idx = items.findIndex(i => i.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Booking not found' });
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ error: '没有收到文件' });

    // 逐个上传云存储（内存 buffer 直传）
    const attachments: BookingAttachment[] = [];
    for (const f of files) {
      const cloudPath = cloudPathFor(f.originalname);
      const { fileID } = await app.uploadFile({ cloudPath, fileContent: f.buffer });
      attachments.push({ id: nextId(), name: f.originalname, type: f.mimetype, size: f.size, path: `/files/${cloudPath.split('/').pop()}`, fileId: fileID });
    }
    items[idx] = { ...items[idx], attachments: [...(items[idx].attachments || []), ...attachments] };
    await upsert('bookings', items[idx]);
    res.json({ attachments });
  } catch (e) {
    console.error('POST /bookings/:id/attachments failed:', e);
    res.status(500).json({ error: '上传失败' });
  }
}) as express.RequestHandler, uploadErrorHandler as unknown as express.RequestHandler);

server.delete('/api/v1/bookings/:id/attachments/:attId', async (req, res) => {
  try {
    const items = await readList<BookingRecord>('bookings');
    const idx = items.findIndex(i => i.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Booking not found' });
    const attId = Number(req.params.attId);
    const att = items[idx].attachments?.find(a => a.id === attId);
    if (!att) return res.status(404).json({ error: 'Attachment not found' });
    try {
      await app.deleteFile({ fileList: [cloudFileId(att.path)] });
    } catch (e) {
      console.error('delete attachment file failed:', e);
    }
    items[idx] = { ...items[idx], attachments: (items[idx].attachments || []).filter(a => a.id !== attId) };
    await upsert('bookings', items[idx]);
    res.json({ success: true });
  } catch (e) {
    console.error('DELETE /bookings/:id/attachments/:attId failed:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ===== 附件下载代理（替代本地版的 express.static('/files')） =====
// 客户端请求 BASE_URL + /files/<文件名>，这里把请求转发到云存储临时链接（有效期 2 小时）
server.get('/files/:name', async (req, res) => {
  try {
    const name = (req.params.name || '').replace(/[^a-zA-Z0-9._-]/g, '');
    if (!name) return res.status(400).json({ error: 'Invalid file name' });
    // 拿云存储临时链接后 302 重定向（客户端 web 用 window.open、原生用 Linking，都能跟随）
    const { fileList } = await app.getTempFileURL({ fileList: [`attachments/${name}`] });
    const info = fileList?.[0];
    if (!info || info.code !== 'SUCCESS' || !info.tempFileURL) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.redirect(302, info.tempFileURL);
  } catch (e) {
    console.error('GET /files/:name failed:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

server.listen(port, () => {
  console.log(`API server listening at http://localhost:${port}/`);
});
