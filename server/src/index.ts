import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { readStore, writeStore, nextId } from "./db.js";
import { seedIfNeeded } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const app = express();
const port = process.env.PORT || 9091;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 上传的附件静态托管（文件名由服务端生成，不含用户输入）
app.use('/files', express.static(UPLOAD_DIR, { maxAge: '30d' }));

// Initialize database
seedIfNeeded();

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ===== Trip Config =====
app.get('/api/v1/trip-info', (_req, res) => {
  const data = readStore('trip_info', null);
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

app.put('/api/v1/trip-info', (req, res) => {
  writeStore('trip_info', req.body);
  res.json({ success: true });
});

// ===== Days =====
interface DayRecord { id: number; day_number: number; date: string; weekday: string; city: string; city_en: string; content_json: string; sort_order: number; }

app.get('/api/v1/days', (_req, res) => {
  const days = readStore<DayRecord[]>('days', []);
  days.sort((a, b) => a.sort_order - b.sort_order);
  res.json(days);
});

app.get('/api/v1/days/:id', (req, res) => {
  const days = readStore<DayRecord[]>('days', []);
  const day = days.find(d => d.id === Number(req.params.id));
  if (!day) return res.status(404).json({ error: 'Not found' });
  res.json(day);
});

app.put('/api/v1/days/:id/content', (req, res) => {
  const days = readStore<DayRecord[]>('days', []);
  const idx = days.findIndex(d => d.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { content_json } = req.body;
  days[idx].content_json = typeof content_json === 'string' ? content_json : JSON.stringify(content_json);
  writeStore('days', days);
  res.json({ success: true });
});

// ===== Expenses =====
interface ExpenseRecord { id: number; date: string; category: string; sub_category: string; amount: number; currency: string; split_count: number; per_person: number; note: string; }

app.get('/api/v1/expenses', (_req, res) => {
  res.json(readStore<ExpenseRecord[]>('expenses', []));
});

app.post('/api/v1/expenses', (req, res) => {
  const expenses = readStore<ExpenseRecord[]>('expenses', []);
  const { date, category, sub_category, amount, currency, split_count, note } = req.body;
  const per_person = Number((amount / (split_count || 6)).toFixed(2));
  const newExpense: ExpenseRecord = { id: nextId(), date, category, sub_category, amount, currency: currency || 'EUR', split_count: split_count || 6, per_person, note: note || '' };
  expenses.push(newExpense);
  writeStore('expenses', expenses);
  res.json({ id: newExpense.id, per_person });
});

app.put('/api/v1/expenses/:id', (req, res) => {
  const expenses = readStore<ExpenseRecord[]>('expenses', []);
  const idx = expenses.findIndex(e => e.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { date, category, sub_category, amount, currency, split_count, note } = req.body;
  expenses[idx] = { ...expenses[idx], date, category, sub_category, amount, currency, split_count, per_person: Number((amount / split_count).toFixed(2)), note: note || '' };
  writeStore('expenses', expenses);
  res.json({ success: true });
});

app.delete('/api/v1/expenses/:id', (req, res) => {
  let expenses = readStore<ExpenseRecord[]>('expenses', []);
  expenses = expenses.filter(e => e.id !== Number(req.params.id));
  writeStore('expenses', expenses);
  res.json({ success: true });
});

// ===== Checklist =====
interface ChecklistRecord { id: number; label: string; checked: number; sort_order: number; category?: string; }

app.get('/api/v1/checklist', (_req, res) => {
  const items = readStore<ChecklistRecord[]>('checklist', []);
  items.sort((a, b) => a.sort_order - b.sort_order);
  res.json(items);
});

app.post('/api/v1/checklist', (req, res) => {
  const items = readStore<ChecklistRecord[]>('checklist', []);
  const { label, category } = req.body;
  const maxOrder = items.reduce((max, i) => Math.max(max, i.sort_order), 0);
  const newItem: ChecklistRecord = { id: nextId(), label, checked: 0, category: category || '杂物', sort_order: maxOrder + 1 };
  items.push(newItem);
  writeStore('checklist', items);
  res.json({ id: newItem.id });
});

app.put('/api/v1/checklist/:id', (req, res) => {
  const items = readStore<ChecklistRecord[]>('checklist', []);
  const idx = items.findIndex(i => i.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { label, checked, category, sort_order } = req.body;
  items[idx] = { ...items[idx], label, checked: checked ? 1 : 0, category, sort_order };
  writeStore('checklist', items);
  res.json({ success: true });
});

app.delete('/api/v1/checklist/:id', (req, res) => {
  let items = readStore<ChecklistRecord[]>('checklist', []);
  items = items.filter(i => i.id !== Number(req.params.id));
  writeStore('checklist', items);
  res.json({ success: true });
});

// ===== Bookings =====
interface BookingAttachment { id: number; name: string; type: string; size: number; path: string; }
interface BookingRecord { id: number; city: string; date: string; attraction: string; price: string; need_reservation: number; booking_link: string; note: string; sort_order: number; category: string; attachments?: BookingAttachment[]; }

app.get('/api/v1/bookings', (_req, res) => {
  const items = readStore<BookingRecord[]>('bookings', []);
  items.sort((a, b) => a.sort_order - b.sort_order);
  res.json(items);
});

app.post('/api/v1/bookings', (req, res) => {
  const items = readStore<BookingRecord[]>('bookings', []);
  const { city, date, attraction, price, need_reservation, booking_link, note, category } = req.body;
  const maxOrder = items.reduce((max, i) => Math.max(max, i.sort_order), 0);
  const newItem: BookingRecord = { id: nextId(), city, date, attraction, price: price || '', need_reservation: need_reservation ? 1 : 0, booking_link: booking_link || '', note: note || '', sort_order: maxOrder + 1, category: category || '景点' };
  items.push(newItem);
  writeStore('bookings', items);
  res.json({ id: newItem.id });
});

app.put('/api/v1/bookings/:id', (req, res) => {
  const items = readStore<BookingRecord[]>('bookings', []);
  const idx = items.findIndex(i => i.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { city, date, attraction, price, need_reservation, booking_link, note, category } = req.body;
  items[idx] = { ...items[idx], city, date, attraction, price, need_reservation: need_reservation ? 1 : 0, booking_link: booking_link || '', note: note || '', category: category || items[idx].category || '景点' };
  writeStore('bookings', items);
  res.json({ success: true });
});

app.delete('/api/v1/bookings/:id', (req, res) => {
  let items = readStore<BookingRecord[]>('bookings', []);
  const deleted = items.find(i => i.id === Number(req.params.id));
  // 同时删除该预定下的所有附件文件
  (deleted?.attachments || []).forEach(a => {
    const fp = path.join(UPLOAD_DIR, path.basename(a.path));
    fs.unlink(fp, () => {});
  });
  items = items.filter(i => i.id !== Number(req.params.id));
  writeStore('bookings', items);
  res.json({ success: true });
});

// ===== Booking Attachments（预定附件） =====
// 仅允许图片和 PDF，单文件 20MB
const ALLOWED_MIME = /^(image\/(png|jpe?g|gif|webp|heic|heif)|application\/pdf)$/i;
const ALLOWED_EXT = /\.(png|jpe?g|gif|webp|heic|heif|pdf)$/i;
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      // 时间戳 + 随机串防重名/防覆盖，保留原扩展名
      const ext = path.extname(file.originalname).toLowerCase() || '';
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.test(file.mimetype) || ALLOWED_EXT.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持图片和 PDF 文件'));
    }
  },
});

app.post('/api/v1/bookings/:id/attachments', upload.array('files', 10), (req: express.Request, res: express.Response) => {
  const items = readStore<BookingRecord[]>('bookings', []);
  const idx = items.findIndex(i => i.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Booking not found' });
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) return res.status(400).json({ error: '没有收到文件' });
  const attachments: BookingAttachment[] = files.map(f => ({
    id: nextId(),
    name: f.originalname,
    type: f.mimetype,
    size: f.size,
    path: `/files/${f.filename}`,
  }));
  items[idx] = { ...items[idx], attachments: [...(items[idx].attachments || []), ...attachments] };
  writeStore('bookings', items);
  res.json({ attachments });
}, (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // multer 报错（类型不允许/超限等）转成友好 JSON，而不是默认的 500 HTML
  const message = err instanceof Error ? err.message : '上传失败';
  const status = message.includes('仅支持') ? 400 : 500;
  res.status(status).json({ error: message });
});

app.delete('/api/v1/bookings/:id/attachments/:attId', (req, res) => {
  const items = readStore<BookingRecord[]>('bookings', []);
  const idx = items.findIndex(i => i.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Booking not found' });
  const attId = Number(req.params.attId);
  const att = items[idx].attachments?.find(a => a.id === attId);
  if (!att) return res.status(404).json({ error: 'Attachment not found' });
  fs.unlink(path.join(UPLOAD_DIR, path.basename(att.path)), () => {});
  items[idx] = { ...items[idx], attachments: (items[idx].attachments || []).filter(a => a.id !== attId) };
  writeStore('bookings', items);
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
