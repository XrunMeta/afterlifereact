import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import type { ApiShort } from '../../api/types';

export default function ShortsTabScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<any>();
  const viewerId = useAuthStore((s) => s.user?.id) ?? 1;
  const [items, setItems] = useState<ApiShort[] | null>(null);

  useEffect(() => {
    apiClient.listShorts(viewerId).then((r) => setItems(r.items));
  }, [viewerId]);

  if (items == null) {
    return <View style={styles.empty} />;
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>{t("feed.shortsEmptyTitle")}</Text>
        <Text style={styles.emptyBody}>{t("feed.shortsHint")}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(s) => String(s.shortId)}
      renderItem={({ item, index }) => (
        <View style={styles.card}>
          <TouchableOpacity
            accessibilityLabel={`short-item-${index}`}
            onPress={() => nav.navigate('Chat', { cloneId: item.cloneId })}
          >
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.meta}>{item.cloneType}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={`short-detail-${index}`}
            onPress={() => nav.navigate('ClonesTab', { screen: 'CloneDetail', params: { cloneId: item.cloneId } })}
            style={styles.detailBtn}
          >
            <Text style={styles.detailText}>{t("feed.shortsViewMore")}</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptyBody: { color: '#6b7280', textAlign: 'center' },
  card: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 16, fontWeight: '700' },
  meta: { color: '#6b7280', marginTop: 4, fontSize: 12 },
  detailBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: '#111',
  },
  detailText: { color: '#fff', fontSize: 12 },
});
