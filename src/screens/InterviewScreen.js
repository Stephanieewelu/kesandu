import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
  Modal, FlatList, SafeAreaView
} from 'react-native';
import useInterviewEngine from '../hooks/useInterviewEngine';
import VoiceSocraticChat from '../components/VoiceSocraticChat';

const COLORS = {
  bg: '#09090B',
  surface: '#18181B',
  surfaceLight: '#27272A',
  border: '#3F3F46',
  text: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  accent: '#E4E4E7',
  success: '#22C55E',
  info: '#3B82F6',
  warning: '#F59E0B',
  danger: '#EF4444',
};

export default function InterviewScreen() {
  const interview = useInterviewEngine();
  const [showRoleSelector, setShowRoleSelector] = useState(true);
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [selectedRole, setSelectedRole] = useState('DATA_ENGINEER');
  const [selectedCompany, setSelectedCompany] = useState('GOOGLE');
  const [showReport, setShowReport] = useState(false);
  const [finalReport, setFinalReport] = useState(null);

  const handleStartInterview = async () => {
    setShowRoleSelector(false);
    await interview.startInterview(selectedRole, selectedCompany);
  };

  const handleAnswerQuestion = async (answer) => {
    await interview.answerQuestion(answer);
  };

  const handleEndInterview = async () => {
    const report = await interview.endInterview();
    if (report) {
      setFinalReport(report);
      setShowReport(true);
    }
  };

  const handleExitInterview = () => {
    setShowRoleSelector(true);
    setShowCompanySelector(false);
    setShowReport(false);
    setFinalReport(null);
    interview.endInterview();
  };

  // Role Selector Modal
  if (showRoleSelector && !interview.interviewState) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.selectorScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>Mic Interview Simulation</Text>
              <Text style={styles.subtitle}>Choose your interview track</Text>
            </View>

            {/* Role Selection */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Select Role</Text>
              {Object.entries(interview.ROLES).map(([key, role]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.card,
                    selectedRole === key && styles.cardSelected,
                  ]}
                  onPress={() => setSelectedRole(key)}
                >
                  <Text style={styles.cardTitle}>{role.name}</Text>
                  <Text style={styles.cardDescription}>{role.description}</Text>
                  <View style={styles.topicsList}>
                    {role.topics.slice(0, 2).map((topic, idx) => (
                      <Text key={idx} style={styles.topicBadge}>#{topic}</Text>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Company Selection */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Select Company Style</Text>
              {Object.entries(interview.COMPANIES).map(([key, company]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.card,
                    selectedCompany === key && styles.cardSelected,
                  ]}
                  onPress={() => setSelectedCompany(key)}
                >
                  <Text style={styles.cardTitle}>{company.name}</Text>
                  <Text style={styles.cardDescription}>
                    {interview.INTERVIEWER_STYLES[interview.COMPANIES[key].style].name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.startButton} onPress={handleStartInterview}>
              <Text style={styles.startButtonText}>Launch Start Interview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Interview In Progress
  if (interview.interviewState && !showReport) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.interviewHeader}>
          <View>
            <Text style={styles.interviewTitle}>
              {interview.ROLES[selectedRole].name}
            </Text>
            <Text style={styles.interviewSubtitle}>
              @ {interview.COMPANIES[selectedCompany].name}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.endButton}
            onPress={handleEndInterview}
          >
            <Text style={styles.endButtonText}>End</Text>
          </TouchableOpacity>
        </View>

        <VoiceSocraticChat
          question={interview.currentQuestion?.question}
          onAnswer={handleAnswerQuestion}
          loading={interview.loading}
          score={interview.score}
        />
      </SafeAreaView>
    );
  }

  // Final Report
  if (showReport && finalReport) {
    const report = finalReport.report;
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.reportScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>Interview Report</Text>
            <Text style={styles.reportSubtitle}>
              {finalReport.role} • {finalReport.company}
            </Text>
          </View>

          {/* Overall Score */}
          <View style={[styles.scoreSection, { borderLeftColor: COLORS.success }]}>
            <Text style={styles.scoreLabel}>Overall Score</Text>
            <Text style={styles.scoreValue}>{report.overallScore}%</Text>
            <Text style={styles.recommendation}>{report.recommendation}</Text>
          </View>

          {/* Metrics */}
          <View style={styles.metricsGrid}>
            <MetricCard label="Technical Depth" value={report.technicalDepth} />
            <MetricCard label="Communication" value={report.communication} />
            <MetricCard label="Problem Solving" value={report.problemSolving} />
          </View>

          {/* Strengths */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Check Strengths</Text>
            {report.strengths.map((strength, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>{strength}</Text>
              </View>
            ))}
          </View>

          {/* Improvements */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: COLORS.warning }]}>Warning Areas to Improve</Text>
            {report.improvements.map((improvement, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>{improvement}</Text>
              </View>
            ))}
          </View>

          {/* Next Steps */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Library Recommended Topics</Text>
            {report.nextSteps.map((topic, idx) => (
              <View key={idx} style={styles.topicCard}>
                <Text style={styles.topicText}>{topic}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.reportFooter}>
          <TouchableOpacity style={styles.newInterviewButton} onPress={handleExitInterview}>
            <Text style={styles.newInterviewText}>New Interview</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

function MetricCard({ label, value }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricProgress}>
        <View style={[styles.metricBar, { width: `${value}%` }]} />
      </View>
      <Text style={styles.metricValue}>{value}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  selectorScroll: {
    padding: 20,
    paddingBottom: 200,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardSelected: {
    borderColor: COLORS.info,
    backgroundColor: COLORS.surfaceLight,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  topicsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicBadge: {
    color: COLORS.info,
    fontSize: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  startButton: {
    backgroundColor: COLORS.info,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: '600',
  },
  interviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  interviewTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  interviewSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  endButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
  },
  endButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  reportScroll: {
    padding: 20,
    paddingBottom: 120,
  },
  reportHeader: {
    marginBottom: 24,
  },
  reportTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  reportSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  scoreSection: {
    backgroundColor: COLORS.surface,
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  scoreLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  scoreValue: {
    color: COLORS.success,
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 8,
  },
  recommendation: {
    color: COLORS.info,
    fontSize: 16,
    fontWeight: '600',
  },
  metricsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  metricProgress: {
    height: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  metricBar: {
    height: '100%',
    backgroundColor: COLORS.info,
  },
  metricValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bullet: {
    color: COLORS.accent,
    fontSize: 16,
    marginRight: 12,
  },
  listText: {
    color: COLORS.text,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  topicCard: {
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    marginBottom: 8,
  },
  topicText: {
    color: COLORS.text,
    fontSize: 14,
  },
  reportFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  newInterviewButton: {
    backgroundColor: COLORS.info,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  newInterviewText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: '600',
  },
});
