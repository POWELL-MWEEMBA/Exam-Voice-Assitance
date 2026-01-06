import { db } from "../config/firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

const EXAMS_COLLECTION = "exams";
const EXAM_SUBMISSIONS_COLLECTION = "examSubmissions";

/**
 * Create a new exam with questions
 * @param {Object} examData - Exam data containing title, subject, duration, and questions
 * @param {string} examinerId - UID of the examiner creating the exam
 * @returns {Promise<string>} - Document ID of the created exam
 */
export const createExam = async (examData, examinerId) => {
  try {
    // Validate questions array
    const questions = examData.questions || [];
    const questionCount = questions.length;

    if (questionCount === 0) {
      throw new Error("Cannot create exam without questions");
    }

    console.log(`[examService] Creating exam with ${questionCount} questions`);
    console.log(
      "[examService] Question types:",
      questions.map((q) => q.type)
    );

    const examDoc = {
      title: examData.title.trim(),
      subject: examData.subject.trim(),
      duration: examData.duration || 60,
      maxAttempts: examData.maxAttempts || 1,
      shuffleQuestions: examData.shuffleQuestions || false,
      shuffleOptions: examData.shuffleOptions || false,
      questions: questions, // Store all questions
      examinerId,
      status: "draft", // draft, active, inactive
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      totalQuestions: questionCount,
    };

    console.log("[examService] Exam document structure:", {
      title: examDoc.title,
      subject: examDoc.subject,
      duration: examDoc.duration,
      questionsCount: examDoc.questions.length,
      totalQuestions: examDoc.totalQuestions,
      examinerId: examDoc.examinerId,
    });

    const docRef = await addDoc(collection(db, EXAMS_COLLECTION), examDoc);
    console.log("[examService] Exam created successfully with ID:", docRef.id);
    console.log(
      "[examService] All questions saved to Firestore:",
      questionCount
    );

    return docRef.id;
  } catch (error) {
    console.error("[examService] Error creating exam:", error);
    console.error("[examService] Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Get a single exam by ID
 * @param {string} examId - Document ID of the exam
 * @returns {Promise<Object>} - Exam data with ID
 */
export const getExam = async (examId) => {
  try {
    const docRef = doc(db, EXAMS_COLLECTION, examId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("Exam not found");
    }
  } catch (error) {
    console.error("Error getting exam:", error);
    throw error;
  }
};

/**
 * Get all exams created by a specific examiner
 * @param {string} examinerId - UID of the examiner
 * @returns {Promise<Array>} - Array of exam objects
 */
export const getExamsByExaminer = async (examinerId) => {
  try {
    // Try query with orderBy first (requires index)
    try {
      const q = query(
        collection(db, EXAMS_COLLECTION),
        where("examinerId", "==", examinerId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (indexError) {
      // If index error, fallback to query without orderBy and sort in JavaScript
      const isIndexError =
        indexError.code === "failed-precondition" ||
        indexError.code === "unavailable" ||
        indexError.message?.includes("index") ||
        indexError.message?.includes("Index");

      if (isIndexError) {
        // Extract index URL from error message if available
        const indexUrlMatch = indexError.message?.match(/https:\/\/[^\s]+/);
        const indexUrl = indexUrlMatch ? indexUrlMatch[0] : null;

        if (indexUrl) {
          console.log(
            `[examService] Firestore composite index required for optimal performance.\n` +
              `The app will work without it, but queries will be slower.\n` +
              `Create the index here: ${indexUrl}\n` +
              `Or go to Firebase Console > Firestore > Indexes and create an index for:\n` +
              `Collection: ${EXAMS_COLLECTION}\n` +
              `Fields: examinerId (Ascending), createdAt (Descending)`
          );
        } else {
          console.log(
            `[examService] Using fallback query (no index). This is normal for first-time setup.\n` +
              `For better performance, create a composite index in Firebase Console:\n` +
              `Collection: ${EXAMS_COLLECTION}, Fields: examinerId (Ascending), createdAt (Descending)`
          );
        }

        const q = query(
          collection(db, EXAMS_COLLECTION),
          where("examinerId", "==", examinerId)
        );
        const querySnapshot = await getDocs(q);

        const exams = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort by createdAt in JavaScript (newest first)
        return exams.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          try {
            const aTime = a.createdAt.toDate
              ? a.createdAt.toDate().getTime()
              : new Date(a.createdAt).getTime();
            const bTime = b.createdAt.toDate
              ? b.createdAt.toDate().getTime()
              : new Date(b.createdAt).getTime();
            return bTime - aTime; // Descending order
          } catch (dateError) {
            console.warn("[examService] Error sorting by date:", dateError);
            return 0;
          }
        });
      }
      throw indexError;
    }
  } catch (error) {
    console.error("Error getting examiner exams:", error);
    throw error;
  }
};

/**
 * Get all active exams
 * @returns {Promise<Array>} - Array of active exam objects
 */
export const getActiveExams = async () => {
  try {
    // Try query with orderBy first (requires index)
    try {
      const q = query(
        collection(db, EXAMS_COLLECTION),
        where("status", "==", "active"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (indexError) {
      // If index error, fallback to query without orderBy and sort in JavaScript
      const isIndexError =
        indexError.code === "failed-precondition" ||
        indexError.code === "unavailable" ||
        indexError.message?.includes("index") ||
        indexError.message?.includes("Index");

      if (isIndexError) {
        // Extract index URL from error message if available
        const indexUrlMatch = indexError.message?.match(/https:\/\/[^\s]+/);
        const indexUrl = indexUrlMatch ? indexUrlMatch[0] : null;

        if (indexUrl) {
          console.log(
            `[examService] Firestore composite index required for optimal performance.\n` +
              `The app will work without it, but queries will be slower.\n` +
              `Create the index here: ${indexUrl}\n` +
              `Or go to Firebase Console > Firestore > Indexes and create an index for:\n` +
              `Collection: ${EXAMS_COLLECTION}\n` +
              `Fields: status (Ascending), createdAt (Descending)`
          );
        } else {
          console.log(
            `[examService] Using fallback query (no index). This is normal for first-time setup.\n` +
              `For better performance, create a composite index in Firebase Console:\n` +
              `Collection: ${EXAMS_COLLECTION}, Fields: status (Ascending), createdAt (Descending)`
          );
        }

        const q = query(
          collection(db, EXAMS_COLLECTION),
          where("status", "==", "active")
        );
        const querySnapshot = await getDocs(q);

        const exams = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort by createdAt in JavaScript (newest first)
        return exams.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          try {
            const aTime = a.createdAt.toDate
              ? a.createdAt.toDate().getTime()
              : new Date(a.createdAt).getTime();
            const bTime = b.createdAt.toDate
              ? b.createdAt.toDate().getTime()
              : new Date(b.createdAt).getTime();
            return bTime - aTime; // Descending order
          } catch (dateError) {
            console.warn("[examService] Error sorting by date:", dateError);
            return 0;
          }
        });
      }
      throw indexError;
    }
  } catch (error) {
    console.error("Error getting active exams:", error);
    throw error;
  }
};

/**
 * Update an exam
 * @param {string} examId - Document ID of the exam
 * @param {Object} updates - Object containing fields to update
 * @returns {Promise<void>}
 */
export const updateExam = async (examId, updates) => {
  try {
    const docRef = doc(db, EXAMS_COLLECTION, examId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    console.log("Exam updated:", examId);
  } catch (error) {
    console.error("Error updating exam:", error);
    throw error;
  }
};

/**
 * Update exam questions
 * @param {string} examId - Document ID of the exam
 * @param {Array} questions - Updated questions array
 * @returns {Promise<void>}
 */
export const updateExamQuestions = async (examId, questions) => {
  try {
    const docRef = doc(db, EXAMS_COLLECTION, examId);
    await updateDoc(docRef, {
      questions,
      totalQuestions: questions.length,
      updatedAt: serverTimestamp(),
    });
    console.log("Exam questions updated:", examId);
  } catch (error) {
    console.error("Error updating exam questions:", error);
    throw error;
  }
};

/**
 * Change exam status (active, inactive, draft)
 * @param {string} examId - Document ID of the exam
 * @param {string} status - New status (active, inactive, draft)
 * @returns {Promise<void>}
 */
export const updateExamStatus = async (examId, status) => {
  try {
    const validStatuses = ["active", "inactive", "draft"];
    if (!validStatuses.includes(status)) {
      throw new Error(
        `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      );
    }

    const docRef = doc(db, EXAMS_COLLECTION, examId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
    console.log("Exam status updated:", examId, status);
  } catch (error) {
    console.error("Error updating exam status:", error);
    throw error;
  }
};

/**
 * Delete an exam
 * @param {string} examId - Document ID of the exam
 * @returns {Promise<void>}
 */
export const deleteExam = async (examId) => {
  try {
    const docRef = doc(db, EXAMS_COLLECTION, examId);
    await deleteDoc(docRef);
    console.log("Exam deleted:", examId);
  } catch (error) {
    console.error("Error deleting exam:", error);
    throw error;
  }
};

/**
 * Get question by index from an exam
 * @param {string} examId - Document ID of the exam
 * @param {number} questionIndex - Index of the question (0-based)
 * @returns {Promise<Object>} - Question object
 */
export const getQuestionByIndex = async (examId, questionIndex) => {
  try {
    const exam = await getExam(examId);
    if (questionIndex >= 0 && questionIndex < exam.questions.length) {
      return exam.questions[questionIndex];
    } else {
      throw new Error("Question index out of range");
    }
  } catch (error) {
    console.error("Error getting question:", error);
    throw error;
  }
};

/**
 * Submit an exam and save graded results
 * @param {string} examId - Document ID of the exam
 * @param {string} studentId - UID of the student
 * @param {Array} answers - Array of student answers
 * @param {Object} gradingResults - Grading results from gradeExam function
 * @returns {Promise<string>} - Document ID of the submission
 */
export const submitExam = async (
  examId,
  studentId,
  answers,
  gradingResults
) => {
  try {
    console.log("[examService] ========== SUBMITTING TO FIREBASE ==========");
    console.log("[examService] Exam ID:", examId);
    console.log("[examService] Student ID:", studentId);
    console.log("[examService] Answers received:", answers);
    console.log("[examService] Answers count:", answers?.length || 0);
    console.log(
      "[examService] Answers type:",
      Array.isArray(answers) ? "Array" : typeof answers
    );

    // Log each answer
    if (Array.isArray(answers)) {
      answers.forEach((ans, idx) => {
        console.log(`[examService] Answer ${idx + 1}:`, {
          questionId: ans?.questionId,
          answer: ans?.answer,
          timestamp: ans?.timestamp,
          fullObject: ans,
        });
      });
    }

    const exam = await getExam(examId);

    const submissionDoc = {
      examId,
      examTitle: exam.title || "Untitled Exam",
      examSubject: exam.subject || "General",
      studentId,
      answers: answers || [],
      gradingResults: gradingResults || {},
      overallScore: gradingResults?.summary?.overallScore || 0,
      multipleChoiceScore: gradingResults?.summary?.multipleChoiceScore || 0,
      writtenScore: gradingResults?.summary?.writtenScore || null,
      submittedAt: serverTimestamp(),
      status:
        gradingResults?.summary?.pendingManualGrading > 0
          ? "pending"
          : "graded",
      // 'pending' = has written questions awaiting manual grading
      // 'graded' = fully graded (only multiple choice)
    };

    console.log("[examService] Submission document to save:", {
      examId: submissionDoc.examId,
      examTitle: submissionDoc.examTitle,
      studentId: submissionDoc.studentId,
      answersCount: submissionDoc.answers.length,
      answers: submissionDoc.answers,
      overallScore: submissionDoc.overallScore,
    });

    const docRef = await addDoc(
      collection(db, EXAM_SUBMISSIONS_COLLECTION),
      submissionDoc
    );
    console.log(
      "[examService] Exam submitted successfully to Firebase with ID:",
      docRef.id
    );
    console.log("[examService] ===========================================");

    return docRef.id;
  } catch (error) {
    console.error("[examService] Error submitting exam:", error);
    console.error("[examService] Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Get exam submission by ID
 * @param {string} submissionId - Document ID of the submission
 * @returns {Promise<Object>} - Submission data with ID
 */
export const getSubmission = async (submissionId) => {
  try {
    const docRef = doc(db, EXAM_SUBMISSIONS_COLLECTION, submissionId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("Submission not found");
    }
  } catch (error) {
    console.error("[examService] Error getting submission:", error);
    throw error;
  }
};

/**
 * Get all submissions for a specific exam
 * @param {string} examId - Document ID of the exam
 * @returns {Promise<Array>} - Array of submission objects
 */
export const getExamSubmissions = async (examId) => {
  try {
    const q = query(
      collection(db, EXAM_SUBMISSIONS_COLLECTION),
      where("examId", "==", examId),
      orderBy("submittedAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    // If index error, fallback to query without orderBy
    if (error.code === "failed-precondition" || error.code === "unavailable") {
      console.warn(
        "[examService] Firestore index not found. Fetching without orderBy."
      );
      const q = query(
        collection(db, EXAM_SUBMISSIONS_COLLECTION),
        where("examId", "==", examId)
      );
      const querySnapshot = await getDocs(q);

      const submissions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort by submittedAt in JavaScript
      return submissions.sort((a, b) => {
        if (!a.submittedAt || !b.submittedAt) return 0;
        try {
          const aTime = a.submittedAt.toDate
            ? a.submittedAt.toDate().getTime()
            : new Date(a.submittedAt).getTime();
          const bTime = b.submittedAt.toDate
            ? b.submittedAt.toDate().getTime()
            : new Date(b.submittedAt).getTime();
          return bTime - aTime; // Descending order
        } catch (dateError) {
          return 0;
        }
      });
    }
    console.error("[examService] Error getting exam submissions:", error);
    throw error;
  }
};

/**
 * Get all submissions by a specific student
 * @param {string} studentId - UID of the student
 * @returns {Promise<Array>} - Array of submission objects
 */
export const getStudentSubmissions = async (studentId) => {
  try {
    const q = query(
      collection(db, EXAM_SUBMISSIONS_COLLECTION),
      where("studentId", "==", studentId),
      orderBy("submittedAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    // If index error, fallback to query without orderBy
    if (error.code === "failed-precondition" || error.code === "unavailable") {
      console.warn(
        "[examService] Firestore index not found. Fetching without orderBy."
      );
      const q = query(
        collection(db, EXAM_SUBMISSIONS_COLLECTION),
        where("studentId", "==", studentId)
      );
      const querySnapshot = await getDocs(q);

      const submissions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort by submittedAt in JavaScript
      return submissions.sort((a, b) => {
        if (!a.submittedAt || !b.submittedAt) return 0;
        try {
          const aTime = a.submittedAt.toDate
            ? a.submittedAt.toDate().getTime()
            : new Date(a.submittedAt).getTime();
          const bTime = b.submittedAt.toDate
            ? b.submittedAt.toDate().getTime()
            : new Date(b.submittedAt).getTime();
          return bTime - aTime; // Descending order
        } catch (dateError) {
          return 0;
        }
      });
    }
    console.error("[examService] Error getting student submissions:", error);
    throw error;
  }
};

/**
 * Get the latest submission for an exam by a student
 * @param {string} examId - Document ID of the exam
 * @param {string} studentId - UID of the student
 * @returns {Promise<Object|null>} - Latest submission or null
 */
export const getLatestSubmission = async (examId, studentId) => {
  try {
    const q = query(
      collection(db, EXAM_SUBMISSIONS_COLLECTION),
      where("examId", "==", examId),
      where("studentId", "==", studentId),
      orderBy("submittedAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const latestDoc = querySnapshot.docs[0];
    return { id: latestDoc.id, ...latestDoc.data() };
  } catch (error) {
    // If index error, try without orderBy
    if (error.code === "failed-precondition" || error.code === "unavailable") {
      const q = query(
        collection(db, EXAM_SUBMISSIONS_COLLECTION),
        where("examId", "==", examId),
        where("studentId", "==", studentId)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      // Find latest manually
      let latest = null;
      querySnapshot.docs.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        if (!latest) {
          latest = data;
        } else {
          try {
            const latestTime = latest.submittedAt?.toDate
              ? latest.submittedAt.toDate().getTime()
              : new Date(latest.submittedAt).getTime();
            const currentTime = data.submittedAt?.toDate
              ? data.submittedAt.toDate().getTime()
              : new Date(data.submittedAt).getTime();
            if (currentTime > latestTime) {
              latest = data;
            }
          } catch (dateError) {
            // Keep current latest
          }
        }
      });

      return latest;
    }
    console.error("[examService] Error getting latest submission:", error);
    throw error;
  }
};

// ============================================
// ATTEMPT LIMITS (for blind users with voice feedback)
// ============================================

/**
 * Get attempt count for a student on an exam
 * @param {string} examId - Document ID of the exam
 * @param {string} studentId - UID of the student
 * @returns {Promise<number>} - Number of attempts used
 */
export const getAttemptCount = async (examId, studentId) => {
  try {
    const q = query(
      collection(db, EXAM_SUBMISSIONS_COLLECTION),
      where("examId", "==", examId),
      where("studentId", "==", studentId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("[examService] Error getting attempt count:", error);
    return 0;
  }
};

/**
 * Check if student can attempt exam
 * Returns eligibility info with voice-friendly message
 * @param {string} examId - Document ID of the exam
 * @param {string} studentId - UID of the student
 * @returns {Promise<Object>} - { canAttempt, attemptsUsed, maxAttempts, message }
 */
export const canAttemptExam = async (examId, studentId) => {
  try {
    const exam = await getExam(examId);
    const maxAttempts = exam.maxAttempts || 1; // Default: 1 attempt
    const attemptsUsed = await getAttemptCount(examId, studentId);

    const canAttempt = attemptsUsed < maxAttempts;
    const remaining = maxAttempts - attemptsUsed;

    let message;
    if (canAttempt) {
      if (remaining === 1) {
        message = "This is your last attempt.";
      } else if (attemptsUsed === 0) {
        message =
          maxAttempts === 1
            ? "You have 1 attempt for this exam."
            : `You have ${maxAttempts} attempts for this exam.`;
      } else {
        message = `You have ${remaining} attempt${
          remaining > 1 ? "s" : ""
        } remaining.`;
      }
    } else {
      message = "You have used all your attempts for this exam.";
    }

    return {
      canAttempt,
      attemptsUsed,
      maxAttempts,
      remaining: canAttempt ? remaining : 0,
      message,
    };
  } catch (error) {
    console.error("[examService] Error checking attempt eligibility:", error);
    return {
      canAttempt: false,
      attemptsUsed: 0,
      maxAttempts: 1,
      remaining: 0,
      message: "Error checking attempt eligibility. Please try again.",
    };
  }
};

// ============================================
// QUESTION RANDOMIZATION (for exam integrity)
// ============================================

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array (new array, original unchanged)
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Get exam with randomized questions if enabled
 * @param {string} examId - Document ID of the exam
 * @returns {Promise<Object>} - Exam with potentially shuffled questions/options
 */
export const getExamWithRandomization = async (examId) => {
  const exam = await getExam(examId);

  if (!exam) return null;

  let questions = [...(exam.questions || [])];
  let wasShuffled = false;

  // Shuffle questions if enabled
  if (exam.shuffleQuestions) {
    questions = shuffleArray(questions);
    wasShuffled = true;
  }

  // Shuffle MCQ options if enabled
  if (exam.shuffleOptions) {
    questions = questions.map((q) => {
      if (
        (q.type === "Multiple Choice" || q.type === "multiple-choice") &&
        q.options
      ) {
        // Get the correct answer text before shuffling
        const correctAnswer =
          q.correctIndex !== undefined
            ? q.options[q.correctIndex]
            : q.correctAnswer;

        // Shuffle options
        const shuffledOptions = shuffleArray([...q.options]);

        // Find new correct index after shuffle
        const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);

        return {
          ...q,
          options: shuffledOptions,
          correctIndex: newCorrectIndex,
          correctAnswer: correctAnswer, // Keep for grading
        };
      }
      return q;
    });
    wasShuffled = true;
  }

  return {
    ...exam,
    questions,
    wasShuffled, // Flag for voice announcement
  };
};
