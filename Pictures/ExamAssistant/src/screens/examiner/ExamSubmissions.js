import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getExamSubmissions, getExam } from '../../services/examService';
import { db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
};

export default function ExamSubmissions({ route, navigation }) {
  const { examId, examTitle } = route?.params || {};
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);

  useEffect(() => {
    loadData();
  }, [examId]);

  const loadData = async () => {
    if (!examId) {
      Alert.alert('Error', 'No exam ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load exam data
      const examData = await getExam(examId);
      setExam(examData);

      // Load submissions
      const submissionsData = await getExamSubmissions(examId);
      
      // Fetch user information for each submission
      const submissionsWithUsers = await Promise.all(
        submissionsData.map(async (submission) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', submission.studentId));
            const userData = userDoc.data();
            
            return {
              ...submission,
              studentName: userData?.name || userData?.firstName + ' ' + userData?.lastName || userData?.email || 'Unknown Student',
              studentEmail: userData?.email || 'N/A',
            };
          } catch (error) {
            console.error('Error fetching user data:', error);
            return {
              ...submission,
              studentName: 'Unknown Student',
              studentEmail: 'N/A',
            };
          }
        })
      );

      setSubmissions(submissionsWithUsers);
    } catch (error) {
      console.error('Error loading submissions:', error);
      Alert.alert('Error', 'Failed to load submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return COLORS.success;
    if (score >= 70) return COLORS.primary;
    if (score >= 60) return COLORS.warning;
    return COLORS.danger;
  };

  const goBack = () => navigation?.goBack?.();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={18} color={COLORS.text} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Exam Submissions</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {examTitle || exam?.title || 'Viewing submissions'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading submissions...</Text>
        </View>
      ) : submissions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color={COLORS.muted} />
          <Text style={styles.emptyTitle}>No submissions yet</Text>
          <Text style={styles.emptyText}>
            No students have submitted this exam yet
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Ionicons name="people" size={24} color={COLORS.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.summaryValue}>{submissions.length}</Text>
                <Text style={styles.summaryLabel}>Total Submissions</Text>
              </View>
            </View>
            {exam && (
              <View style={styles.summaryRow}>
                <Ionicons name="help-circle" size={24} color={COLORS.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.summaryValue}>
                    {exam.totalQuestions || exam.questions?.length || 0}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Questions</Text>
                </View>
              </View>
            )}
          </View>

          {/* Submissions List */}
          {submissions.map((submission) => {
            const overallScore = submission.gradingResults?.summary?.overallScore || 0;
            const mcScore = submission.gradingResults?.summary?.multipleChoiceScore || 0;
            const writtenScore = submission.gradingResults?.summary?.writtenScore || 0;
            const totalQuestions = submission.gradingResults?.summary?.totalQuestions || 0;
            const answeredQuestions = submission.gradingResults?.summary?.answeredQuestions || 0;

            return (
              <View key={submission.id} style={styles.submissionCard}>
                <View style={styles.submissionHeader}>
                  <View style={styles.studentInfo}>
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={20} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studentName}>{submission.studentName}</Text>
                      <Text style={styles.studentEmail}>{submission.studentEmail}</Text>
                    </View>
                  </View>
                  <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(overallScore) + '20' }]}>
                    <Text style={[styles.scoreText, { color: getScoreColor(overallScore) }]}>
                      {overallScore}%
                    </Text>
                  </View>
                </View>

                <View style={styles.submissionDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={COLORS.muted} />
                    <Text style={styles.detailText}>
                      Submitted: {formatDate(submission.submittedAt)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.muted} />
                    <Text style={styles.detailText}>
                      {answeredQuestions} of {totalQuestions} questions answered
                    </Text>
                  </View>
                  <View style={styles.scoreRow}>
                    <View style={styles.scoreItem}>
                      <Text style={styles.scoreLabel}>MC Score</Text>
                      <Text style={[styles.scoreValue, { color: COLORS.primary }]}>
                        {mcScore}%
                      </Text>
                    </View>
                    <View style={styles.scoreItem}>
                      <Text style={styles.scoreLabel}>Written Score</Text>
                      <Text style={[styles.scoreValue, { color: COLORS.primary }]}>
                        {writtenScore}%
                      </Text>
                    </View>
                    <View style={styles.scoreItem}>
                      <Text style={styles.scoreLabel}>Overall</Text>
                      <Text style={[styles.scoreValue, { color: getScoreColor(overallScore) }]}>
                        {overallScore}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
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
  container: { padding: 16, gap: 16 },
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
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    gap: 16,
  },
  summaryRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  summaryLabel: {
    fontSize: 12.5,
    color: COLORS.muted,
    marginTop: 4,
  },
  submissionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  studentEmail: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
  },
  submissionDetails: {
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  scoreItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 4,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});





