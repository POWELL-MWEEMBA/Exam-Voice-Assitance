import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getExam, updateExam } from '../../services/examService';

const CARD_BG = '#FFFFFF';
const BORDER = '#E5E7EB';
const TEXT_DARK = '#0F172A';
const TEXT_MUTED = '#64748B';
const PRIMARY = '#2563EB';

const TYPES = ['Multiple Choice', 'Written Answer'];

export default function EditExamScreen({ navigation, route }) {
  const { user } = useAuth();
  const { examId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [loadingExam, setLoadingExam] = useState(true);

  // Exam details
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState('60');

  // Dropdown state
  const [questionType, setQuestionType] = useState('Written Answer');
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  // Question form (shared)
  const [questionText, setQuestionText] = useState('');
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

  // Multiple choice state
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(null);

  // Written answer state
  const [writtenAnswer, setWrittenAnswer] = useState('');

  // Questions list
  const [questions, setQuestions] = useState([]);

  // Load exam data
  useEffect(() => {
    if (examId) {
      loadExam();
    } else {
      Alert.alert('Error', 'Exam ID not provided');
      navigation?.goBack();
    }
  }, [examId]);

  const loadExam = async () => {
    try {
      setLoadingExam(true);
      const examData = await getExam(examId);

      setTitle(examData.title || '');
      setSubject(examData.subject || '');
      setDuration(String(examData.duration || 60));
      setQuestions(examData.questions || []);

      console.log('Exam loaded:', examData);
    } catch (error) {
      console.error('Error loading exam:', error);
      Alert.alert('Error', 'Failed to load exam. Please try again.');
      navigation?.goBack();
    } finally {
      setLoadingExam(false);
    }
  };

  const goBack = () => navigation?.goBack?.();

  const updateOption = (idx, val) => {
    const next = [...options];
    next[idx] = val;
    setOptions(next);
  };

  const resetQuestionForm = () => {
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectIndex(null);
    setWrittenAnswer('');
    setEditingQuestionIndex(null);
    setQuestionType('Written Answer');
  };

  const startEditingQuestion = (index) => {
    const question = questions[index];
    setQuestionText(question.text);
    setQuestionType(question.type);
    setEditingQuestionIndex(index);

    if (question.type === 'Multiple Choice') {
      // Fill options array, pad with empty strings if needed
      const opts = [...(question.options || [])];
      while (opts.length < 4) opts.push('');
      setOptions(opts);
      setCorrectIndex(question.correctIndex);
    } else {
      setWrittenAnswer(question.expectedAnswer || '');
    }
  };

  const deleteQuestion = (index) => {
    Alert.alert(
      'Delete Question',
      'Are you sure you want to delete this question?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setQuestions(prev => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const addOrUpdateQuestion = () => {
    if (!questionText.trim()) {
      Alert.alert('Validation Error', 'Please enter the question text');
      return;
    }

    if (questionType === 'Multiple Choice') {
      const filled = options.map(o => o.trim());
      const nonEmpty = filled.filter(Boolean);
      if (nonEmpty.length < 2) {
        Alert.alert('Validation Error', 'Please provide at least two answer options');
        return;
      }
      if (correctIndex === null) {
        Alert.alert('Validation Error', 'Please select the correct answer');
        return;
      }

      const questionData = {
        type: 'Multiple Choice',
        text: questionText.trim(),
        options: filled,
        correctIndex,
      };

      if (editingQuestionIndex !== null) {
        // Update existing question
        setQuestions(prev =>
          prev.map((q, i) => (i === editingQuestionIndex ? questionData : q))
        );
      } else {
        // Add new question
        setQuestions(prev => [...prev, questionData]);
      }
    } else {
      if (!writtenAnswer.trim()) {
        Alert.alert('Validation Error', 'Please provide the expected written answer or guidance');
        return;
      }

      const questionData = {
        type: 'Written Answer',
        text: questionText.trim(),
        expectedAnswer: writtenAnswer.trim(),
      };

      if (editingQuestionIndex !== null) {
        // Update existing question
        setQuestions(prev =>
          prev.map((q, i) => (i === editingQuestionIndex ? questionData : q))
        );
      } else {
        // Add new question
        setQuestions(prev => [...prev, questionData]);
      }
    }

    resetQuestionForm();
  };

  const saveExam = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter an exam title');
      return;
    }
    if (!subject.trim()) {
      Alert.alert('Validation Error', 'Please enter a subject');
      return;
    }
    if (questions.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one question');
      return;
    }

    setLoading(true);
    try {
      // Validate and prepare questions
      const validatedQuestions = questions.map((q, index) => {
        if (!q.text || !q.type) {
          throw new Error(`Question ${index + 1} is missing required fields`);
        }

        if (q.type === 'Multiple Choice') {
          if (!q.options || q.options.length < 2) {
            throw new Error(`Question ${index + 1}: Multiple choice needs at least 2 options`);
          }
          if (q.correctIndex === null || q.correctIndex === undefined) {
            throw new Error(`Question ${index + 1}: Please select the correct answer`);
          }
          return {
            type: 'Multiple Choice',
            text: q.text.trim(),
            options: q.options.map(opt => opt.trim()).filter(opt => opt.length > 0),
            correctIndex: q.correctIndex,
          };
        } else if (q.type === 'Written Answer') {
          if (!q.expectedAnswer || !q.expectedAnswer.trim()) {
            throw new Error(`Question ${index + 1}: Written answer requires expected answer text`);
          }
          return {
            type: 'Written Answer',
            text: q.text.trim(),
            expectedAnswer: q.expectedAnswer.trim(),
          };
        } else {
          throw new Error(`Question ${index + 1}: Unknown question type`);
        }
      });

      const updates = {
        title: title.trim(),
        subject: subject.trim(),
        duration: Number(duration) || 60,
        questions: validatedQuestions,
        totalQuestions: validatedQuestions.length,
      };

      await updateExam(examId, updates);

      Alert.alert(
        'Success',
        `Exam updated successfully!\n\n${validatedQuestions.length} question${validatedQuestions.length !== 1 ? 's' : ''} saved.`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation?.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error updating exam:', error);
      Alert.alert('Error', error.message || 'Failed to update exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Renders
  const renderTypeDropdown = () => (
    <View>
      <Pressable onPress={() => setShowTypeMenu(prev => !prev)} style={styles.select}>
        <Text style={styles.selectText}>{questionType}</Text>
        <Ionicons
          name={showTypeMenu ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={TEXT_MUTED}
        />
      </Pressable>

      {showTypeMenu && (
        <View style={styles.dropdownMenu}>
          {TYPES.map(t => {
            const active = t === questionType;
            return (
              <TouchableOpacity
                key={t}
                activeOpacity={0.9}
                onPress={() => {
                  setQuestionType(t);
                  setShowTypeMenu(false);
                }}
                style={[styles.dropdownItem, active && styles.dropdownItemActive]}
              >
                <Text style={[styles.dropdownText, active && styles.dropdownTextActive]}>
                  {t}
                </Text>
                {active && <Ionicons name="checkmark" size={16} color={PRIMARY} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  const isMC = questionType === 'Multiple Choice';

  if (loadingExam) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading exam...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={18} color={TEXT_DARK} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Edit Exam</Text>
          <Text style={styles.subtitle}>Update exam details and questions</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Exam Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBadge}>
              <Ionicons name="book-outline" size={18} color={PRIMARY} />
            </View>
            <Text style={styles.cardTitle}>Exam Details</Text>
          </View>

          <Text style={styles.label}>Exam Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Mathematics Final Exam"
            style={styles.input}
            placeholderTextColor={TEXT_MUTED}
          />

          <Text style={styles.label}>Subject</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g., Mathematics"
            style={styles.input}
            placeholderTextColor={TEXT_MUTED}
          />

          <Text style={styles.label}>Duration (minutes)</Text>
          <View style={styles.durationRow}>
            <View style={styles.inputWithIcon}>
              <Ionicons name="time-outline" size={16} color={TEXT_MUTED} />
              <TextInput
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholder="60"
                style={styles.inputBare}
                placeholderTextColor={TEXT_MUTED}
              />
            </View>
          </View>
        </View>

        {/* Existing Questions */}
        {questions.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="list-outline" size={18} color={TEXT_DARK} />
              <Text style={styles.cardTitle}>Existing Questions ({questions.length})</Text>
            </View>

            {questions.map((question, index) => (
              <View key={index} style={styles.existingQuestion}>
                <View style={styles.existingQuestionHeader}>
                  <Text style={styles.existingQuestionNumber}>Q{index + 1}</Text>
                  <View style={styles.existingQuestionActions}>
                    <TouchableOpacity
                      style={styles.editQuestionBtn}
                      onPress={() => startEditingQuestion(index)}
                    >
                      <Ionicons name="create-outline" size={16} color={PRIMARY} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteQuestionBtn}
                      onPress={() => deleteQuestion(index)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.existingQuestionText} numberOfLines={2}>
                  {question.text}
                </Text>
                <Text style={styles.existingQuestionType}>{question.type}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Add/Edit Question */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name={editingQuestionIndex !== null ? 'create-outline' : 'add-outline'}
              size={18}
              color={TEXT_DARK}
            />
            <Text style={styles.cardTitle}>
              {editingQuestionIndex !== null ? 'Edit Question' : 'Add Question'}
            </Text>
            {editingQuestionIndex !== null && (
              <TouchableOpacity
                style={styles.cancelEditBtn}
                onPress={resetQuestionForm}
              >
                <Text style={styles.cancelEditText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.label}>Question Type</Text>
          {renderTypeDropdown()}

          <Text style={styles.label}>Question</Text>
          <TextInput
            value={questionText}
            onChangeText={setQuestionText}
            placeholder="Enter your question here..."
            style={[styles.input, { minHeight: 44 }]}
            placeholderTextColor={TEXT_MUTED}
          />

          {/* Conditional fields based on type */}
          {isMC ? (
            <>
              <Text style={styles.label}>Answer Options</Text>
              {['A', 'B', 'C', 'D'].map((letter, idx) => (
                <View key={letter} style={styles.optionRow}>
                  <View style={styles.optionBadge}>
                    <Text style={styles.optionBadgeText}>{letter}</Text>
                  </View>
                  <TextInput
                    value={options[idx]}
                    onChangeText={val => updateOption(idx, val)}
                    placeholder={`Option ${letter}`}
                    style={[styles.input, { flex: 1 }]}
                    placeholderTextColor={TEXT_MUTED}
                  />
                </View>
              ))}

              <Text style={styles.label}>Correct Answer</Text>
              <View style={styles.correctRow}>
                {['A', 'B', 'C', 'D'].map((letter, idx) => {
                  const active = correctIndex === idx;
                  return (
                    <TouchableOpacity
                      key={letter}
                      style={[styles.correctChip, active && styles.correctChipActive]}
                      onPress={() => setCorrectIndex(idx)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.correctChipText,
                          active && styles.correctChipTextActive,
                        ]}
                      >
                        {letter}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.label}>Written Answer</Text>
              <TextInput
                value={writtenAnswer}
                onChangeText={setWrittenAnswer}
                placeholder="Type the expected answer or guidance..."
                style={[styles.input, { minHeight: 44 }]}
                placeholderTextColor={TEXT_MUTED}
                multiline
              />
            </>
          )}

          <TouchableOpacity
            style={styles.addBtn}
            onPress={addOrUpdateQuestion}
            activeOpacity={0.9}
          >
            <Ionicons
              name={editingQuestionIndex !== null ? 'checkmark-circle-outline' : 'add-circle-outline'}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.addBtnText}>
              {editingQuestionIndex !== null ? 'Update Question' : 'Add Question'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 84 }} />
      </ScrollView>

      {/* Footer Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createBtn, loading && styles.createBtnDisabled]}
          onPress={saveExam}
          activeOpacity={0.9}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="save-outline" size={18} color="#FFFFFF" />
          )}
          <Text style={styles.createBtnText}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>
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
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  backText: { fontSize: 13, color: TEXT_DARK, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: TEXT_DARK, marginBottom: 2 },
  subtitle: { fontSize: 12.5, color: TEXT_MUTED },

  container: { paddingHorizontal: 16, paddingBottom: 16, gap: 16 },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: TEXT_DARK, flex: 1 },

  label: { fontSize: 12.5, color: TEXT_MUTED, marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: TEXT_DARK,
  },

  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flex: 1,
  },
  inputBare: { flex: 1, fontSize: 14, color: TEXT_DARK, padding: 0 },

  // Dropdown styles
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectText: { fontSize: 14, color: TEXT_DARK, fontWeight: '600' },

  dropdownMenu: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemActive: {
    backgroundColor: '#F0F5FF',
  },
  dropdownText: { fontSize: 14, color: TEXT_DARK },
  dropdownTextActive: { color: PRIMARY, fontWeight: '700' },

  // Multiple choice
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  optionBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  optionBadgeText: { color: PRIMARY, fontWeight: '700' },

  correctRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  correctChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FFFFFF',
  },
  correctChipActive: { borderColor: PRIMARY, backgroundColor: '#EBF2FF' },
  correctChipText: { color: TEXT_DARK, fontWeight: '600' },
  correctChipTextActive: { color: PRIMARY },

  addBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  // Existing Questions
  existingQuestion: {
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  existingQuestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  existingQuestionNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
  },
  existingQuestionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editQuestionBtn: {
    padding: 4,
  },
  deleteQuestionBtn: {
    padding: 4,
  },
  existingQuestionText: {
    fontSize: 14,
    color: TEXT_DARK,
    marginBottom: 4,
  },
  existingQuestionType: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  cancelEditBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelEditText: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: '600',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createBtnDisabled: {
    opacity: 0.6,
  },
  createBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: TEXT_MUTED,
  },
});

