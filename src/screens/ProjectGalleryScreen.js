import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Dimensions
} from 'react-native';

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
  gold: '#EAB308',
};

const { width } = Dimensions.get('window');

const PRODUCTION_PROJECTS = [
  {
    id: 1,
    title: 'Production RAG System for Customer Support',
    category: 'AI Engineering',
    difficulty: 'Advanced',
    duration: '8-12 hours',
    skills: ['LangChain', 'Vector DBs', 'OpenAI API', 'FastAPI', 'Docker'],
    description: 'Build an end-to-end RAG system with document ingestion, vector search, and streaming responses.',
    keyFeatures: [
      'Document chunking and embedding pipeline',
      'Pinecone/Weaviate integration',
      'Streaming chat interface',
      'Conversation memory management',
      'Production deployment with monitoring'
    ],
    metrics: {
      users: '10K+',
      scale: '1M+ docs',
      latency: '<200ms'
    }
  },
  {
    id: 2,
    title: 'Real-time ML Model with Monitoring',
    category: 'ML Engineering',
    difficulty: 'Advanced',
    duration: '10-15 hours',
    skills: ['TensorFlow', 'MLflow', 'Prometheus', 'Grafana', 'Kubernetes'],
    description: 'Deploy a real-time prediction service with A/B testing, monitoring, and automated retraining.',
    keyFeatures: [
      'Feature engineering pipeline',
      'Model serving with TF Serving',
      'Real-time prediction API',
      'Metrics tracking with Prometheus',
      'Grafana dashboards for model performance'
    ],
    metrics: {
      throughput: '10K req/sec',
      uptime: '99.9%',
      latency: '<50ms'
    }
  },
  {
    id: 3,
    title: 'Data Pipeline Processing 1M+ Records',
    category: 'Data Engineering',
    difficulty: 'Intermediate',
    duration: '6-10 hours',
    skills: ['Apache Airflow', 'Spark', 'PostgreSQL', 'dbt', 'AWS S3'],
    description: 'Build a scalable ETL pipeline with data quality checks, incremental processing, and orchestration.',
    keyFeatures: [
      'Airflow DAG orchestration',
      'Spark for distributed processing',
      'dbt for transformations',
      'Data quality validations',
      'Incremental load strategies'
    ],
    metrics: {
      records: '5M+ daily',
      runtime: '<30min',
      reliability: '99.95%'
    }
  },
  {
    id: 4,
    title: 'AI Agent for Email Meeting Booking',
    category: 'AI Engineering',
    difficulty: 'Advanced',
    duration: '8-12 hours',
    skills: ['Claude API', 'LangGraph', 'Gmail API', 'Calendar API', 'Function Calling'],
    description: 'Create an autonomous agent that reads emails, understands context, and books meetings.',
    keyFeatures: [
      'Email parsing and intent detection',
      'Multi-step reasoning with LangGraph',
      'Calendar availability checking',
      'Conflict resolution logic',
      'Confirmation email generation'
    ],
    metrics: {
      accuracy: '95%+',
      automated: '80% of bookings',
      saves: '5 hrs/week'
    }
  },
  {
    id: 5,
    title: 'A/B Testing Infrastructure',
    category: 'ML Engineering',
    difficulty: 'Intermediate',
    duration: '6-8 hours',
    skills: ['Python', 'Redis', 'PostgreSQL', 'Statsmodels', 'FastAPI'],
    description: 'Implement feature flags, variant assignment, and statistical analysis for A/B experiments.',
    keyFeatures: [
      'Feature flag management system',
      'User bucketing with consistent hashing',
      'Metrics collection and aggregation',
      'Statistical significance testing',
      'Real-time experiment dashboard'
    ],
    metrics: {
      experiments: '50+ concurrent',
      latency: '<10ms',
      coverage: '100% of users'
    }
  },
  {
    id: 6,
    title: 'Fraud Detection System',
    category: 'Data Science',
    difficulty: 'Advanced',
    duration: '12-16 hours',
    skills: ['Scikit-learn', 'XGBoost', 'Redis', 'Kafka', 'Docker'],
    description: 'Build a real-time fraud detection pipeline with feature engineering and model deployment.',
    keyFeatures: [
      'Real-time feature computation',
      'Ensemble model with XGBoost',
      'Kafka stream processing',
      'Risk scoring API',
      'False positive reduction techniques'
    ],
    metrics: {
      precision: '92%',
      recall: '87%',
      latency: '<100ms'
    }
  }
];

