import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { AppColors } from '../../constants/AppColors';
import { globalStyles } from '../../constants/GlobalStyles';
import { getExam, getSubmission } from '../../services/examService';

const ResultScreen = ({ route, navigation }) => {
  const examId = route?.params?.examId;
  const submissionId = route?.params?.submissionId;
  const examTitle = route?.params?.examTitle;
  
  const [showDetailedReview, setShowDetailedReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exam, setExam] = useState(null);
  const [submission, setSubmission] = useState(null);

  // Transform Firebase questions to ViewResults format
  const transformQuestions = (firebaseQuestions) => {
    if (!Array.isArray(firebaseQuestions)) return [];
    
    return firebaseQuestions.map((q, index) => {
      const questionType = q.type?.toLowerCase();
      const isMultipleChoice = 
        questionType === 'multiple choice' || 
        questionType === 'multiple-choice' ||
        (q.options && Array.isArray(q.options));
      
      if (isMultipleChoice && q.options) {
        const correctAnswer = q.correctIndex !== undefined && q.options[q.correctIndex]
          ? q.options[q.correctIndex]
          : q.correctAnswer || q.options[0];
        
        return {
          id: q.id || `q${index + 1}`,
          question: q.text || q.question || '',
          type: 'multiple-choice',
          options: q.options || [],
          correctAnswer,
        };
      } else {
        return {
          id: q.id || `q${index + 1}`,
          question: q.text || q.question || '',
          type: 'written',
          expectedAnswer: q.expectedAnswer || q.correctAnswer || null,
        };
      }
    });
  };

  // Load exam and submission data
  useEffect(() => {
    const loadData = async () => {
      if (!examId) {
        setError('No exam ID provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Load exam data
        const examData = await getExam(examId);
        setExam(examData);
        
        // Load submission if submissionId provided
        if (submissionId) {
          const submissionData = await getSubmission(submissionId);
          setSubmission(submissionData);
        }
      } catch (err) {
        console.error('Error loading results:', err);
        setError(err?.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [examId, submissionId]);

  // Get questions and graded results
  const questions = useMemo(() => {
    if (!exam?.questions) return [];
    return transformQuestions(exam.questions);
  }, [exam]);

  const gradedQuestions = useMemo(() => {
    if (!submission?.gradingResults?.gradedQuestions) return [];
    return submission.gradingResults.gradedQuestions;
  }, [submission]);

  const gradingSummary = useMemo(() => {
    if (!submission?.gradingResults?.summary) return null;
    return submission.gradingResults.summary;
  }, [submission]);

  const totalQuestions = questions.length;
  const answeredQuestions = submission?.answers?.length || 0;
  
  const multipleChoiceQuestions = questions.filter(
    (q) => q.type === 'multiple-choice'
  );
  const writtenQuestions = questions.filter((q) => q.type === 'written');

  // Get scores from graded results
  const mcScore = gradingSummary?.multipleChoiceScore || 0;
  const writtenScore = gradingSummary?.writtenScore || 0; // Now auto-graded
  const overallScore = gradingSummary?.overallScore || 0;
  const correctAnswers = gradingSummary?.multipleChoiceCorrect || 0;
  const writtenCorrect = gradingSummary?.writtenCorrect || 0;

  // Get answer map for UI
  const uniqueAnswered = useMemo(() => {
    if (!submission?.answers) return [];
    const map = new Map();
    submission.answers.forEach((entry) => {
      if (entry?.questionId) {
        map.set(entry.questionId, entry);
      }
    });
    return Array.from(map.values());
  }, [submission]);

  const getScoreColor = (score) => {
    if (score >= 90) return AppColors.success;
    if (score >= 80) return AppColors.primary;
    if (score >= 70) return AppColors.warning;
    return AppColors.error;
  };

  const getGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const getPerformanceMessage = (score) => {
    if (score >= 90) return 'Excellent work! You have mastered this material.';
    if (score >= 80) return 'Great job! Your understanding is strong.';
    if (score >= 70) return 'Good effort! Consider reviewing some topics.';
    if (score >= 60) return "You passed, but there's room for improvement.";
    return 'Please review the material and consider retaking the exam.';
  };

  const getAnswerStatus = (question) => {
    const gradedQuestion = gradedQuestions.find(
      (gq) => gq.questionId === question.id
    );
    
    if (!gradedQuestion) {
      const userAnswer = uniqueAnswered.find(
        (a) => a.questionId === question.id
      );
      return userAnswer ? 'answered' : 'unanswered';
    }

    if (question.type === 'multiple-choice') {
      return gradedQuestion.isCorrect ? 'correct' : 'incorrect';
    }
    
    // Written questions - now auto-graded
    if (gradedQuestion.requiresManualGrading || gradedQuestion.graded === false) {
      return 'pending';
    }
    
    // Check if correct/incorrect for written questions
    if (gradedQuestion.isCorrect === true) return 'correct';
    if (gradedQuestion.isCorrect === false) return 'incorrect';
    return 'answered';
  };

  const handleReadResults = async () => {
    const writtenScoreText = `${writtenScore} percent`;
    const summary = `Exam completed. Overall score: ${overallScore} percent. Grade: ${getGrade(
      overallScore
    )}. ${getPerformanceMessage(overallScore)} You answered ${answeredQuestions} of ${totalQuestions} questions. Multiple choice score: ${mcScore} percent. Written questions score: ${writtenScoreText}.`;

    // TTS removed - no speech functionality
  };

  const handleDownloadResults = () => {
    Alert.alert(
      'Coming Soon',
      'The downloadable report feature will be added in a future release.'
    );
  };

  const ResultBadge = ({ status, label }) => {
    const backgroundMap = {
      correct: AppColors.success,
      incorrect: AppColors.error,
      answered: AppColors.info,
      unanswered: AppColors.textLight,
      pending: AppColors.warning,
    };
    return (
      <View
        style={[
          styles.badge,
          { backgroundColor: backgroundMap[status] ?? AppColors.textLight },
        ]}
      >
        <Text style={styles.badgeText}>{label}</Text>
      </View>
    );
  };

  const ProgressBar = ({ value }) => (
    <View style={styles.progressOuter}>
      <View style={[styles.progressInner, { width: `${value}%` }]} />
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[globalStyles.safeContainer, styles.safeContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={[globalStyles.bodyText, { marginTop: 16 }]}>Loading results...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !exam) {
    return (
      <SafeAreaView style={[globalStyles.safeContainer, styles.safeContainer, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={[globalStyles.titleText, { color: AppColors.error, marginBottom: 8 }]}>
          Error
        </Text>
        <Text style={[globalStyles.bodyText, { marginBottom: 16, textAlign: 'center' }]}>
          {error || 'Failed to load results'}
        </Text>
        <TouchableOpacity
          style={[globalStyles.button, { marginTop: 8 }]}
          onPress={() => navigation?.navigate('HomePage')}
        >
          <Text style={globalStyles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const renderDetailedReview = () => (
    <SafeAreaView style={[globalStyles.safeContainer, styles.safeContainer]}>
      <ScrollView
        contentContainerStyle={[globalStyles.scrollContainer, styles.scroll]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.iconButton, styles.outlineButton]}
            onPress={() => setShowDetailedReview(false)}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={20} color={AppColors.primary} />
            <Text style={[styles.buttonLabel, { color: AppColors.primary }]}>
              Back to Results
            </Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>Detailed Review</Text>
        </View>

        {questions.map((question, index) => {
          const userAnswer = uniqueAnswered.find(
            (a) => a.questionId === question.id
          );
          const status = getAnswerStatus(question);

          return (
            <View key={question.id} style={[globalStyles.card, styles.card]}>
              <View style={styles.cardHeader}>
                <Text style={styles.questionTitle}>
                  Question {index + 1}: {question.question}
                </Text>
                <ResultBadge
                  status={status}
                  label={
                    status === 'correct'
                      ? 'Correct'
                      : status === 'incorrect'
                      ? 'Incorrect'
                      : status === 'pending'
                      ? 'Pending'
                      : status === 'answered'
                      ? 'Answered'
                      : 'Not Answered'
                  }
                />
              </View>

              {question.type === 'multiple-choice' ? (
                <View style={styles.optionsGroup}>
                  {question.options?.map((option, optionIndex) => {
                    const isCorrect = option === question.correctAnswer;
                    const isUser = option === userAnswer?.answer;
                    return (
                      <View
                        key={option}
                        style={[
                          styles.optionCard,
                          isCorrect && styles.correctOption,
                          isUser && !isCorrect && styles.incorrectOption,
                        ]}
                      >
                        <Text style={styles.optionLabel}>
                          {String.fromCharCode(65 + optionIndex)}. {option}
                        </Text>
                        <View style={styles.badgeRow}>
                          {isCorrect && (
                            <ResultBadge status="correct" label="Correct Answer" />
                          )}
                          {isUser && !isCorrect && (
                            <ResultBadge
                              status="incorrect"
                              label="Your Answer"
                            />
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.writtenBlock}>
                  <Text style={styles.sectionLabel}>Your Answer:</Text>
                  <View style={styles.answerBox}>
                    <Text style={styles.answerText}>
                      {userAnswer?.answer || 'No answer provided'}
                    </Text>
                  </View>

                  {(() => {
                    const gradedQuestion = gradedQuestions.find(
                      (gq) => gq.questionId === question.id
                    );
                    const isGraded = gradedQuestion?.graded && gradedQuestion?.isCorrect !== null;
                    
                    if (isGraded && gradedQuestion.correctAnswer) {
                      return (
                        <>
                          <Text style={styles.sectionLabel}>Expected Answer:</Text>
                          <View style={styles.answerBox}>
                            <Text style={styles.answerText}>
                              {gradedQuestion.correctAnswer}
                            </Text>
                          </View>
                          <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                              {gradedQuestion.feedback || 'Auto-graded'}
                            </Text>
                          </View>
                        </>
                      );
                    }
                    
                    return (
                      <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                          {gradedQuestion?.requiresManualGrading 
                            ? 'Pending manual grading - no expected answer provided'
                            : 'Auto-graded based on expected answer'}
                        </Text>
                      </View>
                    );
                  })()}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );

  if (showDetailedReview) {
    return renderDetailedReview();
  }

  return (
    <SafeAreaView style={[globalStyles.safeContainer, styles.safeContainer]}>
      <ScrollView
        contentContainerStyle={[globalStyles.scrollContainer, styles.scroll]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.iconButton, styles.outlineButton]}
            onPress={() => navigation?.navigate('HomePage')}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={20} color={AppColors.primary} />
            <Text style={[styles.buttonLabel, { color: AppColors.primary }]}>
              Back to Exams
            </Text>
          </TouchableOpacity>

          <View>
            <Text style={styles.screenTitle}>Exam Results</Text>
            <Text style={styles.subtitle}>{examTitle || exam?.title || 'Exam Results'}</Text>
          </View>
        </View>

        <View style={[globalStyles.card, styles.gradientCard]}>
          <View style={styles.awardContainer}>
            <View style={styles.medallion}>
              <Feather name="award" size={42} color={AppColors.white} />
            </View>
            <Text
              style={[
                styles.overallScore,
                { color: getScoreColor(overallScore) },
              ]}
            >
              {overallScore}%
            </Text>
            <Text style={styles.gradeText}>Grade: {getGrade(overallScore)}</Text>
            <Text style={styles.performanceMessage}>
              {getPerformanceMessage(overallScore)}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[globalStyles.button, styles.flexButton]}
              onPress={handleReadResults}
              activeOpacity={0.85}
            >
              <View style={styles.buttonContent}>
                <Feather name="volume-2" size={18} color={AppColors.white} />
                <Text style={globalStyles.buttonText}>Listen to Results</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                globalStyles.buttonSecondary,
                styles.flexButton,
                styles.secondaryButton,
              ]}
              onPress={handleDownloadResults}
              activeOpacity={0.85}
            >
              <View style={styles.buttonContent}>
                <Feather name="download" size={18} color={AppColors.primary} />
                <Text style={globalStyles.buttonTextSecondary}>
                  Download Report
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statGrid}>
          <View style={[globalStyles.card, styles.card]}>
            <View style={styles.statCardContent}>
              <Feather name="book-open" size={28} color={AppColors.primary} />
              <Text style={styles.statValue}>
                {answeredQuestions}/{totalQuestions}
              </Text>
              <Text style={styles.statLabel}>Questions Answered</Text>
            </View>
          </View>

          <View style={[globalStyles.card, styles.card]}>
            <View style={styles.statCardContent}>
              <Feather name="check-circle" size={28} color={AppColors.success} />
              <Text style={styles.statValue}>
                {correctAnswers}/{multipleChoiceQuestions.length}
              </Text>
              <Text style={styles.statLabel}>Multiple Choice Correct</Text>
            </View>
          </View>

          <View style={[globalStyles.card, styles.card]}>
            <View style={styles.statCardContent}>
              <Feather name="clock" size={28} color={AppColors.info} />
              <Text style={styles.statValue}>90 min</Text>
              <Text style={styles.statLabel}>Time Allowed</Text>
            </View>
          </View>
        </View>

        <View style={[globalStyles.card, styles.card]}>
          <Text style={styles.sectionTitle}>Score Breakdown</Text>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownLabel}>Multiple Choice</Text>
              <Text
                style={[
                  styles.breakdownScore,
                  { color: getScoreColor(mcScore) },
                ]}
              >
                {mcScore}%
              </Text>
            </View>
            <ProgressBar value={mcScore} />
            <Text style={styles.breakdownHint}>
              {correctAnswers} correct out of {multipleChoiceQuestions.length} questions
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownLabel}>Written Questions</Text>
              <Text
                style={[
                  styles.breakdownScore,
                  { color: getScoreColor(writtenScore) },
                ]}
              >
                {writtenScore}%
              </Text>
            </View>
            <ProgressBar value={writtenScore} />
              <Text style={styles.breakdownHint}>
                {writtenQuestions.length} questions · {writtenCorrect} correct · Auto-graded
              </Text>
          </View>
        </View>

        <View style={[globalStyles.card, styles.card]}>
          <Text style={styles.sectionTitle}>Performance Summary</Text>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryColumn}>
              <Text style={styles.summaryHeading}>Strengths</Text>
              {mcScore >= 80 && (
                <View style={styles.summaryItem}>
                  <Feather name="check-circle" size={16} color={AppColors.success} />
                  <Text style={styles.summaryText}>
                    Strong multiple choice performance
                  </Text>
                </View>
              )}
              {answeredQuestions === totalQuestions && (
                <View style={styles.summaryItem}>
                  <Feather name="check-circle" size={16} color={AppColors.success} />
                  <Text style={styles.summaryText}>Completed every question</Text>
                </View>
              )}
              {overallScore >= 80 && (
                <View style={styles.summaryItem}>
                  <Feather name="check-circle" size={16} color={AppColors.success} />
                  <Text style={styles.summaryText}>Solid overall understanding</Text>
                </View>
              )}
            </View>

            <View style={styles.summaryColumn}>
              <Text style={styles.summaryHeading}>Areas to Improve</Text>
              {mcScore < 70 && (
                <View style={styles.summaryItem}>
                  <Feather name="x" size={16} color={AppColors.error} />
                  <Text style={styles.summaryText}>
                    Review multiple choice concepts
                  </Text>
                </View>
              )}
              {answeredQuestions < totalQuestions && (
                <View style={styles.summaryItem}>
                  <Feather name="x" size={16} color={AppColors.error} />
                  <Text style={styles.summaryText}>Practice time management</Text>
                </View>
              )}
              {overallScore < 70 && (
                <View style={styles.summaryItem}>
                  <Feather name="x" size={16} color={AppColors.error} />
                  <Text style={styles.summaryText}>
                    Revisit foundational material
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[globalStyles.button, styles.flexButton]}
            onPress={() => setShowDetailedReview(true)}
            activeOpacity={0.85}
          >
            <View style={styles.buttonContent}>
              <Feather name="eye" size={18} color={AppColors.white} />
              <Text style={globalStyles.buttonText}>Review Answers</Text>
            </View>
          </TouchableOpacity>

            <TouchableOpacity
              style={[
                globalStyles.buttonSecondary,
                styles.flexButton,
                styles.secondaryButton,
              ]}
              onPress={() => navigation?.navigate('HomePage')}
              activeOpacity={0.85}
            >
            <View style={styles.buttonContent}>
              <Feather name="book-open" size={18} color={AppColors.primary} />
              <Text style={globalStyles.buttonTextSecondary}>
                Take Another Exam
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[globalStyles.card, styles.infoCard]}>
          <View style={styles.infoRow}>
            <Feather name="volume-2" size={24} color={AppColors.info} />
            <View style={styles.infoContent}>
              <Text style={styles.infoHeading}>Accessibility Features</Text>
              <Text style={styles.infoBody}>
                Revisit the spoken summary anytime with “Listen to Results,” or open
                “Review Answers” for a question-by-question deep dive.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ResultScreen;

const styles = StyleSheet.create({
  safeContainer: {
    backgroundColor: AppColors.background,
  },
  scroll: {
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.white,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.textDark,
  },
  subtitle: {
    fontSize: 18,
    color: AppColors.textMedium,
  },
  gradientCard: {
    backgroundColor: AppColors.white,
  },
  awardContainer: {
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  medallion: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  overallScore: {
    fontSize: 42,
    fontWeight: '800',
  },
  gradeText: {
    fontSize: 24,
    fontWeight: '600',
    color: AppColors.textDark,
  },
  performanceMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: AppColors.textMedium,
    marginHorizontal: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  flexButton: {
    flex: 1,
    marginVertical: 0,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    marginVertical: 8,
  },
  statCardContent: {
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.textDark,
  },
  statLabel: {
    fontSize: 14,
    color: AppColors.textMedium,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textDark,
    marginBottom: 16,
  },
  breakdownRow: {
    marginBottom: 16,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textDark,
  },
  breakdownScore: {
    fontSize: 18,
    fontWeight: '600',
  },
  breakdownHint: {
    fontSize: 13,
    color: AppColors.textMedium,
    marginTop: 4,
  },
  progressOuter: {
    height: 10,
    borderRadius: 6,
    backgroundColor: AppColors.border,
    overflow: 'hidden',
  },
  progressInner: {
    height: '100%',
    backgroundColor: AppColors.primary,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 24,
    flexWrap: 'wrap',
  },
  summaryColumn: {
    flex: 1,
    minWidth: 160,
    gap: 12,
  },
  summaryHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textDark,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
    color: AppColors.textMedium,
  },
  infoCard: {
    backgroundColor: '#E8F1FF',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoContent: {
    flex: 1,
    gap: 6,
  },
  infoHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textDark,
  },
  infoBody: {
    fontSize: 14,
    color: AppColors.textMedium,
    lineHeight: 20,
  },
    questionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textDark,
    flex: 1,
  },
  badge: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.white,
  },
  optionsGroup: {
    gap: 12,
  },
  optionCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 14,
    backgroundColor: AppColors.white,
  },
  correctOption: {
    backgroundColor: '#E7F8EA',
    borderColor: AppColors.success,
  },
  incorrectOption: {
    backgroundColor: '#FCECEC',
    borderColor: AppColors.error,
  },
  optionLabel: {
    fontSize: 15,
    color: AppColors.textDark,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  writtenBlock: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textDark,
  },
  answerBox: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    padding: 16,
  },
  answerText: {
    fontSize: 15,
    color: AppColors.textDark,
    lineHeight: 22,
  },
  infoBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C5E0FF',
    backgroundColor: '#EDF4FF',
    padding: 12,
  },
  infoText: {
    color: AppColors.info,
    fontSize: 14,
  },
});