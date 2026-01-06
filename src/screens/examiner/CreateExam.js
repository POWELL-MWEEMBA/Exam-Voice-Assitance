import React, { useState } from 'react';
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
import { createExam as createExamInFirebase } from '../../services/examService';

const CARD_BG = '#FFFFFF';
const BORDER = '#E5E7EB';
const TEXT_DARK = '#0F172A';
const TEXT_MUTED = '#64748B';
const PRIMARY = '#2563EB';

const TYPES = ['Multiple Choice', 'Written Answer'];

export default function CreateExamScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Exam details
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState('60');
  const [maxAttempts, setMaxAttempts] = useState('1');
  
  // Randomization options (for exam integrity)
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);

  // Dropdown state
  const [questionType, setQuestionType] = useState('Written Answer'); // default like your screenshot
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  // Question form (shared)
  const [questionText, setQuestionText] = useState('');

  // Multiple choice state
  const [options, setOptions] = useState(['', '', '', '']); // A-D
  const [correctIndex, setCorrectIndex] = useState(null);

  // Written answer state
  const [writtenAnswer, setWrittenAnswer] = useState('');

  // Questions list
  const [questions, setQuestions] = useState([]);

  const goBack = () => (navigation?.goBack ? navigation.goBack() : null);

  const updateOption = (idx, val) => {
    const next = [...options];
    next[idx] = val;
    setOptions(next);
  };

  const addQuestion = () => {
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
      setQuestions(prev => [
        ...prev,
        { type: 'Multiple Choice', text: questionText.trim(), options: filled, correctIndex },
      ]);
      // reset MC fields
      setOptions(['', '', '', '']);
      setCorrectIndex(null);
    } else {
      if (!writtenAnswer.trim()) {
        Alert.alert('Validation Error', 'Please provide the expected written answer or guidance');
        return;
      }
      setQuestions(prev => [
        ...prev,
        { type: 'Written Answer', text: questionText.trim(), expectedAnswer: writtenAnswer.trim() },
      ]);
      // reset written answer field
      setWrittenAnswer('');
    }

    // reset shared
    setQuestionText('');
  };

  const createExam = async () => {
    console.log('Create exam button pressed');
    console.log('User:', user);
    console.log('Title:', title);
    console.log('Subject:', subject);
    console.log('Questions:', questions.length);

    // Validate user
    if (!user?.uid) {
      Alert.alert('Authentication Error', 'You must be logged in to create an exam. Please log in and try again.');
      return;
    }

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

      console.log('Validated questions:', validatedQuestions);
      console.log(`Total questions to save: ${validatedQuestions.length}`);

      const payload = {
        title: title.trim(),
        subject: subject.trim(),
        duration: Number(duration) || 60,
        maxAttempts: Number(maxAttempts) || 1,
        shuffleQuestions,
        shuffleOptions,
        questions: validatedQuestions,
      };

      console.log('Creating exam with payload:', {
        ...payload,
        questionsCount: payload.questions.length,
        questionsPreview: payload.questions.map(q => ({ type: q.type, text: q.text.substring(0, 50) + '...' })),
      });
      console.log('Examiner ID:', user.uid);

      const examId = await createExamInFirebase(payload, user.uid);
      
      console.log('Exam created successfully with ID:', examId);
      console.log('Questions saved to Firestore:', validatedQuestions.length);
      
      Alert.alert(
        'Success',
        `Exam created successfully!\n\n${validatedQuestions.length} question${validatedQuestions.length !== 1 ? 's' : ''} saved to Firestore.`,
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
      console.error('Error creating exam:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Alert.alert(
        'Error',
        error.message || 'Failed to create exam. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Renders
  const renderTypeDropdown = () => (
    <View>
      <Pressable
        onPress={() => setShowTypeMenu(prev => !prev)}
        style={styles.select}
      >
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={18} color={TEXT_DARK} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Create New Exam</Text>
          <Text style={styles.subtitle}>Set up your exam details and questions</Text>
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

          <Text style={styles.label}>Maximum Attempts</Text>
          <View style={styles.durationRow}>
            <View style={styles.inputWithIcon}>
              <Ionicons name="refresh-outline" size={16} color={TEXT_MUTED} />
              <TextInput
                value={maxAttempts}
                onChangeText={setMaxAttempts}
                keyboardType="numeric"
                placeholder="1"
                style={styles.inputBare}
                placeholderTextColor={TEXT_MUTED}
              />
            </View>
          </View>
          <Text style={styles.hint}>How many times can a student take this exam?</Text>

          {/* Randomization Options */}
          <Text style={[styles.label, { marginTop: 16 }]}>Randomization Options</Text>
          
          <TouchableOpacity
            style={[styles.toggleRow, shuffleQuestions && styles.toggleRowActive]}
            onPress={() => setShuffleQuestions(!shuffleQuestions)}
            activeOpacity={0.8}
            accessibilityRole="switch"
            accessibilityState={{ checked: shuffleQuestions }}
            accessibilityLabel="Shuffle question order for each student"
          >
            <Ionicons 
              name={shuffleQuestions ? "checkbox" : "square-outline"} 
              size={22} 
              color={shuffleQuestions ? PRIMARY : TEXT_MUTED} 
            />
            <View style={styles.toggleContent}>
              <Text style={[styles.toggleLabel, shuffleQuestions && styles.toggleLabelActive]}>
                Shuffle Question Order
              </Text>
              <Text style={styles.toggleHint}>Each student sees questions in different order</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleRow, shuffleOptions && styles.toggleRowActive]}
            onPress={() => setShuffleOptions(!shuffleOptions)}
            activeOpacity={0.8}
            accessibilityRole="switch"
            accessibilityState={{ checked: shuffleOptions }}
            accessibilityLabel="Shuffle multiple choice options for each student"
          >
            <Ionicons 
              name={shuffleOptions ? "checkbox" : "square-outline"} 
              size={22} 
              color={shuffleOptions ? PRIMARY : TEXT_MUTED} 
            />
            <View style={styles.toggleContent}>
              <Text style={[styles.toggleLabel, shuffleOptions && styles.toggleLabelActive]}>
                Shuffle MCQ Options
              </Text>
              <Text style={styles.toggleHint}>Answer choices appear in random order</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Add Question */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="add-outline" size={18} color={TEXT_DARK} />
            <Text style={styles.cardTitle}>Add Question</Text>
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
                    onChangeText={(val) => updateOption(idx, val)}
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
                      <Text style={[styles.correctChipText, active && styles.correctChipTextActive]}>
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

          <TouchableOpacity style={styles.addBtn} onPress={addQuestion} activeOpacity={0.9}>
            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add Question</Text>
          </TouchableOpacity>
        </View>

        {/* Optional summary */}
        {questions.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Questions Added</Text>
            {questions.map((q, i) => (
              <View key={i} style={styles.qItem}>
                <Text style={styles.qIndex}>Q{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.qText} numberOfLines={2}>{q.text}</Text>
                  <Text style={styles.qMeta}>
                    Type: {q.type}{' '}
                    {q.type === 'Multiple Choice' && q.correctIndex !== null
                      ? `(Correct: ${String.fromCharCode(65 + q.correctIndex)})`
                      : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 84 }} />
      </ScrollView>

      {/* Footer Create Exam */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createBtn, loading && styles.createBtnDisabled]}
          onPress={() => {
            console.log('Button pressed!');
            createExam();
          }}
          activeOpacity={0.9}
          disabled={loading}
          testID="create-exam-button"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
          )}
          <Text style={styles.createBtnText}>
            {loading ? 'Creating...' : 'Create Exam'}
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: TEXT_DARK },

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

  // Summary
  qItem: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 6 },
  qIndex: { width: 36, textAlign: 'center', fontWeight: '700', color: PRIMARY },
  qText: { fontSize: 13.5, color: TEXT_DARK },
  qMeta: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },

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

  // Hint text
  hint: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 4,
  },

  // Toggle row styles
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 8,
    gap: 12,
  },
  toggleRowActive: {
    backgroundColor: '#EFF6FF',
    borderColor: PRIMARY,
  },
  toggleContent: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  toggleLabelActive: {
    color: PRIMARY,
  },
  toggleHint: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 2,
  },
});