import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { FontAwesome6 } from '@expo/vector-icons';
import { getBookings, createBooking, updateBooking, deleteBooking, type Booking } from '@/services/api';
import { useDataPolling } from '@/hooks/useDataPolling';

const C = {
  primary: '#C75B39', secondary: '#2B5F83', gold: '#D4A853',
  bg: '#FAF5EF', surface: '#FFFCF7', text: '#2C1810',
  muted: '#7A6B5D', border: '#E8DDD0', success: '#5B8C3E', danger: '#B83232',
};

interface BookingForm {
  city: string;
  date: string;
  attraction: string;
  price: string;
  need_reservation: number;
  booking_link: string;
  note: string;
}

const EMPTY_FORM: BookingForm = {
  city: '', date: '', attraction: '', price: '',
  need_reservation: 1, booking_link: '', note: '',
};

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Booking | null>(null);

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
            bookings.map((item) => (
              <BookingCard key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
            ))
          )}
        </ScrollView>

        <BookingModal visible={modalVisible} data={editingItem}
          onClose={() => setModalVisible(false)} onSave={handleSave} />
      </View>
    </Screen>
  );
}

function BookingCard({ item, onEdit, onDelete }: { item: Booking; onEdit: (b: Booking) => void; onDelete: (id: number) => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <FontAwesome6 name="landmark" size={16} color={C.primary} />
          <Text style={styles.cardTitle}>{item.attraction}</Text>
        </View>
        {item.need_reservation ? (
          <View style={styles.resBadge}>
            <Text style={styles.resBadgeText}>需预约</Text>
          </View>
        ) : null}
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
    </View>
  );
}

// Modal with key-based re-mount
function BookingModal({ visible, data, onClose, onSave }: {
  visible: boolean; data: Booking | null;
  onClose: () => void; onSave: (d: BookingForm) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            {visible && <BookingModalInner key={data?.id ?? 'new'} data={data} onClose={onClose} onSave={onSave} />}
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function BookingModalInner({ data, onClose, onSave }: {
  data: Booking | null; onClose: () => void; onSave: (d: BookingForm) => void;
}) {
  const [form, setForm] = useState<BookingForm>(
    data ? {
      city: data.city, date: data.date, attraction: data.attraction,
      price: data.price || '', need_reservation: data.need_reservation,
      booking_link: data.booking_link || '', note: data.note || '',
    } : { ...EMPTY_FORM }
  );

  const update = (key: keyof BookingForm, val: string | number) => setForm(prev => ({ ...prev, [key]: val }));
  const handleSave = () => { onSave(form); };

  return (
    <View>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>{data ? '编辑预定' : '新增预定'}</Text>
        <TouchableOpacity onPress={onClose}>
          <FontAwesome6 name="xmark" size={18} color={C.muted} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.modalBody}>
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

  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, color: C.muted },
  emptyAddBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: C.primary, borderRadius: 12 },
  emptyAddText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  card: { backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: C.primary, shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: C.text, flex: 1 },
  resBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  resBadgeText: { fontSize: 12, fontWeight: '600', color: '#E65100' },

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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  modalBody: { padding: 20, gap: 4 },
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
});
