/**
 * Evaluation Metrics Service
 * Tracks usage data for research evaluation of the Smart AI Exam System
 * For visually impaired accessibility research at Ndola Lion School
 * 
 * Research Objectives Addressed:
 * - Objective 3: Evaluate usability, accuracy, and effectiveness
 * - Track STT recognition accuracy
 * - Measure task completion rates
 * - Log voice command success rates
 */

import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

const METRICS_COLLECTION = 'evaluationMetrics';
const SURVEY_COLLECTION = 'usabilitySurveys';

/**
 * Create a new evaluation session when exam starts
 * @param {string} examId - Exam ID
 * @param {string} studentId - Student ID
 * @param {Object} examInfo - Basic exam info (title, totalQuestions)
 * @returns {Promise<string>} - Session ID
 */
export const startEvaluationSession = async (examId, studentId, examInfo) => {
  try {
    const sessionDoc = {
      examId,
      studentId,
      examTitle: examInfo.title || 'Unknown Exam',
      totalQuestions: examInfo.totalQuestions || 0,
      
      // Timing metrics
      startTime: serverTimestamp(),
      endTime: null,
      totalDuration: null,
      
      // Interaction metrics
      questionMetrics: [],          // Per-question data
      totalVoiceCommands: 0,        // Voice navigation commands used
      totalReadAloudRequests: 0,    // Times "Read Aloud" was pressed
      totalVoiceAnswers: 0,         // Voice answers attempted
      totalVoiceRetries: 0,         // Times voice wasn't recognized
      
      // Accuracy metrics
      
      // Accessibility features used
      accessibilityFeaturesUsed: {
        autoReadQuestions: false,
        voiceNavigation: false,
        voiceAnswers: false,
        readAloud: false,
      },
      
      // Session status
      status: 'in_progress',        // in_progress, completed, abandoned
      completedQuestions: 0,
      
      // Device info
      platform: 'android',
      
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, METRICS_COLLECTION), sessionDoc);
    console.log('[EvaluationMetrics] Session started:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[EvaluationMetrics] Failed to start session:', error);
    return null;
  }
};

/**
 * Log a question interaction
 * @param {string} sessionId - Evaluation session ID
 * @param {Object} questionData - Question interaction data
 */
export const logQuestionMetric = async (sessionId, questionData) => {
  if (!sessionId) return;
  
  try {
    const docRef = doc(db, METRICS_COLLECTION, sessionId);
    
    // Get current metrics and append
    // For simplicity, we'll store this as a separate sub-interaction
    // In production, you might want to use arrayUnion or subcollections
    
    const metric = {
      questionIndex: questionData.questionIndex,
      questionType: questionData.questionType,
      
      // Timing
      timeSpentSeconds: questionData.timeSpent || 0,
      startedAt: questionData.startedAt,
      answeredAt: questionData.answeredAt,
      
      // Interaction
      readAloudCount: questionData.readAloudCount || 0,
      voiceAnswerAttempts: questionData.voiceAnswerAttempts || 0,
      voiceRetries: questionData.voiceRetries || 0,
      
      // Answer
      answerMethod: questionData.answerMethod, // 'voice', 'touch', 'typed'
      wasAnswered: questionData.wasAnswered || false,
      
      // For research analysis
      transcriptAccuracy: questionData.transcriptAccuracy, // If we can measure
    };

    console.log('[EvaluationMetrics] Question metric logged:', metric);
    
    // Note: In a production app, you'd want to batch these updates
    // For now, we'll track them in memory and save at the end
    return metric;
  } catch (error) {
    console.error('[EvaluationMetrics] Failed to log question metric:', error);
    return null;
  }
};

/**
 * Log a voice command usage
 * @param {string} sessionId - Evaluation session ID
 * @param {string} command - The voice command used
 * @param {boolean} wasRecognized - Whether it was successfully recognized
 */
