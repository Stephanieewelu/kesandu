import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView,
  Dimensions, TextInput, ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';

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

const { width, height } = Dimensions.get('window');

const PLAYGROUND_LABS = [
  {
    id: 'code-editor',
    title: 'Live Code Editor',
    description: 'Run Python/SQL in-browser with instant results',
    icon: '💻',
    category: 'Interactive',
    features: [
      'Python 3.11 runtime',
      'SQL execution (SQLite)',
      'Real-time output',
      'Code snippets library',
      'Share code with others'
    ],
    technologies: ['Python', 'SQL', 'WebAssembly'],
    exampleCode: `# Example: Data Analysis with Pandas
import pandas as pd
import numpy as np

# Create sample dataset
data = {
    'user_id': range(1, 101),
    'revenue': np.random.randint(100, 10000, 100),
    'cohort': np.random.choice(['2024-01', '2024-02', '2024-03'], 100)
}
df = pd.DataFrame(data)

# Calculate cohort metrics
cohort_metrics = df.groupby('cohort').agg({
    'revenue': ['sum', 'mean', 'count']
}).round(2)

print(cohort_metrics)`
  },
  {
    id: 'gpu-training',
    title: 'GPU Access - Train Models',
    description: 'Train small ML models with free GPU access (Colab-style)',
    icon: '🚀',
    category: 'ML Training',
    features: [
      'Free GPU hours (T4)',
      'Pre-installed libraries (PyTorch, TensorFlow)',
      'Jupyter notebook interface',
      'Save/load trained models',
      'Tensorboard integration'
    ],
    technologies: ['PyTorch', 'TensorFlow', 'CUDA', 'Jupyter'],
    exampleCode: `# Example: Train a Simple Neural Network
import torch
import torch.nn as nn
import torch.optim as optim

# Define model
class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        return self.fc2(x)

# Initialize
device = 'cuda' if torch.cuda.is_available() else 'cpu'
model = SimpleNet().to(device)
optimizer = optim.Adam(model.parameters(), lr=0.001)

print(f'Training on: {device}')
print(f'Model parameters: {sum(p.numel() for p in model.parameters())}')`
  },
  {
    id: 'api-sandbox',
    title: 'API Sandboxes',
    description: 'Test OpenAI, Anthropic, and other APIs with sample credits',
    icon: '🔌',
    category: 'API Testing',
    features: [
      'Free API credits for testing',
      'Support for major LLM providers',
      'Request/response inspector',
      'Rate limit monitoring',
      'Token usage tracking'
    ],
    technologies: ['OpenAI API', 'Anthropic Claude', 'Gemini', 'REST APIs'],
    exampleCode: `# Example: Testing Claude API
import anthropic

client = anthropic.Anthropic(
    api_key="your_api_key_here"
)

message = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": "Explain RAG systems in 3 sentences"
        }
    ]
)

print(message.content[0].text)

# Monitor usage
print(f"\\nTokens used: {message.usage.input_tokens + message.usage.output_tokens}")`
  },
  {
    id: 'data-playground',
    title: 'Data Playground',
    description: 'Real datasets to analyze (e-commerce, logs, user behavior)',
    icon: '📊',
    category: 'Data Analysis',
    features: [
      'Real-world datasets (1M+ rows)',
      'E-commerce transaction data',
      'Web analytics logs',
      'User behavior tracking',
      'Export results to CSV/JSON'
    ],
    technologies: ['Pandas', 'SQL', 'DuckDB', 'Polars'],
    exampleCode: `# Example: Analyze E-commerce Data
import duckdb

# Load sample e-commerce data (1M rows)
con = duckdb.connect(':memory:')

con.execute("""
    SELECT
        DATE_TRUNC('month', order_date) as month,
        category,
        COUNT(*) as orders,
        SUM(total) as revenue,
        AVG(total) as avg_order_value
    FROM ecommerce_orders
    WHERE order_date >= '2024-01-01'
    GROUP BY 1, 2
    ORDER BY revenue DESC
    LIMIT 10
""")

results = con.fetchall()
for row in results:
    print(row)`
  },
  {
    id: 'deployment-labs',
    title: 'Deployment Labs',
    description: 'Deploy apps to Vercel, Railway, and cloud providers',
    icon: '🚢',
    category: 'DevOps',
    features: [
      'One-click deployments',
      'Git integration',
      'Custom domains',
      'Environment variables',
      'Deploy logs monitoring'
    ],
    technologies: ['Vercel', 'Railway', 'Docker', 'CI/CD'],
    exampleCode: `# Example: Deploy FastAPI App
# vercel.json
{
  "builds": [
    {
      "src": "main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "main.py"
    }
  ]
}

# main.py
from fastapi import FastAPI
app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello from Vercel!"}

# Deploy with: vercel --prod`
  },
  {
    id: 'vector-db',
    title: 'Vector Database Lab',
    description: 'Experiment with embeddings and vector search',
    icon: '🔍',
    category: 'RAG/Search',
    features: [
      'Pinecone/Weaviate sandboxes',
      'Pre-loaded embeddings',
      'Semantic search testing',
      'Hybrid search experiments',
      'Performance benchmarking'
    ],
    technologies: ['Pinecone', 'Weaviate', 'FAISS', 'OpenAI Embeddings'],
    exampleCode: `# Example: Semantic Search with Embeddings
import pinecone
from openai import OpenAI

# Initialize
pc = pinecone.Pinecone(api_key="your_key")
index = pc.Index("kesandu-docs")
openai_client = OpenAI()

# Create query embedding
query = "How do I implement RAG?"
embedding = openai_client.embeddings.create(
    model="text-embedding-3-small",
    input=query
).data[0].embedding

# Search
results = index.query(
    vector=embedding,
    top_k=5,
    include_metadata=True
)

for match in results.matches:
    print(f"Score: {match.score:.2f}")
    print(f"Text: {match.metadata['text']}")
    print()`
  }
];

