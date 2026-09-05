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

const CATEGORIES = [
  { name: '必需品', icon: 'passport', color: '#C75B39' },
  { name: '衣物', icon: 'shirt', color: '#2B5F83' },
  { name: '日常洗漱', icon: 'soap', color: '#059669' },
  { name: '电子产品', icon: 'mobile', color: '#7C3AED' },
  { name: '化妆品', icon: 'spray-can', color: '#DB2777' },
  { name: '杂物', icon: 'bag-shopping', color: '#D97706' },
];

export default function PreparationScreen() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [newCategory, setNewCategory] = useState('必需品');
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
  const itemsByCategory = CATEGORIES.map(cat => ({
    ...cat,
    items: items.filter(item => (item as any).category === cat.name),
  }));

  const totalItems = items.length;
  const checkedCount = items.filter(i => i.checked).length;
  const progress = totalItems > 0 ? checkedCount / totalItems : 0;

  return (
    <Screen>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>出发前清单</Text>
          <Text style={styles.subtitle}>已准备 {checkedCount}/{totalItems} 项</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        </View>

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setIsAdding(!isAdding)}
        >
          <FontAwesome6 name={isAdding ? 'xmark' : 'plus'} size={14} color="#FFF" />
          <Text style={styles.addBtnText}>{isAdding ? '取消' : '添加物品'}</Text>
        </TouchableOpacity>

        {/* Add Form */}
        {isAdding && (
          <View style={styles.addForm}>
            <TextInput
              style={styles.input}
              placeholder="输入物品名称"
              value={newItem}
              onChangeText={setNewItem}
              onSubmitEditing={handleAdd}
            />
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.name}
                    style={[
                      styles.categoryChip,
                      newCategory === cat.name && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                    onPress={() => setNewCategory(cat.name)}
                  >
                    <FontAwesome6
                      name={cat.icon as any}
                      size={12}
                      color={newCategory === cat.name ? '#FFF' : cat.color}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        newCategory === cat.name && { color: '#FFF' },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
              <Text style={styles.submitBtnText}>确认添加</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Category Groups */}
        {itemsByCategory.map(cat => (
          cat.items.length > 0 && (
            <View key={cat.name} style={styles.categoryGroup}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: cat.color }]}>
                  <FontAwesome6 name={cat.icon as any} size={14} color="#FFF" />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
                <Text style={styles.categoryCount}>
                  {cat.items.filter(i => i.checked).length}/{cat.items.length}
                </Text>
              </View>
              {cat.items.map((item) => (
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
          )
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.muted, marginTop: 4 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  progressBar: { flex: 1, height: 8, backgroundColor: COLORS.border, borderRadius: 4 },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  progressText: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary, minWidth: 40, textAlign: 'right' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12, marginBottom: 16, gap: 8 },
  addBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  addForm: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, fontSize: 14, backgroundColor: '#FFF', marginBottom: 12 },
  categoryScroll: { marginBottom: 12 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, gap: 6, backgroundColor: '#FFF' },
  categoryChipText: { fontSize: 12, color: COLORS.muted },
  submitBtn: { backgroundColor: COLORS.primary, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  categoryGroup: { marginBottom: 20 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  categoryIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  categoryName: { fontSize: 16, fontWeight: '600', color: COLORS.text, flex: 1 },
  categoryCount: { fontSize: 13, color: COLORS.muted },
  listContainer: {},
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  itemChecked: { opacity: 0.6 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  itemLabel: { flex: 1, fontSize: 15, color: COLORS.text },
  itemLabelChecked: { textDecorationLine: 'line-through', color: COLORS.muted },
  deleteBtn: { padding: 8 },
});
