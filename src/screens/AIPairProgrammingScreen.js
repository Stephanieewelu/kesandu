import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView,
  Dimensions, TextInput, KeyboardAvoidingView, Platform
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

const { width } = Dimensions.get('window');

const PROJECT_IDEAS = [
  {
    id: 1,
    title: 'RAG-Powered Documentation Bot',
    difficulty: 'Intermediate',
    duration: '4-6 hours',
    stack: ['Python', 'LangChain', 'Pinecone', 'FastAPI'],
    description: 'Build a chatbot that answers questions from your documentation using RAG',
    learningGoals: [
      'Vector embeddings and similarity search',
      'Prompt engineering for context injection',
      'API design for chat interfaces',
      'Error handling in LLM applications'
    ]
  },
  {
    id: 2,
    title: 'Real-time Anomaly Detector',
    difficulty: 'Advanced',
    duration: '6-8 hours',
    stack: ['Python', 'Scikit-learn', 'Kafka', 'Redis'],
    description: 'Streaming anomaly detection system for server logs',
    learningGoals: [
      'Time-series analysis',
      'Online learning algorithms',
      'Stream processing with Kafka',
      'Real-time alerting'
    ]
  },
  {
    id: 3,
    title: 'Data Pipeline with dbt',
    difficulty: 'Intermediate',
    duration: '3-5 hours',
    stack: ['dbt', 'PostgreSQL', 'Airflow', 'SQL'],
    description: 'Analytics pipeline with transformations and data quality tests',
    learningGoals: [
      'dbt models and transformations',
      'Data testing strategies',
      'Incremental processing',
      'DAG orchestration'
    ]
  }
];

const CONVERSATION_HISTORY = [
  {
    role: 'user',
    message: 'I want to build a RAG chatbot. Should I start with the embedding model?'
  },
  {
    role: 'ai',
    type: 'question',
    message: 'Before jumping into code, what problem are you solving? Who will use this chatbot and what kind of questions will they ask?'
  },
  {
    role: 'user',
    message: 'It\'s for our internal docs. Engineers will ask about API usage and deployment processes.'
  },
  {
    role: 'ai',
    type: 'challenge',
    message: 'Good context! Now, what happens if someone asks a question that\'s NOT in your docs? How should the chatbot respond?'
  },
  {
    role: 'user',
    message: 'Hmm, I didn\'t think about that. Maybe it should say "I don\'t know"?'
  },
  {
    role: 'ai',
    type: 'guidance',
    message: 'Exactly! This is called handling "out-of-domain" queries. Before we code, let\'s think through the architecture:\n\n1. What components do you need?\n2. How will documents flow through the system?\n3. Where might bottlenecks occur at scale?\n\nSketch it out first.'
  }
];

