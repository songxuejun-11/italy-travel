import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Platform, LayoutAnimation, TextInput, Alert, Modal,
  KeyboardAvoidingView, Linking,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { getDays, updateDayContent, type Day, type DayContent, type Location, type TransportItem } from '@/services/api';
import { FontAwesome6 } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EditableText, EditableListItem, AddItemButton } from '@/components/EditableFields';
import { useDataPolling } from '@/hooks/useDataPolling';

const C = {
  primary: '#C75B39', secondary: '#2B5F83', gold: '#D4A853',
  bg: '#FAF5EF', surface: '#FFFCF7', text: '#2C1810',
  muted: '#7A6B5D', border: '#E8DDD0', success: '#5B8C3E', danger: '#B83232',
};

export default function RouteBookScreen() {
  const [days, setDays] = useState<Day[]>([]);
  const [activeDay, setActiveDay] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [highlightedLoc, setHighlightedLoc] = useState<string | null>(null);
  const [packingChecked, setPackingChecked] = useState<Record<string, boolean>>({});
  const insets = useSafeAreaInsets();
  const webviewRef = useRef<WebView>(null);

  const loadData = useCallback(() => {
    getDays().then(setDays).catch(console.error);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useDataPolling(loadData, 5000);

  const currentDay = days[activeDay];
  const content: DayContent = currentDay ? JSON.parse(currentDay.content_json) : {};

  const saveContent = useCallback(async (newContent: DayContent) => {
    if (!currentDay) return;
    const days2 = [...days];
    const idx = days2.findIndex(d => d.id === currentDay.id);
    if (idx >= 0) {
      days2[idx] = { ...days2[idx], content_json: JSON.stringify(newContent) };
      setDays(days2);
    }
    await updateDayContent(currentDay.id, newContent);
  }, [currentDay, days]);

  const toggle = useCallback((key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleLocPress = useCallback((name: string) => {
    setHighlightedLoc(name);
    setTimeout(() => setHighlightedLoc(null), 3000);
  }, []);

  // Day content mutation helpers
  const updateLocation = (locIdx: number, updates: Partial<Location>) => {
    const locs = [...(content.locations || [])];
    locs[locIdx] = { ...locs[locIdx], ...updates };
    saveContent({ ...content, locations: locs });
  };

  const deleteLocation = (locIdx: number) => {
    const locs = (content.locations || []).filter((_, i) => i !== locIdx);
    saveContent({ ...content, locations: locs });
  };

  const addLocation = () => {
    const locs = [...(content.locations || [])];
    locs.push({ name: '新地点', nameIt: '', cost: '免费', tags: ['景点'], order: locs.length + 1 });
    saveContent({ ...content, locations: locs });
  };

  const updateTransport = (type: 'intercity' | 'intracity', tIdx: number, updates: Partial<TransportItem>) => {
    const t = content.transport || { intercity: [], intracity: [] };
    const list = [...t[type]];
    list[tIdx] = { ...list[tIdx], ...updates };
    saveContent({ ...content, transport: { ...t, [type]: list } });
  };

  const deleteTransport = (type: 'intercity' | 'intracity', tIdx: number) => {
    const t = content.transport || { intercity: [], intracity: [] };
    const list = t[type].filter((_, i) => i !== tIdx);
    saveContent({ ...content, transport: { ...t, [type]: list } });
  };

  const addTransport = (type: 'intercity' | 'intracity') => {
    const t = content.transport || { intercity: [], intracity: [] };
    const list = [...t[type]];
    list.push(type === 'intercity' ? { desc: '新城际交通', duration: '', cost: '' } : { mode: '新市内交通', details: '' });
    saveContent({ ...content, transport: { ...t, [type]: list } });
  };

  const updateTips = (newItems: string[]) => {
    const tips = content.tips || { items: [], packingList: [] };
    saveContent({ ...content, tips: { ...tips, items: newItems } });
  };

  const addTip = () => {
    const tips = content.tips || { items: [], packingList: [] };
    saveContent({ ...content, tips: { ...tips, items: [...tips.items, '新提示'] } });
  };

  const updateAccommodation = (updates: Record<string, unknown>) => {
    const acc = content.accommodation || {};
    saveContent({ ...content, accommodation: { ...acc, ...updates } });
  };

  // Map HTML builder
  const buildMapHtml = () => {
    const locs = content.locations || [];
    const withCoords = locs.filter(l => l.lat && l.lng);
    if (withCoords.length === 0) return '<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#7A6B5D;"><p>今日暂无地点</p></body></html>';
    const markers = withCoords.map((l, i) => {
      const hl = highlightedLoc === l.name;
      const color = hl ? '#C75B39' : '#2B5F83';
      const sz = hl ? 16 : 12;
      const label = l.name.length > 4 ? l.name.substring(0, 4) : l.name;
      return `L.marker([${l.lat},${l.lng}],{icon:L.divIcon({className:'m',html:'<div style=\"width:auto;height:${sz}px;background:${color};border-radius:${sz/2}px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:${hl ? 9 : 8}px;font-weight:bold;padding:0 6px;white-space:nowrap;\">${label}</div>',iconSize:[60,${sz+4}]})}).bindPopup('<b>${l.name}</b><br/>${l.nameIt || ''}').on('click',function(){window.ReactNativeWebView.postMessage(JSON.stringify({type:'mc',name:'${l.name}'}));});`;
    }).join('\n');
    const pts = withCoords.map(l => `[${l.lat},${l.lng}]`).join(',');
    const ctr = withCoords[0];
    return `<!DOCTYPE html><html><head><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>body{margin:0;padding:0;}#map{width:100%;height:100vh;}.leaflet-popup-content-wrapper{border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);}.leaflet-popup-content{margin:8px 12px;font-family:sans-serif;}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false}).setView([${ctr.lat},${ctr.lng}],13);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'OSM'}).addTo(map);${markers}${withCoords.length > 1 ? `L.polyline([${pts}],{color:'#C75B39',weight:3,opacity:0.7,dashArray:'8,8'}).addTo(map);` : ''}map.fitBounds(L.polyline([${pts}]).getBounds().pad(0.1));</script></body></html>`;
  };

  const handleWebViewMessage = (e: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'mc') handleLocPress(msg.name);
    } catch { /* ignore */ }
  };

  if (!currentDay) {
    return <Screen><View style={styles.loading}><Text style={styles.loadingText}>加载中...</Text></View></Screen>;
  }

  const acc = content.accommodation;
  const tips = content.tips;
  const transport = content.transport;

  return (
    <Screen>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Day Tabs */}
        <View style={styles.dayTabsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabsContent}>
            {days.map((d, i) => (
              <TouchableOpacity key={d.id} style={[styles.dayTab, i === activeDay && styles.dayTabActive]}
                onPress={() => { setActiveDay(i); setExpanded({}); setHighlightedLoc(null); }}>
                <Text style={[styles.dayTabText, i === activeDay && styles.dayTabTextActive]}>Day {d.day_number}</Text>
                <Text style={[styles.dayTabSub, i === activeDay && styles.dayTabSubActive]}>{d.date}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Day Header */}
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderCity}>{currentDay.city} <Text style={styles.dayHeaderCityEn}>{currentDay.city_en}</Text></Text>
          <Text style={styles.dayHeaderDate}>{currentDay.date} {currentDay.weekday}</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          {/* Overview */}
          {content.overview && (
            <View style={styles.overviewBlock}>
              <View style={styles.overviewHighlight}>
                <EditableText value={content.overview.text} multiline
                  onSave={(v) => saveContent({ ...content, overview: { ...content.overview!, text: v } })} />
              </View>
              {content.overview.cityIntro !== undefined && (
                <>
                  <TouchableOpacity onPress={() => toggle('cityIntro')} style={styles.sectionToggle}>
                    <Text style={styles.sectionToggleTitle}>城市介绍</Text>
                    <FontAwesome6 name={expanded['cityIntro'] ? 'chevron-up' : 'chevron-down'} size={12} color={C.muted} />
                  </TouchableOpacity>
                  {expanded['cityIntro'] && (
                    <EditableText value={content.overview.cityIntro || ''} multiline
                      onSave={(v) => saveContent({ ...content, overview: { ...content.overview!, cityIntro: v } })} />
                  )}
                </>
              )}
            </View>
          )}

          {/* Accommodation */}
          {acc && !acc.sameAsPrevious && (
            <View style={styles.section}>
              <TouchableOpacity onPress={() => toggle('acc')} style={styles.sectionHeader}>
                <View style={styles.iconWrap}><FontAwesome6 name="house" size={14} color={C.primary} /></View>
                <Text style={styles.sectionLabel}>住宿</Text>
                <View style={styles.sectionRight}>
                  <TouchableOpacity style={styles.navBtn} onPress={() => {
                    if (acc.address) {
                      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(acc.address)}`;
                      if (Platform.OS === 'web') { /* @ts-ignore */ window.open(url, '_blank'); }
                    }
                  }}>
                    <FontAwesome6 name="location-arrow" size={11} color={C.secondary} />
                    <Text style={styles.navBtnText}>导航</Text>
                  </TouchableOpacity>
                  <FontAwesome6 name={expanded['acc'] ? 'chevron-up' : 'chevron-down'} size={12} color={C.muted} />
                </View>
              </TouchableOpacity>
              {expanded['acc'] && (
                <View style={styles.expanded}>
                  <View style={styles.fieldRow}><Text style={styles.fieldLabel}>入住时间</Text>
                    <EditableText value={acc.checkIn || ''} onSave={(v) => updateAccommodation({ checkIn: v })} style={{ flex: 1 }} /></View>
                  <View style={styles.fieldRow}><Text style={styles.fieldLabel}>地址</Text>
                    <EditableText value={acc.address || ''} onSave={(v) => updateAccommodation({ address: v })} style={{ flex: 1 }} /></View>
                  <View style={styles.fieldRow}><Text style={styles.fieldLabel}>条件</Text>
                    <EditableText value={acc.condition || ''} multiline onSave={(v) => updateAccommodation({ condition: v })} style={{ flex: 1 }} /></View>
                  <View style={styles.fieldRow}><Text style={styles.fieldLabel}>入住方式</Text>
                    <EditableText value={acc.checkInMethod || ''} onSave={(v) => updateAccommodation({ checkInMethod: v })} style={{ flex: 1 }} placeholder="点击编辑" /></View>
                  {acc.tips && <View style={styles.fieldRow}><Text style={styles.fieldLabel}>备注</Text>
                    <EditableText value={acc.tips} multiline onSave={(v) => updateAccommodation({ tips: v })} style={{ flex: 1 }} /></View>}
                </View>
              )}
            </View>
          )}
          {acc?.sameAsPrevious && (
            <View style={styles.sameAcc}>
              <FontAwesome6 name="house" size={12} color={C.muted} />
              <Text style={styles.sameAccText}>同前日住宿（{acc.city}）</Text>
              <TouchableOpacity style={styles.navBtn} onPress={() => {
                if (acc.address) {
                  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(acc.address)}`;
                  if (Platform.OS === 'web') { /* @ts-ignore */ window.open(url, '_blank'); }
                }
              }}>
                <FontAwesome6 name="location-arrow" size={11} color={C.secondary} />
                <Text style={styles.navBtnText}>导航</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tips */}
          {tips && (
            <View style={styles.section}>
              <TouchableOpacity onPress={() => toggle('tips')} style={styles.sectionHeader}>
                <View style={styles.iconWrap}><FontAwesome6 name="lightbulb" size={14} color={C.gold} /></View>
                <Text style={styles.sectionLabel}>Tips</Text>
                <FontAwesome6 name={expanded['tips'] ? 'chevron-up' : 'chevron-down'} size={12} color={C.muted} />
              </TouchableOpacity>
              {expanded['tips'] && (
                <View style={styles.expanded}>
                  {(tips.items || []).map((tip, i) => (
                    <EditableListItem key={i} value={tip} index={i}
                      onSave={(v) => { const items = [...tips.items]; items[i] = v; updateTips(items); }}
                      onDelete={() => { const items = tips.items.filter((_, j) => j !== i); updateTips(items); }} />
                  ))}
                  <AddItemButton onPress={addTip} label="添加提示" />
                  {/* Packing list */}
                  {(tips.packingList?.length ?? 0) > 0 && (
                    <View style={styles.packingSection}>
                      <Text style={styles.packingTitle}>出行带</Text>
                      {(tips.packingList || []).map((item, i) => {
                        const key = `${currentDay.id}-${i}`;
                        const checked = packingChecked[key] || false;
                        return (
                          <TouchableOpacity key={i} style={styles.packingItem}
                            onPress={() => setPackingChecked(prev => ({ ...prev, [key]: !prev[key] }))}>
                            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                              {checked && <FontAwesome6 name="check" size={10} color="#FFF" />}
                            </View>
                            <Text style={[styles.packingText, checked && styles.packingTextChecked]}>{item}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Locations */}
          {content.locations && content.locations.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconWrap}><FontAwesome6 name="map-pin" size={14} color={C.primary} /></View>
                <Text style={styles.sectionLabel}>地点 ({content.locations.length})</Text>
              </View>
              {content.locations.map((loc, i) => (
                <LocationCard key={i} location={loc} index={i} isHighlighted={highlightedLoc === loc.name}
                  onPress={() => handleLocPress(loc.name)}
                  onUpdate={(updates) => updateLocation(i, updates)}
                  onDelete={() => {
                    if (Platform.OS === 'web') {
                      if (/* @ts-ignore */ typeof window !== 'undefined' && window.confirm(`确定删除"${loc.name}"？`)) {
                        deleteLocation(i);
                      }
                    } else {
                      Alert.alert('删除', `确定删除"${loc.name}"？`, [
                        { text: '取消', style: 'cancel' },
                        { text: '删除', style: 'destructive', onPress: () => deleteLocation(i) },
                      ]);
                    }
                  }} />
              ))}
              <AddItemButton onPress={addLocation} label="添加地点" />
            </View>
          )}

          {/* Transport */}
          {transport && (
            <View style={styles.section}>
              <TouchableOpacity onPress={() => toggle('transport')} style={styles.sectionHeader}>
                <View style={styles.iconWrap}><FontAwesome6 name="train" size={14} color={C.secondary} /></View>
                <Text style={styles.sectionLabel}>交通</Text>
                <FontAwesome6 name={expanded['transport'] ? 'chevron-up' : 'chevron-down'} size={12} color={C.muted} />
              </TouchableOpacity>
              {expanded['transport'] && (
                <View style={styles.expanded}>
                  {(transport.intercity || []).map((t, i) => (
                    <TransportEditor key={`ic-${i}`} item={t} index={i} badge="城际" badgeColor={C.secondary}
                      onSave={(u) => updateTransport('intercity', i, u)}
                      onDelete={() => deleteTransport('intercity', i)} />
                  ))}
                  <AddItemButton onPress={() => addTransport('intercity')} label="添加城际交通" />
                  {(transport.intracity || []).map((t, i) => (
                    <TransportEditor key={`il-${i}`} item={t} index={i} badge="市内" badgeColor={C.success}
                      onSave={(u) => updateTransport('intracity', i, u)}
                      onDelete={() => deleteTransport('intracity', i)} />
                  ))}
                  <AddItemButton onPress={() => addTransport('intracity')} label="添加市内交通" />
                </View>
              )}
            </View>
          )}

          {/* Map */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconWrap}><FontAwesome6 name="globe" size={14} color={C.secondary} /></View>
              <Text style={styles.sectionLabel}>地图</Text>
            </View>
            <View style={styles.mapWrap}>
              {Platform.OS === 'web' ? (
                // @ts-ignore web only
                <iframe srcDoc={buildMapHtml()} style={{ width: '100%', height: 300, border: 'none', borderRadius: 12 }} title="map" />
              ) : (
                <WebView ref={webviewRef} source={{ html: buildMapHtml() }} style={{ height: 300, borderRadius: 12 }}
                  onMessage={handleWebViewMessage} javaScriptEnabled originWhitelist={['*']} />
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

// Location Card with inline editing
function LocationCard({ location, index, isHighlighted, onPress, onUpdate, onDelete }: {
  location: Location; index: number; isHighlighted: boolean;
  onPress: () => void; onUpdate: (u: Partial<Location>) => void; onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editModal, setEditModal] = useState(false);

  return (
    <View style={[styles.locCard, isHighlighted && styles.locCardHl]}>
      <TouchableOpacity onPress={onPress} style={styles.locCardHeader}>
        <View style={styles.locIdx}><Text style={styles.locIdxText}>{index + 1}</Text></View>
        <View style={styles.locInfo}>
          <Text style={styles.locName}>{location.name}</Text>
          {location.nameIt ? <Text style={styles.locNameIt}>{location.nameIt}</Text> : null}
          <View style={styles.locMeta}>
            {location.hours ? <Text style={styles.locMetaText}>{location.hours}</Text> : null}
            {location.cost ? <Text style={[styles.locMetaText, styles.locCost]}>{location.cost}</Text> : null}
            {location.duration ? <Text style={styles.locMetaText}>{location.duration}</Text> : null}
          </View>
          <View style={styles.locTags}>
            {(location.tags || []).map((tag, i) => (
              <View key={i} style={[styles.tag, tag === '美食' && styles.tagFood, tag === '购物' && styles.tagShop]}>
                <Text style={[styles.tagText, tag === '美食' && styles.tagTextFood, tag === '购物' && styles.tagTextShop]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>

      {location.tips ? (
        <View style={styles.locTipsRow}>
          <FontAwesome6 name="lightbulb" size={11} color={C.gold} />
          <Text style={styles.locTipsText}>{location.tips}</Text>
        </View>
      ) : null}

      <View style={styles.locActions}>
        <TouchableOpacity style={styles.locNavBtn} onPress={() => {
          const q = location.lat && location.lng ? `${location.lat},${location.lng}` : `${location.name} Italy`;
          const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
          if (Platform.OS === 'web') { /* @ts-ignore */ window.open(url, '_blank'); }
        }}>
          <FontAwesome6 name="location-arrow" size={11} color={C.secondary} />
          <Text style={styles.locNavText}>导航</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.locActionBtn} onPress={() => setEditModal(true)}>
          <FontAwesome6 name="pen" size={11} color={C.muted} />
          <Text style={styles.locActionText}>编辑</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.locActionBtn} onPress={() => setExpanded(!expanded)}>
          <FontAwesome6 name={expanded ? 'chevron-up' : 'chevron-down'} size={11} color={C.muted} />
          <Text style={styles.locActionText}>{expanded ? '收起' : '详情'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.locActionBtn} onPress={onDelete}>
          <FontAwesome6 name="trash-can" size={11} color={C.danger} />
        </TouchableOpacity>
      </View>

      {expanded && location.intro && (
        <View style={styles.locIntro}><Text style={styles.locIntroText}>{location.intro}</Text></View>
      )}

      {/* Edit Modal */}
      <Modal visible={editModal} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>编辑地点</Text>
                <TouchableOpacity onPress={() => setEditModal(false)}>
                  <FontAwesome6 name="xmark" size={18} color={C.muted} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                <Text style={styles.fieldLabel}>中文名称</Text>
                <TextInput style={styles.fieldInput} defaultValue={location.name}
                  onChangeText={(v) => onUpdate({ name: v })} />
                <Text style={styles.fieldLabel}>意大利文名称</Text>
                <TextInput style={styles.fieldInput} defaultValue={location.nameIt || ''}
                  onChangeText={(v) => onUpdate({ nameIt: v })} />
                <Text style={styles.fieldLabel}>营业时间</Text>
                <TextInput style={styles.fieldInput} defaultValue={location.hours || ''}
                  onChangeText={(v) => onUpdate({ hours: v })} placeholder="如 9:00-18:00" placeholderTextColor={C.muted} />
                <Text style={styles.fieldLabel}>人均消费</Text>
                <TextInput style={styles.fieldInput} defaultValue={location.cost || ''}
                  onChangeText={(v) => onUpdate({ cost: v })} placeholder="如 50EUR / 免费" placeholderTextColor={C.muted} />
                <Text style={styles.fieldLabel}>预计游玩时间</Text>
                <TextInput style={styles.fieldInput} defaultValue={location.duration || ''}
                  onChangeText={(v) => onUpdate({ duration: v })} placeholder="如 2h" placeholderTextColor={C.muted} />
                <Text style={styles.fieldLabel}>Tips</Text>
                <TextInput style={[styles.fieldInput, { minHeight: 60 }]} defaultValue={location.tips || ''}
                  onChangeText={(v) => onUpdate({ tips: v })} multiline placeholder="注意事项" placeholderTextColor={C.muted} />
                <Text style={styles.fieldLabel}>景点介绍</Text>
                <TextInput style={[styles.fieldInput, { minHeight: 80 }]} defaultValue={location.intro || ''}
                  onChangeText={(v) => onUpdate({ intro: v })} multiline placeholder="景点介绍" placeholderTextColor={C.muted} />
              </ScrollView>
              <View style={styles.modalFooter}>
                <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={() => setEditModal(false)}>
                  <Text style={styles.saveBtnText}>完成</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// Transport inline editor
function TransportEditor({ item, index, badge, badgeColor, onSave, onDelete }: {
  item: TransportItem; index: number; badge: string; badgeColor: string;
  onSave: (u: Partial<TransportItem>) => void; onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <View style={styles.transportItem}>
      <View style={styles.transportHeader}>
        <View style={[styles.transportBadge, { backgroundColor: `${badgeColor}15` }]}>
          <Text style={[styles.transportBadgeText, { color: badgeColor }]}>{badge}</Text>
        </View>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <FontAwesome6 name={editing ? 'check' : 'pen'} size={12} color={editing ? C.success : C.muted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete}>
          <FontAwesome6 name="trash-can" size={12} color={C.danger} />
        </TouchableOpacity>
      </View>
      {editing ? (
        <View style={{ gap: 6 }}>
          <TextInput style={styles.fieldInput} defaultValue={item.desc || item.mode || ''}
            onChangeText={(v) => item.desc !== undefined ? onSave({ desc: v }) : onSave({ mode: v })} placeholder="描述" placeholderTextColor={C.muted} />
          {item.duration !== undefined && <TextInput style={styles.fieldInput} defaultValue={item.duration || ''}
            onChangeText={(v) => onSave({ duration: v })} placeholder="耗时" placeholderTextColor={C.muted} />}
          {item.cost !== undefined && <TextInput style={styles.fieldInput} defaultValue={item.cost || ''}
            onChangeText={(v) => onSave({ cost: v })} placeholder="费用" placeholderTextColor={C.muted} />}
          <TextInput style={[styles.fieldInput, { minHeight: 50 }]} defaultValue={item.details || item.tips || ''}
            onChangeText={(v) => item.details !== undefined ? onSave({ details: v }) : onSave({ tips: v })} multiline placeholder="详情/Tips" placeholderTextColor={C.muted} />
        </View>
      ) : (
        <View>
          <Text style={styles.transportDesc}>{item.desc || item.mode}</Text>
          {item.duration ? <Text style={styles.transportDetail}>耗时：{item.duration}</Text> : null}
          {item.cost ? <Text style={styles.transportDetail}>费用：{item.cost}</Text> : null}
          {item.departure ? <Text style={styles.transportDetail}>出发站：{item.departure}</Text> : null}
          {item.time ? <Text style={styles.transportDetail}>时间：{item.time}</Text> : null}
          {item.details ? <Text style={styles.transportDetail}>{item.details}</Text> : null}
          {item.tips ? <Text style={styles.transportTip}>Tips: {item.tips}</Text> : null}
          {/* Station navigation button */}
          {item.departureLat && item.departureLng ? (
            <TouchableOpacity
              style={styles.stationNavBtn}
              onPress={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${item.departureLat},${item.departureLng}&travelmode=walking`;
                Linking.openURL(url);
              }}
            >
              <FontAwesome6 name="location-dot" size={12} color={C.primary} />
              <Text style={styles.stationNavText}>导航至{item.departure}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: C.muted },

  dayTabsWrap: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  dayTabsContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  dayTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center', minWidth: 64 },
  dayTabActive: { backgroundColor: C.primary },
  dayTabText: { fontSize: 13, fontWeight: '700', color: C.text },
  dayTabTextActive: { color: '#FFF' },
  dayTabSub: { fontSize: 10, color: C.muted, marginTop: 2 },
  dayTabSubActive: { color: 'rgba(255,255,255,0.8)' },

  dayHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  dayHeaderCity: { fontSize: 22, fontWeight: '800', color: C.text },
  dayHeaderCityEn: { fontSize: 14, fontWeight: '400', color: C.muted },
  dayHeaderDate: { fontSize: 13, color: C.muted, marginTop: 4 },

  content: { flex: 1 },
  contentInner: { paddingHorizontal: 16, paddingBottom: 100 },

  overviewBlock: { marginBottom: 16 },
  overviewHighlight: { backgroundColor: '#FFF3E0', borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: C.gold },
  sectionToggle: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  sectionToggleTitle: { fontSize: 14, fontWeight: '600', color: C.text, flex: 1 },

  section: { backgroundColor: C.surface, borderRadius: 16, marginBottom: 12, padding: 16, shadowColor: C.primary, shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1 },
  sectionRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  expanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },

  fieldRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
  fieldLabel: { fontSize: 12, color: C.muted, width: 60, paddingTop: 6 },
  fieldInput: { backgroundColor: C.bg, borderRadius: 10, padding: 10, fontSize: 13, color: C.text, borderWidth: 1, borderColor: C.border },

  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EBF5FB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  navBtnText: { fontSize: 11, color: C.secondary, fontWeight: '600' },

  sameAcc: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, padding: 12, marginBottom: 12, gap: 8 },
  sameAccText: { fontSize: 13, color: C.muted, flex: 1 },

  packingSection: { marginTop: 12 },
  packingTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
  packingItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: C.success, borderColor: C.success },
  packingText: { fontSize: 13, color: C.text },
  packingTextChecked: { textDecorationLine: 'line-through', color: C.muted },

  locCard: { backgroundColor: C.bg, borderRadius: 14, padding: 14, marginTop: 10, borderWidth: 1, borderColor: 'transparent' },
  locCardHl: { borderColor: C.primary, backgroundColor: '#FFF3E0' },
  locCardHeader: { flexDirection: 'row' },
  locIdx: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 2 },
  locIdxText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  locInfo: { flex: 1 },
  locName: { fontSize: 15, fontWeight: '700', color: C.text },
  locNameIt: { fontSize: 12, color: C.muted, marginTop: 1, fontStyle: 'italic' },
  locMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  locMetaText: { fontSize: 12, color: C.muted },
  locCost: { color: C.primary, fontWeight: '600' },
  locTags: { flexDirection: 'row', gap: 6, marginTop: 6 },
  tag: { backgroundColor: '#EBF5FB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagFood: { backgroundColor: '#FFF3E0' },
  tagShop: { backgroundColor: '#F3E5F5' },
  tagText: { fontSize: 11, color: C.secondary, fontWeight: '500' },
  tagTextFood: { color: '#E65100' },
  tagTextShop: { color: '#7B1FA2' },
  locTipsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8 },
  locTipsText: { flex: 1, fontSize: 12, color: C.text, lineHeight: 18 },
  locActions: { flexDirection: 'row', gap: 14, marginTop: 10, alignItems: 'center' },
  locNavBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locNavText: { fontSize: 11, color: C.secondary, fontWeight: '500' },
  locActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locActionText: { fontSize: 11, color: C.muted },
  locIntro: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  locIntroText: { fontSize: 13, color: C.muted, lineHeight: 20 },
  locIntroDefault: { marginTop: 8, paddingHorizontal: 4, backgroundColor: '#F5F0E8', borderRadius: 8, padding: 10 },
  locIntroTextDefault: { fontSize: 13, color: '#5A4A3A', lineHeight: 20 },

  transportItem: { marginBottom: 12, backgroundColor: C.bg, borderRadius: 12, padding: 12 },
  transportHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  transportBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  transportBadgeText: { fontSize: 11, fontWeight: '600' },
  transportDesc: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 4 },
  transportDetail: { fontSize: 13, color: C.muted, lineHeight: 19 },
  transportTip: { fontSize: 12, color: C.primary, marginTop: 4, lineHeight: 18 },

  stationNavBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: `${C.primary}10`, borderRadius: 8, alignSelf: 'flex-start' },
  stationNavText: { fontSize: 12, color: C.primary, fontWeight: '600' },

  mapWrap: { borderRadius: 12, overflow: 'hidden', marginTop: 8, height: 300, backgroundColor: '#E8DDD0' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  modalBody: { padding: 20, gap: 4 },
  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: C.border },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  saveBtn: { backgroundColor: C.primary },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
