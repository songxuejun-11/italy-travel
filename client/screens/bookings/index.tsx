import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Screen } from '@/components/Screen';
import { getBookings, type Booking } from '@/services/api';
import { FontAwesome6 } from '@expo/vector-icons';

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

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    getBookings().then(setBookings).catch(console.error);
  }, []);

  // Group by city
  const grouped = bookings.reduce<Record<string, Booking[]>>((acc, b) => {
    if (!acc[b.city]) acc[b.city] = [];
    acc[b.city].push(b);
    return acc;
  }, {});

  return (
    <Screen>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>景点预定</Text>
          <Text style={styles.subtitle}>共 {bookings.length} 个景点需要关注</Text>
        </View>

        {/* Bookings by city */}
        {Object.entries(grouped).map(([city, items]) => (
          <View key={city} style={styles.cityGroup}>
            <View style={styles.cityHeader}>
              <FontAwesome6 name="map-pin" size={14} color={COLORS.primary} />
              <Text style={styles.cityName}>{city}</Text>
            </View>
            {items.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.attractionName}>{booking.attraction}</Text>
                  <Text style={styles.bookingDate}>{booking.date}</Text>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.detailRow}>
                    <FontAwesome6 name="tag" size={11} color={COLORS.muted} />
                    <Text style={styles.detailText}>价格：{booking.price}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <FontAwesome6
                      name={booking.need_reservation ? 'calendar-check' : 'calendar'}
                      size={11}
                      color={booking.need_reservation ? COLORS.danger : COLORS.success}
                    />
                    <Text style={[
                      styles.detailText,
                      booking.need_reservation ? styles.needReserve : styles.noReserve,
                    ]}>
                      {booking.need_reservation ? '需要提前预约' : '无需预约'}
                    </Text>
                  </View>

                  {booking.note ? (
                    <View style={styles.noteBox}>
                      <Text style={styles.noteText}>{booking.note}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ))}
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

  cityGroup: { paddingHorizontal: 20, marginTop: 20 },
  cityHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6,
  },
  cityName: { fontSize: 17, fontWeight: '700', color: COLORS.text },

  bookingCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: COLORS.primary, shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  bookingHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12,
  },
  attractionName: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  bookingDate: {
    fontSize: 12, color: COLORS.secondary, fontWeight: '600',
    backgroundColor: '#EBF5FB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },

  bookingDetails: { gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: COLORS.muted },
  needReserve: { color: COLORS.danger, fontWeight: '600' },
  noReserve: { color: COLORS.success },

  noteBox: {
    backgroundColor: '#FFF3E0', borderRadius: 10, padding: 10, marginTop: 4,
    borderLeftWidth: 3, borderLeftColor: COLORS.gold,
  },
  noteText: { fontSize: 12, color: COLORS.text, lineHeight: 18 },
});
