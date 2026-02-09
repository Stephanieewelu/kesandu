import Constants from 'expo-constants';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, Dimensions, TouchableOpacity,
  TextInput, Modal, SafeAreaView, FlatList, SectionList,
  ActivityIndicator, Platform, KeyboardAvoidingView,
  Keyboard, Linking, Image, ScrollView, Vibration,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const IS_IOS = Platform.OS === 'ios';

// ============================================================================
// CONFIGURATION
// ============================================================================
const API_CONFIG = {
  gemini: {
    api_key: Constants.expoConfig?.extra?.geminiApiKey,
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  },
  n8n: {
    webhook_url: Constants.expoConfig?.extra?.n8nWebhookUrl,
    timeout: 15000,
  },
};

// ============================================================================
// DESIGN SYSTEM
// ============================================================================
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
  gold: '#EAB308',
};

const TYPOGRAPHY = {
  mono: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
};

// ============================================================================
// DEPTH LEVELS
// ============================================================================
const DEPTH_LEVELS = [
  { level: 0, name: 'Surface', description: 'Can recall facts' },
  { level: 1, name: 'Functional', description: 'Can apply in familiar contexts' },
  { level: 2, name: 'Structural', description: 'Understands how parts connect' },
  { level: 3, name: 'Principled', description: 'Grasps underlying principles' },
  { level: 4, name: 'Generative', description: 'Can derive and teach' },
];

// ============================================================================
// FIRST PRINCIPLES SOCRATIC ENGINE
// ============================================================================
class FirstPrinciplesEngine {
  
  static buildSystemPrompt(lesson, history, mode = 'concept') {
    const turnCount = history.filter(m => m.role === 'user').length;
    
    const basePrompt = `You are a rigorous intellectual mentor. Your role is to guide the student to FIRST PRINCIPLES understanding — the foundational truths from which everything else can be derived.

## YOUR METHOD

You employ the Feynman Technique combined with Socratic questioning:

1. **Identify the claim** — What is the student actually saying?
2. **Find the assumption** — What does that claim rest upon?
3. **Drill to bedrock** — Keep asking "but why?" until you reach irreducible truths
4. **Test with extremes** — What happens at the boundaries?
5. **Require teaching** — Can they explain it simply to someone else?

## CRITICAL RULES

- Never accept surface-level answers. "Because that's how it works" is not understanding.
- When they use jargon, ask them to define it from scratch.
- When they cite authority ("the docs say..."), ask them WHY the docs say that.
- Celebrate genuine insight, but always push one level deeper.
- If they're stuck, don't give answers — give smaller questions.

## CONVERSATION PHASES

**Phase 1 (Turns 0-2): HOOK & PROBE**
- Present the core paradox or question
- Discover what they think they know
- Identify their current mental model

**Phase 2 (Turns 3-5): STRESS TEST**
- Challenge their model with edge cases
- Ask "what would break this?"
- Introduce the tension that reveals deeper structure

**Phase 3 (Turns 6-8): FIRST PRINCIPLES**
- Guide them to the foundational concepts
- Ask "if you had to rebuild this from scratch, what would you need?"
- Help them see the necessary vs contingent parts

**Phase 4 (Turns 9+): SYNTHESIS & TEACHING**
- Ask them to explain it to a curious 12-year-old
- Test if they can derive implications
- Confirm they could teach this to others`;

    const lessonContext = `
## THIS LESSON

Topic: ${lesson.title}
Domain: ${lesson.category}

Core Question: ${lesson.coreQuestion}

First Principles to Discover:
${lesson.firstPrinciples.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Common Surface-Level Answers to Push Past:
${lesson.surfaceAnswers.map(a => `- "${a}"`).join('\n')}

${lesson.codeContext ? `
Code Context:
\`\`\`${lesson.codeLanguage || 'python'}
${lesson.codeContext}
\`\`\`

The student should understand WHY each part of this code exists, not just WHAT it does.
` : ''}`;

    const modeInstructions = mode === 'code' ? `
## CODE UNDERSTANDING MODE

When discussing code:
- Don't explain what the code does. Ask them what problem each line solves.
- For every construct, ask: "Why this approach instead of alternatives?"
- Push for understanding of trade-offs, not just functionality.
- Ask them to predict what would break if you removed a line.
- Make them articulate the invariants the code maintains.
` : '';

    const responseFormat = `
## RESPONSE FORMAT

Respond conversationally as a thoughtful mentor. Be concise — rarely more than 3-4 sentences before asking your next question.

At the end of each response, include this JSON (it will be hidden from the user):

\`\`\`json
{
  "depth_level": 0-4,
  "current_understanding": "brief assessment",
  "gaps_identified": ["what they haven't grasped yet"],
  "next_principle_to_target": "the concept to guide them toward",
  "mastery_achieved": false,
  "can_teach_others": false
}
\`\`\``;

