import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView,
  Dimensions, TextInput, Modal
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
  purple: '#A855F7',
};

const { width, height } = Dimensions.get('window');

const SYSTEM_COMPONENTS = [
  { id: 'lb', name: 'Load Balancer', icon: '⚖️', category: 'Infrastructure' },
  { id: 'api', name: 'API Gateway', icon: '🚪', category: 'Infrastructure' },
  { id: 'server', name: 'Application Server', icon: '🖥️', category: 'Compute' },
  { id: 'db', name: 'Database', icon: '🗄️', category: 'Storage' },
  { id: 'cache', name: 'Cache (Redis)', icon: '⚡', category: 'Storage' },
  { id: 'queue', name: 'Message Queue', icon: '📬', category: 'Processing' },
  { id: 'cdn', name: 'CDN', icon: '🌐', category: 'Infrastructure' },
  { id: 's3', name: 'Object Storage', icon: '📦', category: 'Storage' },
  { id: 'search', name: 'Search Engine', icon: '🔍', category: 'Storage' },
  { id: 'ml', name: 'ML Model Service', icon: '🤖', category: 'Processing' },
];

const DESIGN_TEMPLATES = [
  {
    id: 'url-shortener',
    name: 'URL Shortener',
    difficulty: 'Easy',
    components: ['lb', 'api', 'server', 'db', 'cache'],
    description: 'Design a scalable URL shortening service like bit.ly'
  },
  {
    id: 'instagram',
    name: 'Instagram Feed',
    difficulty: 'Medium',
    components: ['lb', 'api', 'server', 'db', 'cache', 'cdn', 's3'],
    description: 'Design a social media feed with images and videos'
  },
  {
    id: 'uber',
    name: 'Uber Ride Matching',
    difficulty: 'Hard',
    components: ['lb', 'api', 'server', 'db', 'cache', 'queue', 'ml'],
    description: 'Real-time ride matching with geospatial queries'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    difficulty: 'Expert',
    components: ['lb', 'api', 'server', 'db', 'cache', 'cdn', 's3', 'queue', 'ml', 'search'],
    description: 'Video streaming platform with recommendations'
  }
];

const AI_FEEDBACK_TEMPLATES = [
  {
    type: 'bottleneck',
    messages: [
      'Your database is a single point of failure. What happens if it goes down?',
      'Have you considered read replicas for the database?',
      'How will you handle 10x traffic? Where will the bottleneck be?'
    ]
  },
  {
    type: 'scaling',
    messages: [
      'How will you scale this horizontally?',
      'What about data consistency across multiple servers?',
      'Consider using a CDN for static assets'
    ]
  },
  {
    type: 'latency',
    messages: [
      'What\'s the expected latency for this operation?',
      'Could you add caching to reduce database load?',
      'Have you thought about geo-replication for lower latency?'
    ]
  }
];

