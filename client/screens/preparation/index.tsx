import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Platform, LayoutAnimation, UIManager,
} from 'react-native';
import { Screen } from '@/components/Screen';
import {
  getChecklist, createChecklistItem, updateChecklistItem, deleteChecklistItem,
  type ChecklistItem,
} from '@/services/api';
import { FontAwesome6 } from '@expo/vector-icons';
import { useDataPolling } from '@/hooks/useDataPolling';

// Android 需要开启 LayoutAnimation
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
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

// 预置分类不允许删除
const BUILTIN_CATEGORIES = new Set(CATEGORIES);

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
  // 用户自定义分类（会话内有效），与预置分类合并展示
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState('');
  // 右侧导航菜单：默认收起
  const [navOpen, setNavOpen] = useState(false);
  // Screen 会把 ScrollView 替换为 KeyboardAwareScrollView，其滚动 API 是 scrollToPosition
  const scrollRef = useRef<{ scrollToPosition?: (x: number, y: number, animated?: boolean) => void; scrollTo?: (opts: { y: number; animated?: boolean }) => void } | null>(null);
  const sectionYs = useRef<Record<string, number>>({});

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

  // 全部可用分类 = 预置分类 + 数据里出现过的分类 + 本次会话新建的分类
  const allCategories = Array.from(new Set([
    ...CATEGORIES,
    ...items.map(i => i.category),
    ...customCategories,
  ]));

  // Group items by category
  const itemsByCategory = allCategories.reduce((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  // 新建标签：非空、去重后加入可选列表并直接选中
  const handleCreateCategory = () => {
    const name = categoryDraft.trim();
    if (!name) { setShowCategoryInput(false); return; }
    if (!allCategories.includes(name)) {
      setCustomCategories(prev => [...prev, name]);
    }
    setNewCategory(name);
    setCategoryDraft('');
    setShowCategoryInput(false);
  };

  // 展开/收起导航菜单
  const toggleNav = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNavOpen(prev => !prev);
  };

  // 点击导航标签：滚动到对应分组（预留标题高度偏移，避免贴边）
  const scrollToCategory = (cat: string) => {
    const y = sectionYs.current[cat];
    if (y !== undefined && scrollRef.current) {
      const target = Math.max(0, y - 8);
      if (scrollRef.current.scrollToPosition) {
        // KeyboardAwareScrollView
        scrollRef.current.scrollToPosition(0, target, true);
      } else if (scrollRef.current.scrollTo) {
        // 原生 ScrollView 兜底
        scrollRef.current.scrollTo({ y: target, animated: true });
      }
    }
    toggleNav();
  };

  // 记录各分组在滚动内容中的纵坐标
  const recordSectionY = (cat: string, y: number) => {
    sectionYs.current[cat] = y;
  };

  // 删除自定义标签：连同其下所有物品一起删除（二次确认）
  const handleDeleteCategory = (cat: string) => {
    const catItems = items.filter(i => i.category === cat);
    const doDelete = async () => {
      // 逐个删除该分类下的物品
      await Promise.all(catItems.map(i => deleteChecklistItem(i.id)));
      // 从自定义列表移除（新建未使用的标签）
      setCustomCategories(prev => prev.filter(c => c !== cat));
      // 若被删标签正被选中，重置回杂物
      if (newCategory === cat) setNewCategory('杂物');
      loadItems();
    };
    const msg = catItems.length > 0
      ? `将删除标签「${cat}」及其下 ${catItems.length} 个物品，且无法恢复。确定删除？`
      : `确定删除标签「${cat}」？`;
    if (Platform.OS === 'web') {
      if (/* @ts-ignore */ typeof window !== 'undefined' && window.confirm(msg)) {
        doDelete();
      }
    } else {
      Alert.alert('删除标签', msg, [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const checkedCount = items.filter(i => i.checked).length;
  const progress = items.length > 0 ? checkedCount / items.length : 0;

  return (
    <Screen>
      {/* 冻结的头部：标题 + 进度条，不随内容滚动 */}
      <View style={styles.stickyHeader}>
        <View style={styles.header}>
          <Text style={styles.title}>出发前清单</Text>
          <Text style={styles.subtitle}>已准备 {checkedCount}/{items.length} 项</Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        /* Screen 会将 ScrollView 替换为 KeyboardAwareScrollView 并丢弃 ref。
           innerRef 是该组件透出内部滚动器的专用 prop，但它以函数形式被调用，
           因此用回调把拿到的实例写进 scrollRef */
        innerRef={(node: typeof scrollRef.current) => { scrollRef.current = node; }}
      >
        {/* Categories */}
        {allCategories.map((category) => {
          const categoryItems = itemsByCategory[category] || [];
          if (categoryItems.length === 0) return null;

          const categoryChecked = categoryItems.filter(i => i.checked).length;
          const icon = CATEGORY_ICONS[category] || 'box-open';

          return (
            <View
              key={category}
              style={styles.categorySection}
              onLayout={(e) => recordSectionY(category, e.nativeEvent.layout.y)}
            >
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
                {allCategories.map((cat) => {
                  const deletable = !BUILTIN_CATEGORIES.has(cat);
                  return (
                    <View
                      key={cat}
                      style={[styles.categoryChip, newCategory === cat && styles.categoryChipActive, deletable && styles.categoryChipDeletable]}
                    >
                      <TouchableOpacity style={styles.categoryChipPress} onPress={() => setNewCategory(cat)}>
                        <Text style={[styles.categoryChipText, newCategory === cat && styles.categoryChipTextActive]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                      {deletable && (
                        <TouchableOpacity
                          style={styles.categoryChipDelete}
                          onPress={() => handleDeleteCategory(cat)}
                          hitSlop={{ top: 6, bottom: 6, left: 4, right: 6 }}
                        >
                          <FontAwesome6 name="xmark" size={9} color={COLORS.muted} />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
                <TouchableOpacity
                  style={styles.categoryAddChip}
                  onPress={() => setShowCategoryInput(true)}
                >
                  <FontAwesome6 name="plus" size={11} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              {showCategoryInput && (
                <View style={styles.categoryInputRow}>
                  <TextInput
                    style={styles.categoryInput}
                    placeholder="新标签名称"
                    value={categoryDraft}
                    onChangeText={setCategoryDraft}
                    autoFocus
                    placeholderTextColor={COLORS.muted}
                    onSubmitEditing={handleCreateCategory}
                  />
                  <TouchableOpacity
                    style={styles.categoryInputCancel}
                    onPress={() => { setShowCategoryInput(false); setCategoryDraft(''); }}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <FontAwesome6 name="xmark" size={13} color={COLORS.muted} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.categoryInputConfirm} onPress={handleCreateCategory}>
                    <FontAwesome6 name="check" size={12} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}
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

      {/* 右侧导航菜单：收起时为吸附右缘的半透明圆角方形按钮（左箭头），展开为标签列表面板 */}
      <View style={styles.navFloating} pointerEvents="box-none">
        {navOpen ? (
          <View style={styles.navPanel}>
            <View style={styles.navHeader}>
              <Text style={styles.navTitle}>标签导航</Text>
              <TouchableOpacity onPress={toggleNav} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <FontAwesome6 name="xmark" size={14} color={COLORS.muted} />
              </TouchableOpacity>
            </View>
            {(allCategories.filter(cat => (itemsByCategory[cat] || []).length > 0)).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.navItem}
                onPress={() => scrollToCategory(cat)}
              >
                <FontAwesome6 name={CATEGORY_ICONS[cat] || 'box-open'} size={13} color={COLORS.primary} />
                <Text style={styles.navItemText}>{cat}</Text>
                <Text style={styles.navItemCount}>{itemsByCategory[cat].length}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TouchableOpacity style={styles.navFab} onPress={toggleNav}>
            <FontAwesome6 name="chevron-left" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 40 },
  stickyHeader: { backgroundColor: COLORS.bg, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  header: {},
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.muted, marginTop: 4 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 },
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
  categoryChip: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  categoryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryChipPress: { paddingHorizontal: 12, paddingVertical: 6 },
  categoryChipDelete: { paddingRight: 8, paddingVertical: 6 },
  categoryChipText: { fontSize: 13, color: COLORS.muted },
  categoryChipTextActive: { color: '#FFF' },
  categoryAddChip: { width: 32, height: 30, borderRadius: 16, borderWidth: 1, borderColor: COLORS.primary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  categoryInputRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  categoryInput: { flex: 1, borderWidth: 1, borderColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: COLORS.text, backgroundColor: COLORS.bg },
  categoryInputCancel: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  categoryInputConfirm: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },

  // 右侧导航菜单
  navFloating: { position: 'absolute', right: 0, top: 120, alignItems: 'flex-end' },
  navFab: { width: 34, height: 44, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, backgroundColor: 'rgba(255,252,247,0.85)', borderWidth: 1, borderColor: COLORS.border, borderRightWidth: 0, alignItems: 'center', justifyContent: 'center' },
  navPanel: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 8, marginRight: 14, minWidth: 150, shadowColor: '#2C1810', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, borderWidth: 1, borderColor: COLORS.border },
  navHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
  navTitle: { fontSize: 12, fontWeight: '600', color: COLORS.muted },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 8, borderRadius: 8 },
  navItemText: { fontSize: 14, color: COLORS.text, flex: 1 },
  navItemCount: { fontSize: 12, color: COLORS.muted },
  addButtons: { flexDirection: 'row', gap: 12, marginTop: 12 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.bg, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: COLORS.muted, fontWeight: '500' },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center' },
  confirmBtnText: { fontSize: 15, color: '#FFF', fontWeight: '600' },
});