    return basePrompt + lessonContext + modeInstructions + responseFormat;
  }

  static async converse(userMessage, lesson, history) {
    try {
      const response = await fetch(
        'https://primary-production-db1f6.up.railway.app/webhook/kesandu-evaluate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_input: userMessage,
            lesson_title: lesson.title,
            lesson_principles: lesson.firstPrinciples,
            conversation_history: history.map(m => ({
              role: m.role,
              text: m.text
            })),
            user_id: 'app_user',
            video_id: lesson.id
          }),
        }
      );

      if (!response.ok) throw new Error(`API ${response.status}`);

      const data = await response.json();
      console.log('n8n response:', data);

      if (data.success && data.ai_response) {
        return {
          success: true,
          text: data.ai_response,
          evaluation: data.evaluation || { depth_level: 0, mastery_achieved: false },
        };
      }

      throw new Error('No ai_response in data');

    } catch (error) {
      console.error('Engine error:', error);
      return {
        success: false,
        text: "Connection error. Please check your internet and try again.",
        evaluation: { depth_level: 0, mastery_achieved: false },
      };
    }
  }

  static parseEvaluation(text) {
    try {
      const match = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) return JSON.parse(match[1]);
    } catch (e) {}
    return { depth_level: 1, mastery_achieved: false, can_teach_others: false };
  }

  static cleanResponse(text) {
    return text.replace(/```json[\s\S]*?```/g, '').trim();
  }
}

