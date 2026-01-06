import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { getExamsByExaminer } from '../../services/examService';

const StatCard = ({ label, value, iconName, iconLib = 'Ionicons', onPress }) => {
  const Icon = iconLib === 'Material' ? MaterialCommunityIcons : Ionicons;
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <Icon name={iconName} size={20} color="#3B82F6" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const ActionCard = ({ title, desc, iconName, ctaText, onPress }) => {
  return (
    <View style={styles.actionCard}>
      <View style={styles.actionHeader}>
        <View style={styles.actionIconWrap}>
          <Ionicons name={iconName} size={20} color="#2563EB" />
        </View>
        <Text style={styles.actionTitle}>{title}</Text>
      </View>
      {desc ? <Text style={styles.actionDesc}>{desc}</Text> : null}
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.ctaButton}>
        <Text style={styles.ctaText}>{ctaText}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function App({ navigation }) {
  const { logout, user } = useAuth();
  const userName = user?.name || 'Examiner';
  const [activeExams, setActiveExams] = useState(0);
  const [totalExams, setTotalExams] = useState(0);
  const totalStudents = 45;

  // Fetch exams data from Firebase
  const fetchExamsData = async () => {
    if (!user?.uid) return;

    try {
      const exams = await getExamsByExaminer(user.uid);
      const activeCount = exams.filter(exam => exam.status === 'active').length;
      setActiveExams(activeCount);
      setTotalExams(exams.length);
    } catch (error) {
      console.error('Error fetching exams data:', error);
      // Keep current values on error
    }
  };

  useEffect(() => {
    fetchExamsData();
  }, [user?.uid]);

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user?.uid) {
        fetchExamsData();
      }
    }, [user?.uid])
  );

  const handleLogout = async () => {
    await logout();
  };
  const handleUploadExam = () => {
    navigation?.navigate('CreateExam');
  };
  const handleManageExams = () => {
    navigation?.navigate('ManageExams');
  };

  // Quick Actions handlers
  const handleCreateQuickExam = () => {
    navigation?.navigate('CreateExam');
  };
  const handleViewAllExams = () => {
    navigation?.navigate('ManageExams');
  };
  const handleResearchAnalytics = () => {
    navigation?.navigate('ResearchAnalytics');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcome}>Welcome back,</Text>
            <Text style={styles.username}>{userName}!</Text>
            <Text style={styles.subtle}>Manage your exams and monitor student progress</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={16} color="#0F172A" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label="Active Exams"
            value={activeExams}
            iconName="book-outline"
            onPress={handleManageExams}
          />
          <StatCard
            label="Total Students"
            value={totalStudents}
            iconName="people-outline"
            onPress={() => console.log('View Students')}
          />
        </View>

        <ActionCard
          title="Upload New Exam"
          desc="Create and upload a new exam with questions"
          iconName="cloud-upload-outline"
          ctaText="Get Started"
          onPress={handleUploadExam}
        />

        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconWrap}>
            <MaterialCommunityIcons name="clipboard-list-outline" size={18} color="#EA580C" />
          </View>
          <Text style={styles.sectionTitle}>Manage Exams</Text>
        </View>

        <View style={styles.manageCard}>
          <Text style={styles.manageText}>
            View, edit, and publish existing exams. Track submissions and scores.
          </Text>
          <TouchableOpacity onPress={handleManageExams} activeOpacity={0.85} style={styles.manageBtn}>
            <Text style={styles.manageBtnText}>Open</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions block — placed at the bottom after Manage Exams */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.quickActionBtn}
            activeOpacity={0.85}
            onPress={handleCreateQuickExam}
          >
            <View style={styles.quickIconWrap}>
              <Ionicons name="cloud-upload-outline" size={18} color="#2563EB" />
            </View>
            <Text style={styles.quickActionText}>Create Quick Exam</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            activeOpacity={0.85}
            onPress={handleViewAllExams}
          >
            <View style={styles.quickIconWrap}>
              <Ionicons name="eye-outline" size={18} color="#2563EB" />
            </View>
            <Text style={styles.quickActionText}>View All Exams</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            activeOpacity={0.85}
            onPress={handleResearchAnalytics}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="analytics-outline" size={18} color="#4CAF50" />
            </View>
            <Text style={styles.quickActionText}>Research Analytics</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_BG = '#FFFFFF';
const BORDER = '#E5E7EB';
const TEXT_DARK = '#0F172A';
const TEXT_MUTED = '#64748B';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  welcome: {
    fontSize: 16,
    color: TEXT_MUTED,
    marginBottom: 2,
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  subtle: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 6,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  logoutText: {
    fontSize: 13,
    color: TEXT_DARK,
    fontWeight: '600',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12.5,
    color: TEXT_MUTED,
  },

  actionCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  actionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#EBF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  actionDesc: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 12,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#2563EB',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
  },

  manageCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  manageText: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 12,
  },
  manageBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FB923C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  manageBtnText: {
    color: '#111827',
    fontWeight: '700',
  },

  // Quick Actions styles
  quickActionsCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 10,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    gap: 10,
  },
  quickIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
  },
});