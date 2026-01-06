import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Vibration,
} from "react-native";
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { globalStyles } from "../../constants/GlobalStyles";
import { AppColors } from "../../constants/AppColors";
import {
  getActiveExams,
  getLatestSubmission,
  canAttemptExam,
  getAttemptCount,
} from "../../services/examService";
import { useAuth } from "../../context/AuthContext";
import {
  cacheExams,
  getCachedExams,
  checkNetworkStatus,
  syncPendingSubmissions,
  getPendingSubmissionCount,
} from "../../services/offlineService";
import { submitExam } from "../../services/examService";
import speechService from "../../services/speechService";
import screenContextService from "../../services/screenContextService";

const { width: screenWidth } = Dimensions.get("window");

const HomePage = ({ navigation }) => {
  const { user, logout } = useAuth();
  const userName = useMemo(() => {
    if (!user) return "Student";
    return user.displayName || user.name || user.email || "Student";
  }, [user]);

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [focusedExamIndex, setFocusedExamIndex] = useState(0);

  // Use ref to prevent multiple concurrent loads
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const examsRef = useRef([]);
  const focusedExamIndexRef = useRef(0);

  // Speech service refs
  const speechInitializedRef = useRef(false);
  const isProcessingCommandRef = useRef(false);

  // First loadExams function removed - using the more complete one below

  // Ref for handleStartExam to avoid dependency issues
  const handleStartExamRef = useRef(null);

  // First handleStartExam function removed - using the more complete one below

  const loadExams = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // Prevent concurrent loads
    if (isLoadingRef.current) {
      console.log("[HomePage] Already loading, skipping");
      return;
    }

    let isMounted = true;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Check network status
      const online = await checkNetworkStatus(false);
      setIsOffline(!online);

      // Check for pending submissions
      const pending = await getPendingSubmissionCount();
      setPendingCount(pending);

      // Sync pending submissions if online
      if (online && pending > 0) {
        await syncPendingSubmissions(submitExam);
        setPendingCount(0);
      }

      console.log("[HomePage] Loading exams...");
      let active;

      if (online) {
        active = await getActiveExams();
        // Cache for offline use
        if (active && active.length > 0) {
          await cacheExams(active);
        }
      } else {
        // Use cached exams when offline
        active = await getCachedExams();
      }

      if (!isMounted) return;

      // Check submissions and attempts for each exam
      const normalized = await Promise.all(
        (active || []).map(async (e) => {
          // createdAt can be Firestore Timestamp or string/Date
          const createdAt = e.createdAt?.toDate
            ? e.createdAt.toDate()
            : e.createdAt || new Date();

          // Check if student has submitted this exam
          let submission = null;
          let attemptInfo = {
            attemptsUsed: 0,
            maxAttempts: e.maxAttempts || 1,
          };

          try {
            submission = await getLatestSubmission(e.id, user.uid);
            // Get attempt count
            const attempts = await getAttemptCount(e.id, user.uid);
            attemptInfo.attemptsUsed = attempts;
          } catch (submissionError) {
            console.warn(
              `Failed to check submission for exam ${e.id}:`,
              submissionError
            );
          }

          const isCompleted =
            attemptInfo.attemptsUsed >= attemptInfo.maxAttempts;
          const score = submission?.overallScore || null;
          const submissionId = submission?.id || null;

          return {
            id: e.id,
            title: e.title || "Untitled Exam",
            subject: e.subject || "General",
            duration: e.duration || 60,
            maxAttempts: e.maxAttempts || 1,
            attemptsUsed: attemptInfo.attemptsUsed,
            attemptsRemaining: Math.max(
              0,
              (e.maxAttempts || 1) - attemptInfo.attemptsUsed
            ),
            questions: Array.isArray(e.questions)
              ? e.questions.length
              : e.totalQuestions || 0,
            createdAt,
            difficulty: e.difficulty || "medium",
            completed: isCompleted,
            hasAttempted: attemptInfo.attemptsUsed > 0,
            score: score,
            submissionId: submissionId,
          };
        })
      );

      if (!isMounted) return;
      setExams(normalized);
      examsRef.current = normalized; // Update ref
      // Reset focused exam index when exams load
      if (normalized.length > 0) {
        focusedExamIndexRef.current = 0;
        setFocusedExamIndex(0);
      }
      hasLoadedRef.current = true;
      console.log("[HomePage] Exams loaded successfully");
    } catch (err) {
      console.error("[HomePage] Error loading exams:", err);
      // Try to load cached exams on error
      try {
        const cached = await getCachedExams();
        if (cached.length > 0) {
          setExams(
            cached.map((e) => ({
              ...e,
              attemptsUsed: 0,
              attemptsRemaining: e.maxAttempts || 1,
              completed: false,
              hasAttempted: false,
            }))
          );
          setError("Offline mode - showing cached exams");
        } else {
          setError(err?.message || "Failed to load exams");
        }
      } catch (cacheError) {
        setError(err?.message || "Failed to load exams");
      }
    } finally {
      if (isMounted) {
        isLoadingRef.current = false;
        setLoading(false);
      }
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid && !hasLoadedRef.current) {
      loadExams();
    }
  }, [user?.uid, loadExams]);

  // Handle voice commands for HOME context
  const handleVoiceCommand = useCallback(
    async (transcript) => {
      if (isProcessingCommandRef.current) return;

      // Safety check: ensure transcript is valid
      if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
        console.log("[HomePage] Invalid transcript received:", transcript);
        return;
      }

      const command = transcript.toLowerCase().trim();
      console.log("[HomePage] Voice command received:", command);

      // Check if we're in HOME context
      if (screenContextService.getContext() !== "HOME") {
        console.log("[HomePage] Not in HOME context, ignoring command");
        return;
      }

      isProcessingCommandRef.current = true;

      try {
        // Stop listening before processing
        await speechService.stopListening();

        // Handle commands
        if (command.includes("list exams") || command === "list exam") {
          await handleListExams();
        } else if (
          command.includes("select exam number") ||
          command.includes("begin exam")
        ) {
          // Extract number from command - supports "begin exam X" (primary) and "select exam number X" (legacy)
          let match = command.match(/select exam number (\d+)/);
          if (!match) {
            match = command.match(/begin exam (\d+)/);
          }
          if (match && match[1]) {
            const examNumber = parseInt(match[1], 10);
            await handleSelectExam(examNumber);
          } else {
            await speechService.speak(
              "Please say begin exam followed by the exam number. For example, begin exam 1."
            );
          }
        } else if (command === "repeat") {
          await handleRepeat();
        } else if (command === "exit") {
          await handleExit();
        } else {
          // Unrecognized command
          await speechService.speak(
            "Sorry, I did not understand that command. Please try again."
          );
        }
      } catch (error) {
        console.error("[HomePage] Error handling voice command:", error);
        await speechService.speak(
          "Sorry, an error occurred. Please try again."
        );
      } finally {
        isProcessingCommandRef.current = false;
        // Re-enable listening after response
        setTimeout(async () => {
          if (screenContextService.getContext() === "HOME") {
            await speechService.startListening();
          }
        }, 500);
      }
    },
    [handleListExams, handleSelectExam, handleRepeat, handleExit]
  );

  // Handle list exams command
  const handleListExams = useCallback(async () => {
    const currentExams = examsRef.current;

    if (!currentExams || currentExams.length === 0) {
      await speechService.speak("No exams are available at this time.");
      return;
    }

    let message = "Available exams are: ";
    currentExams.forEach((exam, index) => {
      message += `Exam ${index + 1}: ${exam.title}. `;
    });
    message +=
      "Say begin exam followed by the exam number to start. For example, begin exam 1.";

    await speechService.speak(message);
  }, []);

  // Handle select exam command
  const handleSelectExam = useCallback(
    async (examNumber) => {
      const currentExams = examsRef.current;

      if (!currentExams || currentExams.length === 0) {
        await speechService.speak("No exams are available.");
        return;
      }

      const index = examNumber - 1;
      if (index < 0 || index >= currentExams.length) {
        await speechService.speak(
          `Invalid exam number. Please select a number between 1 and ${currentExams.length}.`
        );
        return;
      }

      const selectedExam = currentExams[index];

      // Check if exam can be attempted
      if (!user?.uid) {
        await speechService.speak("You must be logged in to start an exam.");
        return;
      }

      try {
        const eligibility = await canAttemptExam(selectedExam.id, user.uid);

        if (!eligibility.canAttempt) {
          await speechService.speak(
            eligibility.message || "You cannot start this exam."
          );
          return;
        }

        // Announce selection
        await speechService.speak(
          `${selectedExam.title} selected. Starting exam.`
        );

        // Change context to EXAM before navigation
        screenContextService.setContext("EXAM");

        // Navigate to exam
        navigation?.navigate("ExamPage", { examId: selectedExam.id });
      } catch (error) {
        console.error("[HomePage] Error selecting exam:", error);
        await speechService.speak(
          "Failed to start the exam. Please try again."
        );
      }
    },
    [user, navigation]
  );

  // Handle repeat command
  const handleRepeat = useCallback(async () => {
    const lastMessage = speechService.getLastSpokenMessage();
    if (lastMessage) {
      await speechService.speak(lastMessage);
    } else {
      await speechService.speak(
        "Welcome. You are on the home screen. Say list exams to hear available exams. Say begin exam followed by the number to start an exam. For example, begin exam 1."
      );
    }
  }, []);

  // Handle exit command
  const handleExit = useCallback(async () => {
    await speechService.speak("Exiting application.");
    await speechService.cleanup();
    // You can add logout logic here if needed
  }, []);

  // Handle speech recognition errors
  const handleSpeechError = useCallback(async (error) => {
    console.error("[HomePage] Speech error:", error);

    if (error.type === "silence_timeout") {
      await speechService.speak(
        "Please say a command. For example, say list exams or repeat."
      );
    } else {
      // Re-enable listening after error
      setTimeout(async () => {
        if (screenContextService.getContext() === "HOME") {
          await speechService.startListening();
        }
      }, 1000);
    }
  }, []);

  // Initialize speech service and welcome message
  useEffect(() => {
    let mounted = true;

    const initializeSpeech = async () => {
      if (speechInitializedRef.current) return;

      try {
        // Initialize speech service
        const initialized = await speechService.initialize();
        if (!initialized) {
          console.warn("[HomePage] Speech service initialization failed");
          return;
        }

        // Set up callbacks
        speechService.setOnRecognitionResult(handleVoiceCommand);
        speechService.setOnRecognitionError(handleSpeechError);
        speechService.setOnSpeechEnd(async () => {
          // Re-enable listening after speech ends
          if (mounted && screenContextService.getContext() === "HOME") {
            setTimeout(async () => {
              await speechService.startListening();
            }, 300);
          }
        });

        speechInitializedRef.current = true;

        // Set HOME context
        screenContextService.setContext("HOME");

        // Welcome message
        if (mounted) {
          await speechService.speak(
            "Welcome. You are on the home screen. Say list exams to hear available exams. Say begin exam followed by the number to start an exam. For example, begin exam 1."
          );
        }
      } catch (error) {
        console.error("[HomePage] Error initializing speech:", error);
      }
    };

    // Only initialize after exams are loaded
    if (hasLoadedRef.current && user?.uid) {
      initializeSpeech();
    }

    return () => {
      mounted = false;
    };
  }, [user?.uid, hasLoadedRef.current, handleVoiceCommand, handleSpeechError]);

  // Refresh exams when screen comes into focus (e.g., after submitting an exam)
  // Only refresh if we've already loaded once (to prevent infinite loops)
  useFocusEffect(
    useCallback(() => {
      if (user?.uid && hasLoadedRef.current && !isLoadingRef.current) {
        console.log("[HomePage] Screen focused, refreshing exams");
        hasLoadedRef.current = false; // Reset to allow refresh
        loadExams();
      }

      // Set HOME context when screen is focused
      screenContextService.setContext("HOME");

      // Re-initialize speech if needed
      if (
        speechInitializedRef.current &&
        screenContextService.getContext() === "HOME"
      ) {
        speechService.setOnRecognitionResult(handleVoiceCommand);
        speechService.setOnRecognitionError(handleSpeechError);
        // Read welcome message and available options when returning to home
        setTimeout(async () => {
          if (
            !speechService.isSpeaking &&
            screenContextService.getContext() === "HOME"
          ) {
            await speechService.speak(
              "Welcome. You are on the home screen. Say list exams to hear available exams. Say begin exam followed by the number to start an exam. For example, begin exam 1."
            );
            // Start listening after welcome message
            setTimeout(async () => {
              if (
                !speechService.isListening &&
                screenContextService.getContext() === "HOME"
              ) {
                await speechService.startListening();
              }
            }, 1000);
          } else {
            // If already speaking, just start listening after a delay
            setTimeout(async () => {
              if (
                !speechService.isListening &&
                screenContextService.getContext() === "HOME"
              ) {
                await speechService.startListening();
              }
            }, 500);
          }
        }, 500);
      }

      // Cleanup when page loses focus
      return () => {
        // Stop listening when leaving screen
        speechService.stopListening();
      };
    }, [user?.uid, loadExams, handleVoiceCommand, handleSpeechError])
  );

  const handleStartExam = async (exam) => {
    if (!exam?.id) {
      console.error("No exam ID provided");
      return;
    }

    if (!user?.uid) {
      Alert.alert("Error", "You must be logged in to start an exam.");
      return;
    }

    try {
      const eligibility = await canAttemptExam(exam.id, user.uid);

      if (!eligibility.canAttempt) {
        Alert.alert("Cannot Start Exam", eligibility.message, [{ text: "OK" }]);
        return;
      }

      // If this is their last attempt, confirm
      if (eligibility.remaining === 1 && eligibility.attemptsUsed > 0) {
        Alert.alert(
          "Last Attempt",
          "This is your final attempt for this exam. Are you sure you want to start?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Start Exam",
              onPress: () =>
                navigation?.navigate("ExamPage", { examId: exam.id }),
            },
          ]
        );
        return;
      }

      // Navigate to exam
      navigation?.navigate("ExamPage", { examId: exam.id });
    } catch (error) {
      console.error("Error checking exam eligibility:", error);
      Alert.alert(
        "Error",
        "Failed to check exam eligibility. Please try again."
      );
    }
  };

  // Update handleStartExam ref
  useEffect(() => {
    handleStartExamRef.current = handleStartExam;
  }, [handleStartExam]);

  const handleViewResults = (exam) => {
    if (!exam?.id) {
      console.error("No exam ID provided");
      return;
    }

    // Navigate to results screen with exam and submission IDs
    navigation?.navigate("ViewResults", {
      examId: exam.id,
      submissionId: exam.submissionId,
      examTitle: exam.title,
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn("Logout failed", e);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return AppColors.success || "#22c55e";
      case "medium":
        return AppColors.warning || "#f59e0b";
      case "hard":
        return AppColors.error || "#ef4444";
      default:
        return AppColors.textMedium || "#6b7280";
    }
  };

  const formatDate = (value) => {
    const date = value?.toDate ? value.toDate() : new Date(value);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const completedExams = exams.filter((exam) => exam.completed).length;
  const availableExams = exams.length;
  const averageScore =
    exams
      .filter((exam) => exam.completed && exam.score)
      .reduce((sum, exam) => sum + (exam.score || 0), 0) /
    (exams.filter((exam) => exam.completed && exam.score).length || 1);

  const renderExamCard = (exam) => {
    const difficultyColor = getDifficultyColor(exam.difficulty);

    return (
      <View key={exam.id} style={[globalStyles.card, styles.examCard]}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Text style={[globalStyles.cardTitle, styles.examTitle]}>
                {exam.title}
              </Text>
              <View style={styles.statusContainer}>
                {exam.completed && (
                  <FontAwesome
                    name="check-circle"
                    size={24}
                    color={AppColors.success || "#22c55e"}
                  />
                )}
              </View>
            </View>

            {/* Exam Details */}
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <FontAwesome
                  name="book"
                  size={16}
                  color={AppColors.primary}
                  style={styles.detailIcon}
                />
                <Text style={styles.detailText}>{exam.subject}</Text>
              </View>
              <View style={styles.detailRow}>
                <FontAwesome
                  name="clock-o"
                  size={16}
                  color={AppColors.primary}
                  style={styles.detailIcon}
                />
                <Text style={styles.detailText}>{exam.duration} minutes</Text>
              </View>
              <View style={styles.detailRow}>
                <FontAwesome
                  name="question-circle"
                  size={16}
                  color={AppColors.primary}
                  style={styles.detailIcon}
                />
                <Text style={styles.detailText}>
                  {exam.questions} questions
                </Text>
              </View>
              <View style={styles.detailRow}>
                <FontAwesome
                  name="calendar"
                  size={16}
                  color={AppColors.primary}
                  style={styles.detailIcon}
                />
                <Text style={styles.detailText}>
                  Available since {formatDate(exam.createdAt)}
                </Text>
              </View>
            </View>

            {/* Previous Score */}
            {exam.hasAttempted && exam.score !== null && (
              <View style={styles.scoreContainer}>
                <FontAwesome
                  name="trophy"
                  size={16}
                  color={AppColors.success || "#22c55e"}
                  style={styles.scoreIcon}
                />
                <Text style={styles.scoreText}>
                  Previous Score: {exam.score}%
                </Text>
              </View>
            )}

            {/* Attempts Info */}
            <View
              style={[
                styles.attemptsContainer,
                exam.completed && styles.attemptsContainerDisabled,
              ]}
            >
              <FontAwesome
                name="refresh"
                size={16}
                color={exam.completed ? AppColors.textLight : AppColors.primary}
                style={styles.attemptsIcon}
              />
              <Text
                style={[
                  styles.attemptsText,
                  exam.completed && styles.attemptsTextDisabled,
                ]}
              >
                {exam.completed
                  ? `All ${exam.maxAttempts} attempt${
                      exam.maxAttempts > 1 ? "s" : ""
                    } used`
                  : `${exam.attemptsRemaining} of ${exam.maxAttempts} attempt${
                      exam.maxAttempts > 1 ? "s" : ""
                    } remaining`}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              globalStyles.button,
              exam.completed
                ? globalStyles.buttonDisabled
                : styles.primaryButton,
            ]}
            onPress={() => handleStartExam(exam)}
            disabled={exam.completed}
            activeOpacity={exam.completed ? 1 : 0.8}
            accessibilityLabel={
              exam.completed
                ? `${exam.title} - All attempts used`
                : `Start ${exam.title} - ${exam.attemptsRemaining} attempts remaining`
            }
          >
            <Text
              style={[
                globalStyles.buttonText,
                exam.completed && styles.disabledButtonText,
              ]}
            >
              {exam.completed
                ? "No Attempts Left"
                : exam.hasAttempted
                ? "Retry Exam"
                : "Start Exam"}
            </Text>
          </TouchableOpacity>

          {exam.completed && (
            <TouchableOpacity
              style={[globalStyles.buttonSecondary, styles.secondaryButton]}
              onPress={() => handleViewResults(exam)}
              activeOpacity={0.8}
            >
              <FontAwesome
                name="bar-chart"
                size={16}
                color={AppColors.primary || "#3b82f6"}
                style={styles.buttonIcon}
              />
              <Text style={globalStyles.buttonTextSecondary}>View Results</Text>
            </TouchableOpacity>
          )}

          {/* Preparation Instructions */}
          {!exam.completed && (
            <View style={styles.preparationContainer}>
              <View style={styles.preparationHeader}>
                <FontAwesome
                  name="list-ul"
                  size={16}
                  color={AppColors.textDark || "#1a202c"}
                  style={styles.preparationIcon}
                />
                <Text style={styles.preparationTitle}>Before you start:</Text>
              </View>
              <View style={styles.instructionsList}>
                <View style={styles.instructionItem}>
                  <FontAwesome
                    name="wifi"
                    size={16}
                    color={AppColors.textMedium}
                    style={styles.instructionIcon}
                  />
                  <Text style={styles.instructionText}>
                    Ensure you have a stable internet connection
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <FontAwesome
                    name="volume-off"
                    size={16}
                    color={AppColors.textMedium}
                    style={styles.instructionIcon}
                  />
                  <Text style={styles.instructionText}>
                    Find a quiet environment for the exam
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <FontAwesome
                    name="headphones"
                    size={16}
                    color={AppColors.textMedium}
                    style={styles.instructionIcon}
                  />
                  <Text style={styles.instructionText}>
                    Have headphones ready for audio features
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <FontAwesome
                    name="exclamation-triangle"
                    size={16}
                    color={AppColors.warning}
                    style={styles.instructionIcon}
                  />
                  <Text style={[styles.instructionText, styles.warningText]}>
                    You cannot pause once started
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[globalStyles.safeContainer, styles.container]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={globalStyles.scrollContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text
              style={[globalStyles.titleText, styles.welcomeTitle]}
              accessibilityRole="header"
            >
              Welcome, {userName}!
            </Text>
            <Text style={[globalStyles.bodyText, styles.welcomeSubtitle]}>
              Select an exam to get started
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation?.navigate("AccessibilitySettings")}
              activeOpacity={0.7}
              accessibilityLabel="Accessibility Settings"
              accessibilityRole="button"
              accessibilityHint="Double tap to open accessibility settings"
            >
              <FontAwesome
                name="universal-access"
                size={20}
                color={AppColors.primary || "#3b82f6"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.settingsButton,
                false && styles.voiceModeActive, // TTS/STT removed
              ]}
              onPress={async () => {
                // TTS/STT removed - voice mode toggle removed
              }}
              activeOpacity={0.7}
              accessibilityLabel="Voice navigation disabled"
              accessibilityRole="switch"
              accessibilityHint="Voice navigation has been removed"
            >
              <FontAwesome
                name="microphone"
                size={20}
                color={AppColors.textLight || "#9ca3af"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
              accessibilityLabel="Logout"
              accessibilityRole="button"
              accessibilityHint="Double tap to sign out"
            >
              <FontAwesome
                name="sign-out"
                size={18}
                color={AppColors.textMedium || "#718096"}
              />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics Dashboard */}
        <View style={globalStyles.statsContainer}>
          <View style={[globalStyles.statItem, styles.statCard]}>
            <View style={styles.statIconContainer}>
              <FontAwesome
                name="book"
                size={24}
                color={AppColors.primary || "#3b82f6"}
              />
            </View>
            <Text style={[globalStyles.statNumber, styles.statNumber]}>
              {availableExams}
            </Text>
            <Text style={[globalStyles.statLabel, styles.statLabel]}>
              Available Exams
            </Text>
          </View>

          <View style={[globalStyles.statItem, styles.statCard]}>
            <View style={styles.statIconContainer}>
              <FontAwesome
                name="check-circle"
                size={24}
                color={AppColors.success || "#22c55e"}
              />
            </View>
            <Text style={[globalStyles.statNumber, styles.statNumber]}>
              {completedExams}
            </Text>
            <Text style={[globalStyles.statLabel, styles.statLabel]}>
              Completed
            </Text>
          </View>

          <View style={[globalStyles.statItem, styles.statCard]}>
            <View style={styles.statIconContainer}>
              <FontAwesome
                name="star"
                size={24}
                color={AppColors.warning || "#f59e0b"}
              />
            </View>
            <Text style={[globalStyles.statNumber, styles.statNumber]}>
              {averageScore ? Math.round(averageScore) : "--"}%
            </Text>
            <Text style={[globalStyles.statLabel, styles.statLabel]}>
              Average Score
            </Text>
          </View>
        </View>

        {/* Accessibility Alert */}
        <View style={styles.accessibilityAlert}>
          <FontAwesome
            name="universal-access"
            size={20}
            color={AppColors.info || "#0066cc"}
            style={styles.alertIcon}
          />
          <Text style={styles.alertText}>
            Accessibility Features: Use "Read Question Aloud" and "Answer with
            Voice" buttons during exams for audio assistance.
          </Text>
        </View>

        {/* Voice Navigation Indicator */}
        {/* TTS/STT removed - voice indicator removed */}

        {/* Exams Section */}
        <View style={styles.examSection}>
          <Text style={[globalStyles.subtitleText, styles.sectionTitle]}>
            Available Exams
          </Text>
          {loading && (
            <View style={[globalStyles.card, { padding: 16 }]}>
              <Text style={globalStyles.bodyText}>Loading exams...</Text>
            </View>
          )}
          {error && !loading && (
            <View style={[globalStyles.card, { padding: 16 }]}>
              <Text style={[globalStyles.bodyText, { color: AppColors.error }]}>
                {String(error)}
              </Text>
            </View>
          )}
          {!loading && !error && exams.map(renderExamCard)}
        </View>

        {/* Empty State */}
        {!loading && !error && exams.length === 0 && (
          <View style={styles.emptyState}>
            <FontAwesome
              name="book"
              size={48}
              color={AppColors.textMedium || "#6b7280"}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No exams available</Text>
            <Text style={styles.emptyDescription}>
              There are currently no exams available. Please check back later.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomePage;

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background || "#f8fafc",
  },

  // Header Styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingTop: 8,
  },
  welcomeSection: {
    flex: 1,
    marginRight: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: AppColors.textDark || "#1a202c",
    marginBottom: 8,
    lineHeight: 32,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: AppColors.textMedium || "#718096",
    lineHeight: 24,
    marginBottom: 0,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingsButton: {
    width: 48,
    height: 48,
    backgroundColor: AppColors.white || "#ffffff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.primary || "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceModeActive: {
    backgroundColor: AppColors.successLight || "#f0fff4",
    borderColor: AppColors.success || "#22c55e",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: AppColors.white || "#ffffff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.border || "#e2e8f0",
    minHeight: 48,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "500",
    color: AppColors.textMedium || "#718096",
  },

  // Stats Cards
  statCard: {
    paddingVertical: 24,
    borderWidth: 2,
    borderColor: AppColors.border || "#e2e8f0",
    borderRadius: 12,
  },
  statIconContainer: {
    marginBottom: 12,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },

  // Accessibility Alert
  accessibilityAlert: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: AppColors.infoLight || "#e6f3ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.info || "#0066cc",
  },
  alertIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  alertText: {
    fontSize: 16,
    lineHeight: 24,
    color: AppColors.textDark || "#1a202c",
    flex: 1,
  },

  // Exam Section
  examSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: AppColors.textDark || "#1a202c",
    marginBottom: 16,
  },

  // Exam Cards
  examCard: {
    borderWidth: 2,
    borderColor: AppColors.border || "#e2e8f0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: AppColors.white || "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  examTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.textDark || "#1a202c",
    flex: 1,
    marginRight: 12,
    lineHeight: 24,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  difficultyIcon: {
    opacity: 0.8,
  },

  // Details Container
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailIcon: {
    width: 20,
    marginRight: 12,
  },
  detailText: {
    fontSize: 16,
    color: AppColors.textMedium || "#718096",
    flex: 1,
  },

  // Score Container
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.successLight || "#f0fff4",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.success || "#22c55e",
  },
  scoreIcon: {
    marginRight: 8,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.success || "#22c55e",
    flex: 1,
  },

  // Action Container
  actionContainer: {
    borderTopWidth: 1,
    borderTopColor: AppColors.border || "#e2e8f0",
    paddingTop: 16,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 2,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  // Preparation Instructions
  preparationContainer: {
    backgroundColor: AppColors.background || "#f8fafc",
    borderRadius: 12,
    padding: 16,
  },
  preparationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  preparationIcon: {
    marginRight: 8,
  },
  preparationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.textDark || "#1a202c",
    flex: 1,
  },
  instructionsList: {
    gap: 8,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  instructionIcon: {
    width: 16,
    marginRight: 8,
    marginTop: 2,
  },
  instructionText: {
    fontSize: 16,
    color: AppColors.textMedium || "#718096",
    lineHeight: 20,
    flex: 1,
  },
  warningText: {
    color: AppColors.warning || "#f59e0b",
    fontWeight: "500",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    padding: 48,
    borderWidth: 2,
    borderColor: AppColors.border || "#e2e8f0",
    borderStyle: "dashed",
    borderRadius: 16,
    backgroundColor: AppColors.white || "#ffffff",
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: AppColors.textDark || "#1a202c",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 16,
    color: AppColors.textMedium || "#718096",
    textAlign: "center",
    lineHeight: 24,
  },

  // Exam Section
  examSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: AppColors.textDark || "#1a202c",
    marginBottom: 16,
  },

  // Exam Cards
  examCard: {
    borderWidth: 2,
    borderColor: AppColors.border || "#e2e8f0",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: AppColors.white || "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  examTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.textDark || "#1a202c",
    flex: 1,
    marginRight: 12,
    lineHeight: 24,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  difficultyIcon: {
    opacity: 0.8,
  },

  // Details Container
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailIcon: {
    width: 20,
    marginRight: 12,
  },
  detailText: {
    fontSize: 16,
    color: AppColors.textMedium || "#718096",
    flex: 1,
  },

  // Score Container
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.successLight || "#f0fff4",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.success || "#22c55e",
  },
  scoreIcon: {
    marginRight: 8,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.success || "#22c55e",
    flex: 1,
  },

  // Action Container
  actionContainer: {
    borderTopWidth: 1,
    borderTopColor: AppColors.border || "#e2e8f0",
    paddingTop: 16,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 16,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 2,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  disabledButtonText: {
    color: AppColors.textLight || "#9ca3af",
  },

  // Attempts Container
  attemptsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.primaryLight || "#eff6ff",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.primary || "#3b82f6",
    marginTop: 8,
  },
  attemptsContainerDisabled: {
    backgroundColor: AppColors.background || "#f8fafc",
    borderLeftColor: AppColors.textLight || "#9ca3af",
  },
  attemptsIcon: {
    marginRight: 8,
  },
  attemptsText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.primary || "#3b82f6",
    flex: 1,
  },
  attemptsTextDisabled: {
    color: AppColors.textLight || "#9ca3af",
  },

  // Preparation Instructions
  preparationContainer: {
    backgroundColor: AppColors.background || "#f8fafc",
    borderRadius: 12,
    padding: 16,
  },
  preparationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  preparationIcon: {
    marginRight: 8,
  },
  preparationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.textDark || "#1a202c",
    flex: 1,
  },
  instructionsList: {
    gap: 8,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  instructionIcon: {
    width: 16,
    marginRight: 8,
    marginTop: 2,
  },
  instructionText: {
    fontSize: 16,
    color: AppColors.textMedium || "#718096",
    lineHeight: 20,
    flex: 1,
  },
  warningText: {
    color: AppColors.warning || "#f59e0b",
    fontWeight: "500",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    padding: 48,
    borderWidth: 2,
    borderColor: AppColors.border || "#e2e8f0",
    borderStyle: "dashed",
    borderRadius: 16,
    backgroundColor: AppColors.white || "#ffffff",
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: AppColors.textDark || "#1a202c",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 16,
    color: AppColors.textMedium || "#718096",
    textAlign: "center",
    lineHeight: 24,
  },
  voiceIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.primary || "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  voiceIcon: {
    marginRight: 10,
  },
  voiceText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.white || "#ffffff",
  },
});