export default function AIPlaygroundScreen() {
  const [selectedLab, setSelectedLab] = useState(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const handleRunCode = async () => {
    setIsRunning(true);
    // Simulate code execution
    setTimeout(() => {
      setOutput('Code execution successful!\n\nOutput:\n> Hello from Kesandu Playground\n> Runtime: 0.42s');
      setIsRunning(false);
    }, 1500);
  };

  if (selectedLab) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.labHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedLab(null)}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.labTitleContainer}>
              <Text style={styles.labIcon}>{selectedLab.icon}</Text>
              <Text style={styles.labTitle}>{selectedLab.title}</Text>
            </View>
          </View>

          <ScrollView style={styles.labContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Features</Text>
              {selectedLab.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureBullet}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Example Code</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>{selectedLab.exampleCode}</Text>
                </View>
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Try It Yourself</Text>
              <TextInput
                style={styles.codeInput}
                placeholder="Write your code here..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                value={code}
                onChangeText={setCode}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={styles.runButton}
                onPress={handleRunCode}
                disabled={isRunning}
              >
                {isRunning ? (
                  <ActivityIndicator color={COLORS.text} />
                ) : (
                  <Text style={styles.runButtonText}>▶️ Run Code</Text>
                )}
              </TouchableOpacity>

              {output ? (
                <View style={styles.outputBlock}>
                  <Text style={styles.outputTitle}>Output:</Text>
                  <Text style={styles.outputText}>{output}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Technologies</Text>
              <View style={styles.techContainer}>
                {selectedLab.technologies.map((tech, index) => (
                  <View key={index} style={styles.techTag}>
                    <Text style={styles.techText}>{tech}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.launchButton}>
              <Text style={styles.launchButtonText}>🚀 Launch Full Playground</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Engineering Playground</Text>
          <Text style={styles.subtitle}>Interactive sandboxes for hands-on learning</Text>
        </View>

        <ScrollView
          style={styles.labList}
          showsVerticalScrollIndicator={false}
        >
          {PLAYGROUND_LABS.map(lab => (
            <TouchableOpacity
              key={lab.id}
              style={styles.labCard}
              onPress={() => {
                setSelectedLab(lab);
                setCode(lab.exampleCode);
                setOutput('');
              }}
            >
              <View style={styles.labCardHeader}>
                <Text style={styles.labCardIcon}>{lab.icon}</Text>
                <View style={styles.labCardInfo}>
                  <Text style={styles.labCardTitle}>{lab.title}</Text>
                  <Text style={styles.labCardCategory}>{lab.category}</Text>
                </View>
              </View>

              <Text style={styles.labCardDescription}>{lab.description}</Text>

              <View style={styles.labCardFeatures}>
                {lab.features.slice(0, 3).map((feature, index) => (
                  <Text key={index} style={styles.labCardFeature}>• {feature}</Text>
                ))}
                {lab.features.length > 3 && (
                  <Text style={styles.labCardFeature}>+ {lab.features.length - 3} more</Text>
                )}
              </View>

              <View style={styles.labCardFooter}>
                <Text style={styles.labCardLink}>Open Lab →</Text>
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.promotionCard}>
            <Text style={styles.promotionIcon}>⚡</Text>
            <Text style={styles.promotionTitle}>Premium Playgrounds</Text>
            <Text style={styles.promotionText}>
              Unlock extended GPU hours, larger datasets, and private deployments
            </Text>
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          </View>
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
  labList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  labCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  labCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  labCardIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  labCardInfo: {
    flex: 1,
  },
  labCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  labCardCategory: {
    fontSize: 14,
    color: COLORS.info,
  },
  labCardDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  labCardFeatures: {
    marginBottom: 12,
  },
  labCardFeature: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  labCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  labCardLink: {
    fontSize: 14,
    color: COLORS.info,
    fontWeight: '600',
  },
  backButton: {
    padding: 16,
    paddingBottom: 8,
  },
  backButtonText: {
    color: COLORS.info,
    fontSize: 16,
  },
  labHeader: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  labTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  labIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  labTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  labContent: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureBullet: {
    fontSize: 16,
    color: COLORS.success,
    marginRight: 8,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    flex: 1,
  },
  codeBlock: {
    backgroundColor: COLORS.surfaceLight,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
  },
  codeInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
    fontSize: 14,
    minHeight: 200,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  runButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  runButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  outputBlock: {
    backgroundColor: COLORS.surfaceLight,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  outputTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.success,
    marginBottom: 8,
  },
  outputText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
  },
  techContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  techTag: {
    backgroundColor: COLORS.info + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.info + '40',
  },
  techText: {
    color: COLORS.info,
    fontSize: 13,
    fontWeight: '500',
  },
  launchButton: {
    backgroundColor: COLORS.info,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  launchButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  promotionCard: {
    backgroundColor: COLORS.gold + '10',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
  },
  promotionIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  promotionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  promotionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  upgradeButtonText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