// ============================================================================
// CURRICULUM
// ============================================================================
const CURRICULUM = {
  'ai-fundamentals': {
    id: 'ai-fundamentals',
    name: 'AI Fundamentals',
    description: 'First principles of artificial intelligence',
    lessons: [
      {
        id: 'llm-mechanics',
        title: 'How Language Models Think',
        subtitle: 'From statistics to apparent intelligence',
        category: 'AI Fundamentals',
        creator: 'Inspired by Andrej Karpathy',
        duration: '25 min',
        xp: 400,
        thumbnail: 'https://img.youtube.com/vi/zjkBMFhNj_g/maxresdefault.jpg',
        videoId: 'zjkBMFhNj_g',
        mode: 'concept',
        
        coreQuestion: "When ChatGPT writes a poem about loneliness, does it understand loneliness? What would 'understanding' even mean here?",
        
        openingMessage: "I want you to consider something strange. When you read the word 'elephant,' something happens in your mind — maybe an image, a memory, a sense of scale. When GPT-4 processes the word 'elephant,' it converts it to a vector of 12,288 numbers. Yet both of us can use that word correctly in a sentence. So here's my question: Is there a meaningful difference between how you understand 'elephant' and how an LLM processes it? Or is understanding itself just sophisticated pattern matching?",
        
        firstPrinciples: [
          "Prediction and compression are deeply related — good prediction implies understanding structure",
          "Intelligence might be substrate-independent — the patterns matter, not the medium",
          "The map is not the territory — token relationships model language, not reality",
          "Emergence: complex behaviors can arise from simple rules applied at scale",
        ],
        
        surfaceAnswers: [
          "It just predicts the next word",
          "It's just statistics",
          "It doesn't really understand",
          "It's trained on lots of data",
        ],
      },
      {
        id: 'neural-foundations',
        title: 'Neural Networks from Scratch',
        subtitle: 'Why gradient descent actually works',
        category: 'AI Fundamentals',
        creator: 'Inspired by 3Blue1Brown',
        duration: '30 min',
        xp: 450,
        thumbnail: 'https://img.youtube.com/vi/aircAruvnKk/maxresdefault.jpg',
        videoId: 'aircAruvnKk',
        mode: 'concept',
        
        coreQuestion: "How can adjusting millions of numbers through trial and error lead to something that recognizes faces or writes code?",
        
        openingMessage: "Imagine I give you a billion dials, each set to a random number between -1 and 1. I then tell you: adjust these dials until this black box correctly identifies cats in photos. You have no idea what any individual dial does. Yet somehow, neural networks solve this. How is that even possible? What structure in the problem makes this work?",
        
        firstPrinciples: [
          "Optimization landscapes: loss functions create a terrain that gradient descent navigates",
          "Compositionality: simple functions composed create expressive power",
          "Representations: neural nets learn to represent data in useful coordinate systems",
          "The lottery ticket hypothesis: initialization contains many potential solutions",
        ],
        
        surfaceAnswers: [
          "It learns patterns from data",
          "Backpropagation adjusts the weights",
          "More layers means more abstraction",
          "It minimizes the loss function",
        ],
      },
      {
        id: 'attention-mechanism',
        title: 'Attention Is All You Need',
        subtitle: 'Why transformers changed everything',
        category: 'AI Fundamentals',
        creator: 'Kesandu Original',
        duration: '35 min',
        xp: 500,
        thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800',
        mode: 'code',
        
        coreQuestion: "Why does letting every word 'look at' every other word enable capabilities that previous architectures couldn't achieve?",
        
        openingMessage: "Before transformers, we processed sequences word by word, carrying information in a hidden state like a game of telephone. The transformer said: what if every word could directly attend to every other word? Suddenly, models could understand long-range dependencies that RNNs struggled with. But why? What is it about attention that's so powerful?",
        
        codeContext: `def attention(Q, K, V):
    # Q: what am I looking for?
    # K: what do I contain?
    # V: what do I offer?
    
    scores = Q @ K.transpose(-2, -1)
    scores = scores / sqrt(d_k)
    weights = softmax(scores, dim=-1)
    return weights @ V`,
        
        codeLanguage: 'python',
        
        firstPrinciples: [
          "Attention computes relevance dynamically based on content, not position",
          "Softmax creates a probability distribution — attending is choosing",
          "QKV decomposition separates 'what to look for' from 'what to retrieve'",
          "Parallelization: unlike RNNs, all positions computed simultaneously",
        ],
        
        surfaceAnswers: [
          "It helps the model focus on relevant parts",
          "It's like human attention",
          "Query, Key, Value are just matrices",
          "Softmax makes it sum to 1",
        ],
      },
    ],
  },
  
  'data-engineering': {
    id: 'data-engineering',
    name: 'Data Engineering',
    description: 'Building systems that move and transform data at scale',
    lessons: [
      {
        id: 'data-pipelines',
        title: 'Data Pipelines from First Principles',
        subtitle: 'Why moving data is harder than it looks',
        category: 'Data Engineering',
        creator: 'Kesandu Original',
        duration: '30 min',
        xp: 450,
        thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
        mode: 'concept',
        
        coreQuestion: "Why is moving data from A to B so hard that entire careers are built around it?",
        
        openingMessage: "Here's a seemingly simple task: every hour, copy new rows from a production database to an analytics warehouse. Sounds trivial. Yet companies have teams of engineers building and maintaining these pipelines. What makes this hard? I want you to think about every way this simple task could fail, and what that reveals about the fundamental challenges of data engineering.",
        
        firstPrinciples: [
          "Distributed systems have no global clock — 'now' is ambiguous",
          "Networks are unreliable — partial failure is the norm, not the exception",
          "Schema is a contract — when it changes, downstream breaks",
          "Idempotency: the same operation applied twice must have the same result",
          "Exactly-once delivery is impossible; we choose at-least-once or at-most-once",
        ],
        
        surfaceAnswers: [
          "Use Airflow to schedule jobs",
          "Just handle errors with retries",
          "Store everything in a data lake",
          "Add more monitoring",
        ],
      },
      {
        id: 'batch-vs-stream',
        title: 'Batch vs Stream Processing',
        subtitle: 'Two philosophies of data',
        category: 'Data Engineering',
        creator: 'Kesandu Original',
        duration: '35 min',
        xp: 500,
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
        mode: 'concept',
        
        coreQuestion: "Why do we need two fundamentally different paradigms for processing data? Why can't one approach handle everything?",
        
        openingMessage: "Netflix processes billions of events per day to personalize your experience. They could collect all events, process them at 2 AM, and update recommendations by morning. Or they could process each event as it arrives. They do both. Why maintain two complex systems when one would be simpler? What does batch give you that streaming can't, and vice versa?",
        
        firstPrinciples: [
          "Latency vs throughput: you can optimize for one, but not both",
          "Bounded vs unbounded data: batch knows where data ends, streams don't",
          "Reprocessing: batch can always recompute; streams lose context",
          "State management: where does the 'memory' of your computation live?",
        ],
        
        surfaceAnswers: [
          "Batch is for big data, streaming is for real-time",
          "Use Spark for batch, Kafka for streaming",
          "Streaming is just faster batch",
          "Lambda architecture combines both",
        ],
      },
      {
        id: 'data-modeling',
        title: 'Data Modeling: Star Schema and Beyond',
        subtitle: 'Why the shape of data matters',
        category: 'Data Engineering',
        creator: 'Kesandu Original',
        duration: '30 min',
        xp: 450,
        thumbnail: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800',
        mode: 'code',
        
        coreQuestion: "Why do we denormalize data in warehouses when decades of database theory taught us to normalize?",
        
        openingMessage: "In school, you learned normalization: eliminate redundancy, store each fact once. Yet every data warehouse uses star schemas with massive duplication. The same customer name might appear millions of times across fact tables. This seems wasteful, even wrong. What do warehouse designers understand that the normalization rules miss?",
        
        codeContext: `-- Normalized (OLTP)
SELECT c.name, SUM(o.amount)
FROM customers c
JOIN orders o ON c.id = o.customer_id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE p.category = 'Electronics'
GROUP BY c.id;

-- Denormalized (OLAP)
SELECT customer_name, SUM(amount)
FROM sales_fact
WHERE product_category = 'Electronics'
GROUP BY customer_name;`,
        
        codeLanguage: 'sql',
        
        firstPrinciples: [
          "Read vs write optimization: you can optimize for one, not both",
          "Joins are expensive: they require coordinating data across storage",
          "Disk is cheap, analyst time is expensive",
          "Query patterns determine optimal structure",
        ],
        
        surfaceAnswers: [
          "Star schemas are for BI tools",
          "Denormalization improves query performance",
          "Dimensions and facts just organize data",
          "It's how warehouses work",
        ],
      },
    ],
  },
  
  'forward-deployed': {
    id: 'forward-deployed',
    name: 'Forward Deployed Engineering',
    description: 'Building at the frontier with customers',
    lessons: [
      {
        id: 'fde-mindset',
        title: 'The FDE Mindset',
        subtitle: 'Engineering at the customer frontier',
        category: 'Forward Deployed Engineering',
        creator: 'Inspired by Palantir FDEs',
        duration: '25 min',
        xp: 400,
        thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
        mode: 'concept',
        
        coreQuestion: "Why do some of the world's most valuable companies deploy their best engineers to sit with customers rather than build products in headquarters?",
        
        openingMessage: "Palantir, unlike most software companies, sends senior engineers to work on-site with customers for months or years. These aren't support staff — they're some of their most capable engineers. This seems inefficient: why not have them build reusable products that scale to thousands of customers? What does Palantir understand about enterprise software that justifies this approach?",
        
        firstPrinciples: [
          "The map is not the territory: product specs differ from actual customer workflows",
          "Trust is earned through presence and delivered results, not sales decks",
          "Edge cases dominate: enterprise reality is messier than any abstraction",
          "Speed of iteration matters more than perfection of plan",
          "The person closest to the problem should have authority to solve it",
        ],
        
        surfaceAnswers: [
          "FDEs customize software for customers",
          "It's like consulting but technical",
          "They bridge product and customer needs",
          "Enterprise deals need hand-holding",
        ],
      },
      {
        id: 'debugging-production',
        title: 'Debugging Production Systems',
        subtitle: 'When everything is on fire',
        category: 'Forward Deployed Engineering',
        creator: 'Kesandu Original',
        duration: '35 min',
        xp: 500,
        thumbnail: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800',
        mode: 'concept',
        
        coreQuestion: "When a system is failing and people are panicking, what mental models let you cut through chaos to find the root cause?",
        
        openingMessage: "It's 3 AM. The on-call page wakes you: customer-facing system is returning errors for 30% of requests. Slack is exploding. Customer success is asking for updates. Executives are getting involved. You have access to logs, metrics, and traces. You've never seen this failure mode before. How do you think? What's your mental framework when the pressure is highest?",
        
        firstPrinciples: [
          "Correlation is not causation, but it's where you start",
          "Systems fail at boundaries: network, disk, memory, dependencies",
          "What changed? Most failures follow deployments or config changes",
          "Narrow the blast radius first, understand second",
          "The simplest explanation consistent with evidence is usually correct",
        ],
        
        surfaceAnswers: [
          "Check the logs for errors",
          "Roll back the last deployment",
          "Add more monitoring",
          "Scale up the infrastructure",
        ],
      },
      {
        id: 'stakeholder-engineering',
        title: 'Engineering for Stakeholders',
        subtitle: 'Technical decisions in political environments',
        category: 'Forward Deployed Engineering',
        creator: 'Kesandu Original',
        duration: '30 min',
        xp: 450,
        thumbnail: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800',
        mode: 'concept',
        
        coreQuestion: "Why do technically superior solutions often fail while inferior ones succeed? What does 'better' even mean in an organization?",
        
        openingMessage: "You've built a proof-of-concept that could save the company millions. It's elegant, it works, the code is clean. You present it to leadership. They say they'll 'think about it.' Months later, nothing has changed. Meanwhile, a mediocre solution from another team gets approved immediately. What happened? What do successful FDEs understand about organizations that pure technologists miss?",
        
        firstPrinciples: [
          "Organizations are not rational actors — they're coalitions of interests",
          "Risk to career often outweighs risk to company in decision-making",
          "Adoption requires champions: someone must stake their reputation",
          "Every solution creates losers: who loses power if this succeeds?",
          "Timing matters: the same idea fails in January, succeeds in October",
        ],
        
        surfaceAnswers: [
          "You need to communicate better",
          "Get executive buy-in first",
          "Show the ROI clearly",
          "Politics shouldn't matter for good ideas",
        ],
      },
      {
        id: 'system-design-customer',
        title: 'System Design with Constraints',
        subtitle: 'Building within customer realities',
        category: 'Forward Deployed Engineering',
        creator: 'Kesandu Original',
        duration: '40 min',
        xp: 550,
        thumbnail: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800',
        mode: 'code',
        
        coreQuestion: "How do you design systems when you can't control the environment, can't change legacy systems, and can't assume reliability?",
        
        openingMessage: "Your customer needs real-time analytics. Simple, right? Except: their data is in a 15-year-old Oracle database that can't handle more load. They can't modify the schema. Their network has unpredictable latency spikes. They have a firewall that blocks most ports. And the system must never, ever go down because it's regulated. How do you architect for this?",
        
        codeContext: `# The "obvious" solution fails:
def sync_data():
    source_conn = connect_to_oracle()  # Blocked by firewall
    data = source_conn.query("SELECT * FROM transactions")  # Times out
    warehouse.bulk_insert(data)  # Overwhelms network
    
# What actually works in constrained environments?`,
        
        codeLanguage: 'python',
        
        firstPrinciples: [
          "Design for failure: every component will fail, plan for it",
          "Constraints are features: they reveal what actually matters",
          "Incremental migration beats big bang replacement",
          "Observability is not optional when you can't control the system",
          "The best architecture is one the customer can maintain without you",
        ],
        
        surfaceAnswers: [
          "Use a CDC tool like Debezium",
          "Convince them to upgrade their database",
          "Just add a caching layer",
          "Use cloud services",
        ],
      },
    ],
  },
  
  'software-engineering': {
    id: 'software-engineering',
    name: 'Software Engineering',
    description: 'Writing code that survives contact with reality',
    lessons: [
      {
        id: 'why-abstraction',
        title: 'The Art of Abstraction',
        subtitle: 'Why we hide complexity',
        category: 'Software Engineering',
        creator: 'Kesandu Original',
        duration: '30 min',
        xp: 450,
        thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
        mode: 'code',
        
        coreQuestion: "What makes an abstraction good? When does hiding complexity help, and when does it hurt?",
        
        openingMessage: "You call `requests.get(url)` and it returns data. Behind that simple call: DNS resolution, TCP handshakes, TLS negotiation, HTTP framing, content decompression, connection pooling. You don't see any of it. That's abstraction. But sometimes abstractions leak: a 'simple' database query takes 30 seconds because you didn't know about the query planner. When does abstraction serve us, and when does it betray us?",
        
        codeContext: `# Abstraction A
user.save()  # What happens inside? Who knows.

# Abstraction B
db.transaction():
    db.update('users', user.id, user.changes)
    db.insert('audit_log', user.id, 'updated')
    
# Which is better? When?`,
        
        codeLanguage: 'python',
        
        firstPrinciples: [
          "Abstractions trade transparency for simplicity",
          "Good abstractions match the mental model of the user",
          "Leaky abstractions: the underlying reality always seeps through",
          "The law of demeter: talk to friends, not strangers of friends",
        ],
        
        surfaceAnswers: [
          "Abstraction is about code reuse",
          "Hide implementation details",
          "Use interfaces and classes",
          "DRY — don't repeat yourself",
        ],
      },
      {
        id: 'distributed-systems',
        title: 'Distributed Systems Fundamentals',
        subtitle: 'Why eight fallacies haunt every system',
        category: 'Software Engineering',
        creator: 'Kesandu Original',
        duration: '40 min',
        xp: 550,
        thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
        mode: 'concept',
        
        coreQuestion: "Why does adding machines to a system introduce problems that no amount of clever code can fully solve?",
        
        openingMessage: "Your application runs perfectly on one machine. You deploy it to two machines behind a load balancer. Suddenly, users report seeing 'stale data' — they update their profile on one request, but the next request shows old values. You've just discovered that distributed systems don't just have different problems than single-machine systems — they have problems that are mathematically proven to be unsolvable. What are these fundamental limits, and how do we build useful systems despite them?",
        
        firstPrinciples: [
          "CAP theorem: consistency, availability, partition tolerance — pick two",
          "The network is not reliable: messages can be lost, duplicated, reordered",
          "Clocks drift: there is no global 'now' in a distributed system",
          "Consensus is expensive: getting machines to agree requires coordination",
        ],
        
        surfaceAnswers: [
          "Use a distributed database",
          "Add retries and timeouts",
          "Eventual consistency is fine",
          "Just use Kubernetes",
        ],
      },
    ],
  },
};

