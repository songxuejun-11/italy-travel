-- 重建业务表：id 统一改为 bigint（nextId() 用毫秒时间戳，超出 int32）
-- 旧表已在执行前手动 DROP

-- ===== days：行程日 =====
CREATE TABLE IF NOT EXISTS days (
  id bigint PRIMARY KEY,
  day_number integer NOT NULL,
  date text NOT NULL DEFAULT '',
  weekday text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  city_en text NOT NULL DEFAULT '',
  content_json text NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0
);

-- ===== expenses：开销 =====
CREATE TABLE IF NOT EXISTS expenses (
  id bigint PRIMARY KEY,
  date text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  sub_category text NOT NULL DEFAULT '',
  amount double precision NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  split_count integer NOT NULL DEFAULT 6,
  per_person double precision NOT NULL DEFAULT 0,
  note text NOT NULL DEFAULT ''
);

-- ===== checklist：行李清单 =====
CREATE TABLE IF NOT EXISTS checklist (
  id bigint PRIMARY KEY,
  label text NOT NULL DEFAULT '',
  checked integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT '杂物',
  sort_order integer NOT NULL DEFAULT 0
);

-- ===== bookings：预定（含附件元数据） =====
CREATE TABLE IF NOT EXISTS bookings (
  id bigint PRIMARY KEY,
  city text NOT NULL DEFAULT '',
  date text NOT NULL DEFAULT '',
  attraction text NOT NULL DEFAULT '',
  price text NOT NULL DEFAULT '',
  need_reservation integer NOT NULL DEFAULT 0,
  booking_link text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT '景点',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb
);

-- 附件 id 生成用序列（对应 nextId()）
CREATE SEQUENCE IF NOT EXISTS app_id_seq START 1788948366965;
