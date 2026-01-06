import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppColors } from "../../constants/AppColors";
import { globalStyles } from "../../constants/GlobalStyles";
import { getExam, submitExam } from "../../services/examService";
import { gradeExam } from "../../utils/grading";
import { useAuth } from "../../context/AuthContext";
import {
  startEvaluationSession,
  createMetricsTracker,
} from "../../services/evaluationMetrics";
import speechService from "../../services/speechService";
import screenContextService from "../../services/screenContextService";

const { width: screenWidth } = Dimensions.get("window");

const ExamPage = ({ route, navigation }) => {
  // Get examId from route params
  const examId = route?.params?.examId;
  const { user } = useAuth();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [accessibilityMode, setAccessibilityMode] = useState(true); // Enable by default for VI users
  const [isWaitingForSubmitConfirmation, setIsWaitingForSubmitConfirmation] =
    useState(false);

  // Use refs to track state and prevent multiple loads
  const loadedExamIdRef = useRef(null);
  const isLoadingRef = useRef(false);
  const examIdRef = useRef(examId);

  // Metrics tracker for research evaluation
  const metricsTrackerRef = useRef(null);
  const evaluationSessionIdRef = useRef(null);

  // Speech service refs
  const speechInitializedRef = useRef(false);
  const isProcessingCommandRef = useRef(false);
  const isWaitingForConfirmationRef = useRef(false);

  // Update examId ref when it changes
  useEffect(() => {
    examIdRef.current = examId;
  }, [examId]);

  // Ref for accessing current question in callbacks
  const currentQuestionRef = useRef(null);
  const saveAnswerRef = useRef(null);
  const getCurrentAnswerRef = useRef(null);
  const examRef = useRef(null); // Ref to access current exam state in callbacks
  const currentQuestionIndexRef = useRef(0); // Ref to track current question index
  const totalQuestionsRef = useRef(0); // Ref to track total number of questions
  const answersRef = useRef([]); // Ref to track latest answers for submission

  // Transform Firebase question format to ExamPage format
  const transformQuestions = (firebaseQuestions) => {
    if (!Array.isArray(firebaseQuestions)) return [];

    return firebaseQuestions.map((q, index) => {
      // Handle different question type formats
      const questionType = q.type?.toLowerCase();
      const isMultipleChoice =
        questionType === "multiple choice" ||
        questionType === "multiple-choice" ||
        (q.options && Array.isArray(q.options));

      if (isMultipleChoice && q.options) {
        // Get correct answer from options array using correctIndex
        const correctAnswer =
          q.correctIndex !== undefined && q.options[q.correctIndex]
            ? q.options[q.correctIndex]
            : q.correctAnswer || q.options[0];

        return {
          id: q.id || `q${index + 1}`,
          question: q.text || q.question || "",
          type: "multiple-choice",
          options: q.options || [],
          correctAnswer,
        };
      } else {
        // Written answer question
        return {
          id: q.id || `q${index + 1}`,
          question: q.text || q.question || "",
          type: "written",
          expectedAnswer: q.expectedAnswer || q.correctAnswer || null,
        };
      }
    });
  };

  // Load exam from Firebase - only run once per examId
  useEffect(() => {
    const currentExamId = examIdRef.current;

    // Don't do anything if examId is not available yet
    if (!currentExamId) {
      console.log("[ExamPage] No examId, skipping load");
      return;
    }

    // If we already loaded this exact examId, don't reload
    if (loadedExamIdRef.current === currentExamId) {
      console.log("[ExamPage] Exam already loaded:", currentExamId);
      return;
    }

    // If we're already loading, don't start another load
    if (isLoadingRef.current) {
      console.log("[ExamPage] Already loading, skipping");
      return;
    }

    // If examId changed from a previous one, reset state first
    if (
      loadedExamIdRef.current !== null &&
      loadedExamIdRef.current !== currentExamId
    ) {
      console.log("[ExamPage] ExamId changed, resetting state");
      loadedExamIdRef.current = null;
      setExam(null);
      examRef.current = null; // Clear exam ref
      setAnswers([]);
      answersRef.current = []; // Clear answers ref
      setCurrentQuestionIndex(0);
      currentQuestionIndexRef.current = 0; // Reset index ref
      totalQuestionsRef.current = 0; // Reset total questions ref
      setError(null);
      isLoadingRef.current = false;
    }

    // Mark that we're loading this examId BEFORE starting the async operation
    loadedExamIdRef.current = currentExamId;
    let isMounted = true;
    let shouldLoad = true;

    const loadExam = async () => {
      if (!shouldLoad || !isMounted) return;

      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        console.log("[ExamPage] Loading exam:", currentExamId);
        const examData = await getExam(currentExamId);

        if (!isMounted || !shouldLoad) {
          console.log("[ExamPage] Component unmounted during load, aborting");
          return;
        }

        if (!examData) {
          throw new Error("Exam not found");
        }

        const transformedQuestions = transformQuestions(
          examData.questions || []
        );

        if (transformedQuestions.length === 0) {
          throw new Error("Exam has no questions");
        }

        const examObj = {
          id: examData.id || currentExamId,
          title: examData.title || "Untitled Exam",
          duration: examData.duration || 60,
          questions: transformedQuestions,
        };

        if (!isMounted || !shouldLoad) {
          console.log(
            "[ExamPage] Component unmounted after transform, aborting"
          );
          return;
        }

        console.log("[ExamPage] Exam loaded successfully:", examObj.id);
        setExam(examObj);
        examRef.current = examObj; // Update ref for use in callbacks
        totalQuestionsRef.current = examObj.questions?.length || 0; // Store total questions count
        currentQuestionIndexRef.current = 0; // Reset index
        setTimeRemaining((examObj.duration || 60) * 60); // Convert to seconds
        isLoadingRef.current = false;
        setLoading(false);
      } catch (err) {
        console.error("[ExamPage] Error loading exam:", err);
        if (!isMounted || !shouldLoad) return;
        setError(err?.message || "Failed to load exam");
        isLoadingRef.current = false;
        setLoading(false);
        loadedExamIdRef.current = null; // Allow retry on error
      }
    };

    loadExam();

    return () => {
      console.log("[ExamPage] Cleanup: unmounting load effect");
      isMounted = false;
      shouldLoad = false;
    };
  }, [examId]);

  const currentQuestion = exam?.questions?.[currentQuestionIndex];
  const answeredIds = useMemo(
    () => new Set(answers.map((entry) => entry.questionId)),
    [answers]
  );
  const progress = exam?.questions?.length
    ? ((currentQuestionIndex + 1) / exam.questions.length) * 100
    : 0;
  const answeredQuestions = answeredIds.size;

  const submitExamAnswers = useCallback(async () => {
    if (!exam || !user?.uid) return;

    setSubmitting(true);
    isWaitingForConfirmationRef.current = false;

    try {
      // Stop speech before submitting
      await speechService.stopListening();
      await speechService.stopSpeaking();

      // Use ref to get the latest answers (avoids stale closure issues)
      const latestAnswers = answersRef.current || answers;

      console.log("[ExamPage] ========== SUBMITTING EXAM ==========");
      console.log(
        "[ExamPage] Using answers from ref:",
        answersRef.current.length
      );
      console.log("[ExamPage] Using answers from state:", answers.length);
      console.log("[ExamPage] Latest answers to submit:", latestAnswers);
      console.log("[ExamPage] Exam questions count:", exam.questions?.length);

      // Log each answer for debugging
      latestAnswers.forEach((ans, idx) => {
        console.log(`[ExamPage] Answer ${idx + 1}:`, {
          questionId: ans.questionId,
          answer: ans.answer,
          timestamp: ans.timestamp,
        });
      });

      // Grade the exam
      const gradingResults = gradeExam(exam.questions, latestAnswers);

      console.log("[ExamPage] Grading results:", {
        overallScore: gradingResults.summary.overallScore,
        totalScore: gradingResults.summary.totalScore,
        totalPossible: gradingResults.summary.totalPossible,
      });

      // Save submission to Firebase
      const submissionId = await submitExam(
        exam.id,
        user.uid,
        latestAnswers,
        gradingResults
      );

      console.log(
        "[ExamPage] Exam submitted successfully to Firebase:",
        submissionId
      );
      console.log("[ExamPage] Submission document ID:", submissionId);

      // Save evaluation metrics for research
      if (metricsTrackerRef.current) {
        // End the current question tracking
        const currentAnswerExists = answers.some(
          (a) => a.questionId === currentQuestion?.id
        );
        metricsTrackerRef.current.endQuestion(currentAnswerExists, "voice");

        // Save final metrics
        await metricsTrackerRef.current.save(
          "completed",
          gradingResults.summary.overallScore
        );
        console.log("[ExamPage] Evaluation metrics saved");
      }

      // Announce successful submission
      await speechService.speak("Your exam has been submitted successfully.");

      // Read the scores to the user
      const summary = gradingResults.summary;
      const overallScore = summary.overallScore || 0;
      const mcScore = summary.multipleChoiceScore || 0;
      const writtenScore = summary.writtenScore || 0;
      const totalQuestions = summary.totalQuestions || 0;
      const answeredQuestions = summary.answeredQuestions || 0;

      // Calculate grade
      const getGrade = (score) => {
        if (score >= 90) return "A";
        if (score >= 80) return "B";
        if (score >= 70) return "C";
        if (score >= 60) return "D";
        return "F";
      };

      // Get performance message
      const getPerformanceMessage = (score) => {
        if (score >= 90)
          return "Excellent work! You have mastered this material.";
        if (score >= 80) return "Great job! Your understanding is strong.";
        if (score >= 70) return "Good effort! Consider reviewing some topics.";
        if (score >= 60) return "You passed, but there's room for improvement.";
        return "Please review the material and consider retaking the exam.";
      };

      const grade = getGrade(overallScore);
      const performanceMessage = getPerformanceMessage(overallScore);

      // Read scores
      const scoresMessage = `Exam completed. Overall score: ${overallScore} percent. Grade: ${grade}. ${performanceMessage} You answered ${answeredQuestions} of ${totalQuestions} questions. Multiple choice score: ${mcScore} percent. Written questions score: ${writtenScore} percent.`;
      await speechService.speak(scoresMessage);

      // Change context back to HOME
      screenContextService.setContext("HOME");

      // Navigate to home page after reading scores
      setTimeout(() => {
        navigation?.navigate("HomePage");
      }, 1000);
    } catch (err) {
      console.error("[ExamPage] Error submitting exam:", err);

      await speechService.speak("Failed to submit exam. Please try again.");
      setSubmitting(false);
    }
  }, [exam, user, answers, navigation, currentQuestion]);

  const handleAutoSubmit = useCallback(async () => {
    // Auto-submit without confirmation when time runs out
    await submitExamAnswers();
  }, [submitExamAnswers]);

  const handleSubmit = useCallback(async () => {
    if (!exam || !user?.uid) return;

    // Show confirmation alert
    Alert.alert(
      "Submit Exam",
      "Are you sure you want to submit your exam? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: submitExamAnswers,
        },
      ]
    );
  }, [exam, user, submitExamAnswers]);

  // Timer countdown
  useEffect(() => {
    if (!exam || timeRemaining <= 0 || submitting) return;

    const timerId = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          // Auto-submit when time runs out
          handleAutoSubmit();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [exam, timeRemaining, submitting, handleAutoSubmit]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getCurrentAnswer = () => {
    if (!currentQuestion) return "";
    return (
      answers.find((entry) => entry.questionId === currentQuestion.id)
        ?.answer ?? ""
    );
  };

  const saveAnswer = (answer) => {
    if (!currentQuestion) {
      console.warn("[ExamPage] saveAnswer called but currentQuestion is null");
      return;
    }

    // Ensure answer is a string and trimmed
    const trimmedAnswer = String(answer || "").trim();
    if (!trimmedAnswer) {
      console.warn(
        "[ExamPage] Attempted to save empty answer for question:",
        currentQuestion.id
      );
      return;
    }

    setAnswers((prev) => {
      const filtered = prev.filter(
        (entry) => entry.questionId !== currentQuestion.id
      );
      const newAnswers = [
        ...filtered,
        {
          questionId: currentQuestion.id,
          answer: trimmedAnswer,
          timestamp: new Date().toISOString(),
        },
      ];

      // Update ref with latest answers
      answersRef.current = newAnswers;

      console.log("[ExamPage] Answer saved:", {
        questionId: currentQuestion.id,
        answer: trimmedAnswer,
        totalAnswers: newAnswers.length,
        allAnswers: newAnswers,
      });

      return newAnswers;
    });
  };

  // Update refs for use in speech callbacks
  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
    saveAnswerRef.current = saveAnswer;
    getCurrentAnswerRef.current = getCurrentAnswer;
    answersRef.current = answers; // Keep ref in sync with state
  });

  // TTS/STT removed - speech functions deleted

  // TTS/STT removed - speech functions deleted

  const handleNextQuestion = useCallback(async () => {
    // Use refs to get current state (avoids closure issues)
    const currentExam = examRef.current || exam;
    const currentIndex = currentQuestionIndexRef.current;
    const totalQuestions =
      totalQuestionsRef.current || currentExam?.questions?.length || 0;

    console.log("[ExamPage] handleNextQuestion called", {
      hasExam: !!currentExam,
      currentIndex: currentIndex,
      currentIndexState: currentQuestionIndex,
      totalQuestions: totalQuestions,
      canMoveNext: currentIndex < totalQuestions - 1,
    });

    if (!currentExam || totalQuestions === 0) {
      console.log(
        "[ExamPage] ❌ No exam available or no questions, cannot navigate"
      );
      return;
    }

    // Check if we can move to next question using refs (more reliable)
    if (currentIndex < totalQuestions - 1) {
      console.log("[ExamPage] Moving to next question...");

      // Navigate to next question (using ref value + 1)
      const nextIndex = currentIndex + 1;
      console.log(
        "[ExamPage] ✅ Moving from question",
        currentIndex + 1,
        "to question",
        nextIndex + 1,
        "of",
        totalQuestions
      );

      // Update both state and ref
      currentQuestionIndexRef.current = nextIndex;
      setCurrentQuestionIndex(nextIndex);

      // Read the new question after navigation
      setTimeout(async () => {
        await readCurrentQuestion();
      }, 300);
    } else {
      console.log(
        "[ExamPage] Already on last question (",
        currentIndex + 1,
        "of",
        totalQuestions,
        ")."
      );
      // Just read the question - submit prompt will come after answer selection
      await readCurrentQuestion();
    }
  }, [exam, currentQuestionIndex, readCurrentQuestion]);

  const handlePreviousQuestion = useCallback(async () => {
    // Use refs to get current state (avoids closure issues)
    const currentIndex = currentQuestionIndexRef.current;
    const totalQuestions = totalQuestionsRef.current;

    console.log("[ExamPage] handlePreviousQuestion called", {
      currentIndex: currentIndex,
      canMoveBack: currentIndex > 0,
    });

    if (currentIndex > 0) {
      // Navigate to previous question (using ref value - 1)
      const prevIndex = currentIndex - 1;
      console.log(
        "[ExamPage] ✅ Moving from question",
        currentIndex + 1,
        "to question",
        prevIndex + 1,
        "of",
        totalQuestions
      );

      // Update both state and ref
      currentQuestionIndexRef.current = prevIndex;
      setCurrentQuestionIndex(prevIndex);

      // Read the previous question after navigation
      setTimeout(async () => {
        await readCurrentQuestion();
      }, 300);
    } else {
      console.log("[ExamPage] Already on first question");
      await speechService.speak("You are already on the first question.");
    }
  }, [readCurrentQuestion]);

  // TTS/STT removed - speech functions deleted

  // Read current question aloud
  const readCurrentQuestion = useCallback(async () => {
    const currentExam = examRef.current || exam;
    const currentIndex = currentQuestionIndexRef.current;
    const question = currentExam?.questions?.[currentIndex];

    if (!question) {
      console.log("[ExamPage] No question found at index:", currentIndex);
      return;
    }

    try {
      // Read question first
      const questionText = `Question ${currentIndex + 1}. ${
        question.question
      }. `;
      console.log("[ExamPage] Reading question:", questionText);
      await speechService.speak(questionText);

      // Wait a bit before reading options to ensure question is fully spoken
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Read options separately to ensure all are read
      if (
        question.type === "multiple-choice" &&
        question.options &&
        question.options.length > 0
      ) {
        console.log("[ExamPage] Reading", question.options.length, "options");

        for (let index = 0; index < question.options.length; index++) {
          const letter = String.fromCharCode(65 + index); // A, B, C, D
          const optionText = `Option ${letter}: ${question.options[index]}. `;
          console.log("[ExamPage] Reading option:", optionText);
          await speechService.speak(optionText);

          // Small delay between options to ensure each is fully spoken
          if (index < question.options.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }

        console.log("[ExamPage] Finished reading all options");
      }
    } catch (error) {
      console.error("[ExamPage] Error reading question:", error);
    }
  }, [exam]);

  // Handle voice commands for EXAM context
  const handleVoiceCommand = useCallback(
    async (transcript) => {
      console.log(
        "[ExamPage] handleVoiceCommand called with transcript:",
        transcript
      );

      if (isProcessingCommandRef.current) {
        console.log("[ExamPage] Already processing command, ignoring");
        return;
      }

      if (!transcript || typeof transcript !== "string") {
        console.log("[ExamPage] Invalid transcript:", transcript);
        return;
      }

      const command = transcript.toLowerCase().trim();
      console.log(
        "[ExamPage] Voice command received:",
        command,
        "Context:",
        screenContextService.getContext()
      );

      // Check if we're in EXAM context
      if (screenContextService.getContext() !== "EXAM") {
        console.log(
          "[ExamPage] Not in EXAM context, ignoring command. Current context:",
          screenContextService.getContext()
        );
        return;
      }

      // Handle confirmation commands if waiting for submit confirmation
      if (isWaitingForConfirmationRef.current) {
        if (command === "yes") {
          isProcessingCommandRef.current = true;
          await speechService.stopListening();
          await speechService.speak("Submitting exam.");
          isWaitingForConfirmationRef.current = false;
          await submitExamAnswers();
          return;
        } else if (command === "no") {
          isProcessingCommandRef.current = true;
          await speechService.stopListening();
          await speechService.speak("Returning to current question.");
          isWaitingForConfirmationRef.current = false;
          // Re-read current question
          setTimeout(async () => {
            await readCurrentQuestion();
            // Start listening after question is read
            setTimeout(async () => {
              if (
                screenContextService.getContext() === "EXAM" &&
                !speechService.isListening &&
                !speechService.isSpeaking
              ) {
                console.log(
                  "[ExamPage] Starting listening after canceling submit"
                );
                await speechService.startListening();
              }
            }, 1000);
          }, 500);
          isProcessingCommandRef.current = false;
          return;
        }
      }

      isProcessingCommandRef.current = true;

      try {
        // Stop listening before processing
        await speechService.stopListening();

        const currentExam = examRef.current || exam;
        const currentIndex = currentQuestionIndexRef.current;
        const currentQuestion = currentExam?.questions?.[currentIndex];
        const totalQuestions =
          totalQuestionsRef.current || currentExam?.questions?.length || 0;
        const isLastQuestion = currentIndex === totalQuestions - 1;

        // Handle answer selection for multiple-choice questions FIRST (before navigation commands)
        if (
          currentQuestion?.type === "multiple-choice" &&
          currentQuestion.options
        ) {
          // Match patterns like "option a", "option b", "a", "b", etc.
          // Prioritize matches at the END of the command (user's actual input, not TTS output)
          let selectedLetter = null;

          // First, try to find standalone commands at the end (most reliable)
          const endPatterns = [
            /\b(?:select|choose|pick)\s+(?:option\s+)?([a-d])\s*$/i,
            /\b(?:option\s+)?([a-d])\s*$/i,
          ];

          for (const pattern of endPatterns) {
            const match = command.match(pattern);
            if (match) {
              selectedLetter = match[1].toUpperCase();
              break;
            }
          }

          // If no end match, try to find a match in the last 15 characters
          if (!selectedLetter) {
            const lastPart = command.slice(-15);
            const lastMatch = lastPart.match(/\b(?:option\s+)?([a-d])\b/i);
            if (lastMatch) {
              selectedLetter = lastMatch[1].toUpperCase();
            }
          }

          // If still no match, use the last occurrence (fallback)
          if (!selectedLetter) {
            const allMatches = [
              ...command.matchAll(/\b(?:option\s+)?([a-d])\b/gi),
            ];
            if (allMatches && allMatches.length > 0) {
              selectedLetter =
                allMatches[allMatches.length - 1][1].toUpperCase();
            }
          }

          if (selectedLetter) {
            const optionIndex = selectedLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3

            console.log(
              "[ExamPage] Option match found - letter:",
              selectedLetter,
              "index:",
              optionIndex,
              "from command:",
              command
            );

            if (
              optionIndex >= 0 &&
              optionIndex < currentQuestion.options.length
            ) {
              const selectedOption = currentQuestion.options[optionIndex];
              // Save the answer using the ref to ensure we have the latest function
              if (saveAnswerRef.current) {
                saveAnswerRef.current(selectedOption);
              } else {
                saveAnswer(selectedOption);
              }

              // Check if this is the last question
              const isLastQuestion = currentIndex === totalQuestions - 1;

              if (isLastQuestion) {
                // On last question, inform user to submit after selecting answer
                await speechService.speak(
                  `Option ${selectedLetter} selected: ${selectedOption}. This is the last question. Say submit to finish the exam.`
                );
              } else {
                // For non-last questions, prompt to go to next question
                await speechService.speak(
                  `Option ${selectedLetter} selected: ${selectedOption}. Say next question to continue.`
                );
              }

              isProcessingCommandRef.current = false;
              setTimeout(async () => {
                if (
                  screenContextService.getContext() === "EXAM" &&
                  !speechService.isSpeaking
                ) {
                  await speechService.startListening();
                }
              }, 1500);
              return;
            } else {
              // Invalid option letter
              await speechService.speak(
                `Invalid option. Please choose A, B, C, or D.`
              );
              isProcessingCommandRef.current = false;
              setTimeout(async () => {
                if (
                  screenContextService.getContext() === "EXAM" &&
                  !speechService.isSpeaking
                ) {
                  await speechService.startListening();
                }
              }, 1500);
              return;
            }
          }
        }

        // Handle navigation and control commands (use includes for more flexible matching)
        console.log(
          "[ExamPage] Processing command:",
          command,
          "isLastQuestion:",
          isLastQuestion
        );

        if (command.includes("next")) {
          console.log("[ExamPage] Next command detected");
          if (isLastQuestion) {
            await speechService.speak(
              "You are on the last question. Please select an answer, then say submit to finish the exam."
            );
          } else {
            console.log("[ExamPage] Calling handleNextQuestion");
            await handleNextQuestion();
          }
        } else if (command.includes("previous") || command.includes("back")) {
          console.log("[ExamPage] Previous command detected");
          await handlePreviousQuestion();
        } else if (
          command.includes("repeat") ||
          command.includes("read") ||
          command.includes("again")
        ) {
          console.log("[ExamPage] Repeat command detected");
          await readCurrentQuestion();
        } else if (command.includes("submit") || command.includes("finish")) {
          console.log("[ExamPage] Submit command detected");
          await handleSubmitCommand();
        } else if (
          command.includes("exit") ||
          command.includes("quit") ||
          command.includes("leave")
        ) {
          console.log("[ExamPage] Exit command detected");
          await handleExitCommand();
        } else {
          // Unrecognized command
          console.log("[ExamPage] Unrecognized command:", command);
          await speechService.speak(
            "Sorry, I did not understand that command. Please try again."
          );
        }
      } catch (error) {
        console.error("[ExamPage] Error handling voice command:", error);
        await speechService.speak(
          "Sorry, an error occurred. Please try again."
        );
      } finally {
        isProcessingCommandRef.current = false;
        // Re-enable listening after response (unless waiting for confirmation)
        if (!isWaitingForConfirmationRef.current) {
          setTimeout(async () => {
            if (screenContextService.getContext() === "EXAM") {
              await speechService.startListening();
            }
          }, 500);
        }
      }
    },
    [
      exam,
      saveAnswer,
      handleNextQuestion,
      handlePreviousQuestion,
      readCurrentQuestion,
      handleSubmitCommand,
      handleExitCommand,
      submitExamAnswers,
    ]
  );

  // Handle submit command
  const handleSubmitCommand = useCallback(async () => {
    isWaitingForConfirmationRef.current = true;
    await speechService.speak(
      "Are you sure you want to submit the exam? Say yes to confirm or no to cancel."
    );
    // Start listening after confirmation prompt to wait for yes/no response
    setTimeout(async () => {
      if (
        screenContextService.getContext() === "EXAM" &&
        !speechService.isListening &&
        !speechService.isSpeaking
      ) {
        console.log("[ExamPage] Starting listening after confirmation prompt");
        await speechService.startListening();
      }
    }, 1000);
  }, []);

  // Handle exit command
  const handleExitCommand = useCallback(async () => {
    await speechService.speak("Exiting exam.");
    await speechService.cleanup();
    screenContextService.setContext("HOME");
    navigation?.goBack();
  }, [navigation]);

  // Handle speech recognition errors
  const handleSpeechError = useCallback(async (error) => {
    console.error("[ExamPage] Speech error:", error);

    if (error.type === "silence_timeout") {
      await speechService.speak(
        "Please say a command. For example, say next or repeat."
      );
    } else {
      // Re-enable listening after error
      if (!isWaitingForConfirmationRef.current) {
        setTimeout(async () => {
          if (screenContextService.getContext() === "EXAM") {
            await speechService.startListening();
          }
        }, 1000);
      }
    }
  }, []);

  // Initialize evaluation session when exam loads
  useEffect(() => {
    if (!exam || !user?.uid) return;

    const initSession = async () => {
      console.log("[ExamPage] Initializing exam session...");

      // Start evaluation metrics session for research
      const sessionId = await startEvaluationSession(exam.id, user.uid, {
        title: exam.title,
        totalQuestions: exam.questions.length,
      });

      if (sessionId) {
        evaluationSessionIdRef.current = sessionId;
        metricsTrackerRef.current = createMetricsTracker(sessionId);
        console.log("[ExamPage] Evaluation session started:", sessionId);
      }

      // Start metrics for first question
      if (metricsTrackerRef.current && exam.questions[0]) {
        metricsTrackerRef.current.startQuestion(0, exam.questions[0].type);
      }
    };

    initSession();
  }, [exam, user?.uid]);

  // Initialize speech service when exam loads
  useEffect(() => {
    let mounted = true;

    const initializeSpeech = async () => {
      if (!exam || speechInitializedRef.current) return;

      try {
        // Initialize speech service if not already done
        if (!speechService.isInitialized) {
          const initialized = await speechService.initialize();
          if (!initialized) {
            console.warn("[ExamPage] Speech service initialization failed");
            return;
          }
        }

        // Set up callbacks
        speechService.setOnRecognitionResult(handleVoiceCommand);
        speechService.setOnRecognitionError(handleSpeechError);
        speechService.setOnSpeechEnd(async () => {
          // Re-enable listening after speech ends
          // But only if we've already read the first question (to avoid starting too early)
          // And only if we're not in the initial setup phase
          if (
            mounted &&
            screenContextService.getContext() === "EXAM" &&
            !isWaitingForConfirmationRef.current &&
            hasReadFirstQuestionRef.current &&
            speechInitializedRef.current
          ) {
            setTimeout(async () => {
              if (
                !speechService.isListening &&
                !speechService.isSpeaking &&
                screenContextService.getContext() === "EXAM"
              ) {
                console.log("[ExamPage] Starting listening after speech ended");
                await speechService.startListening();
              }
            }, 500);
          }
        });

        speechInitializedRef.current = true;

        // Set EXAM context
        screenContextService.setContext("EXAM");

        // Welcome message and instructions
        if (mounted) {
          // Mark that we're initializing to prevent the effect from running
          isInitializingRef.current = true;
          hasReadFirstQuestionRef.current = false;

          await speechService.speak(
            "The exam has started. Say next to go to the next question. Say repeat to hear the question again. Say submit to submit the exam. Say exit to leave the exam."
          );

          // Read first question after welcome message
          setTimeout(async () => {
            await readCurrentQuestion();

            // Mark that we've read the first question and initialization is complete
            setTimeout(() => {
              hasReadFirstQuestionRef.current = true;
              isInitializingRef.current = false;

              // Explicitly start listening after question is read (with longer delay to ensure TTS is done)
              setTimeout(async () => {
                const context = screenContextService.getContext();
                const isListening = speechService.isListening;
                const isSpeaking = speechService.isSpeaking;

                console.log(
                  "[ExamPage] Checking conditions - mounted:",
                  mounted,
                  "context:",
                  context,
                  "isListening:",
                  isListening,
                  "isSpeaking:",
                  isSpeaking
                );

                if (
                  mounted &&
                  context === "EXAM" &&
                  !isListening &&
                  !isSpeaking
                ) {
                  console.log(
                    "[ExamPage] Starting voice input after first question read"
                  );
                  try {
                    await speechService.startListening();
                    console.log("[ExamPage] Voice input started successfully");
                  } catch (error) {
                    console.error(
                      "[ExamPage] Error starting voice input:",
                      error
                    );
                  }
                } else {
                  console.log(
                    "[ExamPage] Not starting listening - mounted:",
                    mounted,
                    "context:",
                    context,
                    "isListening:",
                    isListening,
                    "isSpeaking:",
                    isSpeaking
                  );
                  // Try to start anyway if context is correct
                  if (context === "EXAM" && !isSpeaking) {
                    console.log(
                      "[ExamPage] Attempting to start listening despite check failure"
                    );
                    try {
                      await speechService.startListening();
                      console.log("[ExamPage] Voice input started (fallback)");
                    } catch (error) {
                      console.error(
                        "[ExamPage] Error starting voice input (fallback):",
                        error
                      );
                    }
                  }
                }
              }, 1000);
            }, 500);
          }, 1000);
        }
      } catch (error) {
        console.error("[ExamPage] Error initializing speech:", error);
      }
    };

    if (exam) {
      initializeSpeech();
    }

    return () => {
      mounted = false;
    };
  }, [exam, handleVoiceCommand, handleSpeechError, readCurrentQuestion]);

  // Track if we've read the first question
  const hasReadFirstQuestionRef = useRef(false);
  const isInitializingRef = useRef(false);

  // Read question when it changes (but not on initial load)
  useEffect(() => {
    // Don't run if we're still initializing
    if (isInitializingRef.current) {
      console.log(
        "[ExamPage] Still initializing, skipping question read effect"
      );
      return;
    }

    if (exam && currentQuestion && speechInitializedRef.current) {
      // Skip reading on first question if we already read it during initialization
      if (currentQuestionIndex === 0 && hasReadFirstQuestionRef.current) {
        console.log(
          "[ExamPage] Skipping question read - already read during init"
        );
        return;
      }

      // Read question after a short delay
      const timer = setTimeout(async () => {
        await readCurrentQuestion();
        // Start listening after reading question
        setTimeout(async () => {
          if (
            screenContextService.getContext() === "EXAM" &&
            !speechService.isListening &&
            !speechService.isSpeaking &&
            !isWaitingForConfirmationRef.current
          ) {
            console.log("[ExamPage] Starting voice input after question read");
            try {
              await speechService.startListening();
            } catch (error) {
              console.error("[ExamPage] Error starting listening:", error);
            }
          }
        }, 1000);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex, exam, readCurrentQuestion]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechService.stopListening();
      speechService.stopSpeaking();
      screenContextService.setContext("HOME");
    };
  }, []);

  const getTimeWarningColor = () => {
    if (timeRemaining <= 300) return AppColors.error || "#ef4444";
    if (timeRemaining <= 600) return AppColors.warning || "#f59e0b";
    return AppColors.textDark || "#1f2937";
  };

  const ExitConfirmModal = () => (
    <Modal
      visible={showExitConfirm}
      transparent
      animationType="fade"
      onRequestClose={() => setShowExitConfirm(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.modalTitle}>Exit Exam?</Text>
          </View>

          <Text style={styles.modalText}>
            Are you sure you want to exit the exam? Your progress will be lost
            and you won't be able to resume.
          </Text>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[globalStyles.buttonSecondary, styles.modalButton]}
              onPress={() => setShowExitConfirm(false)}
              activeOpacity={0.8}
            >
              <Text style={globalStyles.buttonTextSecondary}>
                Continue Exam
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dangerButton, styles.modalButton]}
              onPress={() => {
                setShowExitConfirm(false);
                navigation?.goBack();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.dangerButtonText}>Exit Exam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (showExitConfirm) {
    return <ExitConfirmModal />;
  }

  // Error state - only show if we have an error OR if we have examId but no exam
  if (error || (examId && !exam && !loading)) {
    return (
      <SafeAreaView
        style={[
          globalStyles.safeContainer,
          styles.container,
          styles.centerContainer,
        ]}
      >
        <Text
          style={[
            globalStyles.titleText,
            { color: AppColors.error, marginBottom: 8 },
          ]}
        >
          Error
        </Text>
        <Text
          style={[
            globalStyles.bodyText,
            { marginBottom: 16, textAlign: "center" },
          ]}
        >
          {error || "Failed to load exam"}
        </Text>
        <TouchableOpacity
          style={[globalStyles.button, { marginTop: 8 }]}
          onPress={() => navigation?.goBack()}
        >
          <Text style={globalStyles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // If exam is not loaded yet, show empty state (no loading screen)
  if (!exam || !currentQuestion) {
    return (
      <SafeAreaView style={[globalStyles.safeContainer, styles.container]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={globalStyles.scrollContainer}
        >
          {/* Empty state while loading - no spinner */}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[globalStyles.safeContainer, styles.container]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={globalStyles.scrollContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={[globalStyles.titleText, styles.examTitle]}>
              {exam.title}
            </Text>
            <Text style={[globalStyles.bodyText, styles.questionCounter]}>
              Question {currentQuestionIndex + 1} of {exam.questions.length}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.accessibilityToggle,
                accessibilityMode && styles.accessibilityToggleActive,
              ]}
              onPress={async () => {
                const newValue = !accessibilityMode;
                setAccessibilityMode(newValue);

                // If disabling, stop everything and release lock
                if (accessibilityMode) {
                  // TTS/STT removed - no speech to stop
                }

                // TTS removed - no announcement
              }}
              activeOpacity={0.7}
              accessibilityLabel={`Accessibility mode ${
                accessibilityMode ? "on" : "off"
              }`}
              accessibilityRole="switch"
            >
              <Text style={styles.accessibilityIcon}>♿</Text>
            </TouchableOpacity>

            <View
              style={[
                styles.timerContainer,
                { borderColor: getTimeWarningColor() },
              ]}
            >
              <Text style={styles.timerIcon}>🕐</Text>
              <Text
                style={[styles.timerText, { color: getTimeWarningColor() }]}
              >
                {formatTime(timeRemaining)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.exitButton}
              onPress={async () => {
                setShowExitConfirm(true);
                // TTS removed - no announcement
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.exitIcon}>✖️</Text>
              <Text style={styles.exitText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress */}
        <View style={[globalStyles.card, styles.progressCard]}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressPercentage}>
              {Math.round(progress)}% Complete
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>

          <View style={styles.progressFooter}>
            <Text style={styles.progressText}>
              {answeredQuestions} answered
            </Text>
            <Text style={styles.progressText}>
              {exam.questions.length - answeredQuestions} remaining
            </Text>
          </View>
        </View>

        {/* Time warning */}
        {timeRemaining <= 600 && (
          <View
            style={[
              styles.timeWarning,
              timeRemaining <= 300
                ? styles.criticalWarning
                : styles.normalWarning,
            ]}
          >
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              {timeRemaining <= 300
                ? `Only ${Math.floor(
                    timeRemaining / 60
                  )} minutes remaining! The exam will auto-submit when time runs out.`
                : `${Math.floor(timeRemaining / 60)} minutes remaining.`}
            </Text>
          </View>
        )}

        {/* Question card */}
        <View style={[globalStyles.card, styles.questionCard]}>
          <View style={styles.questionHeader}>
            <Text style={[globalStyles.cardTitle, styles.questionTitle]}>
              Question {currentQuestionIndex + 1}: {currentQuestion.question}
            </Text>

            {/* TTS/STT removed - listening banner deleted */}

            {/* TTS/STT removed - speech action buttons deleted */}
          </View>

          <View style={styles.questionContent}>
            {currentQuestion.type === "multiple-choice" ? (
              <View style={styles.optionsContainer}>
                {currentQuestion.options?.map((option, index) => {
                  const selected = getCurrentAnswer() === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionButton,
                        selected && styles.selectedOption,
                      ]}
                      onPress={() => saveAnswer(option)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.radioButton,
                          selected && styles.selectedRadio,
                        ]}
                      >
                        {selected && <View style={styles.radioInner} />}
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          selected && styles.selectedOptionText,
                        ]}
                      >
                        {String.fromCharCode(65 + index)}. {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.writtenContainer}>
                <Text style={styles.writtenLabel}>Your Answer:</Text>
                <TextInput
                  style={styles.writtenInput}
                  placeholder="Type your answer here..."
                  placeholderTextColor={AppColors.textLight || "#9ca3af"}
                  value={getCurrentAnswer()}
                  onChangeText={saveAnswer}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
                <View style={styles.voiceHint}>
                  <Text style={styles.hintIcon}>💡</Text>
                  <Text style={styles.hintText}>
                    Voice commands: "next", "previous", "read", "time",
                    "submit", or say your answer.
                  </Text>
                </View>
              </View>
            )}

            {!!getCurrentAnswer() && (
              <View style={styles.savedIndicator}>
                <Text style={styles.checkIcon}>✅</Text>
                <Text style={styles.savedText}>Answer saved</Text>
              </View>
            )}

            {/* Voice commands hint for MCQ */}
            {currentQuestion.type === "multiple-choice" && (
              <View style={styles.voiceHint}>
                <Text style={styles.hintIcon}>🎤</Text>
                <Text style={styles.hintText}>
                  Say "A", "B", "C", or "D" to select. Say "next" for next
                  question, "read" to repeat.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentQuestionIndex === 0 && styles.disabledButton,
            ]}
            onPress={() =>
              setCurrentQuestionIndex((index) => Math.max(index - 1, 0))
            }
            disabled={currentQuestionIndex === 0}
            activeOpacity={0.7}
          >
            <Text style={styles.navIcon}>←</Text>
            <Text
              style={[
                styles.navText,
                currentQuestionIndex === 0 && styles.disabledText,
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>

          <View style={styles.navCenter}>
            <Text style={styles.navCenterText}>
              {answeredQuestions} of {exam.questions.length} answered
            </Text>
          </View>

          {currentQuestionIndex === exam.questions.length - 1 ? (
            <TouchableOpacity
              style={[
                styles.submitButton,
                submitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              activeOpacity={0.7}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color={AppColors.white || "#ffffff"}
                  />
                  <Text style={styles.submitText}>Submitting...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.submitText}>Submit Exam</Text>
                  <Text style={styles.submitIcon}>✓</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={() =>
                setCurrentQuestionIndex((index) =>
                  Math.min(index + 1, exam.questions.length - 1)
                )
              }
              activeOpacity={0.7}
            >
              <Text style={styles.nextText}>Next</Text>
              <Text style={styles.nextIcon}>→</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Question navigator */}
        <View style={[globalStyles.card, styles.navigatorCard]}>
          <Text style={[globalStyles.subtitleText, styles.navigatorTitle]}>
            Question Navigator
          </Text>

          <View style={styles.navigatorGrid}>
            {exam.questions.map((question, index) => {
              const isCurrent = index === currentQuestionIndex;
              const isAnswered = answeredIds.has(question.id);

              return (
                <TouchableOpacity
                  key={question.id}
                  style={[
                    styles.navigatorButton,
                    isCurrent && styles.currentQuestion,
                    isAnswered && !isCurrent && styles.answeredQuestion,
                  ]}
                  onPress={() => setCurrentQuestionIndex(index)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.navigatorButtonText,
                      isCurrent && styles.currentQuestionText,
                      isAnswered && !isCurrent && styles.answeredQuestionText,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.navigatorLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.answeredLegend]} />
              <Text style={styles.legendText}>Answered</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.unansweredLegend]} />
              <Text style={styles.legendText}>Not answered</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.currentLegend]} />
              <Text style={styles.legendText}>Current</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ExamPage;

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background || "#f8fafc",
  },
  header: {
    marginBottom: 20,
  },
  titleSection: {
    marginBottom: 16,
  },
  examTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: AppColors.textDark || "#1f2937",
    marginBottom: 8,
  },
  questionCounter: {
    fontSize: 16,
    color: AppColors.textMedium || "#6b7280",
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  accessibilityToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: AppColors.border || "#e5e7eb",
    backgroundColor: AppColors.white || "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  accessibilityToggleActive: {
    backgroundColor: AppColors.primary || "#3b82f6",
    borderColor: AppColors.primary || "#3b82f6",
  },
  accessibilityIcon: {
    fontSize: 20,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: AppColors.white || "#ffffff",
    flex: 1,
  },
  timerIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  timerText: {
    fontSize: 18,
    fontWeight: "600",
  },
  exitButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: AppColors.border || "#e5e7eb",
    backgroundColor: AppColors.white || "#ffffff",
    minHeight: 44,
  },
  exitIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  exitText: {
    fontSize: 16,
    fontWeight: "500",
    color: AppColors.textDark || "#1f2937",
  },
  progressCard: {
    padding: 20,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: AppColors.textDark || "#1f2937",
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: "500",
    color: AppColors.textMedium || "#6b7280",
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: AppColors.border || "#e5e7eb",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    backgroundColor: AppColors.primary || "#3b82f6",
    borderRadius: 6,
  },
  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    fontSize: 14,
    color: AppColors.textMedium || "#6b7280",
  },
  timeWarning: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  normalWarning: {
    backgroundColor: AppColors.warningLight || "#fef3c7",
    borderLeftColor: AppColors.warning || "#f59e0b",
  },
  criticalWarning: {
    backgroundColor: AppColors.errorLight || "#fef2f2",
    borderLeftColor: AppColors.error || "#ef4444",
  },
  warningIcon: {
    fontSize: 18,
    marginRight: 12,
    marginTop: 2,
  },
  warningText: {
    fontSize: 16,
    lineHeight: 24,
    color: AppColors.textDark || "#1f2937",
    flex: 1,
  },
  questionCard: {
    padding: 20,
    marginBottom: 20,
  },
  questionHeader: {
    marginBottom: 20,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: AppColors.textDark || "#1f2937",
    lineHeight: 24,
    marginBottom: 16,
  },
  questionActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: AppColors.border || "#e5e7eb",
    backgroundColor: AppColors.white || "#ffffff",
    flex: 1,
    justifyContent: "center",
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  listeningButton: {
    borderColor: AppColors.error || "#ef4444",
    backgroundColor: AppColors.errorLight || "#fef2f2",
  },
  listeningIcon: {
    fontSize: 16,
  },
  listeningText: {
    color: AppColors.error || "#ef4444",
    fontWeight: "600",
  },
  speakingButton: {
    borderColor: AppColors.primary || "#3b82f6",
    backgroundColor: AppColors.primaryLight || "#eff6ff",
  },
  speakingText: {
    color: AppColors.primary || "#3b82f6",
    fontWeight: "600",
  },
  transcriptContainer: {
    backgroundColor: AppColors.primaryLight || "#eff6ff",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: AppColors.primary || "#3b82f6",
    borderStyle: "dashed",
  },
  transcriptLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.primary || "#3b82f6",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  transcriptText: {
    fontSize: 16,
    color: AppColors.textDark || "#1f2937",
    fontStyle: "italic",
    lineHeight: 22,
  },
  speechErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.warningLight || "#fef3c7",
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  speechErrorIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  speechErrorText: {
    fontSize: 14,
    color: AppColors.warning || "#f59e0b",
    flex: 1,
  },
  listeningBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.error || "#ef4444",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  listeningBannerIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  listeningBannerText: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.white || "#ffffff",
  },
  questionContent: {
    gap: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.border || "#e5e7eb",
    backgroundColor: AppColors.white || "#ffffff",
  },
  selectedOption: {
    borderColor: AppColors.primary || "#3b82f6",
    backgroundColor: AppColors.primaryLight || "#eff6ff",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: AppColors.border || "#e5e7eb",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedRadio: {
    borderColor: AppColors.primary || "#3b82f6",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.primary || "#3b82f6",
  },
  optionText: {
    fontSize: 16,
    color: AppColors.textDark || "#1f2937",
    flex: 1,
    lineHeight: 22,
  },
  selectedOptionText: {
    fontWeight: "600",
    color: AppColors.primary || "#3b82f6",
  },
  writtenContainer: {
    gap: 12,
  },
  writtenLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.textDark || "#1f2937",
  },
  writtenInput: {
    borderWidth: 2,
    borderColor: AppColors.border || "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: AppColors.textDark || "#1f2937",
    backgroundColor: AppColors.white || "#ffffff",
    minHeight: 120,
    textAlignVertical: "top",
  },
  voiceHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    backgroundColor: AppColors.background || "#f8fafc",
    borderRadius: 8,
  },
  hintIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 1,
  },
  hintText: {
    fontSize: 14,
    color: AppColors.textMedium || "#6b7280",
    flex: 1,
    lineHeight: 20,
  },
  savedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  checkIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  savedText: {
    fontSize: 16,
    color: AppColors.success || "#22c55e",
    fontWeight: "500",
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    gap: 16,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.border || "#e5e7eb",
    backgroundColor: AppColors.white || "#ffffff",
    flex: 1,
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  navIcon: {
    fontSize: 18,
    marginRight: 8,
    color: AppColors.textDark || "#1f2937",
  },
  navText: {
    fontSize: 16,
    fontWeight: "500",
    color: AppColors.textDark || "#1f2937",
  },
  disabledText: {
    color: AppColors.textLight || "#9ca3af",
  },
  navCenter: {
    alignItems: "center",
    flex: 1,
  },
  navCenterText: {
    fontSize: 14,
    color: AppColors.textMedium || "#6b7280",
    textAlign: "center",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: AppColors.primary || "#3b82f6",
    flex: 1,
    justifyContent: "center",
  },
  nextText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.white || "#ffffff",
    marginRight: 8,
  },
  nextIcon: {
    fontSize: 18,
    color: AppColors.white || "#ffffff",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: AppColors.success || "#22c55e",
    flex: 1,
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.white || "#ffffff",
    marginRight: 8,
  },
  submitIcon: {
    fontSize: 18,
    color: AppColors.white || "#ffffff",
  },
  navigatorCard: {
    padding: 20,
    marginBottom: 20,
  },
  navigatorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: AppColors.textDark || "#1f2937",
    marginBottom: 16,
  },
  navigatorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  navigatorButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: AppColors.border || "#e5e7eb",
    backgroundColor: AppColors.white || "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  currentQuestion: {
    backgroundColor: AppColors.primary || "#3b82f6",
    borderColor: AppColors.primary || "#3b82f6",
  },
  answeredQuestion: {
    borderColor: AppColors.success || "#22c55e",
    backgroundColor: AppColors.successLight || "#f0fff4",
  },
  navigatorButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.textDark || "#1f2937",
  },
  currentQuestionText: {
    color: AppColors.white || "#ffffff",
  },
  answeredQuestionText: {
    color: AppColors.success || "#22c55e",
  },
  navigatorLegend: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.border || "#e5e7eb",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
  },
  answeredLegend: {
    borderColor: AppColors.success || "#22c55e",
    backgroundColor: AppColors.successLight || "#f0fff4",
  },
  unansweredLegend: {
    borderColor: AppColors.border || "#e5e7eb",
    backgroundColor: AppColors.white || "#ffffff",
  },
  currentLegend: {
    backgroundColor: AppColors.primary || "#3b82f6",
    borderColor: AppColors.primary || "#3b82f6",
  },
  legendText: {
    fontSize: 12,
    color: AppColors.textMedium || "#6b7280",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: AppColors.white || "#ffffff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: screenWidth < 480 ? screenWidth - 40 : 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.textDark || "#1f2937",
    marginLeft: 12,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: AppColors.textMedium || "#6b7280",
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 48,
  },
  dangerButton: {
    backgroundColor: AppColors.error || "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButtonText: {
    color: AppColors.white || "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
});