export default function ProjectGalleryScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProject, setSelectedProject] = useState(null);

  const categories = ['All', 'AI Engineering', 'ML Engineering', 'Data Engineering', 'Data Science'];

  const filteredProjects = selectedCategory === 'All'
    ? PRODUCTION_PROJECTS
    : PRODUCTION_PROJECTS.filter(p => p.category === selectedCategory);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Intermediate': return COLORS.info;
      case 'Advanced': return COLORS.warning;
      default: return COLORS.success;
    }
  };

  if (selectedProject) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedProject(null)}
          >
            <Text style={styles.backButtonText}>← Back to Gallery</Text>
          </TouchableOpacity>

          <View style={styles.projectDetailHeader}>
            <Text style={styles.projectDetailTitle}>{selectedProject.title}</Text>
            <View style={styles.projectDetailMeta}>
              <View style={[styles.badge, { backgroundColor: getDifficultyColor(selectedProject.difficulty) + '20' }]}>
                <Text style={[styles.badgeText, { color: getDifficultyColor(selectedProject.difficulty) }]}>
                  {selectedProject.difficulty}
                </Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{selectedProject.duration}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.projectDescription}>{selectedProject.description}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Features</Text>
            {selectedProject.keyFeatures.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureBullet}>•</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Production Metrics</Text>
            <View style={styles.metricsGrid}>
              {Object.entries(selectedProject.metrics).map(([key, value]) => (
                <View key={key} style={styles.metricCard}>
                  <Text style={styles.metricValue}>{value}</Text>
                  <Text style={styles.metricLabel}>{key}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tech Stack</Text>
            <View style={styles.skillsContainer}>
              {selectedProject.skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillTagText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.startButton}>
            <Text style={styles.startButtonText}>Start Building</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Real-World Projects</Text>
          <Text style={styles.subtitle}>Build production-grade systems that ship</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          style={styles.projectList}
          showsVerticalScrollIndicator={false}
        >
          {filteredProjects.map(project => (
            <TouchableOpacity
              key={project.id}
              style={styles.projectCard}
              onPress={() => setSelectedProject(project)}
            >
              <View style={styles.projectCardHeader}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(project.difficulty) + '20' }]}>
                  <Text style={[styles.difficultyText, { color: getDifficultyColor(project.difficulty) }]}>
                    {project.difficulty}
                  </Text>
                </View>
              </View>

              <Text style={styles.projectCategory}>{project.category}</Text>
              <Text style={styles.projectDuration}>⏱️ {project.duration}</Text>

              <View style={styles.skillsPreview}>
                {project.skills.slice(0, 3).map((skill, index) => (
                  <Text key={index} style={styles.skillPreviewText}>{skill}</Text>
                ))}
                {project.skills.length > 3 && (
                  <Text style={styles.skillPreviewText}>+{project.skills.length - 3}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
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
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.info + '20',
    borderColor: COLORS.info,
  },
  categoryChipText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: COLORS.info,
  },
  projectList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  projectCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  projectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    marginRight: 10,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  projectCategory: {
    fontSize: 14,
    color: COLORS.info,
    marginBottom: 4,
  },
  projectDuration: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  skillsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillPreviewText: {
    fontSize: 12,
    color: COLORS.textMuted,
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  backButton: {
    padding: 20,
    paddingBottom: 10,
  },
  backButtonText: {
    color: COLORS.info,
    fontSize: 16,
  },
  projectDetailHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  projectDetailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  projectDetailMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  projectDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  featureBullet: {
    fontSize: 16,
    color: COLORS.info,
    marginRight: 8,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: COLORS.surfaceLight,
    padding: 16,
    borderRadius: 12,
    minWidth: (width - 64) / 3,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.success,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillTag: {
    backgroundColor: COLORS.info + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.info + '40',
  },
  skillTagText: {
    color: COLORS.info,
    fontSize: 14,
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: COLORS.info,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 20,
    alignItems: 'center',
  },
  startButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
