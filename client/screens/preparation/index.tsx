import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Platform,
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

const CATEGORIES = ['必需品', '衣物', '日常洗漱', '电子产品', '化妆品', '杂物'];

const CATEGORY_ICONS: Record<string, keyof typeof FontAwesome6.glyphMap> = {
  '必需品': 'passport',
  '衣物': 'shirt',
  '日常洗漱': 'pump-soap',
  '电子产品': 'plug',
  '化妆品': 'wand-magic-sparkles',
  '杂物': 'box-open',
};

export default function PreparationScreen() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [newCategory, setNewCategory] = useState('杂物');
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
    await createChecklistItem(newItem.trim(), newCategory);
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

  // Group items by category
  const itemsByCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

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

        {/* Categories */}
        {CATEGORIES.map((category) => {
          const categoryItems = itemsByCategory[category] || [];
          if (categoryItems.length === 0) return null;

          const categoryChecked = categoryItems.filter(i => i.checked).length;
          const icon = CATEGORY_ICONS[category] || 'box-open';

          return (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryIcon}>
                  <FontAwesome6 name={icon} size={16} color={COLORS.primary} />
                </View>
                <Text style={styles.categoryTitle}>{category}</Text>
                <Text style={styles.categoryCount}>{categoryChecked}/{categoryItems.length}</Text>
              </View>

              {categoryItems.map((item) => (
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
                    <FontAwesome6 name="trash-can" size={14} color="#C75B39" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })}

        {/* Add Button */}
        {isAdding ? (
          <View style={styles.addContainer}>
            <View style={styles.addInputRow}>
              <TextInput
                style={styles.addInput}
                placeholder="物品名称"
                value={newItem}
                onChangeText={setNewItem}
                placeholderTextColor={COLORS.muted}
              />
              <View style={styles.categoryPicker}>
                {CATEGORIES.slice(0, 3).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, newCategory === cat && styles.categoryChipActive]}
                    onPress={() => setNewCategory(cat)}
                  >
                    <Text style={[styles.categoryChipText, newCategory === cat && styles.categoryChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.addButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setIsAdding(false); setNewItem(''); }}>
                <Text style={styles.cancelBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAdd}>
                <Text style={styles.confirmBtnText}>添加</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.addBtn} onPress={() => setIsAdding(true)}>
            <FontAwesome6 name="plus" size={18} color={COLORS.primary} />
            <Text style={styles.addBtnText}>添加物品</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.muted, marginTop: 4 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
  progressBar: { flex: 1, height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  progressText: { fontSize: 14, fontWeight: '600', color: COLORS.primary, minWidth: 40, textAlign: 'right' },

  categorySection: { marginBottom: 20 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  categoryIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(199,91,57,0.1)', alignItems: 'center', justifyContent: 'center' },
  categoryTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, flex: 1 },
  categoryCount: { fontSize: 13, color: COLORS.muted },

  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: COLORS.surface, borderRadius: 12, marginBottom: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  itemChecked: { opacity: 0.7 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  itemLabel: { flex: 1, fontSize: 15, color: COLORS.text },
  itemLabelChecked: { textDecorationLine: 'line-through', color: COLORS.muted },
  deleteBtn: { padding: 8, opacity: 0.6 },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', gap: 8, marginTop: 8 },
  addBtnText: { fontSize: 15, color: COLORS.primary, fontWeight: '500' },
  addContainer: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginTop: 8 },
  addInputRow: { gap: 12 },
  addInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.bg },
  categoryPicker: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border },
  categoryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryChipText: { fontSize: 13, color: COLORS.muted },
  categoryChipTextActive: { color: '#FFF' },
  addButtons: { flexDirection: 'row', gap: 12, marginTop: 12 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.bg, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: COLORS.muted, fontWeight: '500' },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center' },
  confirmBtnText: { fontSize: 15, color: '#FFF', fontWeight: '600' },
});
