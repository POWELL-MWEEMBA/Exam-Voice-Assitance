import { AppColors } from "./AppColors";
import { StyleSheet } from "react-native";

export const globalStyles = StyleSheet.create({
  // Containers
  safeContainer: {
    flex: 1,
    backgroundColor: AppColors.background || AppColors.white,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  // Buttons
 button: {
  backgroundColor: AppColors.primary,
  borderRadius: 8,
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,     // safer
  paddingVertical: 12,
  marginVertical: 12,
  shadowColor: AppColors.primary,
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 3,
},
  buttonSecondary: {
    backgroundColor: AppColors.white,
    
    borderWidth: 1,
    borderColor: AppColors.primary,
     borderRadius: 8,
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,     // safer
  paddingVertical: 12,
  marginVertical: 12,
  shadowColor: AppColors.primary,
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 3,
  },
  buttonText: {
    color: AppColors.white,
    fontWeight: "600",
    fontSize: 16,
    lineHeight: 20, 
    textAlignVertical: "center", 
  },
  buttonTextSecondary: {
    color: AppColors.primary,
    fontWeight: "600",
    fontSize: 16,
    lineHeight: 20,
    textAlignVertical: "center",
  },

  buttonDisabled: {
    backgroundColor: AppColors.gray || "#CCCCCC",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    opacity: 0.6,
  },

  // Inputs
  inputField: {
    width: "100%",
    height: 48,
    backgroundColor: AppColors.lightPrimary,
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppColors.border || AppColors.lightPrimary,
  },
  inputFieldFocused: {
    borderColor: AppColors.primary,
    borderWidth: 2,
  },
  inputFieldError: {
    borderColor: AppColors.error,
    backgroundColor: AppColors.errorLight || "#FFEEEE",
  },

  // Text
  titleText: {
    fontSize: 26,
    fontWeight: "700",
    color: AppColors.textDark || AppColors.primary,
    marginBottom: 16,
    textAlign: "left", // better for headers
  },
  subtitleText: {
    fontSize: 18,
    fontWeight: "600",
    color: AppColors.textMedium || AppColors.primary,
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 16,
    color: AppColors.textMedium || "#444",
    lineHeight: 24,
    marginBottom: 8,
  },
  captionText: {
    fontSize: 13,
    color: AppColors.textLight || "#999",
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: AppColors.error,
    marginBottom: 10,
    paddingLeft: 5,
  },

  // Cards
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: AppColors.textDark,
  },
  cardSubtitle: {
    fontSize: 14,
    color: AppColors.textMedium,
    marginBottom: 6,
  },

  // Status badges
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  statusBadgeCompleted: {
    backgroundColor: AppColors.success,
  },
  statusBadgeAvailable: {
    backgroundColor: AppColors.info,
  },
  statusBadgePending: {
    backgroundColor: AppColors.warning,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.white,
  },

  // Dashboard Stats
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    backgroundColor: AppColors.white,
    borderRadius: 12,
    marginHorizontal: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
    
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: AppColors.primary,
  },
  statLabel: {
    fontSize: 13,
    color: AppColors.textMedium,
    marginTop: 4,
    textAlign: "center",
  },

  // Utility spacing
  marginTop10: { marginTop: 10 },
  marginBottom20: { marginBottom: 20 },
  flexRow: { flexDirection: "row" },
  justifyBetween: { justifyContent: "space-between" },
  alignCenter: { alignItems: "center" },

  // Flex utilities
  flexRow: { flexDirection: "row" },
  flexColumn: { flexDirection: "column" },
  justifyCenter: { justifyContent: "center" },
  justifyBetween: { justifyContent: "space-between" },
  alignCenter: { alignItems: "center" },
  flex1: { flex: 1 },

  // Border styles
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: AppColors.border || "#EEEEEE",
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border || "#EEEEEE",
  },
});
