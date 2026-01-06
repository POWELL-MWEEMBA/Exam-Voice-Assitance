// ManageExams.js
import React, { useState, useEffect, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, RefreshControl, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getExamsByExaminer, updateExamStatus, deleteExam, getExamSubmissions } from '../../services/examService';

const COLORS = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: '#0F172A',
  muted: '#64748B',
  primary: '#2563EB',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#EF4444',
  inactive: '#94A3B8',
};

export default function ManageExams({ navigation }) {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch exams from Firebase
  const fetchExams = async () => {
    if (!user?.uid) return;

    try {
      const examsData = await getExamsByExaminer(user.uid);
      
      // Get submission counts for each exam in parallel
      const examsWithAttempts = await Promise.all(
        examsData.map(async (exam) => {
          let attempts = 0;
          try {
            const submissions = await getExamSubmissions(exam.id);
            attempts = submissions.length;
          } catch (error) {
            console.warn(`Error fetching submissions for exam ${exam.id}:`, error);
            attempts = 0;
          }

          let formattedDate = 'N/A';
          if (exam.createdAt) {
            try {
              // Handle Firestore timestamp
              const date = exam.createdAt.toDate ? exam.createdAt.toDate() : new Date(exam.createdAt);
              formattedDate = date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });
            } catch (error) {
              console.error('Error formatting date:', error);
              formattedDate = 'N/A';
            }
          }

          return {
            ...exam,
            questionsCount: exam.totalQuestions || exam.questions?.length || 0, // Store count separately
            questions: exam.questions || [], // Preserve the actual questions array
            attempts: attempts, // Actual count from submissions
            created: formattedDate,
          };
        })
      );

      setExams(examsWithAttempts);
    } catch (error) {
      console.error('Error fetching exams:', error);
      Alert.alert('Error', 'Failed to load exams. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [user?.uid]);

  // Refresh exams when screen comes into focus (e.g., after creating a new exam)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.uid) {
        // Small delay to avoid duplicate calls on initial mount
        const timer = setTimeout(() => {
          if (!loading) {
            fetchExams();
          }
        }, 300);
        return () => clearTimeout(timer);
      }
    }, [user?.uid])
  );

  // Compute stats from exams
  const stats = useMemo(() => {
    const total = exams.length;
    const active = exams.filter(e => e.status === 'active').length;
    const attempts = exams.reduce((sum, e) => sum + (e.attempts || 0), 0);
    return { total, active, attempts };
  }, [exams]);

  const goBack = () => navigation?.goBack?.();

  const onViewDetails = (exam) => {
    // Navigate to ExamSubmissions screen instead of opening modal
    navigation?.navigate('ExamSubmissions', {
      examId: exam.id,
      examTitle: exam.title,
    });
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedExam(null);
  };
  const onEdit = (exam) => {
    navigation?.navigate('EditExam', { examId: exam.id });
  };
  const onDeactivate = async (exam) => {
    Alert.alert(
      'Deactivate Exam',
      `Are you sure you want to deactivate "${exam.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              const newStatus = exam.status === 'active' ? 'inactive' : 'active';
              await updateExamStatus(exam.id, newStatus);
              Alert.alert('Success', `Exam ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
              fetchExams(); // Refresh the list
            } catch (error) {
              console.error('Error updating exam status:', error);
              Alert.alert('Error', 'Failed to update exam status. Please try again.');
            }
          },
        },
      ]
    );
  };

  const onDelete = async (exam) => {
    Alert.alert(
      'Delete Exam',
      `Are you sure you want to delete "${exam.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExam(exam.id);
              Alert.alert('Success', 'Exam deleted successfully');
              fetchExams(); // Refresh the list
            } catch (error) {
              console.error('Error deleting exam:', error);
              Alert.alert('Error', 'Failed to delete exam. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={18} color={COLORS.text} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Manage Exams</Text>
          <Text style={styles.subtitle}>View, edit, and manage your exams</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchExams();
            }}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            label="Total Exams"
            value={stats.total}
            icon="book-outline"
            iconColor={COLORS.primary}
          />
          <StatCard
            label="Active Exams"
            value={stats.active}
            icon="eye-outline"
            iconColor={COLORS.success}
          />
          <StatCard
            label="Total Attempts"
            value={stats.attempts}
            icon="people-outline"
            iconColor={COLORS.primary}
          />
        </View>

        {/* Loading state */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading exams...</Text>
          </View>
        ) : exams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>No exams yet</Text>
            <Text style={styles.emptyText}>Create your first exam to get started</Text>
          </View>
        ) : (
          <>
            {/* Exam list */}
            {exams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onViewDetails={() => onViewDetails(exam)}
                onEdit={() => onEdit(exam)}
                onDeactivate={() => onDeactivate(exam)}
                onDelete={() => onDelete(exam)}
              />
            ))}
            <View style={{ height: 24 }} />
          </>
        )}
      </ScrollView>

      {/* Exam Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Exam Details</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedExam && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
                {/* Exam Info */}
                <View style={styles.examInfoCard}>
                  <Text style={styles.examInfoTitle}>{selectedExam.title}</Text>
                  <View style={styles.examInfoRow}>
                    <Ionicons name="book-outline" size={16} color={COLORS.muted} />
                    <Text style={styles.examInfoText}>{selectedExam.subject}</Text>
                  </View>
                  <View style={styles.examInfoRow}>
                    <Ionicons name="time-outline" size={16} color={COLORS.muted} />
                    <Text style={styles.examInfoText}>{selectedExam.duration} minutes</Text>
                  </View>
                  <View style={styles.examInfoRow}>
                    <Ionicons name="help-circle-outline" size={16} color={COLORS.muted} />
                    <Text style={styles.examInfoText}>
                      {selectedExam.questions?.length || selectedExam.totalQuestions || 0} questions
                    </Text>
                  </View>
                  <View style={styles.examInfoRow}>
                    <Ionicons name="flag-outline" size={16} color={COLORS.muted} />
                    <Text style={[styles.examInfoText, { 
                      color: selectedExam.status === 'active' ? COLORS.success : 
                             selectedExam.status === 'inactive' ? COLORS.inactive : COLORS.warning 
                    }]}>
                      Status: {selectedExam.status || 'draft'}
                    </Text>
                  </View>
                </View>

                {/* Questions List */}
                <View style={styles.questionsSection}>
                  <Text style={styles.questionsSectionTitle}>Questions</Text>
                  
                  {selectedExam.questions && selectedExam.questions.length > 0 ? (
                    selectedExam.questions.map((question, index) => (
                      <QuestionCard key={index} question={question} index={index} />
                    ))
                  ) : (
                    <View style={styles.noQuestionsContainer}>
                      <Ionicons name="document-text-outline" size={32} color={COLORS.muted} />
                      <Text style={styles.noQuestionsText}>No questions found</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* Reusable components */

function StatCard({ label, value, icon, iconColor }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function ExamCard({ exam, onViewDetails, onEdit, onDeactivate, onDelete }) {
  const statusColor =
    exam.status === 'active' ? COLORS.success : exam.status === 'inactive' ? COLORS.inactive : COLORS.warning;

  return (
    <View style={styles.examCard}>
      {/* Title row + status */}
      <View style={styles.examHeader}>
        <Text style={styles.examTitle}>{exam.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: '#ECFDF5' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {exam.status}
          </Text>
        </View>
      </View>

      {/* Meta rows */}
      <MetaRow
        icon="book-outline"
        text={`${exam.subject}   •   ${exam.duration} minutes`}
      />
      <MetaRow
        icon="help-circle-outline"
        text={`${exam.questionsCount || exam.questions?.length || 0} questions   •   ${exam.attempts} attempts`}
      />
      <MetaRow
        icon="calendar-outline"
        text={`Created ${exam.created}`}
      />

      {/* Actions */}
      <View style={styles.actionsRow}>
        <GhostButton icon="eye-outline" text="View Details" onPress={onViewDetails} />
        <GhostButton icon="create-outline" text="Edit" onPress={onEdit} />
      </View>

      <View style={styles.actionsRow}>
        <OutlineButton text="Activation" onPress={onDeactivate} />
        <DangerButton text="Delete" onPress={onDelete} />
      </View>
    </View>
  );
}

function MetaRow({ icon, text }) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={16} color={COLORS.muted} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

function GhostButton({ icon, text, onPress }) {
  return (
    <TouchableOpacity style={styles.ghostBtn} onPress={onPress} activeOpacity={0.9}>
      <Ionicons name={icon} size={16} color={COLORS.text} />
      <Text style={styles.ghostText}>{text}</Text>
    </TouchableOpacity>
  );
}
function OutlineButton({ text, onPress }) {
  return (
    <TouchableOpacity style={styles.outlineBtn} onPress={onPress} activeOpacity={0.9}>
      <Text style={styles.outlineText}>{text}</Text>
    </TouchableOpacity>
  );
}
function DangerButton({ text, onPress }) {
  return (
    <TouchableOpacity style={styles.dangerBtn} onPress={onPress} activeOpacity={0.9}>
      <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
      <Text style={styles.dangerText}>{text}</Text>
    </TouchableOpacity>
  );
}

function QuestionCard({ question, index }) {
  return (
    <View style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <View style={styles.questionNumber}>
          <Text style={styles.questionNumberText}>Q{index + 1}</Text>
        </View>
        <View style={styles.questionTypeBadge}>
          <Text style={styles.questionTypeText}>{question.type}</Text>
        </View>
      </View>
      
      <Text style={styles.questionText}>{question.text}</Text>
      
      {question.type === 'Multiple Choice' && question.options ? (
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsTitle}>Options:</Text>
          {question.options.map((option, optIndex) => (
            <View
              key={optIndex}
              style={[
                styles.optionItem,
                question.correctIndex === optIndex && styles.correctOption
              ]}
            >
              <View style={styles.optionLetter}>
                <Text style={[
                  styles.optionLetterText,
                  question.correctIndex === optIndex && styles.correctOptionText
                ]}>
                  {String.fromCharCode(65 + optIndex)}
                </Text>
              </View>
              <Text style={[
                styles.optionText,
                question.correctIndex === optIndex && styles.correctOptionText
              ]}>
                {option || '(Empty)'}
              </Text>
              {question.correctIndex === optIndex && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              )}
            </View>
          ))}
        </View>
      ) : question.type === 'Written Answer' && question.expectedAnswer ? (
        <View style={styles.writtenAnswerContainer}>
          <Text style={styles.expectedAnswerTitle}>Expected Answer:</Text>
          <Text style={styles.expectedAnswerText}>{question.expectedAnswer}</Text>
        </View>
      ) : null}
    </View>
  );
}

/* Styles */
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  backText: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  subtitle: { fontSize: 12.5, color: COLORS.muted },

  container: { paddingHorizontal: 16, paddingBottom: 16, gap: 16 },

  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 12.5, color: COLORS.muted },

  examCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  examHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  examTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  statusText: { fontSize: 12, fontWeight: '700' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 13, color: COLORS.muted },

  actionsRow: { flexDirection: 'row', gap: 10 },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  ghostText: { color: COLORS.text, fontWeight: '700', fontSize: 13.5 },

  outlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  outlineText: { color: COLORS.text, fontWeight: '700', fontSize: 13.5 },

  dangerBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    paddingVertical: 10,
  },
  dangerText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13.5 },

  // Loading and empty states
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.muted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },

  // Exam Info Card
  examInfoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  examInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  examInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  examInfoText: {
    fontSize: 14,
    color: COLORS.muted,
  },

  // Questions Section
  questionsSection: {
    marginTop: 8,
  },
  questionsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  noQuestionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noQuestionsText: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 12,
  },

  // Question Card
  questionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  questionNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  questionTypeBadge: {
    backgroundColor: '#EBF2FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questionTypeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 22,
  },

  // Multiple Choice Options
  optionsContainer: {
    marginTop: 8,
  },
  optionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
    marginBottom: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  correctOption: {
    backgroundColor: '#ECFDF5',
    borderColor: COLORS.success,
    borderWidth: 2,
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionLetterText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  correctOptionText: {
    color: COLORS.success,
    fontWeight: '600',
  },

  // Written Answer
  writtenAnswerContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expectedAnswerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
    marginBottom: 8,
  },
  expectedAnswerText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
});