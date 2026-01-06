/**
 * Offline support service for blind users
 * Caches exams locally and syncs when online
 * Works without native network modules - uses fetch to check connectivity
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHED_EXAMS_KEY = 'cached_exams';
const PENDING_SUBMISSIONS_KEY = 'pending_submissions';
const OFFLINE_ANSWERS_KEY = 'offline_answers_';

/**
 * Check network status by trying to reach a reliable endpoint
 * @param {boolean} announce - Whether to announce status via TTS
 * @returns {Promise<boolean>} - True if online
 */
export const checkNetworkStatus = async (announce = true) => {
  try {
    // Try to fetch a small resource to check connectivity
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const isOnline = response.ok || response.status === 204;
    
    return isOnline;
  } catch (error) {
    // Network error = offline
    console.log('[Offline] Network check failed, assuming offline:', error.message);
    
    return false;
  }
};

/**
 * Subscribe to network status changes (polling-based fallback)
 * @param {Function} callback - Called with (isOnline) when status changes
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToNetworkChanges = (callback) => {
  // Poll every 30 seconds as a fallback
  let lastStatus = null;
  
  const checkAndNotify = async () => {
    const isOnline = await checkNetworkStatus(false);
    if (lastStatus !== null && lastStatus !== isOnline) {
      callback(isOnline);
    }
    lastStatus = isOnline;
  };
  
  const intervalId = setInterval(checkAndNotify, 30000);
  checkAndNotify(); // Initial check
  
  return () => clearInterval(intervalId);
};

/**
 * Cache exams for offline use
 * @param {Array} exams - Array of exam objects
 */
export const cacheExams = async (exams) => {
  try {
    await AsyncStorage.setItem(CACHED_EXAMS_KEY, JSON.stringify({
      exams,
      cachedAt: new Date().toISOString(),
    }));
    console.log('[Offline] Cached', exams.length, 'exams');
  } catch (error) {
    console.error('[Offline] Failed to cache exams:', error);
  }
};

/**
 * Get cached exams when offline
 * @returns {Promise<Array>} - Array of cached exams
 */
export const getCachedExams = async () => {
  try {
    const data = await AsyncStorage.getItem(CACHED_EXAMS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.exams || [];
    }
    return [];
  } catch (error) {
    console.error('[Offline] Failed to get cached exams:', error);
    return [];
  }
};

/**
 * Save answers locally during exam (for auto-save and offline support)
 * @param {string} examId - Exam document ID
 * @param {Array} answers - Array of answer objects
 * @param {number} currentQuestionIndex - Current question index for resume
 */
export const saveAnswersLocally = async (examId, answers, currentQuestionIndex = 0) => {
  try {
    const key = OFFLINE_ANSWERS_KEY + examId;
    await AsyncStorage.setItem(key, JSON.stringify({
      answers,
      currentQuestionIndex,
      savedAt: new Date().toISOString(),
    }));
    console.log('[Offline] Auto-saved', answers.length, 'answers at question', currentQuestionIndex + 1);
  } catch (error) {
    console.error('[Offline] Failed to save answers locally:', error);
  }
};

/**
 * Get locally saved answers (for resume)
 * @param {string} examId - Exam document ID
 * @returns {Promise<Object|null>} - { answers, currentQuestionIndex, savedAt } or null
 */
export const getLocalAnswers = async (examId) => {
  try {
    const key = OFFLINE_ANSWERS_KEY + examId;
    const data = await AsyncStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('[Offline] Failed to get local answers:', error);
    return null;
  }
};

/**
 * Clear local answers after successful submission
 * @param {string} examId - Exam document ID
 */
export const clearLocalAnswers = async (examId) => {
  try {
    const key = OFFLINE_ANSWERS_KEY + examId;
    await AsyncStorage.removeItem(key);
    console.log('[Offline] Cleared local answers for exam:', examId);
  } catch (error) {
    console.error('[Offline] Failed to clear local answers:', error);
  }
};

/**
 * Queue submission for later sync (when offline)
 * @param {string} examId - Exam document ID
 * @param {string} studentId - Student UID
 * @param {Array} answers - Array of answer objects
 * @param {Object} gradingResults - Grading results
 * @returns {Promise<boolean>} - True if queued successfully
 */
export const queueSubmission = async (examId, studentId, answers, gradingResults) => {
  try {
    const pending = await getPendingSubmissions();
    
    // Check if already queued (prevent duplicates)
    const alreadyQueued = pending.some(
      (p) => p.examId === examId && p.studentId === studentId
    );
    
    if (alreadyQueued) {
      // Update existing queued submission
      const updated = pending.map((p) => {
        if (p.examId === examId && p.studentId === studentId) {
          return { ...p, answers, gradingResults, queuedAt: new Date().toISOString() };
        }
        return p;
      });
      await AsyncStorage.setItem(PENDING_SUBMISSIONS_KEY, JSON.stringify(updated));
    } else {
      // Add new queued submission
      pending.push({
        examId,
        studentId,
        answers,
        gradingResults,
        queuedAt: new Date().toISOString(),
      });
      await AsyncStorage.setItem(PENDING_SUBMISSIONS_KEY, JSON.stringify(pending));
    }
    
    return true;
  } catch (error) {
    console.error('[Offline] Failed to queue submission:', error);
    return false;
  }
};

/**
 * Get pending submissions to sync
 * @returns {Promise<Array>} - Array of pending submission objects
 */
export const getPendingSubmissions = async () => {
  try {
    const data = await AsyncStorage.getItem(PENDING_SUBMISSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[Offline] Failed to get pending submissions:', error);
    return [];
  }
};

/**
 * Get count of pending submissions
 * @returns {Promise<number>} - Number of pending submissions
 */
export const getPendingSubmissionCount = async () => {
  const pending = await getPendingSubmissions();
  return pending.length;
};

/**
 * Sync pending submissions when back online
 * @param {Function} submitFunction - The submitExam function from examService
 * @returns {Promise<{ synced: number, failed: number }>}
 */
export const syncPendingSubmissions = async (submitFunction) => {
  const pending = await getPendingSubmissions();
  
  if (pending.length === 0) {
    return { synced: 0, failed: 0 };
  }
  
  const failed = [];
  let synced = 0;
  
  for (const submission of pending) {
    try {
      await submitFunction(
        submission.examId,
        submission.studentId,
        submission.answers,
        submission.gradingResults
      );
      synced++;
      
      // Clear local answers for this exam
      await clearLocalAnswers(submission.examId);
    } catch (error) {
      console.error('[Offline] Failed to sync submission:', error);
      failed.push(submission);
    }
  }
  
  // Save only failed ones back
  await AsyncStorage.setItem(PENDING_SUBMISSIONS_KEY, JSON.stringify(failed));
  
  return { synced, failed: failed.length };
};

/**
 * Clear all offline data (for logout)
 */
export const clearAllOfflineData = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const offlineKeys = keys.filter(
      (k) => k.startsWith(OFFLINE_ANSWERS_KEY) || 
             k === CACHED_EXAMS_KEY || 
             k === PENDING_SUBMISSIONS_KEY
    );
    await AsyncStorage.multiRemove(offlineKeys);
    console.log('[Offline] Cleared all offline data');
  } catch (error) {
    console.error('[Offline] Failed to clear offline data:', error);
  }
};

