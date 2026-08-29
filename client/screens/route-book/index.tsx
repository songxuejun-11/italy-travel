import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Platform, LayoutAnimation,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { getDays, updateDayContent, type Day, type DayContent, type Location } from '@/services/api';
import { FontAwesome6 } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
};

export default function RouteBookScreen() {
  const [days, setDays] = useState<Day[]>([]);
  const [activeDay, setActiveDay] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [highlightedLoc, setHighlightedLoc] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const dayScrollViewRef = useRef<ScrollView>(null);
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    getDays().then((d) => {
      setDays(d);
      if (d.length > 0) setActiveDay(0);
    });
  }, []);

  const currentDay = days[activeDay];
  const content: DayContent = currentDay ? JSON.parse(currentDay.content_json) : {};

  const toggleSection = useCallback((key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleLocPress = useCallback((locName: string) => {
    setHighlightedLoc(locName);
    // Send message to WebView to highlight marker
    if (webviewRef.current) {
      webviewRef.current.postMessage(JSON.stringify({ type: 'highlight', name: locName }));
    }
    // Auto-clear highlight after 3s
    setTimeout(() => setHighlightedLoc(null), 3000);
  }, []);

  const handleWebViewMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'markerClick') {
        setHighlightedLoc(msg.name);
        setTimeout(() => setHighlightedLoc(null), 3000);
      }
    } catch { /* ignore */ }
  }, []);

  // Build map HTML
  const buildMapHtml = useCallback(() => {
    const locations = content.locations || [];
    if (locations.length === 0) return '<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#7A6B5D;"><p>今日暂无地点</p></body></html>';

    const markers = locations.filter(l => l.lat && l.lng).map((l, i) => {
      const isHighlighted = highlightedLoc === l.name;
      const color = isHighlighted ? '#C75B39' : '#2B5F83';
      const size = isHighlighted ? 14 : 10;
      return `L.marker([${l.lat}, ${l.lng}], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: '<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:8px;font-weight:bold;">${i + 1}</div>',
          iconSize: [${size + 4}, ${size + 4}],
        })
      }).bindPopup('${l.name}').on('click', function() { window.ReactNativeWebView.postMessage(JSON.stringify({type:'markerClick',name:'${l.name}'})); });`;
    }).join('\n');

    const pathPoints = locations.filter(l => l.lat && l.lng).map(l => `[${l.lat}, ${l.lng}]`).join(',');
    const center = locations.find(l => l.lat && l.lng);

    return `<!DOCTYPE html><html><head>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>body{margin:0;padding:0;}#map{width:100%;height:100vh;}</style>
    </head><body>
      <div id="map"></div>
      <script>
        var map = L.map('map',{zoomControl:false}).setView([${center?.lat || 41.9}, ${center?.lng || 12.5}], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'OSM'}).addTo(map);
        ${markers}
        ${locations.filter(l => l.lat && l.lng).length > 1 ? `L.polyline([${pathPoints}],{color:'#C75B39',weight:3,opacity:0.7,dashArray:'8,8'}).addTo(map);` : ''}
        document.addEventListener('message', function(e) {
          var msg = JSON.parse(e.data);
          if(msg.type==='highlight'){/* handle highlight */}
        });
      </script>
    </body></html>`;
  }, [content, highlightedLoc]);

  if (!currentDay) {
    return <Screen><View style={styles.loading}><Text style={styles.loadingText}>加载中...</Text></View></Screen>;
  }

  const acc = content.accommodation;
  const isAccExpanded = expandedSections['acc'] || false;
  const isTipsExpanded = expandedSections['tips'] || false;

  return (
    <Screen>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Day Tabs */}
        <View style={styles.dayTabsContainer}>
          <ScrollView
            ref={dayScrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayTabsContent}
          >
            {days.map((d, i) => (
              <TouchableOpacity
                key={d.id}
                style={[styles.dayTab, i === activeDay && styles.dayTabActive]}
                onPress={() => { setActiveDay(i); setExpandedSections({}); setHighlightedLoc(null); }}
              >
                <Text style={[styles.dayTabText, i === activeDay && styles.dayTabTextActive]}>
                  Day {d.day_number}
                </Text>
                <Text style={[styles.dayTabSub, i === activeDay && styles.dayTabSubActive]}>
                  {d.date}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Day Header */}
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderCity}>
            {currentDay.city} <Text style={styles.dayHeaderCityEn}>{currentDay.city_en}</Text>
          </Text>
          <Text style={styles.dayHeaderDate}>
            {currentDay.date} {currentDay.weekday}
          </Text>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          {/* Overview */}
          {content.overview && (
            <View style={styles.overviewBlock}>
              <View style={styles.overviewHighlight}>
                <Text style={styles.overviewText}>{content.overview.text}</Text>
              </View>
              {content.overview.cityIntro ? (
                <TouchableOpacity onPress={() => toggleSection('cityIntro')} style={styles.collapsibleHeader}>
                  <Text style={styles.collapsibleTitle}>城市介绍</Text>
                  <FontAwesome6
                    name={expandedSections['cityIntro'] ? 'chevron-up' : 'chevron-down'}
                    size={12} color={COLORS.muted}
                  />
                </TouchableOpacity>
              ) : null}
              {expandedSections['cityIntro'] && content.overview.cityIntro && (
                <Text style={styles.cityIntroText}>{content.overview.cityIntro}</Text>
              )}
            </View>
          )}

          {/* Accommodation */}
          {acc && !acc.sameAsPrevious && (
            <View style={styles.sectionBlock}>
              <TouchableOpacity onPress={() => toggleSection('acc')} style={styles.collapsibleHeader}>
                <View style={styles.sectionIconWrap}>
                  <FontAwesome6 name="house" size={14} color={COLORS.primary} />
                </View>
                <View style={styles.sectionHeaderContent}>
                  <Text style={styles.sectionLabel}>住宿</Text>
                  <Text style={styles.accCity}>{acc.city} · {acc.address?.split(',')[0]}</Text>
                </View>
                <View style={styles.sectionHeaderRight}>
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      if (acc.address) {
                        const url = Platform.OS === 'web'
                          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(acc.address)}`
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(acc.address)}`;
                        if (Platform.OS === 'web') {
                          // @ts-ignore web only
                          window.open(url, '_blank');
                        }
                      }
                    }}
                  >
                    <FontAwesome6 name="location-arrow" size={12} color={COLORS.secondary} />
                    <Text style={styles.navButtonText}>导航</Text>
                  </TouchableOpacity>
                  <FontAwesome6
                    name={isAccExpanded ? 'chevron-up' : 'chevron-down'}
                    size={12} color={COLORS.muted}
                  />
                </View>
              </TouchableOpacity>
              {isAccExpanded && (
                <View style={styles.expandedContent}>
                  {acc.checkIn && <Text style={styles.detailText}>入住时间：{acc.checkIn}</Text>}
                  {acc.condition && <Text style={styles.detailText}>住宿条件：{acc.condition}</Text>}
                  {acc.checkInMethod && <Text style={styles.detailText}>入住方式：{acc.checkInMethod}</Text>}
                  {acc.tips && <Text style={styles.detailTextWarn}>Tips: {acc.tips}</Text>}
                </View>
              )}
            </View>
          )}
          {acc?.sameAsPrevious && (
            <View style={styles.sameAccBlock}>
              <FontAwesome6 name="house" size={12} color={COLORS.muted} />
              <Text style={styles.sameAccText}>同前日住宿（{acc.city}）</Text>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => {
                  if (acc.address) {
                    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(acc.address)}`;
                    if (Platform.OS === 'web') {
                      // @ts-ignore web only
                      window.open(url, '_blank');
                    }
                  }
                }}
              >
                <FontAwesome6 name="location-arrow" size={11} color={COLORS.secondary} />
                <Text style={styles.navButtonText}>导航</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tips */}
          {content.tips && (content.tips.items.length > 0 || content.tips.packingList?.length > 0) && (
            <View style={styles.sectionBlock}>
              <TouchableOpacity onPress={() => toggleSection('tips')} style={styles.collapsibleHeader}>
                <View style={styles.sectionIconWrap}>
                  <FontAwesome6 name="lightbulb" size={14} color={COLORS.gold} />
                </View>
                <Text style={styles.sectionLabel}>Tips</Text>
                <FontAwesome6
                  name={isTipsExpanded ? 'chevron-up' : 'chevron-down'}
                  size={12} color={COLORS.muted}
                />
              </TouchableOpacity>
              {isTipsExpanded && (
                <View style={styles.expandedContent}>
                  {content.tips.items.map((tip, i) => (
                    <Text key={i} style={styles.tipText}>• {tip}</Text>
                  ))}
                  {content.tips.packingList?.length > 0 && (
                    <View style={styles.packingList}>
                      <Text style={styles.packingTitle}>出行带</Text>
                      {content.tips.packingList.map((item, i) => (
                        <View key={i} style={styles.packingItem}>
                          <View style={styles.checkbox} />
                          <Text style={styles.packingItemText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Locations */}
          {content.locations && content.locations.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.collapsibleHeader}>
                <View style={styles.sectionIconWrap}>
                  <FontAwesome6 name="map-pin" size={14} color={COLORS.primary} />
                </View>
                <Text style={styles.sectionLabel}>地点 ({content.locations.length})</Text>
              </View>
              {content.locations.map((loc: Location, i: number) => (
                <LocationCard
                  key={i}
                  location={loc}
                  index={i}
                  isHighlighted={highlightedLoc === loc.name}
                  onPress={() => handleLocPress(loc.name)}
                />
              ))}
            </View>
          )}

          {/* Transport */}
          {content.transport && (
            <View style={styles.sectionBlock}>
              <TouchableOpacity onPress={() => toggleSection('transport')} style={styles.collapsibleHeader}>
                <View style={styles.sectionIconWrap}>
                  <FontAwesome6 name="train-tram" size={14} color={COLORS.secondary} />
                </View>
                <Text style={styles.sectionLabel}>交通</Text>
                <FontAwesome6
                  name={expandedSections['transport'] ? 'chevron-up' : 'chevron-down'}
                  size={12} color={COLORS.muted}
                />
              </TouchableOpacity>
              {expandedSections['transport'] && (
                <View style={styles.expandedContent}>
                  {content.transport.intercity?.map((t, i) => (
                    <View key={`ic-${i}`} style={styles.transportItem}>
                      <View style={styles.transportBadge}>
                        <Text style={styles.transportBadgeText}>城际</Text>
                      </View>
                      <Text style={styles.transportDesc}>{t.desc}</Text>
                      {t.duration && <Text style={styles.transportDetail}>耗时：{t.duration}</Text>}
                      {t.cost && <Text style={styles.transportDetail}>费用：{t.cost}</Text>}
                      {t.tips && <Text style={styles.transportTip}>Tips: {t.tips}</Text>}
                    </View>
                  ))}
                  {content.transport.intracity?.map((t, i) => (
                    <View key={`ic2-${i}`} style={styles.transportItem}>
                      <View style={[styles.transportBadge, { backgroundColor: '#E8F5E9' }]}>
                        <Text style={[styles.transportBadgeText, { color: COLORS.success }]}>市内</Text>
                      </View>
                      <Text style={styles.transportMode}>{t.mode}</Text>
                      <Text style={styles.transportDetail}>{t.details}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Map */}
          <View style={styles.mapSection}>
            <View style={styles.collapsibleHeader}>
              <View style={styles.sectionIconWrap}>
                <FontAwesome6 name="globe" size={14} color={COLORS.secondary} />
              </View>
              <Text style={styles.sectionLabel}>地图</Text>
            </View>
            <View style={styles.mapContainer}>
              {Platform.OS === 'web' ? (
                // @ts-ignore web only
                <iframe
                  srcDoc={buildMapHtml()}
                  style={{ width: '100%', height: 300, border: 'none', borderRadius: 12 }}
                  title="route-map"
                />
              ) : (
                <WebView
                  ref={webviewRef}
                  source={{ html: buildMapHtml() }}
                  style={{ height: 300, borderRadius: 12 }}
                  onMessage={handleWebViewMessage}
                  javaScriptEnabled
                  originWhitelist={['*']}
                />
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

function LocationCard({ location, index, isHighlighted, onPress }: {
  location: Location; index: number; isHighlighted: boolean; onPress: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const handleNav = () => {
    const query = location.lat && location.lng
      ? `${location.lat},${location.lng}`
      : `${location.name} ${location.nameIt || ''} Italy`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    if (Platform.OS === 'web') {
      // @ts-ignore web only
      window.open(url, '_blank');
    }
  };

  return (
    <View style={[styles.locCard, isHighlighted && styles.locCardHighlighted]}>
      <TouchableOpacity onPress={onPress} style={styles.locCardHeader}>
        <View style={styles.locIndex}>
          <Text style={styles.locIndexText}>{index + 1}</Text>
        </View>
        <View style={styles.locInfo}>
          <Text style={styles.locName}>{location.name}</Text>
          {location.nameIt && <Text style={styles.locNameIt}>{location.nameIt}</Text>}
          <View style={styles.locMeta}>
            {location.hours && <Text style={styles.locMetaText}>{location.hours}</Text>}
            {location.cost && <Text style={[styles.locMetaText, styles.locCost]}>{location.cost}</Text>}
            {location.duration && <Text style={styles.locMetaText}>{location.duration}</Text>}
          </View>
          <View style={styles.locTags}>
            {location.tags?.map((tag, i) => (
              <View key={i} style={[styles.tag, tag === '美食' && styles.tagFood, tag === '购物' && styles.tagShop]}>
                <Text style={[styles.tagText, tag === '美食' && styles.tagTextFood, tag === '购物' && styles.tagTextShop]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>

      {location.tips && <View style={styles.locTipsRow}><FontAwesome6 name="lightbulb" size={12} color={COLORS.gold} /><Text style={styles.locTips}>{location.tips}</Text></View>}

      <View style={styles.locActions}>
        <TouchableOpacity style={styles.locNavBtn} onPress={handleNav}>
          <FontAwesome6 name="location-arrow" size={11} color={COLORS.secondary} />
          <Text style={styles.locNavText}>导航</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.locExpandBtn} onPress={() => setExpanded(!expanded)}>
          <FontAwesome6 name={expanded ? 'chevron-up' : 'chevron-down'} size={11} color={COLORS.muted} />
          <Text style={styles.locExpandText}>{expanded ? '收起' : '详情'}</Text>
        </TouchableOpacity>
      </View>

      {expanded && location.intro && (
        <View style={styles.locIntro}>
          <Text style={styles.locIntroText}>{location.intro}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: COLORS.muted },

  // Day Tabs
  dayTabsContainer: { backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dayTabsContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  dayTab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    backgroundColor: COLORS.bg, alignItems: 'center', minWidth: 64,
  },
  dayTabActive: { backgroundColor: COLORS.primary },
  dayTabText: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  dayTabTextActive: { color: '#FFFFFF' },
  dayTabSub: { fontSize: 10, color: COLORS.muted, marginTop: 2 },
  dayTabSubActive: { color: 'rgba(255,255,255,0.8)' },

  // Day Header
  dayHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  dayHeaderCity: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  dayHeaderCityEn: { fontSize: 14, fontWeight: '400', color: COLORS.muted },
  dayHeaderDate: { fontSize: 13, color: COLORS.muted, marginTop: 4 },

  content: { flex: 1 },
  contentInner: { paddingHorizontal: 16, paddingBottom: 100 },

  // Overview
  overviewBlock: { marginBottom: 16 },
  overviewHighlight: {
    backgroundColor: '#FFF3E0', borderRadius: 14, padding: 16,
    borderLeftWidth: 4, borderLeftColor: COLORS.gold,
  },
  overviewText: { fontSize: 14, color: COLORS.text, lineHeight: 22 },
  collapsibleHeader: {
    flexDirection: 'row', alignItems: 'center', marginTop: 12,
    paddingVertical: 8,
  },
  collapsibleTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, flex: 1 },
  cityIntroText: { fontSize: 13, color: COLORS.muted, lineHeight: 20, marginTop: 4 },

  // Sections
  sectionBlock: {
    backgroundColor: COLORS.surface, borderRadius: 16, marginBottom: 12, padding: 16,
    shadowColor: COLORS.primary, shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionIconWrap: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#FFF3E0',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  sectionHeaderContent: { flex: 1 },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1 },
  sectionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  // Accommodation
  accCity: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  navButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EBF5FB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  navButtonText: { fontSize: 11, color: COLORS.secondary, fontWeight: '600' },
  expandedContent: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  detailText: { fontSize: 13, color: COLORS.text, lineHeight: 20, marginBottom: 6 },
  detailTextWarn: { fontSize: 13, color: COLORS.primary, lineHeight: 20, marginTop: 4 },

  sameAccBlock: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 12, marginBottom: 12, gap: 8,
  },
  sameAccText: { fontSize: 13, color: COLORS.muted, flex: 1 },

  // Tips
  tipText: { fontSize: 13, color: COLORS.text, lineHeight: 20, marginBottom: 6 },
  packingList: { marginTop: 12 },
  packingTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  packingItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  checkbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: COLORS.border, marginRight: 8 },
  packingItemText: { fontSize: 13, color: COLORS.text },

  // Locations
  locCard: {
    backgroundColor: COLORS.bg, borderRadius: 14, padding: 14, marginTop: 10,
    borderWidth: 1, borderColor: 'transparent',
  },
  locCardHighlighted: { borderColor: COLORS.primary, backgroundColor: '#FFF3E0' },
  locCardHeader: { flexDirection: 'row' },
  locIndex: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 2,
  },
  locIndexText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  locInfo: { flex: 1 },
  locName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  locNameIt: { fontSize: 12, color: COLORS.muted, marginTop: 1, fontStyle: 'italic' },
  locMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  locMetaText: { fontSize: 12, color: COLORS.muted },
  locCost: { color: COLORS.primary, fontWeight: '600' },
  locTags: { flexDirection: 'row', gap: 6, marginTop: 6 },
  tag: { backgroundColor: '#EBF5FB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagFood: { backgroundColor: '#FFF3E0' },
  tagShop: { backgroundColor: '#F3E5F5' },
  tagText: { fontSize: 11, color: COLORS.secondary, fontWeight: '500' },
  tagTextFood: { color: '#E65100' },
  tagTextShop: { color: '#7B1FA2' },
  locTips: { fontSize: 12, color: COLORS.gold, lineHeight: 18, flex: 1 },
  locTipsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8 },
  locActions: { flexDirection: 'row', gap: 16, marginTop: 10 },
  locNavBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locNavText: { fontSize: 11, color: COLORS.secondary, fontWeight: '500' },
  locExpandBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locExpandText: { fontSize: 11, color: COLORS.muted },
  locIntro: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  locIntroText: { fontSize: 13, color: COLORS.muted, lineHeight: 20 },

  // Transport
  transportItem: { marginBottom: 12 },
  transportBadge: {
    backgroundColor: '#EBF5FB', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6,
  },
  transportBadgeText: { fontSize: 11, color: COLORS.secondary, fontWeight: '600' },
  transportDesc: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  transportMode: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  transportDetail: { fontSize: 13, color: COLORS.muted, lineHeight: 19 },
  transportTip: { fontSize: 12, color: COLORS.primary, marginTop: 4, lineHeight: 18 },

  // Map
  mapSection: { marginTop: 4, marginBottom: 16 },
  mapContainer: { borderRadius: 12, overflow: 'hidden', marginTop: 8, height: 300, backgroundColor: '#E8DDD0' },
});
