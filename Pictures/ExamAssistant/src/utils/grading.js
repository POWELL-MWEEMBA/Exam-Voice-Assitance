/**
 * Grading utility functions
 * Handles automatic grading of exam answers
 */

/**
 * Grade a single question
 * @param {Object} question - The question object with correct answer
 * @param {string} studentAnswer - The student's answer
 * @returns {Object} - Grading result { isCorrect, score, feedback }
 */
export const gradeQuestion = (question, studentAnswer) => {
  if (!question || studentAnswer === undefined || studentAnswer === null) {
    return {
      isCorrect: false,
      score: 0,
      feedback: "No answer provided",
      graded: false,
    };
  }

  // Multiple choice question grading
  if (
    question.type === "multiple-choice" ||
    question.type === "Multiple Choice"
  ) {
    // First try to get correctAnswer directly
    let correctAnswer = question.correctAnswer;

    // If correctAnswer is not set, try to get it from correctIndex
    if (
      !correctAnswer &&
      question.options &&
      question.correctIndex !== undefined &&
      question.correctIndex !== null
    ) {
      correctAnswer = question.options[question.correctIndex];
    }

    // If still no correctAnswer, log warning
    if (!correctAnswer) {
      console.warn(
        "[grading] No correctAnswer found for question:",
        question.id || question.questionId
      );
      return {
        isCorrect: false,
        score: 0,
        feedback: "No correct answer defined",
        graded: false,
        correctAnswer: null,
      };
    }

    // Normalize both answers for comparison (trim and handle case if needed)
    const normalizedStudentAnswer = (studentAnswer || "").trim();
    const normalizedCorrectAnswer = correctAnswer.trim();

    const isCorrect = normalizedStudentAnswer === normalizedCorrectAnswer;

    console.log("[grading] Comparing answers:", {
      questionId: question.id || question.questionId,
      studentAnswer: normalizedStudentAnswer,
      correctAnswer: normalizedCorrectAnswer,
      isCorrect,
    });

    return {
      isCorrect,
      score: isCorrect ? 1 : 0,
      feedback: isCorrect ? "Correct" : "Incorrect",
      graded: true,
      correctAnswer: correctAnswer,
    };
  }

  // Written answer - auto-grade by comparing with expected answer
  if (question.type === "written" || question.type === "Written Answer") {
    const expectedAnswer =
      question.expectedAnswer || question.correctAnswer || "";

    if (!expectedAnswer) {
      // No expected answer provided, mark as pending manual grading
      return {
        isCorrect: null,
        score: null,
        feedback: "Pending manual grading - no expected answer provided",
        graded: false,
        requiresManualGrading: true,
      };
    }

    // Normalize answers for comparison (trim, lowercase, remove extra spaces)
    const normalizeText = (text) => {
      return text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .replace(/[^\w\s]/g, ""); // Remove punctuation for comparison
    };

    const normalizedStudent = normalizeText(studentAnswer);
    const normalizedExpected = normalizeText(expectedAnswer);

    // Exact match
    if (normalizedStudent === normalizedExpected) {
      return {
        isCorrect: true,
        score: 1,
        feedback: "Correct",
        graded: true,
        correctAnswer: expectedAnswer,
      };
    }

    // Check for keyword matching (if answer contains key concepts from expected answer)
    const expectedWords = normalizedExpected
      .split(/\s+/)
      .filter((w) => w.length > 3); // Words longer than 3 chars
    const studentWords = normalizedStudent.split(/\s+/);

    if (expectedWords.length > 0) {
      const matchedWords = expectedWords.filter((word) =>
        studentWords.some((sw) => sw.includes(word) || word.includes(sw))
      );
      const matchPercentage = matchedWords.length / expectedWords.length;

      // If 70% or more keywords match, consider it correct
      if (matchPercentage >= 0.7) {
        return {
          isCorrect: true,
          score: 1,
          feedback: "Correct (keyword match)",
          graded: true,
          correctAnswer: expectedAnswer,
        };
      }

      // If 50-70% keywords match, give partial credit
      if (matchPercentage >= 0.5) {
        return {
          isCorrect: true,
          score: 0.7,
          feedback: "Partially correct",
          graded: true,
          correctAnswer: expectedAnswer,
        };
      }
    }

    // No match found
    return {
      isCorrect: false,
      score: 0,
      feedback: "Incorrect",
      graded: true,
      correctAnswer: expectedAnswer,
    };
  }

  // Unknown question type
  return {
    isCorrect: false,
    score: 0,
    feedback: "Unknown question type",
    graded: false,
  };
};

/**
 * Grade an entire exam submission
 * @param {Array} questions - Array of question objects from exam
 * @param {Array} answers - Array of student answers { questionId, answer }
 * @returns {Object} - Complete grading results
 */
export const gradeExam = (questions, answers) => {
  if (!Array.isArray(questions) || !Array.isArray(answers)) {
    throw new Error("Questions and answers must be arrays");
  }

  // Create a map of answers by questionId
  const answerMap = new Map();
  answers.forEach((answer) => {
    if (answer?.questionId) {
      answerMap.set(answer.questionId, answer.answer);
    }
  });

  const gradedQuestions = [];
  let multipleChoiceCorrect = 0;
  let multipleChoiceTotal = 0;
  let writtenQuestionsTotal = 0;
  let gradedWrittenQuestions = 0;
  let totalScore = 0;
  let totalPossible = 0;

  questions.forEach((question, index) => {
    const studentAnswer = answerMap.get(question.id || `q${index + 1}`);
    const gradeResult = gradeQuestion(question, studentAnswer);

    const gradedQuestion = {
      questionId: question.id || `q${index + 1}`,
      questionText: question.question || question.text || "",
      questionType: question.type,
      studentAnswer: studentAnswer || "",
      ...gradeResult,
    };

    gradedQuestions.push(gradedQuestion);

    // Calculate scores
    if (
      question.type === "multiple-choice" ||
      question.type === "Multiple Choice"
    ) {
      multipleChoiceTotal++;
      totalPossible++;
      if (gradeResult.isCorrect) {
        multipleChoiceCorrect++;
        totalScore++;
      }
    } else if (
      question.type === "written" ||
      question.type === "Written Answer"
    ) {
      writtenQuestionsTotal++;
      totalPossible++;
      // Written questions are now auto-graded
      if (gradeResult.graded && gradeResult.isCorrect !== null) {
        totalScore += gradeResult.score || 0;
        if (gradeResult.isCorrect) {
          gradedWrittenQuestions++;
        }
      }
    }
  });

  // Calculate percentage scores
  const multipleChoiceScore =
    multipleChoiceTotal > 0
      ? Math.round((multipleChoiceCorrect / multipleChoiceTotal) * 100)
      : 0;

  // Written questions score (now auto-graded)
  const writtenScore =
    writtenQuestionsTotal > 0
      ? Math.round((gradedWrittenQuestions / writtenQuestionsTotal) * 100)
      : 0;

  // Overall score based on auto-graded questions only
  const overallScore =
    totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

  return {
    gradedQuestions,
    summary: {
      totalQuestions: questions.length,
      answeredQuestions: answers.length,
      multipleChoiceQuestions: multipleChoiceTotal,
      multipleChoiceCorrect,
      multipleChoiceScore,
      writtenQuestions: writtenQuestionsTotal,
      writtenScore,
      writtenCorrect: gradedWrittenQuestions,
      overallScore,
      totalScore,
      totalPossible,
      gradedAutomatically: totalPossible,
      pendingManualGrading: 0, // All questions are now auto-graded
    },
  };
};
