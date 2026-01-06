/**
 * Post-Exam Usability Survey Screen
 * Based on System Usability Scale (SUS) - modified for accessibility research
 * For Ndola Lion School for the Visually Impaired research study
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveUsabilitySurvey } from '../../services/evaluationMetrics';

const QUESTIONS = [
  {
    id: 'q1',
    text: 'The exam system was easy to use.',
  },
  {
    id: 'q2',
    text: 'Voice commands were easy to understand.',
  },
  {
    id: 'q3',
    text: 'The read-aloud feature was clear and helpful.',
  },
  {
    id: 'q4',
    text: 'The system understood my voice accurately.',
  },
  {
    id: 'q5',
    text: 'I could complete the exam independently.',
  },
  {
    id: 'q6',
    text: 'I prefer this system over using a scribe.',
  },
  {
    id: 'q7',
    text: 'This system reduced my exam stress.',
  },
  {
    id: 'q8',
    text: 'I would use this system for future exams.',
  },
];

const RATING_LABELS = [
  { value: 1, label: 'Strongly Disagree', short: '1' },
  { value: 2, label: 'Disagree', short: '2' },
  { value: 3, label: 'Neutral', short: '3' },
  { value: 4, label: 'Agree', short: '4' },
  { value: 5, label: 'Strongly Agree', short: '5' },
];

const UsabilitySurvey = ({ navigation, route }) => {
  const { sessionId, examId, studentId, examDuration, examScore } = route.params || {};
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState({
    q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0,
    q9: '', // What worked well
    q10: '', // What could be improved
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
  }, []);

  const handleRating = async (questionId, rating) => {
    setResponses(prev => ({ ...prev, [questionId]: rating }));
    
    // Move to next question
    setTimeout(() => {
      if (currentQuestion < 9) {
        setCurrentQuestion(currentQuestion + 1);
      }
    }, 100);
  };

  const handleTextChange = (questionId, text) => {
    setResponses(prev => ({ ...prev, [questionId]: text }));
  };

  const handleNext = () => {
    if (currentQuestion < 9) {
      setCurrentQuestion(currentQuestion + 1);
      readCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      readCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      await saveUsabilitySurvey({
        sessionId,
        examId,
        studentId,
        examDuration,
        ...responses,
      });
      
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }, 500);
    } catch (error) {
      console.error('Survey submission error:', error);
      setIsSubmitting(false);
    }
  };

  const handleSkipSurvey = () => {
    Alert.alert(
      'Skip Survey',
      'Your feedback helps improve accessibility for visually impaired students. Are you sure you want to skip?',
      [
        { text: 'Continue Survey', style: 'cancel' },
        { 
          text: 'Skip', 
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          }
        },
      ]
    );
  };

  const renderRatingQuestion = (question) => (
    <View style={styles.questionContainer}>
      <Text style={styles.questionText} accessibilityRole="header">
        {question.text}
      </Text>
      
      <View style={styles.ratingContainer}>
        {RATING_LABELS.map((rating) => (
          <TouchableOpacity
            key={rating.value}
            style={[
              styles.ratingButton,
              responses[question.id] === rating.value && styles.ratingButtonSelected,
            ]}
            onPress={() => handleRating(question.id, rating.value)}
            accessibilityLabel={`${rating.value}, ${rating.label}`}
            accessibilityRole="radio"
            accessibilityState={{ selected: responses[question.id] === rating.value }}
          >
            <Text style={[
              styles.ratingNumber,
              responses[question.id] === rating.value && styles.ratingTextSelected,
            ]}>
              {rating.value}
            </Text>
            <Text style={[
              styles.ratingLabel,
              responses[question.id] === rating.value && styles.ratingTextSelected,
            ]}>
              {rating.short === '1' ? 'Disagree' : rating.short === '5' ? 'Agree' : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.scaleLabels}>
        <Text style={styles.scaleLabel}>Strongly{'\n'}Disagree</Text>
        <Text style={styles.scaleLabel}>Strongly{'\n'}Agree</Text>
      </View>
    </View>
  );

  const renderTextQuestion = (questionId, placeholder, label) => (
    <View style={styles.questionContainer}>
      <Text style={styles.questionText} accessibilityRole="header">
        {label}
      </Text>
      
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={responses[questionId]}
        onChangeText={(text) => handleTextChange(questionId, text)}
        multiline
        numberOfLines={4}
        accessibilityLabel={label}
        accessibilityHint="Type your response here"
      />
    </View>
  );

  const renderCurrentQuestion = () => {
    if (currentQuestion < QUESTIONS.length) {
      return renderRatingQuestion(QUESTIONS[currentQuestion]);
    } else if (currentQuestion === 8) {
      return renderTextQuestion('q9', 'What features helped you the most?', 'What worked well about the system?');
    } else if (currentQuestion === 9) {
      return renderTextQuestion('q10', 'Any suggestions for improvement?', 'What could be improved?');
    }
  };

  // Calculate progress
  const answeredCount = Object.values(responses).filter(v => v !== 0 && v !== '').length;
  const progress = Math.round((answeredCount / 10) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Usability Survey
          </Text>
          <Text style={styles.subtitle}>
            Help us improve accessibility for visually impaired students
          </Text>
          
          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Question {currentQuestion + 1} of 10 ({progress}% complete)
          </Text>
        </View>

        {/* Exam Results Summary */}
        {examScore !== undefined && (
          <View style={styles.scoreCard} accessibilityLabel={`Your exam score was ${examScore} percent`}>
            <Text style={styles.scoreLabel}>Your Exam Score</Text>
            <Text style={styles.scoreValue}>{examScore}%</Text>
          </View>
        )}

        {/* Current Question */}
        {renderCurrentQuestion()}

        {/* Navigation */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, currentQuestion === 0 && styles.navButtonDisabled]}
            onPress={handlePrevious}
            disabled={currentQuestion === 0}
            accessibilityLabel="Previous question"
            accessibilityRole="button"
          >
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.readButton}
            onPress={() => readCurrentQuestion(currentQuestion)}
            accessibilityLabel="Read question aloud"
            accessibilityRole="button"
          >
            <Text style={styles.readButtonText}>Read Aloud</Text>
          </TouchableOpacity>
          
          {currentQuestion < 9 ? (
            <TouchableOpacity
              style={styles.navButton}
              onPress={handleNext}
              accessibilityLabel="Next question"
              accessibilityRole="button"
            >
              <Text style={styles.navButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navButton, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              accessibilityLabel="Submit survey"
              accessibilityRole="button"
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Skip Option */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipSurvey}
          accessibilityLabel="Skip survey and go to home"
          accessibilityRole="button"
        >
          <Text style={styles.skipButtonText}>Skip Survey</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  scoreCard: {
    backgroundColor: '#1a2a4a',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#3a5a8a',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  questionContainer: {
    backgroundColor: '#1a1a2e',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 24,
    lineHeight: 28,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ratingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2a2a4a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#444',
  },
  ratingButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  ratingNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  ratingLabel: {
    fontSize: 8,
    color: '#aaa',
  },
  ratingTextSelected: {
    color: '#fff',
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  scaleLabel: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: '#2a2a4a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#444',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    backgroundColor: '#2a2a4a',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  readButton: {
    backgroundColor: '#3a5a8a',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  readButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    alignSelf: 'center',
    padding: 12,
  },
  skipButtonText: {
    color: '#888',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default UsabilitySurvey;