export default function ARSystemDesignScreen() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [placedComponents, setPlacedComponents] = useState([]);
  const [connections, setConnections] = useState([]);
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [aiFeedback, setAiFeedback] = useState([]);
  const [showComponentMenu, setShowComponentMenu] = useState(false);

  const handlePlaceComponent = (component) => {
    const newComponent = {
      ...component,
      id: `${component.id}_${Date.now()}`,
      x: Math.random() * (width - 150) + 20,
      y: Math.random() * 200 + 100,
    };
    setPlacedComponents([...placedComponents, newComponent]);
    setShowComponentMenu(false);
  };

  const handleGetAIFeedback = () => {
    // Simulate AI analysis
    const feedback = [
      {
        type: 'positive',
        message: '✓ Good use of load balancer for distributing traffic'
      },
      {
        type: 'warning',
        message: '⚠️ Database is a single point of failure - consider replication'
      },
      {
        type: 'question',
        message: '❓ How will you handle cache invalidation when data changes?'
      },
      {
        type: 'suggestion',
        message: '💡 Consider adding a CDN for static content to reduce server load'
      }
    ];
    setAiFeedback(feedback);
    setShowAIFeedback(true);
  };

  const handleClearCanvas = () => {
    setPlacedComponents([]);
    setConnections([]);
    setAiFeedback([]);
  };

  if (selectedTemplate) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.canvasHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setSelectedTemplate(null);
                handleClearCanvas();
              }}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.canvasTitle}>{selectedTemplate.name}</Text>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearCanvas}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {/* Canvas Area */}
          <ScrollView style={styles.canvas} showsVerticalScrollIndicator={false}>
            <Text style={styles.canvasInstruction}>
              Tap + to add components. Drag to position. Tap AI for feedback.
            </Text>

            {/* Placed Components */}
            <View style={styles.canvasContent}>
              {placedComponents.map((component, index) => (
                <View
                  key={index}
                  style={[
                    styles.placedComponent,
                    { top: component.y, left: component.x }
                  ]}
                >
                  <Text style={styles.componentIcon}>{component.icon}</Text>
                  <Text style={styles.componentName}>{component.name}</Text>
                </View>
              ))}

              {placedComponents.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateIcon}>🎨</Text>
                  <Text style={styles.emptyStateText}>
                    Start designing your system architecture
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Tap the + button to add components
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Component Menu Modal */}
          <Modal
            visible={showComponentMenu}
            transparent
            animationType="slide"
            onRequestClose={() => setShowComponentMenu(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.componentMenuContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Component</Text>
                  <TouchableOpacity onPress={() => setShowComponentMenu(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.componentList}>
                  {SYSTEM_COMPONENTS.map(component => (
                    <TouchableOpacity
                      key={component.id}
                      style={styles.componentItem}
                      onPress={() => handlePlaceComponent(component)}
                    >
                      <Text style={styles.componentItemIcon}>{component.icon}</Text>
                      <View style={styles.componentItemInfo}>
                        <Text style={styles.componentItemName}>{component.name}</Text>
                        <Text style={styles.componentItemCategory}>{component.category}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* AI Feedback Modal */}
          <Modal
            visible={showAIFeedback}
            transparent
            animationType="slide"
            onRequestClose={() => setShowAIFeedback(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.feedbackContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>AI Critique</Text>
                  <TouchableOpacity onPress={() => setShowAIFeedback(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.feedbackList}>
                  {aiFeedback.map((feedback, index) => (
                    <View
                      key={index}
                      style={[
                        styles.feedbackItem,
                        feedback.type === 'warning' && styles.feedbackWarning,
                        feedback.type === 'positive' && styles.feedbackPositive
                      ]}
                    >
                      <Text style={styles.feedbackText}>{feedback.message}</Text>
                    </View>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={styles.feedbackButton}
                  onPress={() => setShowAIFeedback(false)}
                >
                  <Text style={styles.feedbackButtonText}>Got it!</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Bottom Action Bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowComponentMenu(true)}
            >
              <Text style={styles.actionButtonIcon}>➕</Text>
              <Text style={styles.actionButtonText}>Add</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.aiButton]}
              onPress={handleGetAIFeedback}
              disabled={placedComponents.length === 0}
            >
              <Text style={styles.actionButtonIcon}>🤖</Text>
              <Text style={styles.actionButtonText}>AI Critique</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonIcon}>💾</Text>
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonIcon}>🔗</Text>
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AR System Design</Text>
          <Text style={styles.subtitle}>Visual, interactive architecture whiteboard</Text>
        </View>

        <View style={styles.featureGrid}>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🎨</Text>
            <Text style={styles.featureTitle}>Draw in 3D Space</Text>
            <Text style={styles.featureDescription}>
              Interactive nodes, animated data flows
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🔍</Text>
            <Text style={styles.featureTitle}>Zoom Into Details</Text>
            <Text style={styles.featureDescription}>
              Tap components to explore internals
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🤖</Text>
            <Text style={styles.featureTitle}>AI Critique</Text>
            <Text style={styles.featureDescription}>
              Real-time feedback on your design
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🤝</Text>
            <Text style={styles.featureTitle}>Collaborate</Text>
            <Text style={styles.featureDescription}>
              Share and design with others
            </Text>
          </View>
        </View>

        <View style={styles.templatesSection}>
          <Text style={styles.sectionTitle}>Practice Templates</Text>
          <ScrollView
            style={styles.templateList}
            showsVerticalScrollIndicator={false}
          >
            {DESIGN_TEMPLATES.map(template => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateCard}
                onPress={() => setSelectedTemplate(template)}
              >
                <View style={styles.templateHeader}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <View style={[
                    styles.difficultyBadge,
                    template.difficulty === 'Easy' && styles.difficultyEasy,
                    template.difficulty === 'Medium' && styles.difficultyMedium,
                    template.difficulty === 'Hard' && styles.difficultyHard,
                    template.difficulty === 'Expert' && styles.difficultyExpert,
                  ]}>
                    <Text style={styles.difficultyText}>{template.difficulty}</Text>
                  </View>
                </View>

                <Text style={styles.templateDescription}>{template.description}</Text>

                <View style={styles.templateComponents}>
                  {template.components.slice(0, 5).map((compId, index) => {
                    const component = SYSTEM_COMPONENTS.find(c => c.id === compId);
                    return (
                      <Text key={index} style={styles.templateComponentIcon}>
                        {component?.icon}
                      </Text>
                    );
                  })}
                  {template.components.length > 5 && (
                    <Text style={styles.templateMore}>+{template.components.length - 5}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.interviewTips}>
          <Text style={styles.tipsTitle}>💡 Interview Tips</Text>
          <Text style={styles.tipsText}>
            • Start with requirements and constraints{'\n'}
            • Draw high-level first, then zoom into details{'\n'}
            • Discuss trade-offs (consistency vs availability){'\n'}
            • Always mention scalability and bottlenecks
          </Text>
        </View>
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
    paddingBottom: 16,
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
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    width: (width - 52) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  templatesSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  templateList: {
    flex: 1,
  },
  templateCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyEasy: {
    backgroundColor: COLORS.success + '20',
  },
  difficultyMedium: {
    backgroundColor: COLORS.info + '20',
  },
  difficultyHard: {
    backgroundColor: COLORS.warning + '20',
  },
  difficultyExpert: {
    backgroundColor: COLORS.danger + '20',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  templateDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  templateComponents: {
    flexDirection: 'row',
    gap: 8,
  },
  templateComponentIcon: {
    fontSize: 24,
  },
  templateMore: {
    fontSize: 14,
    color: COLORS.textMuted,
    alignSelf: 'center',
  },
  interviewTips: {
    backgroundColor: COLORS.info + '10',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    borderWidth: 1,
    borderColor: COLORS.info + '40',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.info,
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  canvasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: COLORS.info,
    fontSize: 16,
  },
  canvasTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: COLORS.danger,
    fontSize: 16,
  },
  canvas: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  canvasInstruction: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    padding: 16,
  },
  canvasContent: {
    height: height - 300,
    position: 'relative',
  },
  placedComponent: {
    position: 'absolute',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: COLORS.info,
    alignItems: 'center',
    minWidth: 100,
  },
  componentIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  componentName: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aiButton: {
    backgroundColor: COLORS.purple + '20',
    borderColor: COLORS.purple,
  },
  actionButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  componentMenuContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalClose: {
    fontSize: 24,
    color: COLORS.textMuted,
  },
  componentList: {
    padding: 16,
  },
  componentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  componentItemIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  componentItemInfo: {
    flex: 1,
  },
  componentItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  componentItemCategory: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  feedbackContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
  },
  feedbackList: {
    padding: 16,
  },
  feedbackItem: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  feedbackWarning: {
    borderLeftColor: COLORS.warning,
  },
  feedbackPositive: {
    borderLeftColor: COLORS.success,
  },
  feedbackText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  feedbackButton: {
    backgroundColor: COLORS.info,
    margin: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  feedbackButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
