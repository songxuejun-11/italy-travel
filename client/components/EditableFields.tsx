import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

const COLORS = {
  primary: '#C75B39',
  bg: '#FAF5EF',
  surface: '#FFFCF7',
  text: '#2C1810',
  muted: '#7A6B5D',
  border: '#E8DDD0',
  editBg: '#FFF8E1',
};

// Inline editable text field
export function EditableText({
  value,
  onSave,
  placeholder,
  multiline,
  style,
}: {
  value: string;
  onSave: (val: string) => void;
  placeholder?: string;
  multiline?: boolean;
  style?: Record<string, unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => { setText(value); }, [value]);

  const handleSave = () => {
    setEditing(false);
    if (text.trim() !== value) {
      onSave(text.trim());
    }
  };

  if (editing) {
    return (
      <TextInput
        ref={inputRef}
        style={[styles.editInput, multiline && styles.editInputMulti, style as object]}
        value={text}
        onChangeText={setText}
        onBlur={handleSave}
        onSubmitEditing={handleSave}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        multiline={multiline}
        autoFocus
      />
    );
  }

  return (
    <TouchableOpacity
      style={[styles.displayBox, style as object]}
      onPress={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 50); }}
      activeOpacity={0.7}
    >
      <Text style={styles.displayText} numberOfLines={multiline ? undefined : 1}>
        {value || placeholder || '点击编辑'}
      </Text>
      <FontAwesome6 name="pen" size={10} color={COLORS.muted} style={styles.editIcon} />
    </TouchableOpacity>
  );
}

// Editable list item (for tips, transport, etc.)
export function EditableListItem({
  value,
  onSave,
  onDelete,
  index,
}: {
  value: string;
  onSave: (val: string) => void;
  onDelete: () => void;
  index: number;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => { setText(value); }, [value]);

  const handleSave = () => {
    setEditing(false);
    if (text.trim() && text.trim() !== value) {
      onSave(text.trim());
    } else if (!text.trim()) {
      onDelete();
    }
  };

  if (editing) {
    return (
      <View style={styles.editRow}>
        <Text style={styles.editIndex}>{index + 1}</Text>
        <TextInput
          ref={inputRef}
          style={styles.editListInput}
          value={text}
          onChangeText={setText}
          onBlur={handleSave}
          onSubmitEditing={handleSave}
          autoFocus
          multiline
        />
      </View>
    );
  }

  return (
    <View style={styles.listItemRow}>
      <Text style={styles.listIndex}>{index + 1}</Text>
      <TouchableOpacity
        style={styles.listItemContent}
        onPress={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 50); }}
      >
        <Text style={styles.listItemText}>{value}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.deleteSmallBtn}>
        <FontAwesome6 name="xmark" size={12} color={COLORS.muted} />
      </TouchableOpacity>
    </View>
  );
}

// Add item button
export function AddItemButton({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <TouchableOpacity style={styles.addBtn} onPress={onPress}>
      <FontAwesome6 name="plus" size={11} color={COLORS.primary} />
      <Text style={styles.addBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Editable text
  displayBox: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, paddingHorizontal: 8,
    borderRadius: 8, borderWidth: 1, borderColor: 'transparent',
    borderStyle: 'dashed',
  },
  displayText: { fontSize: 13, color: COLORS.text, flex: 1, lineHeight: 19 },
  editIcon: { marginLeft: 6, opacity: 0.5 },
  editInput: {
    fontSize: 13, color: COLORS.text, padding: 8,
    borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary,
    backgroundColor: COLORS.editBg, lineHeight: 19,
  },
  editInputMulti: { minHeight: 60, textAlignVertical: 'top' },

  // Editable list item
  editRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 6 },
  editIndex: { fontSize: 11, color: COLORS.muted, width: 16, textAlign: 'center', marginTop: 8 },
  editListInput: {
    flex: 1, fontSize: 13, color: COLORS.text, padding: 8,
    borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary,
    backgroundColor: COLORS.editBg, minHeight: 36, textAlignVertical: 'top',
  },

  // List item
  listItemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 6 },
  listIndex: { fontSize: 11, color: COLORS.primary, width: 16, textAlign: 'center', fontWeight: '700', marginTop: 2 },
  listItemContent: { flex: 1, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: COLORS.border, borderStyle: 'dashed' },
  listItemText: { fontSize: 13, color: COLORS.text, lineHeight: 19 },
  deleteSmallBtn: { padding: 4, marginTop: 2 },

  // Add button
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.primary, borderStyle: 'dashed',
    gap: 6, marginTop: 8,
  },
  addBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
});
