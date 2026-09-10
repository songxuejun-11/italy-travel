import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert, Linking,
  type ViewStyle,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import {
  getBookings, createBooking, updateBooking, deleteBooking,
  uploadBookingAttachments, deleteBookingAttachment, attachmentUrl,
  type Booking, type BookingAttachment,
} from '@/services/api';
import { useDataPolling } from '@/hooks/useDataPolling';
import * as DocumentPicker from 'expo-document-picker';

// 附件类型 → 图标
const attachmentIcon = (a: BookingAttachment): { icon: string; color: string } =>
  a.type.startsWith('image/')
    ? { icon: 'file-image', color: '#5B8C3E' }
    : { icon: 'file-pdf', color: '#B83232' };

// 人类可读的文件大小
const formatSize = (bytes: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
};

// web 端新开标签页查看附件，原生端交给系统打开
const openAttachment = (a: BookingAttachment) => {
  const url = attachmentUrl(a.path);
  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener');
  } else {
    Linking.openURL(url);
  }
};

const C = {
  primary: '#C75B39', secondary: '#2B5F83', gold: '#D4A853',
  bg: '#FAF5EF', surface: '#FFFCF7', text: '#2C1810',
  muted: '#7A6B5D', border: '#E8DDD0', success: '#5B8C3E', danger: '#B83232',
};

// 预定标签：取值、颜色与图标
const BOOKING_CATEGORIES: { value: string; color: string; icon: string }[] = [
  { value: '景点', color: '#2B5F83', icon: 'landmark' },
  { value: '交通', color: '#5B8C3E', icon: 'train' },
  { value: '餐厅', color: '#C75B39', icon: 'utensils' },
  { value: '购物', color: '#7B1FA2', icon: 'bag-shopping' },
];

const categoryStyle = (cat?: string) =>
  BOOKING_CATEGORIES.find(c => c.value === cat) || BOOKING_CATEGORIES[0];

interface BookingForm {
  city: string;
  date: string;
  attraction: string;
  price: string;
  need_reservation: number;
  booking_link: string;
  note: string;
  category: string;
}