export const logVoiceCommand = async (sessionId, command, wasRecognized) => {
  if (!sessionId) return;
  
  console.log('[EvaluationMetrics] Voice command:', { command, wasRecognized });
  
  return {
    command,
    wasRecognized,
    timestamp: new Date().toISOString(),
  };
};

/**
 * End the evaluation session and save final metrics
 * @param {string} sessionId - Evaluation session ID
 * @param {Object} finalMetrics - Final accumulated metrics
 */
export const endEvaluationSession = async (sessionId, finalMetrics) => {
  if (!sessionId) return;
  
  try {
    const docRef = doc(db, METRICS_COLLECTION, sessionId);
    
    const updateData = {
      endTime: serverTimestamp(),
      status: finalMetrics.status || 'completed',
      
      // Final counts
      totalVoiceCommands: finalMetrics.totalVoiceCommands || 0,
      totalReadAloudRequests: finalMetrics.totalReadAloudRequests || 0,
      totalVoiceAnswers: finalMetrics.totalVoiceAnswers || 0,
      totalVoiceRetries: finalMetrics.totalVoiceRetries || 0,
      completedQuestions: finalMetrics.completedQuestions || 0,
      
      // Question-by-question data
      questionMetrics: finalMetrics.questionMetrics || [],
      
      // Features used
      accessibilityFeaturesUsed: finalMetrics.featuresUsed || {},
      
      // Total duration will be calculated by Firestore
      totalDurationSeconds: finalMetrics.totalDurationSeconds || 0,
      
      // Exam results
      examScore: finalMetrics.examScore || null,
    };

    await updateDoc(docRef, updateData);
    console.log('[EvaluationMetrics] Session ended:', sessionId);
    console.log('[EvaluationMetrics] Final metrics:', updateData);
    
    return true;
  } catch (error) {
    console.error('[EvaluationMetrics] Failed to end session:', error);
    return false;
  }
};

/**
 * Create an in-memory metrics tracker for the exam session
 * This accumulates metrics and saves them at the end
 */
export const createMetricsTracker = (sessionId) => {
  const startTime = Date.now();
  
  const tracker = {
    sessionId,
    startTime,
    
    // Counters
    totalVoiceCommands: 0,
    totalReadAloudRequests: 0,
    totalVoiceAnswers: 0,
    totalVoiceRetries: 0,
    
    // Question data
    questionMetrics: [],
    currentQuestionStart: null,
    currentQuestionData: null,
    
    // Features used
    featuresUsed: {
      autoReadQuestions: false,
      voiceNavigation: false,
      voiceAnswers: false,
      readAloud: false,
    },
    
    // Methods
    startQuestion(index, type) {
      this.currentQuestionStart = Date.now();
      this.currentQuestionData = {
        questionIndex: index,
        questionType: type,
        startedAt: new Date().toISOString(),
        readAloudCount: 0,
        voiceAnswerAttempts: 0,
        voiceRetries: 0,
        answerMethod: null,
        wasAnswered: false,
      };
    },
    
    endQuestion(wasAnswered, answerMethod) {
      if (this.currentQuestionData) {
        this.currentQuestionData.wasAnswered = wasAnswered;
        this.currentQuestionData.answerMethod = answerMethod;
        this.currentQuestionData.answeredAt = new Date().toISOString();
        this.currentQuestionData.timeSpentSeconds = 
          Math.round((Date.now() - this.currentQuestionStart) / 1000);
        
        this.questionMetrics.push({ ...this.currentQuestionData });
      }
    },
    
    logReadAloud() {
      this.totalReadAloudRequests++;
      this.featuresUsed.readAloud = true;
      if (this.currentQuestionData) {
        this.currentQuestionData.readAloudCount++;
      }
    },
    
    logVoiceAnswer(wasSuccessful) {
      this.totalVoiceAnswers++;
      this.featuresUsed.voiceAnswers = true;
      
      if (wasSuccessful) {
      } else {
        this.totalVoiceRetries++;
        if (this.currentQuestionData) {
          this.currentQuestionData.voiceRetries++;
        }
      }
      
      if (this.currentQuestionData) {
        this.currentQuestionData.voiceAnswerAttempts++;
      }
    },
    
    logVoiceCommand(command, wasRecognized) {
      this.totalVoiceCommands++;
      this.featuresUsed.voiceNavigation = true;
      
      if (!wasRecognized) {
        this.totalVoiceRetries++;
      }
    },
    
    logAutoRead() {
      this.featuresUsed.autoReadQuestions = true;
    },
    
    getMetrics() {
      return {
        sessionId: this.sessionId,
        totalVoiceCommands: this.totalVoiceCommands,
        totalReadAloudRequests: this.totalReadAloudRequests,
        totalVoiceAnswers: this.totalVoiceAnswers,
        totalVoiceRetries: this.totalVoiceRetries,
        questionMetrics: this.questionMetrics,
        featuresUsed: this.featuresUsed,
        totalDurationSeconds: Math.round((Date.now() - this.startTime) / 1000),
        completedQuestions: this.questionMetrics.filter(q => q.wasAnswered).length,
      };
    },
    
    async save(status = 'completed', examScore = null) {
      const metrics = this.getMetrics();
      metrics.status = status;
      metrics.examScore = examScore;
      
      return await endEvaluationSession(this.sessionId, metrics);
    },
  };
  
  return tracker;
};