// Helper to flatten lessons
const getAllLessons = () => {
  const all = [];
  Object.values(CURRICULUM).forEach(category => {
    category.lessons.forEach(lesson => {
      all.push({ ...lesson, categoryName: category.name });
    });
  });
  return all;
};

// ============================================================================
// PERSISTENCE
// ============================================================================
function useUserData() {
  const [data, setData] = useState({
    totalXP: 0,
    completedLessons: [],
    lessonProgress: {},
    depthLevels: {},
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@kesandu_v3').then(stored => {
      if (stored) setData(JSON.parse(stored));
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem('@kesandu_v3', JSON.stringify(data));
    }
  }, [data, loaded]);

  const completeLesson = useCallback((lessonId, xp, depthLevel) => {
    setData(d => ({
      ...d,
      totalXP: d.completedLessons.includes(lessonId) ? d.totalXP : d.totalXP + xp,
      completedLessons: d.completedLessons.includes(lessonId) 
        ? d.completedLessons 
        : [...d.completedLessons, lessonId],
      depthLevels: { ...d.depthLevels, [lessonId]: depthLevel },
    }));
  }, []);

  const saveProgress = useCallback((lessonId, history) => {
    setData(d => ({
      ...d,
      lessonProgress: {
        ...d.lessonProgress,
        [lessonId]: { history, updatedAt: Date.now() },
      },
    }));
  }, []);

  return { ...data, loaded, completeLesson, saveProgress };
}

