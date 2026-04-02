import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import InterestChip from "./InterestChip";
import { COLORS, SIZES, RADIUS } from "../constants";
import { ALL_INTERESTS } from "../../mocks/interestHelpers";

const INTEREST_OPTIONS = ALL_INTERESTS;

interface FilterModalProps {
  visible: boolean;
  selectedInterests: string[];
  onToggleInterest: (interest: string) => void;
  onClearAll: () => void;
  onApply: () => void;
  onClose: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  selectedInterests,
  onToggleInterest,
  onClearAll,
  onApply,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {}
      <View style={styles.sheet}>
        {}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>관심사 필터</Text>
            {selectedInterests.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{selectedInterests.length}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={20} color={COLORS.zinc600} />
          </TouchableOpacity>
        </View>

        {}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
        >
          <View style={styles.grid}>
            {INTEREST_OPTIONS.map((interest) => (
              <View key={interest} style={styles.gridItem}>
                <InterestChip
                  label={interest}
                  selected={selectedInterests.includes(interest)}
                  onPress={() => onToggleInterest(interest)}
                  variant="filter"
                />
              </View>
            ))}
          </View>
        </ScrollView>

        {}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={onClearAll}
            style={styles.resetButton}
            activeOpacity={0.7}
          >
            <Text style={styles.resetText}>초기화</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onApply}
            style={styles.applyButton}
            activeOpacity={0.7}
          >
            <Text style={styles.applyText}>적용하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.xlarge,
    paddingVertical: SIZES.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.zinc200,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.zinc900,
  },
  badge: {
    backgroundColor: COLORS.violet100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.violet600,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    maxHeight: 300,
  },
  bodyContent: {
    padding: SIZES.xlarge,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    width: "47%",
  },
  footer: {
    flexDirection: "row",
    padding: SIZES.xlarge,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc200,
  },
  resetButton: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.zinc100,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  resetText: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.zinc700,
  },
  applyButton: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.violet500,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  applyText: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.white,
  },
});

export default FilterModal;
