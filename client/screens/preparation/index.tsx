import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, LayoutAnimation, Platform,
} from 'react-native';
import { Screen } from '@/components/Screen';
import {
  getChecklist, createChecklistItem, updateChecklistItem, deleteChecklistItem,
  type ChecklistItem,
} from '@/services/api';
import { FontAwesome6 } from '@expo/vector-icons';
import { useDataPolling } from '@/hooks/useDataPolling';

const COLORS = {
  primary: '#C75B39',
  gold: '#D4A853',
  bg: '#FAF5EF',
  surface: '#FFFCF7',
  text: '#2C1810',
  muted: '#7A6B5D',
  border: '#E8DDD0',
  success: '#5B8C3E',
};

export default function PreparationScreen() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadItems = useCallback(() => {
    getChecklist().then(setItems).catch(console.error);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);
  useDataPolling(loadItems, 5000);

  const handleToggle = async (item: ChecklistItem) => {
    await updateChecklistItem({ ...item, checked: item.checked ? 0 : 1 });
    loadItems();
  };

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    await createChecklistItem(newItem.trim());
    setNewItem('');
    setIsAdding(false);
    loadItems();
  };

  const handleDelete = (item: ChecklistItem) => {
    const doDelete = async () => { await deleteChecklistItem(item.id); loadItems(); };
    if (Platform.OS === 'web') {
      if (/* @ts-ignore */ typeof window !== 'undefined' && window.confirm(`确定删除"${item.label}"？`)) {
        doDelete();
      }
    } else {
      Alert.alert('删除', `确定删除"${item.label}"？`, [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const checkedCount = items.filter(i => i.checked).length;
  const progress = items.length > 0 ? checkedCount / items.length : 0;

  return (
    <Screen>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>出发前清单</Text>
          <Text style={styles.subtitle}>已准备 {checkedCount}/{items.length} 项</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        </View>

        {/* Items */}
        <View style={styles.listContainer}>
          {items.map((item) => (
            <View key={item.id} style={[styles.item, item.checked ? styles.itemChecked : null]}>
              <TouchableOpacity
                style={[styles.checkbox, item.checked ? styles.checkboxChecked : null]}
                onPress={() => handleToggle(item)}
              >
                {item.checked ? <FontAwesome6 name="check" size={12} color="#FFF" /> : null}
              </TouchableOpacity>
              <Text
                style={[styles.itemLabel, item.checked ? styles.itemLabelChecked : null]}
                onPress={() => handleToggle(item)}
              >
                {item.label}
              </Text>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                <View style={styles.deleteBtnInner}>
                  <FontAwesome6 name="trash-can" size={13} color={COLORS.muted} />
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Add Item */}
        {isAdding ? (
          <View style={styles.addContainer}>
            <TextInput
              style={styles.addInput}
              value={newItem}
              onChangeText={setNewItem}
              placeholder="输入物品名称..."
              placeholderTextColor={COLORS.muted}
              autoFocus
              onSubmitEditing={handleAdd}
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <FontAwesome6 name="check" size={14} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setIsAdding(false); setNewItem(''); }}>
              <FontAwesome6 name="xmark" size={14} color={COLORS.muted} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addButton} onPress={() => setIsAdding(true)}>
            <FontAwesome6 name="plus" size={14} color={COLORS.primary} />
            <Text style={styles.addButtonText}>添加物品</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </Screen>
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
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 6 },

  progressContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 20, gap: 12,
  },
  progressBar: { flex: 1, height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.success, borderRadius: 4 },
  progressText: { fontSize: 14, fontWeight: '700', color: COLORS.success, minWidth: 40, textAlign: 'right' },

  listContainer: { paddingHorizontal: 20, marginTop: 20 },
  item: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: COLORS.primary, shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  itemChecked: { opacity: 0.6 },
  checkbox: {
    width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  checkboxChecked: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  itemLabel: { fontSize: 15, color: COLORS.text, flex: 1, fontWeight: '500' },
  itemLabelChecked: { textDecorationLine: 'line-through', color: COLORS.muted },
  deleteBtn: { padding: 4 },
  deleteBtnInner: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: '#FFEBEE',
    justifyContent: 'center', alignItems: 'center',
  },

  addContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 16, gap: 8,
  },
  addInput: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: 12,
    fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border,
  },
  addBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  cancelBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bg,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },

  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 20, marginTop: 16, padding: 14,
    borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: 'dashed',
    gap: 8,
  },
  addButtonText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
});
