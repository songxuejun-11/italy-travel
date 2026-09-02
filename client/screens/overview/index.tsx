import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Platform } from 'react-native';
import { Screen } from '@/components/Screen';
import { getTripInfo, type TripInfo, type FlightSegment } from '@/services/api';
import { FontAwesome6 } from '@expo/vector-icons';
import { useDataPolling } from '@/hooks/useDataPolling';

// Hand-drawn map image
const mapImage = require('@/assets/italy-map.jpeg');

export default function OverviewScreen() {
  const [trip, setTrip] = useState<TripInfo | null>(null);

  const loadData = useCallback(() => {
    getTripInfo().then(setTrip).catch(console.error);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useDataPolling(loadData, 5000);

  if (!trip) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Hero Header */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{trip.title}</Text>
          <Text style={styles.heroDate}>{trip.dateRange}</Text>
          <Text style={styles.heroSub}>共{trip.totalDays}天，其中旅行日{trip.travelDays}天</Text>
          <Text style={styles.heroDest}>{trip.destination}</Text>
        </View>

        {/* City Route */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>途经城市</Text>
          <View style={styles.cityRoute}>
            {trip.cities.map((city, i) => (
              <View key={i} style={styles.cityItem}>
                <View style={styles.cityDot}>
                  <Text style={styles.cityDotText}>{i + 1}</Text>
                </View>
                <Text style={styles.cityName}>{city}</Text>
                {i < trip.cities.length - 1 && (
                  <FontAwesome6 name="arrow-right" size={10} color="#C75B39" style={styles.cityArrow} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Hand-drawn Map */}
        <View style={styles.section}>
          <Image source={mapImage} style={styles.mapImage} resizeMode="contain" />
        </View>

        {/* Flights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>航班信息</Text>
          <FlightCard flight={trip.flights.outbound} />
          <View style={{ height: 16 }} />
          <FlightCard flight={trip.flights.inbound} />
        </View>

        {/* Notices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>出行须知</Text>

          <View style={styles.noticeGroup}>
            <View style={styles.noticeHeader}>
              <FontAwesome6 name="train" size={14} color="#C75B39" />
              <Text style={styles.noticeTitle}>交通须知</Text>
            </View>
            {trip.notices.transport.map((n, i) => (
              <View key={i} style={styles.noticeItem}>
                <Text style={styles.noticeNum}>{i + 1}</Text>
                <Text style={styles.noticeText}>{n}</Text>
              </View>
            ))}
          </View>

          <View style={styles.noticeGroup}>
            <View style={styles.noticeHeader}>
              <FontAwesome6 name="shield-halved" size={14} color="#C75B39" />
              <Text style={styles.noticeTitle}>出行须知</Text>
            </View>
            {trip.notices.travel.map((n, i) => (
              <View key={i} style={styles.noticeItem}>
                <Text style={styles.noticeNum}>{i + 1}</Text>
                <Text style={styles.noticeText}>{n}</Text>
              </View>
            ))}
          </View>

          <View style={styles.noticeGroup}>
            <View style={styles.noticeHeader}>
              <FontAwesome6 name="droplet" size={14} color="#C75B39" />
              <Text style={styles.noticeTitle}>日常须知</Text>
            </View>
            <Text style={styles.noticeTextFull}>{trip.notices.daily}</Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function FlightCard({ flight }: { flight: TripInfo['flights']['outbound'] }) {
  return (
    <View style={styles.flightCard}>
      <Text style={styles.flightTitle}>{flight.title}</Text>
      <Text style={styles.flightDate}>{flight.date}</Text>

      {flight.segments.map((seg: FlightSegment, i: number) => (
        <View key={i}>
          {seg.type === 'flight' ? (
            <View style={styles.flightSegment}>
              {/* Timeline dot */}
              <View style={styles.timelineCol}>
                <View style={styles.timelineDotFilled} />
                {i < flight.segments.length - 1 && <View style={styles.timelineLine} />}
              </View>
              {/* Content */}
              <View style={styles.segmentContent}>
                <Text style={styles.segmentLabel}>{seg.label}</Text>
                <View style={styles.segmentRow}>
                  <View style={styles.segmentCity}>
                    <Text style={styles.segmentCityName}>{seg.departure?.city}</Text>
                    <Text style={styles.segmentTime}>{seg.departure?.time}</Text>
                  </View>
                  <View style={styles.segmentMiddle}>
                    <FontAwesome6 name="plane" size={12} color="#C75B39" />
                    <Text style={styles.segmentDuration}>{seg.duration}</Text>
                  </View>
                  <View style={styles.segmentCity}>
                    <Text style={styles.segmentCityName}>{seg.arrival?.city}</Text>
                    <Text style={styles.segmentTime}>{seg.arrival?.time}</Text>
                  </View>
                </View>
                {/* Airport and Flight No on new line, left aligned */}
                <View style={styles.segmentInfoRow}>
                  {seg.departure?.airport && (
                    <Text style={styles.segmentAirport}>{seg.departure.airport}</Text>
                  )}
                  <Text style={styles.segmentAirline}>{seg.airline} {seg.flightNo}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.flightSegment}>
              <View style={styles.timelineCol}>
                <View style={styles.timelineDot} />
                {i < flight.segments.length - 1 && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.segmentContent}>
                <View style={styles.transitBadge}>
                  <Text style={styles.transitText}>中转 {seg.duration}</Text>
                </View>
                {seg.location && <Text style={styles.transitLocation}>{seg.location}</Text>}
              </View>
            </View>
          )}
        </View>
      ))}

      {/* Tips */}
      {flight.tips.length > 0 && (
        <View style={styles.flightTips}>
          <Text style={styles.flightTipsTitle}>Tips</Text>
          {flight.tips.map((tip: string, i: number) => (
            <Text key={i} style={styles.flightTipText}>• {tip}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 100 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#7A6B5D' },

  // Hero
  hero: {
    backgroundColor: '#C75B39',
    paddingTop: Platform.OS === 'web' ? 40 : 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: 2 },
  heroDate: { fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 8, fontWeight: '500' },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  heroDest: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  // Section
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: {
    fontSize: 18, fontWeight: '700', color: '#2C1810', marginBottom: 14,
  },

  // City Route
  cityRoute: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center',
    backgroundColor: '#FFFCF7', borderRadius: 16, padding: 16,
    shadowColor: '#C75B39', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cityItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cityDot: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#C75B39',
    justifyContent: 'center', alignItems: 'center',
  },
  cityDotText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  cityName: { fontSize: 13, color: '#2C1810', fontWeight: '500', marginLeft: 6 },
  cityArrow: { marginHorizontal: 6 },

  // Map
  mapImage: {
    width: '100%', height: 200, borderRadius: 16,
    backgroundColor: '#F0E8DE',
  },

  // Flight
  flightCard: {
    backgroundColor: '#FFFCF7', borderRadius: 16, padding: 20,
    shadowColor: '#C75B39', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  flightTitle: { fontSize: 16, fontWeight: '700', color: '#2C1810' },
  flightDate: { fontSize: 13, color: '#7A6B5D', marginTop: 4, marginBottom: 16 },

  flightSegment: { flexDirection: 'row', minHeight: 50 },
  timelineCol: { width: 24, alignItems: 'center', marginRight: 12 },
  timelineDotFilled: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#C75B39' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D4A853', borderWidth: 2, borderColor: '#C75B39' },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E8DDD0', marginVertical: 2 },

  segmentContent: { flex: 1, paddingBottom: 12 },
  segmentLabel: { fontSize: 11, color: '#7A6B5D', fontWeight: '600', marginBottom: 4 },
  segmentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  segmentCity: { flex: 1 },
  segmentCityName: { fontSize: 15, fontWeight: '700', color: '#2C1810' },
  segmentTime: { fontSize: 13, color: '#C75B39', fontWeight: '600', marginTop: 2 },
  segmentAirport: { fontSize: 11, color: '#7A6B5D', marginTop: 2 },
  segmentMiddle: { alignItems: 'center', paddingHorizontal: 12 },
  segmentDuration: { fontSize: 11, color: '#7A6B5D', marginTop: 2 },
  segmentInfoRow: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginTop: 6, gap: 8 },
  segmentAirline: { fontSize: 12, color: '#2B5F83', fontWeight: '500' },

  transitBadge: {
    backgroundColor: '#FFF3E0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  transitText: { fontSize: 12, color: '#D4A853', fontWeight: '600' },
  transitLocation: { fontSize: 12, color: '#7A6B5D', marginTop: 4 },

  flightTips: {
    marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E8DDD0',
  },
  flightTipsTitle: { fontSize: 13, fontWeight: '700', color: '#D4A853', marginBottom: 6 },
  flightTipText: { fontSize: 12, color: '#7A6B5D', lineHeight: 18, marginBottom: 4 },

  // Notices
  noticeGroup: {
    backgroundColor: '#FFFCF7', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#C75B39', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  noticeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: '#2C1810', marginLeft: 8 },
  noticeItem: { flexDirection: 'row', marginBottom: 8, paddingLeft: 4 },
  noticeNum: {
    fontSize: 11, fontWeight: '700', color: '#C75B39', marginRight: 8,
    width: 16, textAlign: 'center',
  },
  noticeText: { fontSize: 13, color: '#4A3728', lineHeight: 19, flex: 1 },
  noticeTextFull: { fontSize: 13, color: '#4A3728', lineHeight: 19, paddingLeft: 4 },
});
