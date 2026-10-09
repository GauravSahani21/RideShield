import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRide } from '../context/RideContext';
import { EmergencyContact } from '../types';
import { useAppTheme } from '../theme/ThemeContext';
import { AppPageHeader, AppCard, AppButton, AppBadge } from '../components/UIComponents';
import { spacing, radius, typography } from '../theme';

interface EmergencyContactsScreenProps {
  onBack: () => void;
}

export const EmergencyContactsScreen: React.FC<EmergencyContactsScreenProps> = ({
  onBack,
}) => {
  const { contacts, saveContact, deleteContact } = useRide();
  const { theme } = useAppTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('Family');

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setPhone('');
    setRelationship('Family');
    setModalVisible(true);
  };

  const handleOpenEdit = (contact: EmergencyContact) => {
    setEditingId(contact.id);
    setName(contact.name);
    setPhone(contact.phone);
    setRelationship(contact.relationship);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Required Fields', 'Please provide a name and valid phone number.');
      return;
    }

    const contact: EmergencyContact = {
      id: editingId || `contact-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship.trim(),
      priority: contacts.length + 1,
      active: true,
    };

    await saveContact(contact);
    setModalVisible(false);
  };

  const handleDelete = (id: string, contactName: string) => {
    Alert.alert('Remove Contact', `Delete ${contactName} from emergency dispatch contacts?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteContact(id),
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppPageHeader
        title="Emergency Contacts"
        subtitle="ICE notification list for automated crash SOS dispatch"
        onBack={onBack}
        rightElement={
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}
            onPress={handleOpenAdd}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="plus" size={20} color={theme.primary} />
            <Text style={[styles.addBtnText, { color: theme.primary }]}>Add</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notice Info Card */}
        <AppCard style={styles.noticeCard}>
          <MaterialCommunityIcons name="shield-alert-outline" size={20} color={theme.primary} />
          <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
            When a crash is confirmed and the 25s buffer expires, your live GPS location and impact telemetry are dispatched to these contacts immediately.
          </Text>
        </AppCard>

        {contacts.length === 0 ? (
          <AppCard style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceHover }]}>
              <MaterialCommunityIcons name="account-alert-outline" size={36} color={theme.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Emergency Contacts Added</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
              Add at least one ICE (In Case of Emergency) contact to ensure rapid response during an incident.
            </Text>
            <View style={{ marginTop: spacing.md, width: '100%' }}>
              <AppButton
                title="Add Primary Contact"
                variant="primary"
                icon="plus"
                onPress={handleOpenAdd}
              />
            </View>
          </AppCard>
        ) : (
          contacts.map((c) => (
            <AppCard key={c.id} style={styles.contactCard}>
              <View style={styles.contactLeft}>
                <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.avatarText, { color: theme.primary }]}>
                    {c.name[0]?.toUpperCase() || 'C'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.contactName, { color: theme.text }]}>{c.name}</Text>
                    {c.priority === 1 && (
                      <AppBadge label="PRIMARY" variant="info" />
                    )}
                  </View>
                  <Text style={[styles.contactPhone, { color: theme.textSecondary }]}>{c.phone}</Text>
                  <Text style={[styles.contactRel, { color: theme.textMuted }]}>{c.relationship}</Text>
                </View>
              </View>

              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={[styles.iconAction, { backgroundColor: theme.surfaceHover }]}
                  onPress={() => handleOpenEdit(c)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconAction, { backgroundColor: theme.dangerLight }]}
                  onPress={() => handleDelete(c.id, c.name)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.danger} />
                </TouchableOpacity>
              </View>
            </AppCard>
          ))
        )}
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingId ? 'Edit Emergency Contact' : 'New Emergency Contact'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialCommunityIcons name="close" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>FULL NAME</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.inputText,
                  },
                ]}
                placeholder="e.g. Sarah Connor"
                placeholderTextColor={theme.inputPlaceholder}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>MOBILE PHONE</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.inputText,
                  },
                ]}
                placeholder="+1 (555) 019-2834"
                placeholderTextColor={theme.inputPlaceholder}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>RELATIONSHIP</Text>
              <View style={styles.relOptions}>
                {['Family', 'Spouse', 'Friend', 'Doctor'].map((rel) => (
                  <TouchableOpacity
                    key={rel}
                    style={[
                      styles.relPill,
                      {
                        backgroundColor: relationship === rel ? theme.primaryLight : theme.inputBg,
                        borderColor: relationship === rel ? theme.primary : theme.inputBorder,
                      },
                    ]}
                    onPress={() => setRelationship(rel)}
                  >
                    <Text
                      style={[
                        styles.relPillText,
                        {
                          color: relationship === rel ? theme.primary : theme.textSecondary,
                          fontWeight: relationship === rel ? '700' : '500',
                        },
                      ]}
                    >
                      {rel}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalBtnRow}>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={() => setModalVisible(false)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="Save Contact"
                  variant="primary"
                  icon="check"
                  onPress={handleSave}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  addBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: spacing.md,
  },
  noticeText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  contactPhone: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  contactRel: {
    fontSize: 10,
    marginTop: 1,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconAction: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: typography.sizes.sm,
  },
  relOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  relPillText: {
    fontSize: typography.sizes.xs,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