const EMPTY_FORM: BookingForm = {
  city: '', date: '', attraction: '', price: '',
  need_reservation: 1, booking_link: '', note: '', category: '景点',
};

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Booking | null>(null);
  // 标签筛选：null = 全部
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const loadData = useCallback(() => {
    getBookings().then(setBookings).catch(console.error);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useDataPolling(loadData, 5000);

  const handleAdd = () => { setEditingItem(null); setModalVisible(true); };

  const handleEdit = (item: Booking) => { setEditingItem(item); setModalVisible(true); };

  const handleDelete = (id: number) => {
    const doDelete = async () => { await deleteBooking(id); await loadData(); };
    if (Platform.OS === 'web') {
      if (/* @ts-ignore */ typeof window !== 'undefined' && window.confirm('确定删除此预定？')) {
        doDelete();
      }
    } else {
      Alert.alert('删除', '确定删除此预定？', [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleSave = async (data: BookingForm) => {
    if (!data.attraction.trim()) { Alert.alert('错误', '景点名称不能为空'); return; }
    if (editingItem) {
      await updateBooking(editingItem.id, data);
    } else {
      await createBooking(data);
    }
    setModalVisible(false);
    await loadData();
  };

  // 直接在卡片上修改标签
  const handleCategoryChange = async (id: number, category: string) => {
    const item = bookings.find(b => b.id === id);
    if (!item || (item.category || '景点') === category) return;
    await updateBooking(id, { ...item, category });
    await loadData();
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>景点预定</Text>
            <Text style={styles.subtitle}>共 {bookings.length} 个预约</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <FontAwesome6 name="plus" size={14} color="#FFF" />
            <Text style={styles.addBtnText}>新增</Text>
          </TouchableOpacity>
        </View>

        {/* 标签筛选 */}
        {bookings.length > 0 && (
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, categoryFilter === null && styles.filterChipActive]}
              onPress={() => setCategoryFilter(null)}
            >
              <Text style={[styles.filterChipText, categoryFilter === null && styles.filterChipTextActive]}>全部</Text>
            </TouchableOpacity>
            {BOOKING_CATEGORIES.map(({ value, color }) => {
              const count = bookings.filter(b => (b.category || '景点') === value).length;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.filterChip, categoryFilter === value && styles.filterChipActive]}
                  onPress={() => setCategoryFilter(categoryFilter === value ? null : value)}
                >
                  <Text style={[styles.filterChipText, categoryFilter === value && styles.filterChipTextActive]}>
                    {value}{count > 0 ? ` ${count}` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          {bookings.length === 0 ? (
            <View style={styles.empty}>
              <FontAwesome6 name="calendar-xmark" size={40} color={C.border} />
              <Text style={styles.emptyText}>暂无预定</Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={handleAdd}>
                <Text style={styles.emptyAddText}>添加第一个预定</Text>
              </TouchableOpacity>
            </View>
          ) : (
            bookings
              .filter(b => !categoryFilter || (b.category || '景点') === categoryFilter)
              .map((item) => (
                <BookingCard key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete}
                  onCategoryChange={handleCategoryChange} />
              ))
          )}
        </ScrollView>

        <BookingModal visible={modalVisible} data={editingItem}
          onClose={() => setModalVisible(false)} onSave={handleSave} onDataChanged={loadData} />
      </View>
    </Screen>
  );
}

function BookingCard({ item, onEdit, onDelete, onCategoryChange }: {
  item: Booking; onEdit: (b: Booking) => void; onDelete: (id: number) => void;
  onCategoryChange: (id: number, category: string) => void;
}) {
  const [categoryModal, setCategoryModal] = useState(false);
  const cat = categoryStyle(item.category);
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <FontAwesome6 name={cat.icon} size={16} color={cat.color} />
          <Text style={styles.cardTitle} numberOfLines={2}>{item.attraction}</Text>
          {/* 徽标组：类型标签（可点击改）+ 需预约，统一尺寸对齐 */}
          <View style={styles.badgeGroup}>
            <TouchableOpacity
              style={[styles.catChip, { backgroundColor: `${cat.color}15` }]}
              onPress={() => setCategoryModal(true)}
            >
              <FontAwesome6 name={cat.icon} size={9} color={cat.color} />
              <Text style={[styles.catChipText, { color: cat.color }]}>{cat.value}</Text>
            </TouchableOpacity>
            {item.need_reservation ? (
              <View style={styles.resBadge}>
                <Text style={styles.resBadgeText}>需预约</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <FontAwesome6 name="location-dot" size={12} color={C.muted} />
          <Text style={styles.infoText}>{item.city}</Text>
        </View>
        <View style={styles.infoRow}>
          <FontAwesome6 name="calendar" size={12} color={C.muted} />
          <Text style={styles.infoText}>{item.date}</Text>
        </View>
        {item.price ? (
          <View style={styles.infoRow}>
            <FontAwesome6 name="euro-sign" size={12} color={C.muted} />
            <Text style={styles.infoText}>{item.price}</Text>
          </View>
        ) : null}
        {item.booking_link ? (
          <View style={styles.infoRow}>
            <FontAwesome6 name="link" size={12} color={C.muted} />
            <Text style={[styles.infoText, styles.linkText]}>{item.booking_link}</Text>
          </View>
        ) : null}
        {item.note ? (
          <View style={styles.notesRow}>
            <FontAwesome6 name="note-sticky" size={12} color={C.gold} />
            <Text style={styles.notesText}>{item.note}</Text>
          </View>
        ) : null}
        {(item.attachments || []).length > 0 ? (
          <View style={styles.attachRow}>
            <FontAwesome6 name="paperclip" size={12} color={C.muted} />
            <View style={styles.attachList}>
              {item.attachments!.map(a => {
                const { icon, color } = attachmentIcon(a);
                return (
                  <TouchableOpacity key={a.id} style={styles.attachChip} onPress={() => openAttachment(a)}>
                    <FontAwesome6 name={icon} size={11} color={color} />
                    <Text style={styles.attachChipText} numberOfLines={1}>{a.name}</Text>
                    {a.size ? <Text style={styles.attachSize}>{formatSize(a.size)}</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(item)}>
          <FontAwesome6 name="pen" size={12} color={C.secondary} />
          <Text style={styles.actionBtnText}>编辑</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(item.id)}>
          <FontAwesome6 name="trash-can" size={12} color={C.danger} />
          <Text style={styles.actionBtnTextDanger}>删除</Text>
        </TouchableOpacity>
      </View>

      {/* 标签选择菜单 */}
      <Modal visible={categoryModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCategoryModal(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.categorySheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>修改标签</Text>
              <TouchableOpacity onPress={() => setCategoryModal(false)}>
                <FontAwesome6 name="xmark" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>
            <View style={styles.categorySheetBody}>
              {BOOKING_CATEGORIES.map(({ value, color, icon }) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.categorySheetItem, cat.value === value && { backgroundColor: `${color}15` }]}
                  onPress={() => { onCategoryChange(item.id, value); setCategoryModal(false); }}
                >
                  <FontAwesome6 name={icon} size={14} color={color} />
                  <Text style={styles.categorySheetText}>{value}</Text>
                  {cat.value === value && <FontAwesome6 name="check" size={12} color={color} />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// Modal with key-based re-mount
function BookingModal({ visible, data, onClose, onSave, onDataChanged }: {
  visible: boolean; data: Booking | null;
  onClose: () => void; onSave: (d: BookingForm) => void; onDataChanged: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={[styles.modalViewport, Platform.OS === 'web' ? styles.modalViewportWeb : null]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            {visible && <BookingModalInner key={`${data?.id ?? 'new'}-${data?.attachments?.length ?? 0}`} data={data} onClose={onClose} onSave={onSave} onDataChanged={onDataChanged} />}
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function BookingModalInner({ data, onClose, onSave, onDataChanged }: {
  data: Booking | null; onClose: () => void; onSave: (d: BookingForm) => void; onDataChanged: () => void;
}) {
  const [form, setForm] = useState<BookingForm>(
    data ? {
      city: data.city, date: data.date, attraction: data.attraction,
      price: data.price || '', need_reservation: data.need_reservation,
      booking_link: data.booking_link || '', note: data.note || '',
      category: data.category || '景点',
    } : { ...EMPTY_FORM }
  );
  // 附件：仅编辑已有预定时可管理（新预定保存后再传）
  const [attachments, setAttachments] = useState<BookingAttachment[]>(data?.attachments || []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const update = (key: keyof BookingForm, val: string | number) => setForm(prev => ({ ...prev, [key]: val }));
  const handleSave = () => { onSave(form); };

  const handlePickFiles = async () => {
    if (!data) return;
    setUploadError('');
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      type: ['image/*', 'application/pdf'],
    });
    if (result.canceled) return;
    setUploading(true);
    try {
      // web 端 asset 自带 File 对象（file 字段），直接透传
      const picked = result.assets.map(a => ({
        uri: a.uri, name: a.name || '附件', mimeType: a.mimeType || undefined,
        file: 'file' in a ? (a as { file?: File }).file : undefined,
      }));
      const saved = await uploadBookingAttachments(data.id, picked);
      setAttachments(prev => [...prev, ...saved]);
      onDataChanged();
    } catch (e) {
      setUploadError('上传失败，请重试');
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = (att: BookingAttachment) => {
    setAttachments(prev => prev.filter(a => a.id !== att.id));
    deleteBookingAttachment(data!.id, att.id)
      .then(onDataChanged)
      .catch(console.error);
  };

  return (
    <View style={styles.modalInner}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>{data ? '编辑预定' : '新增预定'}</Text>
        <TouchableOpacity onPress={onClose}>
          <FontAwesome6 name="xmark" size={18} color={C.muted} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
        <Text style={styles.fieldLabel}>标签</Text>
        <View style={styles.categoryEditRow}>
          {BOOKING_CATEGORIES.map(({ value, color, icon }) => (
            <TouchableOpacity
              key={value}
              style={[styles.categoryEditChip, form.category === value && { backgroundColor: `${color}15`, borderColor: color }]}
              onPress={() => update('category', value)}
            >
              <FontAwesome6 name={icon} size={11} color={form.category === value ? color : C.muted} />
              <Text style={[styles.categoryEditText, form.category === value && { color }]}>{value}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.fieldLabel}>景点名称 *</Text>
        <TextInput style={styles.fieldInput} value={form.attraction} onChangeText={(v) => update('attraction', v)}
          placeholder="如：罗马斗兽场" placeholderTextColor={C.muted} />
        <Text style={styles.fieldLabel}>城市</Text>
        <TextInput style={styles.fieldInput} value={form.city} onChangeText={(v) => update('city', v)}
          placeholder="如：罗马" placeholderTextColor={C.muted} />
        <Text style={styles.fieldLabel}>日期</Text>
        <TextInput style={styles.fieldInput} value={form.date} onChangeText={(v) => update('date', v)}
          placeholder="如：10/4" placeholderTextColor={C.muted} />
        <Text style={styles.fieldLabel}>价格</Text>
        <TextInput style={styles.fieldInput} value={form.price} onChangeText={(v) => update('price', v)}
          placeholder="如：18EUR/人" placeholderTextColor={C.muted} />
        <Text style={styles.fieldLabel}>是否需要预约</Text>
        <View style={styles.switchRow}>
          <TouchableOpacity style={[styles.switchOption, form.need_reservation === 1 && styles.switchActive]}
            onPress={() => update('need_reservation', 1)}>
            <Text style={[styles.switchText, form.need_reservation === 1 && styles.switchTextActive]}>需要</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.switchOption, form.need_reservation === 0 && styles.switchActive]}
            onPress={() => update('need_reservation', 0)}>
            <Text style={[styles.switchText, form.need_reservation === 0 && styles.switchTextActive]}>不需要</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.fieldLabel}>预约链接</Text>
        <TextInput style={styles.fieldInput} value={form.booking_link} onChangeText={(v) => update('booking_link', v)}
          placeholder="https://..." placeholderTextColor={C.muted} autoCapitalize="none" />
        <Text style={styles.fieldLabel}>备注</Text>
        <TextInput style={[styles.fieldInput, { minHeight: 60 }]} value={form.note} onChangeText={(v) => update('note', v)}
          placeholder="注意事项" placeholderTextColor={C.muted} multiline />

        {/* 附件 */}
        <Text style={styles.fieldLabel}>附件</Text>
        {data ? (
          <View style={styles.attachSection}>
            {attachments.map(a => {
              const { icon, color } = attachmentIcon(a);
              return (
                <View key={a.id} style={styles.attachItem}>
                  <FontAwesome6 name={icon} size={14} color={color} />
                  <Text style={styles.attachName} numberOfLines={1}>{a.name}</Text>
                  <TouchableOpacity style={styles.attachViewBtn} onPress={() => openAttachment(a)}>
                    <Text style={styles.attachViewText}>查看</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.attachDelBtn} onPress={() => handleRemoveAttachment(a)}>
                    <FontAwesome6 name="xmark" size={11} color={C.danger} />
                  </TouchableOpacity>
                </View>
              );
            })}
            <TouchableOpacity style={styles.attachAddBtn} onPress={handlePickFiles} disabled={uploading}>
              <FontAwesome6 name={uploading ? 'spinner' : 'cloud-arrow-up'} size={13} color={C.secondary} />
              <Text style={styles.attachAddText}>{uploading ? '上传中...' : '上传图片 / PDF'}</Text>
            </TouchableOpacity>
            {uploadError ? <Text style={styles.attachError}>{uploadError}</Text> : null}
          </View>
        ) : (
          <Text style={styles.attachHint}>保存预定后即可上传门票、确认单等附件</Text>
        )}
      </ScrollView>
      <View style={styles.modalFooter}>
        <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={onClose}>
          <Text style={styles.cancelBtnText}>取消</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleSave}>
          <Text style={styles.saveBtnText}>保存</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: C.text },
  subtitle: { fontSize: 13, color: C.muted, marginTop: 4 },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
  addBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },

  // 标签筛选行
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  filterChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterChipText: { fontSize: 12, color: C.muted },
  filterChipTextActive: { color: '#FFF', fontWeight: '600' },

  // 标签选择菜单
  categorySheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  categorySheetBody: { padding: 16, gap: 8, paddingBottom: 32 },
  categorySheetItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12 },
  categorySheetText: { fontSize: 15, color: C.text, flex: 1 },

  // 编辑弹窗内的标签行
  categoryEditRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryEditChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  categoryEditText: { fontSize: 13, color: C.muted },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, color: C.muted },
  emptyAddBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: C.primary, borderRadius: 12 },
  emptyAddText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  card: { backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: C.primary, shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  cardHeader: { marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: C.text, flex: 1 },
  // 徽标组：类型标签与需预约并排，同规格（字号 11 / 内边距 3 / 圆角 6 / 高度一致）
  badgeGroup: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catChipText: { fontSize: 11, fontWeight: '500' },
  resBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  resBadgeText: { fontSize: 11, fontWeight: '600', color: '#E65100' },

  cardBody: { gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, color: C.text },
  linkText: { color: C.secondary },
  notesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4 },
  notesText: { fontSize: 13, color: C.gold, flex: 1, lineHeight: 19 },

  cardActions: { flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtnText: { fontSize: 13, color: C.secondary },
  actionBtnTextDanger: { fontSize: 13, color: C.danger },

  // Modal
  // web 端 Modal 是 position:fixed，其底边落在浏览器工具栏后面；
  // 100dvh 为动态可视高度（自动排除工具栏），使弹窗整体锚定在真实可见区域内
  modalViewport: { flex: 1 },
  modalViewportWeb: { height: '100dvh' } as unknown as ViewStyle,
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  // 内层与 ScrollView 允许收缩，内容超出 maxHeight 时在卡内滚动，footer 始终可见
  modalInner: { flexShrink: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  modalBody: { padding: 20, gap: 4, flexShrink: 1 },
  modalBodyContent: { paddingBottom: 8 },
  modalFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: C.border },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  cancelBtn: { backgroundColor: C.bg },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: C.muted },
  saveBtn: { backgroundColor: C.primary },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6, marginTop: 12 },
  fieldInput: { backgroundColor: C.bg, borderRadius: 12, padding: 12, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border },

  switchRow: { flexDirection: 'row', gap: 8 },
  switchOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: C.bg },
  switchActive: { backgroundColor: C.primary },
  switchText: { fontSize: 14, color: C.muted, fontWeight: '500' },
  switchTextActive: { color: '#FFF' },

  // 附件 —— 卡片上的展示
  attachRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4 },
  attachList: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  attachChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, maxWidth: '100%' },
  attachChipText: { fontSize: 12, color: C.secondary, flexShrink: 1 },
  attachSize: { fontSize: 11, color: C.muted },

  // 附件 —— 编辑弹窗内
  attachSection: { gap: 8 },
  attachItem: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  attachName: { fontSize: 13, color: C.text, flex: 1, flexShrink: 1 },
  attachViewBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: `${C.secondary}15` },
  attachViewText: { fontSize: 12, color: C.secondary, fontWeight: '500' },
  attachDelBtn: { padding: 4 },
  attachAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', borderRadius: 10, paddingVertical: 12, backgroundColor: C.bg },
  attachAddText: { fontSize: 13, color: C.secondary, fontWeight: '500' },
  attachError: { fontSize: 12, color: C.danger },
  attachHint: { fontSize: 12, color: C.muted },
});
