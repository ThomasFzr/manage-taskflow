import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTaskStore } from '@/stores/taskStore';
import {
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  Circle,
  Square,
  CheckSquare,
} from 'lucide-react-native';
import type { Task } from '@/lib/api';

const PRESET_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#ef4444',
  '#eab308',
  '#8b5cf6',
  '#f97316',
] as const;

function formatDueDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

function endOfLocalDayAsIso(d: Date): string {
  const x = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    23,
    59,
    59,
    999
  );
  return x.toISOString();
}

function parseDueToDate(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

type TaskFormModalProps = {
  visible: boolean;
  title: string;
  submitLabel: string;
  initialTitle: string;
  initialDue: Date | null;
  initialColor: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    dueDate: string | null;
    color: string | null;
  }) => void;
};

function TaskFormModal({
  visible,
  title,
  submitLabel,
  initialTitle,
  initialDue,
  initialColor,
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  const [formTitle, setFormTitle] = useState(initialTitle);
  const [due, setDue] = useState<Date | null>(initialDue);
  const [color, setColor] = useState<string | null>(initialColor);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [webDateText, setWebDateText] = useState(
    initialDue ? initialDue.toISOString().slice(0, 10) : ''
  );

  useEffect(() => {
    if (visible) {
      setFormTitle(initialTitle);
      setDue(initialDue);
      setColor(initialColor);
      setWebDateText(
        initialDue ? initialDue.toISOString().slice(0, 10) : ''
      );
      setShowDatePicker(false);
    }
  }, [visible, initialTitle, initialDue, initialColor]);

  const handleSubmit = () => {
    const t = formTitle.trim();
    if (!t) return;
    let dueIso: string | null = null;
    if (Platform.OS === 'web') {
      if (webDateText.trim()) {
        const parsed = new Date(webDateText + 'T12:00:00');
        if (!Number.isNaN(parsed.getTime())) {
          dueIso = endOfLocalDayAsIso(parsed);
        }
      }
    } else if (due) {
      dueIso = endOfLocalDayAsIso(due);
    }
    onSubmit({ title: t, dueDate: dueIso, color });
  };

  const dueLabel =
    Platform.OS === 'web'
      ? webDateText || 'Aucune'
      : due
        ? formatDueDate(endOfLocalDayAsIso(due))
        : 'Aucune date limite';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Titre</Text>
            <TextInput
              style={styles.input}
              value={formTitle}
              onChangeText={setFormTitle}
              placeholder="Titre de la tâche"
              maxLength={500}
            />
            <Text style={styles.fieldLabel}>Date limite</Text>
            {Platform.OS === 'web' ? (
              <TextInput
                style={styles.input}
                value={webDateText}
                onChangeText={setWebDateText}
                placeholder="YYYY-MM-DD (optionnel)"
                autoCapitalize="none"
                autoCorrect={false}
              />
            ) : (
              <>
                <Pressable
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dateButtonText}>{dueLabel}</Text>
                </Pressable>
                <Pressable
                  style={styles.clearDue}
                  onPress={() => {
                    setDue(null);
                    setShowDatePicker(false);
                  }}>
                  <Text style={styles.clearDueText}>Retirer la date</Text>
                </Pressable>
                {showDatePicker && (
                  <>
                    <DateTimePicker
                      value={due ?? new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, date) => {
                        if (Platform.OS === 'android') {
                          setShowDatePicker(false);
                        }
                        if (event.type === 'dismissed' || !date) return;
                        setDue(date);
                      }}
                    />
                    {Platform.OS === 'ios' ? (
                      <Pressable
                        style={styles.iosDateDone}
                        onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.iosDateDoneText}>OK</Text>
                      </Pressable>
                    ) : null}
                  </>
                )}
              </>
            )}
            <Text style={styles.fieldLabel}>Couleur</Text>
            <View style={styles.colorRow}>
              <Pressable
                style={[
                  styles.colorChip,
                  styles.colorChipNone,
                  color === null && styles.colorChipSelected,
                ]}
                onPress={() => setColor(null)}>
                <Text style={styles.colorChipNoneText}>Aucune</Text>
              </Pressable>
              {PRESET_COLORS.map((c) => (
                <Pressable
                  key={c}
                  style={[
                    styles.colorChip,
                    { backgroundColor: c },
                    color === c && styles.colorRing,
                  ]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.saveBtn,
                  !formTitle.trim() && styles.saveBtnDisabled,
                ]}
                disabled={!formTitle.trim()}
                onPress={handleSubmit}>
                <Text style={styles.saveBtnText}>{submitLabel}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function TasksScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    tasks,
    isLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    bulkDeleteTasks,
  } = useTaskStore();

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = useCallback(() => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    bulkDeleteTasks(ids);
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, [selectedIds, bulkDeleteTasks]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          {selectionMode && selectedIds.size > 0 && (
            <Pressable
              onPress={handleBulkDelete}
              testID="bulk-delete-button"
              style={styles.headerBtn}>
              <Text style={styles.headerBtnTextPrimary}>
                Supprimer ({selectedIds.size})
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => {
              if (selectionMode) {
                setSelectedIds(new Set());
                setSelectionMode(false);
              } else {
                setSelectionMode(true);
              }
            }}
            testID="selection-mode-toggle"
            style={styles.headerBtn}>
            <Text style={styles.headerBtnTextPrimary}>
              {selectionMode ? 'Annuler' : 'Sélectionner'}
            </Text>
          </Pressable>
        </View>
      ),
    });
  }, [navigation, selectionMode, selectedIds.size, handleBulkDelete]);

  const showInitialLoading = isLoading && tasks.length === 0;

  if (showInitialLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement des tâches…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <Pressable onPress={() => fetchTasks()} testID="retry-fetch">
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : null}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 88 },
        ]}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.emptyText}>Aucune tâche pour le moment.</Text>
          ) : null
        }
        renderItem={({ item }) => {
          const accent = item.color ?? '#c7c7cc';
          const selected = selectedIds.has(item.id);
          return (
            <View
              style={[
                styles.taskItem,
                { borderLeftWidth: 4, borderLeftColor: accent },
              ]}>
              {selectionMode ? (
                <Pressable
                  style={styles.selectBox}
                  onPress={() => toggleSelected(item.id)}
                  testID={`select-${item.id}`}>
                  {selected ? (
                    <CheckSquare size={24} color="#007AFF" />
                  ) : (
                    <Square size={24} color="#8E8E93" />
                  )}
                </Pressable>
              ) : null}
              <Pressable
                style={styles.taskContent}
                onPress={() => {
                  if (selectionMode) toggleSelected(item.id);
                  else updateTask(item.id, { completed: !item.completed });
                }}>
                <Text
                  style={[
                    styles.taskTitle,
                    item.completed && styles.completedTask,
                  ]}>
                  {item.title}
                </Text>
                {item.dueDate ? (
                  <Text
                    style={[
                      styles.dueText,
                      item.completed && styles.completedDue,
                    ]}>
                    Échéance : {formatDueDate(item.dueDate)}
                  </Text>
                ) : (
                  <Text style={styles.noDueText}>Pas de date limite</Text>
                )}
              </Pressable>
              {!selectionMode ? (
                <View style={styles.taskActions}>
                  <Pressable
                    onPress={() => updateTask(item.id, { completed: !item.completed })}
                    style={styles.iconBtn}>
                    {item.completed ? (
                      <CheckCircle2 size={24} color="#22c55e" />
                    ) : (
                      <Circle size={24} color="#8E8E93" />
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => setEditTask(item)}
                    style={styles.iconBtn}
                    testID={`edit-button-${item.id}`}>
                    <Pencil size={20} color="#007AFF" />
                  </Pressable>
                  <Pressable
                    onPress={() => deleteTask(item.id)}
                    testID={`delete-button-${item.id}`}
                    style={styles.iconBtn}>
                    <Trash2 size={20} color="#FF3B30" />
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        }}
      />
      <Pressable
        style={[styles.fab, { bottom: 24 + insets.bottom }]}
        testID="add-button"
        onPress={() => setAddOpen(true)}>
        <Plus size={24} color="#FFFFFF" />
      </Pressable>

      <TaskFormModal
        visible={addOpen}
        title="Nouvelle tâche"
        submitLabel="Créer"
        initialTitle=""
        initialDue={null}
        initialColor={null}
        onClose={() => setAddOpen(false)}
        onSubmit={async (payload) => {
          try {
            await createTask({
              title: payload.title,
              dueDate: payload.dueDate,
              color: payload.color,
            });
            setAddOpen(false);
          } catch {
            /* erreur affichée dans la bannière */
          }
        }}
      />

      <TaskFormModal
        visible={editTask !== null}
        title="Modifier la tâche"
        submitLabel="Enregistrer"
        initialTitle={editTask?.title ?? ''}
        initialDue={parseDueToDate(editTask?.dueDate ?? null)}
        initialColor={editTask?.color ?? null}
        onClose={() => setEditTask(null)}
        onSubmit={async (payload) => {
          if (!editTask) return;
          try {
            await updateTask(editTask.id, {
              title: payload.title,
              dueDate: payload.dueDate,
              color: payload.color,
            });
            setEditTask(null);
          } catch {
            /* erreur affichée dans la bannière */
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centered: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  listContent: {
    paddingTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 48,
    fontSize: 16,
    color: '#8E8E93',
    paddingHorizontal: 24,
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  errorBannerText: {
    flex: 1,
    color: '#C62828',
    fontSize: 14,
  },
  retryText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 4,
  },
  headerBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  headerBtnTextPrimary: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectBox: {
    paddingRight: 8,
    paddingVertical: 4,
  },
  taskContent: {
    flex: 1,
    minWidth: 0,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  dueText: {
    fontSize: 14,
    color: '#3C3C43',
    marginTop: 4,
  },
  completedDue: {
    color: '#8E8E93',
  },
  noDueText: {
    fontSize: 13,
    color: '#C7C7CC',
    marginTop: 4,
    fontStyle: 'italic',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#000',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#000',
  },
  clearDue: {
    marginTop: 8,
  },
  clearDueText: {
    color: '#007AFF',
    fontSize: 15,
  },
  iosDateDone: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  iosDateDoneText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 17,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  colorChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colorChipNone: {
    borderWidth: 1,
    borderColor: '#C7C7CC',
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    width: 'auto',
    paddingHorizontal: 12,
  },
  colorChipNoneText: {
    fontSize: 12,
    color: '#3C3C43',
  },
  colorChipSelected: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  colorRing: {
    borderWidth: 3,
    borderColor: '#000',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: '#007AFF',
    fontSize: 17,
  },
  saveBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 17,
  },
});
