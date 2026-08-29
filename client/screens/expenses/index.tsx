import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Screen } from '@/components/Screen';
import {
  getExpenses, createExpense, updateExpense, deleteExpense,
  type Expense, type CreateExpense,
} from '@/services/api';
import { FontAwesome6 } from '@expo/vector-icons';
import { useDataPolling } from '@/hooks/useDataPolling';

const COLORS = {
  primary: '#C75B39',
  secondary: '#2B5F83',
  gold: '#D4A853',
  bg: '#FAF5EF',
  surface: '#FFFCF7',
  text: '#2C1810',
  muted: '#7A6B5D',
  border: '#E8DDD0',
  success: '#5B8C3E',
  danger: '#B83232',
};

const CATEGORIES = ['交通', '住宿', '餐饮', '门票', '购物', '其他'] as const;
const CATEGORY_ICONS: Record<string, string> = {
  '交通': 'train', '住宿': 'house', '餐饮': 'utensils',
  '门票': 'ticket', '购物': 'bag-shopping', '其他': 'ellipsis',
};
const CATEGORY_COLORS: Record<string, string> = {
  '交通': '#2B5F83', '住宿': '#C75B39', '餐饮': '#D4A853',
  '门票': '#5B8C3E', '购物': '#7B1FA2', '其他': '#7A6B5D',
};

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const loadExpenses = useCallback(() => {
    getExpenses().then(setExpenses).catch(console.error);
  }, []);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);
  useDataPolling(loadExpenses, 5000);

  // Summary
  const totalEUR = expenses.filter(e => e.currency === 'EUR').reduce((s, e) => s + e.amount, 0);
  const totalRMB = expenses.filter(e => e.currency === 'RMB').reduce((s, e) => s + e.amount, 0);
  const totalPerPersonEUR = expenses.filter(e => e.currency === 'EUR').reduce((s, e) => s + e.per_person, 0);
  const totalPerPersonRMB = expenses.filter(e => e.currency === 'RMB').reduce((s, e) => s + e.per_person, 0);

  // Category summary
  const categorySummary = CATEGORIES.map(cat => {
    const items = expenses.filter(e => e.category === cat);
    const total = items.reduce((s, e) => s + e.amount, 0);
    return { category: cat, total, count: items.length };
  }).filter(c => c.count > 0);

  const handleAdd = () => { setEditing(null); setModalVisible(true); };
  const handleEdit = (item: Expense) => { setEditing(item); setModalVisible(true); };
  const handleDelete = (item: Expense) => {
    const doDelete = async () => { await deleteExpense(item.id); loadExpenses(); };
    if (Platform.OS === 'web') {
      if (/* @ts-ignore */ typeof window !== 'undefined' && window.confirm(`确定删除"${item.sub_category}"？`)) {
        doDelete();
      }
    } else {
      Alert.alert('删除', `确定删除"${item.sub_category}"？`, [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <Screen>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>开销统计</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryAmount}>€{totalEUR.toFixed(1)}</Text>
              <Text style={styles.summaryLabel}>总计(EUR)</Text>
              <Text style={styles.summaryPerPerson}>人均 €{totalPerPersonEUR.toFixed(1)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryAmount}>¥{totalRMB.toFixed(0)}</Text>
              <Text style={styles.summaryLabel}>总计(RMB)</Text>
              <Text style={styles.summaryPerPerson}>人均 ¥{totalPerPersonRMB.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        {/* Category Summary */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>分类汇总</Text>
          <View style={styles.categoryGrid}>
            {categorySummary.map((cs) => (
              <View key={cs.category} style={styles.categoryCard}>
                <View style={[styles.categoryIcon, { backgroundColor: `${CATEGORY_COLORS[cs.category]}15` }]}>
                  <FontAwesome6 name={CATEGORY_ICONS[cs.category] as any} size={14} color={CATEGORY_COLORS[cs.category]} />
                </View>
                <Text style={styles.categoryName}>{cs.category}</Text>
                <Text style={styles.categoryTotal}>€{cs.total.toFixed(1)}</Text>
                <Text style={styles.categoryCount}>{cs.count}笔</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Expense List */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>开销明细</Text>
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <FontAwesome6 name="plus" size={12} color="#FFF" />
              <Text style={styles.addBtnText}>添加</Text>
            </TouchableOpacity>
          </View>
          {expenses.map((item) => (
            <View key={item.id} style={styles.expenseItem}>
              <TouchableOpacity style={styles.expenseItemLeft} onPress={() => handleEdit(item)}>
                <View style={[styles.expenseIcon, { backgroundColor: `${CATEGORY_COLORS[item.category]}15` }]}>
                  <FontAwesome6 name={CATEGORY_ICONS[item.category] as any} size={14} color={CATEGORY_COLORS[item.category]} />
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseName}>{item.sub_category}</Text>
                  <Text style={styles.expenseMeta}>{item.date} · {item.category}{item.note ? ` · ${item.note}` : ''}</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.expenseRight}>
                <View style={styles.expenseAmount}>
                  <Text style={styles.expenseAmountText}>
                    {item.currency === 'EUR' ? '€' : '¥'}{item.amount.toFixed(item.amount % 1 === 0 ? 0 : 1)}
                  </Text>
                  <Text style={styles.expensePerPerson}>人均 {item.currency === 'EUR' ? '€' : '¥'}{item.per_person.toFixed(1)}</Text>
                </View>
                <TouchableOpacity style={styles.expenseDeleteBtn} onPress={() => handleDelete(item)}>
                  <FontAwesome6 name="trash-can" size={13} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <ExpenseModal
        visible={modalVisible}
        editing={editing}
        onClose={() => { setModalVisible(false); setEditing(null); }}
        onSave={async (data) => {
          if (editing) {
            await updateExpense(editing.id, data);
          } else {
            await createExpense(data);
          }
          setModalVisible(false);
          setEditing(null);
          loadExpenses();
        }}
      />
    </Screen>
  );
}

function ExpenseModal({ visible, editing, onClose, onSave }: {
  visible: boolean;
  editing: Expense | null;
  onClose: () => void;
  onSave: (data: CreateExpense) => Promise<void>;
}) {
  // Use a key to force re-mount when editing changes, avoiding setState in useEffect
  const key = editing ? `edit-${editing.id}` : 'new';
  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ExpenseModalInner key={key} editing={editing} onClose={onClose} onSave={onSave} />
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ExpenseModalInner({ editing, onClose, onSave }: {
  editing: Expense | null;
  onClose: () => void;
  onSave: (data: CreateExpense) => Promise<void>;
}) {
  const [date, setDate] = useState(editing?.date || '');
  const [category, setCategory] = useState(editing?.category || '交通');
  const [subCategory, setSubCategory] = useState(editing?.sub_category || '');
  const [amount, setAmount] = useState(editing?.amount?.toString() || '');
  const [currency, setCurrency] = useState(editing?.currency || 'EUR');
  const [splitCount, setSplitCount] = useState(editing?.split_count?.toString() || '6');
  const [note, setNote] = useState(editing?.note || '');

  const handleSave = () => {
    if (!subCategory.trim() || !amount || !date) {
      Alert.alert('请填写必要信息', '日期、名称和金额不能为空');
      return;
    }
    onSave({
      date, category, sub_category: subCategory.trim(),
      amount: parseFloat(amount), currency,
      split_count: parseInt(splitCount) || 6, note,
    });
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{editing ? '编辑' : '新增'}开销</Text>
          <TouchableOpacity onPress={onClose}>
            <FontAwesome6 name="xmark" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.fieldLabel}>日期</Text>
              <TextInput style={styles.fieldInput} value={date} onChangeText={setDate} placeholder="如 9/24" placeholderTextColor={COLORS.muted} />

              <Text style={styles.fieldLabel}>分类</Text>
              <View style={styles.categoryPicker}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryOption, category === cat && { backgroundColor: CATEGORY_COLORS[cat] }]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.categoryOptionText, category === cat && { color: '#FFF' }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>名称</Text>
              <TextInput style={styles.fieldInput} value={subCategory} onChangeText={setSubCategory} placeholder="如：巴勒莫公寓" placeholderTextColor={COLORS.muted} />

              <Text style={styles.fieldLabel}>金额</Text>
              <View style={styles.amountRow}>
                <TextInput style={[styles.fieldInput, { flex: 1 }]} value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor={COLORS.muted} keyboardType="decimal-pad" />
                <TouchableOpacity
                  style={[styles.currencyToggle, currency === 'EUR' ? styles.currencyEUR : styles.currencyRMB]}
                  onPress={() => setCurrency(currency === 'EUR' ? 'RMB' : 'EUR')}
                >
                  <Text style={styles.currencyText}>{currency === 'EUR' ? '€ EUR' : '¥ RMB'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>分摊人数</Text>
              <TextInput style={styles.fieldInput} value={splitCount} onChangeText={setSplitCount} placeholder="6" placeholderTextColor={COLORS.muted} keyboardType="number-pad" />

              <Text style={styles.fieldLabel}>备注</Text>
              <TextInput style={styles.fieldInput} value={note} onChangeText={setNote} placeholder="选填" placeholderTextColor={COLORS.muted} />
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
        </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 100 },

  header: {
    backgroundColor: COLORS.primary, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  summaryRow: { flexDirection: 'row', marginTop: 16, alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryAmount: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  summaryPerPerson: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  summaryDivider: { width: 1, height: 50, backgroundColor: 'rgba(255,255,255,0.2)' },

  categorySection: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryCard: {
    width: '47%', backgroundColor: COLORS.surface, borderRadius: 14, padding: 14,
    shadowColor: COLORS.primary, shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  categoryIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  categoryName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  categoryTotal: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 4 },
  categoryCount: { fontSize: 11, color: COLORS.muted, marginTop: 2 },

  listSection: { paddingHorizontal: 20, marginTop: 24 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  addBtnText: { fontSize: 12, color: '#FFF', fontWeight: '600' },

  expenseItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: COLORS.primary, shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  expenseItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  expenseRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  expenseIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  expenseInfo: { flex: 1 },
  expenseName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  expenseMeta: { fontSize: 11, color: COLORS.muted, marginTop: 3 },
  expenseAmount: { alignItems: 'flex-end' },
  expenseAmountText: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  expensePerPerson: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  expenseDeleteBtn: { padding: 8, marginLeft: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  modalBody: { padding: 20, maxHeight: 400 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 14 },
  fieldInput: {
    backgroundColor: COLORS.bg, borderRadius: 12, padding: 12,
    fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border,
  },
  categoryPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryOption: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
  },
  categoryOptionText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  amountRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  currencyToggle: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 },
  currencyEUR: { backgroundColor: '#EBF5FB' },
  currencyRMB: { backgroundColor: '#FFF3E0' },
  currencyText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  modalFooter: {
    flexDirection: 'row', padding: 20, gap: 12,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  cancelBtn: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.muted },
  saveBtn: { backgroundColor: COLORS.primary },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
