/**
 * Research Analytics Dashboard
 * For thesis evaluation data collection and analysis
 * Ndola Lion School for the Visually Impaired research study
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getAggregatedResearchStats,
  getResearchMetrics,
  getUsabilitySurveys,
  getAverageSUSScore,
} from '../../services/evaluationMetrics';

const ResearchAnalytics = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [avgSUS, setAvgSUS] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  const loadData = useCallback(async () => {
    try {
      const [statsData, sessionsData, surveysData, susScore] = await Promise.all([
        getAggregatedResearchStats(),
        getResearchMetrics(),
        getUsabilitySurveys(),
        getAverageSUSScore(),
      ]);
      
      setStats(statsData);
      setSessions(sessionsData);
      setSurveys(surveysData);
      setAvgSUS(susScore);
    } catch (error) {
      console.error('Failed to load research data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const getSUSGrade = (score) => {
    if (score >= 80) return { grade: 'A', label: 'Excellent', color: '#4CAF50' };
    if (score >= 68) return { grade: 'B', label: 'Good', color: '#8BC34A' };
    if (score >= 50) return { grade: 'C', label: 'OK', color: '#FFC107' };
    return { grade: 'F', label: 'Poor', color: '#F44336' };
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const renderOverviewTab = () => {
    if (!stats) return null;
    
    const susGrade = getSUSGrade(avgSUS);
    
    return (
      <View>
        {/* Key Metrics Cards */}
        <Text style={styles.sectionTitle}>Research Metrics Summary</Text>
        
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Total Sessions"
            value={stats.totalSessions}
            subtitle="Exam attempts"
            icon="📊"
          />
          <MetricCard
            title="STT Accuracy"
            value={`${stats.avgSTTAccuracy}%`}
            subtitle="Voice recognition"
            icon="🎤"
            color={stats.avgSTTAccuracy >= 80 ? '#4CAF50' : '#FFC107'}
          />
          <MetricCard
            title="Completion Rate"
            value={`${stats.avgCompletionRate}%`}
            subtitle="Questions answered"
            icon="✅"
          />
          <MetricCard
            title="Avg Time/Question"
            value={`${stats.avgTimePerQuestion}s`}
            subtitle="Seconds per question"
            icon="⏱️"
          />
        </View>

        {/* SUS Score */}
        <View style={[styles.susCard, { borderColor: susGrade.color }]}>
          <Text style={styles.susTitle}>System Usability Score (SUS)</Text>
          <View style={styles.susScoreRow}>
            <Text style={[styles.susScore, { color: susGrade.color }]}>{avgSUS}</Text>
            <View style={styles.susGradeContainer}>
              <Text style={[styles.susGrade, { backgroundColor: susGrade.color }]}>
                {susGrade.grade}
              </Text>
              <Text style={styles.susLabel}>{susGrade.label}</Text>
            </View>
          </View>
          <Text style={styles.susSubtitle}>
            Based on {surveys.length} survey{surveys.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Feature Usage */}
        <Text style={styles.sectionTitle}>Accessibility Feature Usage</Text>
        <View style={styles.featureUsageCard}>
          <FeatureBar 
            label="Voice Navigation" 
            percentage={stats.featureUsageRates?.voiceNavigation || 0} 
          />
          <FeatureBar 
            label="Voice Answers" 
            percentage={stats.featureUsageRates?.voiceAnswers || 0} 
          />
          <FeatureBar 
            label="Read Aloud (TTS)" 
            percentage={stats.featureUsageRates?.readAloud || 0} 
          />
        </View>

        {/* Totals */}
        <View style={styles.totalsRow}>
          <View style={styles.totalItem}>
            <Text style={styles.totalValue}>{stats.totalVoiceCommands || 0}</Text>
            <Text style={styles.totalLabel}>Voice Commands</Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalValue}>{stats.totalReadAloudRequests || 0}</Text>
            <Text style={styles.totalLabel}>Read Aloud Uses</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSessionsTab = () => (
    <View>
      <Text style={styles.sectionTitle}>
        Session History ({sessions.length})
      </Text>
      
      {sessions.length === 0 ? (
        <Text style={styles.emptyText}>No exam sessions recorded yet.</Text>
      ) : (
        sessions.map((session, index) => (
          <View key={session.id || index} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionTitle}>{session.examTitle || 'Unknown Exam'}</Text>
              <Text style={[
                styles.sessionStatus,
                { color: session.status === 'completed' ? '#4CAF50' : '#FFC107' }
              ]}>
                {session.status}
              </Text>
            </View>
            
            <View style={styles.sessionStats}>
              <StatItem label="Duration" value={formatDuration(session.totalDurationSeconds || 0)} />
              <StatItem label="Questions" value={`${session.completedQuestions || 0}/${session.totalQuestions || 0}`} />
              <StatItem label="STT Accuracy" value={`${session.sttAccuracyRate || 0}%`} />
              <StatItem label="Voice Commands" value={session.totalVoiceCommands || 0} />
            </View>
            
            {session.examScore !== null && (
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Exam Score:</Text>
                <Text style={styles.scoreValue}>{session.examScore}%</Text>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderSurveysTab = () => (
    <View>
      <Text style={styles.sectionTitle}>
        Survey Responses ({surveys.length})
      </Text>
      
      {surveys.length === 0 ? (
        <Text style={styles.emptyText}>No survey responses yet.</Text>
      ) : (
        surveys.map((survey, index) => {
          const susGrade = getSUSGrade(survey.susScore || 0);
          return (
            <View key={survey.id || index} style={styles.surveyCard}>
              <View style={styles.surveyHeader}>
                <Text style={styles.surveyTitle}>Survey #{index + 1}</Text>
                <Text style={[styles.surveyScore, { color: susGrade.color }]}>
                  SUS: {survey.susScore || 0}
                </Text>
              </View>
              
              {/* Question responses */}
              <View style={styles.responsesGrid}>
                {Object.entries(survey.responses || {}).slice(0, 8).map(([key, value]) => (
                  <View key={key} style={styles.responseItem}>
                    <Text style={styles.responseKey}>{key.toUpperCase()}</Text>
                    <Text style={styles.responseValue}>{value}/5</Text>
                  </View>
                ))}
              </View>
              
              {/* Open feedback */}
              {survey.responses?.q9_what_worked && (
                <View style={styles.feedbackSection}>
                  <Text style={styles.feedbackLabel}>What worked well:</Text>
                  <Text style={styles.feedbackText}>{survey.responses.q9_what_worked}</Text>
                </View>
              )}
              {survey.responses?.q10_improvements && (
                <View style={styles.feedbackSection}>
                  <Text style={styles.feedbackLabel}>Improvements suggested:</Text>
                  <Text style={styles.feedbackText}>{survey.responses.q10_improvements}</Text>
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading research data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Research Analytics</Text>
        <Text style={styles.subtitle}>
          Smart AI Exam System Evaluation Data
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sessions' && styles.tabActive]}
          onPress={() => setActiveTab('sessions')}
        >
          <Text style={[styles.tabText, activeTab === 'sessions' && styles.tabTextActive]}>
            Sessions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'surveys' && styles.tabActive]}
          onPress={() => setActiveTab('surveys')}
        >
          <Text style={[styles.tabText, activeTab === 'surveys' && styles.tabTextActive]}>
            Surveys
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'sessions' && renderSessionsTab()}
        {activeTab === 'surveys' && renderSurveysTab()}
      </ScrollView>
    </SafeAreaView>
  );
};

// Sub-components
const MetricCard = ({ title, value, subtitle, icon, color = '#4CAF50' }) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricIcon}>{icon}</Text>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
    <Text style={styles.metricTitle}>{title}</Text>
    <Text style={styles.metricSubtitle}>{subtitle}</Text>
  </View>
);

const FeatureBar = ({ label, percentage }) => (
  <View style={styles.featureRow}>
    <Text style={styles.featureLabel}>{label}</Text>
    <View style={styles.featureBarContainer}>
      <View style={[styles.featureBarFill, { width: `${percentage}%` }]} />
    </View>
    <Text style={styles.featurePercentage}>{percentage}%</Text>
  </View>
);

const StatItem = ({ label, value }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#aaa',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  tabActive: {
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#4CAF50',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    marginTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 20,
  },
  metricCard: {
    width: '50%',
    padding: 8,
  },
  metricCardInner: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  metricTitle: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
  },
  metricSubtitle: {
    fontSize: 10,
    color: '#888',
  },
  susCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
  },
  susTitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 12,
    textAlign: 'center',
  },
  susScoreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  susScore: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  susGradeContainer: {
    marginLeft: 16,
    alignItems: 'center',
  },
  susGrade: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  susLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  susSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
  },
  featureUsageCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureLabel: {
    width: 120,
    fontSize: 12,
    color: '#aaa',
  },
  featureBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  featureBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  featurePercentage: {
    width: 40,
    fontSize: 12,
    color: '#fff',
    textAlign: 'right',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 20,
  },
  totalItem: {
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  totalLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  sessionCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  sessionStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sessionStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    color: '#888',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 8,
  },
  surveyCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  surveyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  surveyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  surveyScore: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  responsesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  responseItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 8,
  },
  responseKey: {
    fontSize: 10,
    color: '#888',
  },
  responseValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  feedbackSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  feedbackLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 13,
    color: '#ddd',
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
    paddingVertical: 40,
  },
});

export default ResearchAnalytics;