export default function AIPairProgrammingScreen() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [showCodeReview, setShowCodeReview] = useState(false);

  const handleSendMessage = () => {
    if (!userMessage.trim()) return;

    const newMessage = {
      role: 'user',
      message: userMessage,
      timestamp: new Date().toISOString()
    };

    setChatHistory([...chatHistory, newMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage);
      setChatHistory(prev => [...prev, aiResponse]);
    }, 1000);

    setUserMessage('');
  };

  const generateAIResponse = (userMsg) => {
    // Simulate different types of AI responses
    const responses = [
      {
        type: 'question',
        message: 'Interesting approach! What happens when the input is None or empty? How would you handle that edge case?'
      },
      {
        type: 'challenge',
        message: 'I see you\'re using a list here. What\'s the time complexity of searching through it? Could we do better?'
      },
      {
        type: 'guidance',
        message: 'Let\'s think about this step by step:\n\n1. What are the requirements?\n2. What data structures would be efficient?\n3. How will this scale?\n\nWalk me through your thinking.'
      },
      {
        type: 'caught_bug',
        message: '🐛 I noticed something: You\'re modifying a list while iterating over it. What could go wrong there?'
      }
    ];

    return {
      role: 'ai',
      ...responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date().toISOString()
    };
  };

  const handleCodeReview = () => {
    setShowCodeReview(true);
  };

  if (selectedProject) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Header */}
          <View style={styles.projectHeader}>
            <TouchableOpacity
              onPress={() => {
                setSelectedProject(null);
                setChatHistory([]);
                setCodeInput('');
              }}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.projectTitle}>{selectedProject.title}</Text>
          </View>

          {/* Split View: Code Editor & AI Chat */}
          <View style={styles.splitView}>
            {/* Code Editor */}
            <View style={styles.codeSection}>
              <Text style={styles.sectionTitle}>Your Code</Text>
              <TextInput
                style={styles.codeEditor}
                placeholder="Write your code here..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                value={codeInput}
                onChangeText={setCodeInput}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={handleCodeReview}
                disabled={!codeInput.trim()}
              >
                <Text style={styles.reviewButtonText}>🤖 Ask AI to Review</Text>
              </TouchableOpacity>
            </View>

            {/* AI Chat */}
            <View style={styles.chatSection}>
              <Text style={styles.sectionTitle}>AI Pair Partner</Text>

              <ScrollView
                style={styles.chatHistory}
                showsVerticalScrollIndicator={false}
              >
                {chatHistory.length === 0 && (
                  <View style={styles.chatEmpty}>
                    <Text style={styles.chatEmptyIcon}>💬</Text>
                    <Text style={styles.chatEmptyText}>
                      Your AI pair partner is here to help you think through problems
                    </Text>
                    <Text style={styles.chatEmptySubtext}>
                      Ask questions, share your approach, or request code review
                    </Text>
                  </View>
                )}

                {chatHistory.map((msg, index) => (
                  <View
                    key={index}
                    style={[
                      styles.chatMessage,
                      msg.role === 'user' ? styles.userMessage : styles.aiMessage
                    ]}
                  >
                    {msg.role === 'ai' && (
                      <View style={[
                        styles.messageTypeBadge,
                        msg.type === 'question' && styles.typeQuestion,
                        msg.type === 'challenge' && styles.typeChallenge,
                        msg.type === 'caught_bug' && styles.typeBug,
                      ]}>
                        <Text style={styles.messageTypeText}>
                          {msg.type === 'question' && '❓'}
                          {msg.type === 'challenge' && '🎯'}
                          {msg.type === 'caught_bug' && '🐛'}
                          {msg.type === 'guidance' && '🧭'}
                          {' '}
                          {msg.type}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.messageText}>{msg.message}</Text>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.chatInput}>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Ask your AI pair partner..."
                  placeholderTextColor={COLORS.textMuted}
                  value={userMessage}
                  onChangeText={setUserMessage}
                  onSubmitEditing={handleSendMessage}
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSendMessage}
                  disabled={!userMessage.trim()}
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Code Review Modal */}
          {showCodeReview && (
            <View style={styles.reviewOverlay}>
              <View style={styles.reviewContainer}>
                <Text style={styles.reviewTitle}>AI Code Review</Text>

                <ScrollView style={styles.reviewContent}>
                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewIcon}>✓</Text>
                    <Text style={styles.reviewText}>
                      Good: You're using descriptive variable names
                    </Text>
                  </View>

                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewIcon}>❓</Text>
                    <Text style={styles.reviewText}>
                      Question: What happens if the API call fails? Do you have error handling?
                    </Text>
                  </View>

                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewIcon}>💡</Text>
                    <Text style={styles.reviewText}>
                      Suggestion: Consider extracting this logic into a separate function for testability
                    </Text>
                  </View>

                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewIcon}>⚠️</Text>
                    <Text style={styles.reviewText}>
                      Concern: This loop has O(n²) complexity. Can you optimize it?
                    </Text>
                  </View>
                </ScrollView>

                <TouchableOpacity
                  style={styles.closeReviewButton}
                  onPress={() => setShowCodeReview(false)}
                >
                  <Text style={styles.closeReviewButtonText}>Got it!</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Pair Programming</Text>
          <Text style={styles.subtitle}>Build real projects with AI as your thinking partner</Text>
        </View>

        <View style={styles.philosophyCard}>
          <Text style={styles.philosophyIcon}>🎯</Text>
          <Text style={styles.philosophyTitle}>Not AI Writing Code FOR You</Text>
          <Text style={styles.philosophyText}>
            Your AI pair partner asks questions, suggests alternatives, catches bugs through
            Socratic dialogue, and helps you think like a senior engineer.
          </Text>
        </View>

        <View style={styles.howItWorks}>
          <Text style={styles.howItWorksTitle}>How It Works</Text>

          <View style={styles.stepCard}>
            <Text style={styles.stepNumber}>1</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Ask "Why are you using that approach?"</Text>
              <Text style={styles.stepDescription}>
                AI challenges your assumptions and makes you explain your reasoning
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <Text style={styles.stepNumber}>2</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Suggests alternatives without giving answers</Text>
              <Text style={styles.stepDescription}>
                "Have you considered using a hash map instead of a list?"
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <Text style={styles.stepNumber}>3</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Catches bugs through questions</Text>
              <Text style={styles.stepDescription}>
                "What happens when input is None?" - makes YOU find the fix
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <Text style={styles.stepNumber}>4</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Reviews your code Socratically</Text>
              <Text style={styles.stepDescription}>
                "Is there a more efficient way?" - guides you to better solutions
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.exampleSection}>
          <Text style={styles.exampleTitle}>Example Conversation</Text>
          {CONVERSATION_HISTORY.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.exampleMessage,
                msg.role === 'user' ? styles.exampleUser : styles.exampleAI
              ]}
            >
              <Text style={styles.exampleRole}>
                {msg.role === 'user' ? '👤 You' : '🤖 AI Partner'}
              </Text>
              {msg.type && (
                <Text style={styles.exampleType}>[{msg.type}]</Text>
              )}
              <Text style={styles.exampleText}>{msg.message}</Text>
            </View>
          ))}
        </View>

        <View style={styles.projectsSection}>
          <Text style={styles.projectsSectionTitle}>Choose a Project</Text>

          {PROJECT_IDEAS.map(project => (
            <TouchableOpacity
              key={project.id}
              style={styles.projectCard}
              onPress={() => setSelectedProject(project)}
            >
              <View style={styles.projectCardHeader}>
                <Text style={styles.projectCardTitle}>{project.title}</Text>
                <View style={styles.projectDifficulty}>
                  <Text style={styles.projectDifficultyText}>{project.difficulty}</Text>
                </View>
              </View>

              <Text style={styles.projectDescription}>{project.description}</Text>

              <View style={styles.projectMeta}>
                <Text style={styles.projectDuration}>⏱️ {project.duration}</Text>
              </View>

              <View style={styles.projectStack}>
                {project.stack.map((tech, index) => (
                  <Text key={index} style={styles.projectTech}>{tech}</Text>
                ))}
              </View>

              <View style={styles.projectGoals}>
                <Text style={styles.projectGoalsTitle}>You'll Learn:</Text>
                {project.learningGoals.slice(0, 2).map((goal, index) => (
                  <Text key={index} style={styles.projectGoal}>• {goal}</Text>
                ))}
                {project.learningGoals.length > 2 && (
                  <Text style={styles.projectGoal}>+ {project.learningGoals.length - 2} more</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
  philosophyCard: {
    backgroundColor: COLORS.purple + '10',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.purple,
    alignItems: 'center',
  },
  philosophyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  philosophyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  philosophyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  howItWorks: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  howItWorksTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.info,
    marginRight: 16,
    width: 32,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  exampleSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  exampleTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  exampleMessage: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exampleUser: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  exampleAI: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.purple,
  },
  exampleRole: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  exampleType: {
    fontSize: 12,
    color: COLORS.warning,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  exampleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  projectsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  projectsSectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  projectCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  projectDifficulty: {
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  projectDifficultyText: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '600',
  },
  projectDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 22,
  },
  projectMeta: {
    marginBottom: 12,
  },
  projectDuration: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  projectStack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  projectTech: {
    fontSize: 12,
    color: COLORS.info,
    backgroundColor: COLORS.info + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  projectGoals: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    padding: 12,
  },
  projectGoalsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  projectGoal: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  projectHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButtonText: {
    color: COLORS.info,
    fontSize: 16,
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  splitView: {
    flex: 1,
    flexDirection: 'row',
  },
  codeSection: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    padding: 16,
  },
  chatSection: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  codeEditor: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewButton: {
    backgroundColor: COLORS.purple,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  reviewButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  chatHistory: {
    flex: 1,
    marginBottom: 12,
  },
  chatEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  chatEmptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  chatEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  chatEmptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  chatMessage: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  userMessage: {
    backgroundColor: COLORS.info + '20',
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  aiMessage: {
    backgroundColor: COLORS.surfaceLight,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  messageTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  typeQuestion: {
    backgroundColor: COLORS.info + '30',
  },
  typeChallenge: {
    backgroundColor: COLORS.warning + '30',
  },
  typeBug: {
    backgroundColor: COLORS.danger + '30',
  },
  messageTypeText: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  chatInput: {
    flexDirection: 'row',
    gap: 8,
  },
  messageInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    backgroundColor: COLORS.info,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  reviewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reviewContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
    width: '100%',
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  reviewContent: {
    marginBottom: 16,
  },
  reviewItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  reviewIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  reviewText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  closeReviewButton: {
    backgroundColor: COLORS.info,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeReviewButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