// ============================================
// USABILITY SURVEY (SUS - System Usability Scale)
// ============================================

/**
 * Save post-exam usability survey responses
 * Based on modified SUS (System Usability Scale) for accessibility
 * @param {Object} surveyData - Survey responses
 * @returns {Promise<string>} - Survey document ID
 */
export const saveUsabilitySurvey = async (surveyData) => {
  try {
    const surveyDoc = {
      sessionId: surveyData.sessionId,
      examId: surveyData.examId,
      studentId: surveyData.studentId,
      
      // SUS-style questions (1-5 scale: 1=Strongly Disagree, 5=Strongly Agree)
      responses: {
        // Ease of use
        q1_easy_to_use: surveyData.q1 || 0,              // "The system was easy to use"
        q2_voice_commands_clear: surveyData.q2 || 0,    // "Voice commands were easy to understand"
        q3_tts_clear: surveyData.q3 || 0,               // "The read-aloud feature was clear"
        q4_stt_accurate: surveyData.q4 || 0,            // "The system understood my voice well"
        q5_independent: surveyData.q5 || 0,             // "I could complete the exam independently"
        
        // Satisfaction
        q6_prefer_over_scribe: surveyData.q6 || 0,      // "I prefer this system over using a scribe"
        q7_reduced_stress: surveyData.q7 || 0,          // "The system reduced my exam stress"
        q8_would_use_again: surveyData.q8 || 0,         // "I would use this system again"
        
        // Open feedback
        q9_what_worked: surveyData.q9 || '',            // "What worked well?"
        q10_improvements: surveyData.q10 || '',         // "What could be improved?"
      },
      
      // Calculated scores
      susScore: calculateSUSScore(surveyData),
      
      // Metadata
      completedAt: serverTimestamp(),
      examDurationMinutes: surveyData.examDuration || 0,
    };

    const docRef = await addDoc(collection(db, SURVEY_COLLECTION), surveyDoc);
    console.log('[Survey] Saved usability survey:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[Survey] Failed to save survey:', error);
    return null;
  }
};

/**
 * Calculate SUS score from responses (0-100 scale)
 */
const calculateSUSScore = (surveyData) => {
  // SUS calculation: Sum of (odd items - 1) + (5 - even items), multiply by 2.5
  // Simplified for our 8 Likert questions
  const responses = [
    surveyData.q1, surveyData.q2, surveyData.q3, surveyData.q4,
    surveyData.q5, surveyData.q6, surveyData.q7, surveyData.q8
  ].filter(r => r > 0);
  
  if (responses.length === 0) return 0;
  
  const sum = responses.reduce((a, b) => a + b, 0);
  const average = sum / responses.length;
  
  // Convert 1-5 scale to 0-100
  return Math.round(((average - 1) / 4) * 100);
};