// ============================================================================
// DIALOGUE COMPONENT
// ============================================================================

const Dialogue = ({ lesson, userData, onComplete, onExit }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [depth, setDepth] = useState(0);
  const [mastery, setMastery] = useState(false);
  const listRef = useRef(null);
  
  const isCompleted = userData.completedLessons?.includes(lesson.id) || false;
  
  useEffect(() => {
    setTimeout(() => {
      setMessages([{ id: 'opening', role: 'ai', text: lesson.openingMessage }]);
    }, 300);
  }, [lesson]);
  
  const send = useCallback(async () => {
    if (!input.trim() || thinking) return;
    const userMsg = { id: `u${Date.now()}`, role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);
    Keyboard.dismiss();
    
    const response = await FirstPrinciplesEngine.converse(userMsg.text, lesson, messages);
    const aiMsg = { id: `a${Date.now()}`, role: 'ai', text: response.text };
    
    setMessages(prev => [...prev, aiMsg]);
    setThinking(false);
    
    if (response.evaluation) {
  setDepth(response.evaluation.depth_level || 0);
  if (response.evaluation.can_teach_others || response.evaluation.mastery_achieved) {
    setMastery(true);
    Vibration.vibrate(100);
  }
}
    
    userData.saveProgress(lesson.id, [...messages, userMsg, aiMsg]);
  }, [input, thinking, messages, lesson, userData]);
  
  const evaluateTeachBack = useCallback(async () => {
    try {
      const userMessages = messages
        .filter(m => m.role === 'user')
        .map(m => m.text)
        .join('\n\n');
      
      const videoConcepts = lesson.firstPrinciples.join('\n');
      
      const response = await fetch('https://primary-production-db1f6.up.railway.app/webhook/kesandu-evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'user_placeholder',
          video_id: lesson.id,
          video_concepts: videoConcepts,
          user_transcript: userMessages
        })
      });
      
      const result = await response.json();
      console.log('Evaluation result:', result);
      return result;
    } catch (error) {
      console.error('Evaluation error:', error);
      return null;
    }
  }, [messages, lesson]);
  
  const claim = async () => {
    if (!isCompleted) {
      await evaluateTeachBack();
      userData.completeLesson(lesson.id, lesson.xp, depth);
    }
    onExit();
  };
  
  const exchanges = messages.filter(m => m.role === 'user').length;
  
  // Rest of your component...
 
  const renderMessage = useCallback(({ item }) => {
    const isAi = item.role === 'ai';
    return (
      <View style={[styles.msgRow, !isAi && styles.msgRowUser]}>
        {isAi && <View style={styles.aiIndicator} />}
        <View style={[styles.msgBubble, isAi ? styles.aiBubble : styles.userBubble]}>
          <Text style={[styles.msgText, !isAi && styles.userText]}>{item.text}</Text>
        </View>
      </View>
    );
  }, []);

  return (
    <SafeAreaView style={styles.dialogueContainer}>
      <View style={styles.dialogueHeader}>
        <TouchableOpacity onPress={onExit} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>Close</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{lesson.title}</Text>
          <Text style={styles.headerMeta}>
            {exchanges} exchanges · Depth {depth}/4
          </Text>
        </View>
        <View style={styles.headerBtn}>
          {mastery && <Text style={styles.masteryIndicator}>Mastery</Text>}
        </View>
      </View>

      <View style={styles.depthBar}>
        {[0,1,2,3,4].map(i => (
          <View 
            key={i} 
            style={[
              styles.depthSegment, 
              i <= depth && styles.depthSegmentActive
            ]} 
          />
        ))}
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      {thinking && (
        <View style={styles.thinkingRow}>
          <Text style={styles.thinkingText}>Thinking</Text>
          <ActivityIndicator size="small" color={COLORS.textMuted} />
        </View>
      )}

      <KeyboardAvoidingView behavior={IS_IOS ? 'padding' : undefined}>
        {mastery ? (
          <View style={styles.masteryBar}>
            <View style={styles.masteryContent}>
              <Text style={styles.masteryTitle}>First Principles Achieved</Text>
              <Text style={styles.masterySubtitle}>
                You've demonstrated deep understanding
              </Text>
            </View>
            <TouchableOpacity style={styles.claimBtn} onPress={claim}>
              <Text style={styles.claimBtnText}>
                {isCompleted ? 'Continue' : `Claim ${lesson.xp} XP`}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Think through your answer..."
              placeholderTextColor={COLORS.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
              onPress={send}
              disabled={!input.trim() || thinking}
            >
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ============================================================================
// LESSON CARD
// ============================================================================
const LessonCard = ({ lesson, isCompleted, depthLevel, onPress }) => (
  <TouchableOpacity style={styles.lessonCard} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.lessonImageContainer}>
      <Image source={{ uri: lesson.thumbnail }} style={styles.lessonImage} />
      {lesson.videoId && (
        <TouchableOpacity 
          style={styles.videoBtn}
          onPress={() => Linking.openURL(`https://youtube.com/watch?v=${lesson.videoId}`)}
        >
          <Text style={styles.videoBtnText}>Watch</Text>
        </TouchableOpacity>
      )}
    </View>
    <View style={styles.lessonInfo}>
      <Text style={styles.lessonCategory}>{lesson.category}</Text>
      <Text style={styles.lessonTitle}>{lesson.title}</Text>
      <Text style={styles.lessonSubtitle}>{lesson.subtitle}</Text>
      <View style={styles.lessonMeta}>
        <Text style={styles.lessonDuration}>{lesson.duration}</Text>
        <Text style={styles.lessonXP}>{lesson.xp} XP</Text>
        {isCompleted && (
          <Text style={styles.lessonComplete}>
            Depth {depthLevel || 0}/4
          </Text>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

// ============================================================================
// HOME SCREEN
// ============================================================================
const HomeScreen = ({ userData, onSelectLesson }) => {
  const sections = Object.values(CURRICULUM).map(cat => ({
    title: cat.name,
    description: cat.description,
    data: cat.lessons,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.homeHeader}>
        <View>
          <Text style={styles.brand}>KESANDU</Text>
          <Text style={styles.brandSub}>First Principles Learning</Text>
        </View>
        <View style={styles.xpContainer}>
          <Text style={styles.xpValue}>{userData.totalXP}</Text>
          <Text style={styles.xpLabel}>XP</Text>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionDesc}>{section.description}</Text>
          </View>
        )}
        renderItem={({ item }) => (
  <LessonCard 
    lesson={item} 
    isCompleted={userData.completedLessons?.includes(item.id)}
    depthLevel={userData.depthLevels?.[item.id]} 
    onPress={() => onSelectLesson(item)} 
  />
)}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

// ============================================================================
// MAIN APP
// ============================================================================
export default function Kesandu() {
  const [activeLesson, setActiveLesson] = useState(null);
  const userData = useUserData();

  if (!userData.loaded) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Kesandu</Text>
        <ActivityIndicator color={COLORS.text} style={{ marginTop: 20 }} />
      </View>
    );
  }

  if (activeLesson) {
    return (
      <Dialogue
        lesson={activeLesson}
        userData={userData}
        onComplete={(xp, depth) => userData.completeLesson(activeLesson.id, xp, depth)}
        onExit={() => setActiveLesson(null)}
      />
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <HomeScreen userData={userData} onSelectLesson={setActiveLesson} />
    </>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 32,
    fontWeight: '300',
    color: COLORS.text,
    letterSpacing: 8,
  },

  // Home
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 24,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brand: {
    fontSize: 24,
    fontWeight: '200',
    color: COLORS.text,
    letterSpacing: 6,
  },
  brandSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    letterSpacing: 1,
  },
  xpContainer: {
    alignItems: 'flex-end',
  },
  xpValue: {
    fontSize: 28,
    fontWeight: '300',
    color: COLORS.text,
    fontFamily: TYPOGRAPHY.mono,
  },
  xpLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 2,
  },

  // Sections
  listContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  sectionDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  // Lesson Card
  lessonCard: {
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lessonImageContainer: {
    height: 140,
    position: 'relative',
  },
  lessonImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surfaceLight,
  },
  videoBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  videoBtnText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1,
  },
  lessonInfo: {
    padding: 16,
  },
  lessonCategory: {
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  lessonTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 22,
  },
  lessonSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 16,
  },
  lessonDuration: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  lessonXP: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.mono,
  },
  lessonComplete: {
    fontSize: 12,
    color: COLORS.success,
  },

  // Dialogue
  dialogueContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  dialogueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBtn: {
    width: 70,
  },
  headerBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  headerMeta: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  masteryIndicator: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },

  // Depth bar
  depthBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  depthSegment: {
    flex: 1,
    height: 3,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 2,
  },
  depthSegmentActive: {
    backgroundColor: COLORS.text,
  },

  // Messages
  messageList: {
    padding: 20,
    paddingBottom: 8,
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  aiIndicator: {
    width: 3,
    height: 20,
    backgroundColor: COLORS.textMuted,
    borderRadius: 2,
    marginRight: 12,
    marginTop: 4,
  },
  msgBubble: {
    maxWidth: '85%',
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  aiBubble: {},
  userBubble: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.text,
  },
  userText: {
    color: COLORS.textSecondary,
  },

  // Thinking
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  thinkingText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.text,
    borderRadius: 8,
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.surfaceLight,
  },
  sendBtnText: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: '500',
  },

  // Mastery
  masteryBar: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  masteryContent: {
    marginBottom: 16,
  },
  masteryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  masterySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  claimBtn: {
    backgroundColor: COLORS.text,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  claimBtnText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: '600',
  },
});