// ============================================
// RESEARCH ANALYTICS QUERIES
// ============================================

/**
 * Get all evaluation sessions for research analysis
 * @param {string} examId - Optional filter by exam
 * @returns {Promise<Array>} - Array of session data
 */
export const getResearchMetrics = async (examId = null) => {
  try {
    let q;
    if (examId) {
      q = query(
        collection(db, METRICS_COLLECTION),
        where('examId', '==', examId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, METRICS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[Research] Failed to get metrics:', error);
    return [];
  }
};

/**
 * Get aggregated research statistics
 * @returns {Promise<Object>} - Aggregated stats
 */
export const getAggregatedResearchStats = async () => {
  try {
    const sessions = await getResearchMetrics();
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        avgSTTAccuracy: 0,
        avgCompletionRate: 0,
        avgTimePerQuestion: 0,
        featureUsageRates: {},
      };
    }
    
    let totalQuestions = 0;
    let completedQuestions = 0;
    let totalTimeSeconds = 0;
    const featureUsage = {
      voiceNavigation: 0,
      voiceAnswers: 0,
      readAloud: 0,
    };
    
    sessions.forEach(session => {
      totalQuestions += session.totalQuestions || 0;
      completedQuestions += session.completedQuestions || 0;
      totalTimeSeconds += session.totalDurationSeconds || 0;
      
      if (session.accessibilityFeaturesUsed?.voiceNavigation) featureUsage.voiceNavigation++;
      if (session.accessibilityFeaturesUsed?.voiceAnswers) featureUsage.voiceAnswers++;
      if (session.accessibilityFeaturesUsed?.readAloud) featureUsage.readAloud++;
    });
    
    return {
      totalSessions: sessions.length,
      avgCompletionRate: totalQuestions > 0 
        ? Math.round((completedQuestions / totalQuestions) * 100) 
        : 0,
      avgTimePerQuestion: totalQuestions > 0 
        ? Math.round(totalTimeSeconds / totalQuestions) 
        : 0,
      featureUsageRates: {
        voiceNavigation: Math.round((featureUsage.voiceNavigation / sessions.length) * 100),
        voiceAnswers: Math.round((featureUsage.voiceAnswers / sessions.length) * 100),
        readAloud: Math.round((featureUsage.readAloud / sessions.length) * 100),
      },
      totalVoiceCommands: sessions.reduce((sum, s) => sum + (s.totalVoiceCommands || 0), 0),
      totalReadAloudRequests: sessions.reduce((sum, s) => sum + (s.totalReadAloudRequests || 0), 0),
    };
  } catch (error) {
    console.error('[Research] Failed to aggregate stats:', error);
    return null;
  }
};

/**
 * Get all usability surveys for research
 * @returns {Promise<Array>} - Array of survey responses
 */
export const getUsabilitySurveys = async () => {
  try {
    const q = query(
      collection(db, SURVEY_COLLECTION),
      orderBy('completedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[Research] Failed to get surveys:', error);
    return [];
  }
};

/**
 * Get average SUS score from all surveys
 */
export const getAverageSUSScore = async () => {
  const surveys = await getUsabilitySurveys();
  if (surveys.length === 0) return 0;
  
  const totalScore = surveys.reduce((sum, s) => sum + (s.susScore || 0), 0);
  return Math.round(totalScore / surveys.length);
};

export default {
  startEvaluationSession,
  logQuestionMetric,
  logVoiceCommand,
  endEvaluationSession,
  createMetricsTracker,
  // Survey
  saveUsabilitySurvey,
  // Research Analytics
  getResearchMetrics,
  getAggregatedResearchStats,
  getUsabilitySurveys,
  getAverageSUSScore,
};

