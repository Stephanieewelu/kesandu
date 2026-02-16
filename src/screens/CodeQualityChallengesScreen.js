import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Dimensions, TextInput
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

const CODE_CHALLENGES = [
  {
    id: 1,
    title: 'Debug Memory Leak in Python Service',
    category: 'Performance',
    difficulty: 'Hard',
    points: 500,
    timeLimit: '30 min',
    description: 'A Python microservice is consuming increasing memory over time. The service processes batches of user data and crashes after 6 hours.',
    buggyCode: `import requests
from typing import List

class UserDataProcessor:
    def __init__(self):
        self.users = []
        self.cache = {}

    def fetch_users(self, batch_size=1000):
        response = requests.get(f'/api/users?limit={batch_size}')
        users = response.json()
        self.users.extend(users)  # BUG: Never clears old users
        return users

    def process_batch(self):
        users = self.fetch_users()
        for user in users:
            self.cache[user['id']] = user  # BUG: Cache grows indefinitely
            self._enrich_user(user)

    def _enrich_user(self, user):
        # Process user data
        pass`,
    hints: [
      'Check data structures that accumulate over time',
      'Look for collections that never get cleared',
      'Consider cache eviction strategies'
    ],
    solution: {
      fixes: [
        'Clear self.users list after processing each batch',
        'Implement LRU cache with max size',
        'Use weakref for cache if appropriate',
        'Add explicit cleanup in process_batch'
      ],
      fixedCode: `import requests
from typing import List
from functools import lru_cache

class UserDataProcessor:
    def __init__(self, max_cache_size=1000):
        self.cache = {}
        self.max_cache_size = max_cache_size

    def fetch_users(self, batch_size=1000):
        response = requests.get(f'/api/users?limit={batch_size}')
        return response.json()

    def process_batch(self):
        users = self.fetch_users()  # No longer storing
        for user in users:
            self._add_to_cache(user)
            self._enrich_user(user)

    def _add_to_cache(self, user):
        if len(self.cache) >= self.max_cache_size:
            # Remove oldest entry
            oldest_key = next(iter(self.cache))
            del self.cache[oldest_key]
        self.cache[user['id']] = user

    def _enrich_user(self, user):
        # Process user data
        pass`
    },
    learningPoints: [
      'Always clear temporary data structures',
      'Implement bounded caches with eviction policies',
      'Use profiling tools to identify memory leaks',
      'Consider using weakref for caches'
    ]
  },
  {
    id: 2,
    title: 'Optimize Slow SQL Query (1min → 100ms)',
    category: 'Database',
    difficulty: 'Medium',
    points: 300,
    timeLimit: '20 min',
    description: 'An analytics query is taking 60 seconds. Optimize it to under 100ms without changing the result.',
    buggyCode: `-- Get top customers by order value in last 30 days
SELECT
    u.id,
    u.name,
    u.email,
    COUNT(*) as order_count,
    SUM(o.total) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.name, u.email
ORDER BY total_spent DESC
LIMIT 100;

-- PROBLEMS:
-- 1. No index on orders.created_at
-- 2. LEFT JOIN fetches all users then filters
-- 3. No index on orders.user_id
-- 4. Sorting large result set`,
    hints: [
      'Check if indexes exist on filtered/joined columns',
      'Consider changing JOIN type',
      'Look at the execution plan',
      'Think about materialized views'
    ],
    solution: {
      fixes: [
        'Add index on orders(created_at, user_id, total)',
        'Change LEFT JOIN to INNER JOIN (only users with orders)',
        'Add composite index for covering query',
        'Consider materialized view for frequently run query'
      ],
      fixedCode: `-- First, create indexes
CREATE INDEX idx_orders_recent
ON orders(created_at, user_id, total)
WHERE created_at >= NOW() - INTERVAL '30 days';

CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Optimized query
SELECT
    u.id,
    u.name,
    u.email,
    COUNT(*) as order_count,
    SUM(o.total) as total_spent
FROM users u
INNER JOIN orders o ON u.id = o.user_id  -- Changed to INNER
WHERE o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.name, u.email
ORDER BY total_spent DESC
LIMIT 100;

-- Alternative: Materialized view for real-time dashboards
CREATE MATERIALIZED VIEW top_customers_30d AS
SELECT
    u.id,
    u.name,
    u.email,
    COUNT(*) as order_count,
    SUM(o.total) as total_spent
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.name, u.email
ORDER BY total_spent DESC;

-- Refresh hourly
REFRESH MATERIALIZED VIEW CONCURRENTLY top_customers_30d;`
    },
    learningPoints: [
      'Always analyze query execution plans',
      'Index filtered and joined columns',
      'Use appropriate JOIN types',
      'Consider materialized views for expensive queries'
    ]
  },
  {
    id: 3,
    title: 'Fix Race Condition in Async Code',
    category: 'Concurrency',
    difficulty: 'Hard',
    points: 450,
    timeLimit: '25 min',
    description: 'An async inventory system occasionally allows overselling. Fix the race condition.',
    buggyCode: `import asyncio
from typing import Dict

class InventoryManager:
    def __init__(self):
        self.inventory: Dict[str, int] = {}

    async def check_stock(self, item_id: str) -> int:
        await asyncio.sleep(0.1)  # Simulate DB read
        return self.inventory.get(item_id, 0)

    async def reserve_item(self, item_id: str, quantity: int) -> bool:
        # BUG: Race condition between check and update
        stock = await self.check_stock(item_id)

        if stock >= quantity:
            await asyncio.sleep(0.1)  # Simulate processing
            self.inventory[item_id] = stock - quantity
            return True
        return False

# Race condition scenario:
# 1. User A checks stock (10 items)
# 2. User B checks stock (10 items)
# 3. User A reserves 10 items (stock = 0)
# 4. User B reserves 10 items (stock = -10) ❌`,
    hints: [
      'Multiple coroutines can interleave',
      'Need atomic check-and-update',
      'Consider using locks',
      'Database transactions can help'
    ],
    solution: {
      fixes: [
        'Use asyncio.Lock for atomic operations',
        'Implement optimistic locking with version numbers',
        'Use database transactions with row-level locks',
        'Consider Redis with atomic operations'
      ],
      fixedCode: `import asyncio
from typing import Dict

class InventoryManager:
    def __init__(self):
        self.inventory: Dict[str, int] = {}
        self.locks: Dict[str, asyncio.Lock] = {}

    def _get_lock(self, item_id: str) -> asyncio.Lock:
        if item_id not in self.locks:
            self.locks[item_id] = asyncio.Lock()
        return self.locks[item_id]

    async def check_stock(self, item_id: str) -> int:
        await asyncio.sleep(0.1)
        return self.inventory.get(item_id, 0)

    async def reserve_item(self, item_id: str, quantity: int) -> bool:
        # Acquire lock for atomic check-and-update
        async with self._get_lock(item_id):
            stock = await self.check_stock(item_id)

            if stock >= quantity:
                await asyncio.sleep(0.1)
                self.inventory[item_id] = stock - quantity
                return True
            return False

# Alternative: Using optimistic locking
class InventoryManagerOptimistic:
    def __init__(self):
        self.inventory: Dict[str, tuple[int, int]] = {}  # (stock, version)

    async def reserve_item(self, item_id: str, quantity: int, max_retries=3) -> bool:
        for _ in range(max_retries):
            stock, version = self.inventory.get(item_id, (0, 0))

            if stock >= quantity:
                # Try to update with version check
                if self._compare_and_swap(item_id, stock - quantity, version):
                    return True
                # Version mismatch, retry
                await asyncio.sleep(0.01)
            else:
                return False
        return False

    def _compare_and_swap(self, item_id: str, new_stock: int, expected_version: int) -> bool:
        current_stock, current_version = self.inventory.get(item_id, (0, 0))
        if current_version == expected_version:
            self.inventory[item_id] = (new_stock, current_version + 1)
            return True
        return False`
    },
    learningPoints: [
      'Understand race conditions in async code',
      'Use locks for critical sections',
      'Consider optimistic vs pessimistic locking',
      'Test concurrent scenarios'
    ]
  },
  {
    id: 4,
    title: 'Refactor Legacy Code to be Testable',
    category: 'Clean Code',
    difficulty: 'Medium',
    points: 250,
    timeLimit: '20 min',
    description: 'Refactor this tightly coupled code to make it unit testable.',
    buggyCode: `import requests
import os

class OrderProcessor:
    def process_order(self, order_id: str):
        # Tight coupling to external services
        api_key = os.environ['API_KEY']

        # Can't mock this HTTP call
        response = requests.get(
            f'https://api.example.com/orders/{order_id}',
            headers={'Authorization': f'Bearer {api_key}'}
        )
        order = response.json()

        # Business logic mixed with I/O
        if order['total'] > 1000:
            # Can't test without sending real email
            self._send_fraud_alert(order)

        # Direct database write
        import sqlite3
        conn = sqlite3.connect('orders.db')
        conn.execute('INSERT INTO processed_orders VALUES (?)', (order_id,))
        conn.commit()

    def _send_fraud_alert(self, order):
        import smtplib
        # Sends real email - can't test!
        pass`,
    hints: [
      'Separate I/O from business logic',
      'Use dependency injection',
      'Create abstractions for external services',
      'Make side effects explicit'
    ],
    solution: {
      fixes: [
        'Extract external dependencies into injected interfaces',
        'Separate business logic from I/O',
        'Use repository pattern for data access',
        'Create testable pure functions'
      ],
      fixedCode: `from abc import ABC, abstractmethod
from typing import Protocol

# Define protocols for dependencies
class OrderRepository(Protocol):
    def get_order(self, order_id: str) -> dict: ...
    def mark_processed(self, order_id: str) -> None: ...

class NotificationService(Protocol):
    def send_fraud_alert(self, order: dict) -> None: ...

# Pure business logic - easily testable
class OrderProcessor:
    def __init__(
        self,
        order_repo: OrderRepository,
        notification_service: NotificationService
    ):
        self.order_repo = order_repo
        self.notification_service = notification_service

    def process_order(self, order_id: str):
        # Get order (mockable)
        order = self.order_repo.get_order(order_id)

        # Pure business logic
        if self._should_flag_fraud(order):
            self.notification_service.send_fraud_alert(order)

        # Save (mockable)
        self.order_repo.mark_processed(order_id)

    def _should_flag_fraud(self, order: dict) -> bool:
        # Pure function - trivial to test
        return order['total'] > 1000

# Concrete implementations
class HTTPOrderRepository:
    def __init__(self, api_key: str, base_url: str):
        self.api_key = api_key
        self.base_url = base_url

    def get_order(self, order_id: str) -> dict:
        import requests
        response = requests.get(
            f'{self.base_url}/orders/{order_id}',
            headers={'Authorization': f'Bearer {self.api_key}'}
        )
        return response.json()

    def mark_processed(self, order_id: str) -> None:
        import sqlite3
        conn = sqlite3.connect('orders.db')
        conn.execute('INSERT INTO processed_orders VALUES (?)', (order_id,))
        conn.commit()

class EmailNotificationService:
    def send_fraud_alert(self, order: dict) -> None:
        import smtplib
        # Send email

# Easy to test with mocks
class MockOrderRepository:
    def __init__(self, orders: dict):
        self.orders = orders
        self.processed = []

    def get_order(self, order_id: str) -> dict:
        return self.orders[order_id]

    def mark_processed(self, order_id: str) -> None:
        self.processed.append(order_id)

# Test example
def test_fraud_detection():
    mock_repo = MockOrderRepository({'123': {'total': 2000}})
    mock_notif = Mock()

    processor = OrderProcessor(mock_repo, mock_notif)
    processor.process_order('123')

    assert mock_notif.send_fraud_alert.called
    assert '123' in mock_repo.processed`
    },
    learningPoints: [
      'Dependency injection enables testing',
      'Separate business logic from I/O',
      'Use protocols/interfaces for flexibility',
      'Pure functions are easier to test'
    ]
  },
  {
    id: 5,
    title: 'Add Error Handling to AI Pipeline',
    category: 'Reliability',
    difficulty: 'Medium',
    points: 300,
    timeLimit: '20 min',
    description: 'Add proper error handling, retries, and fallbacks to this fragile AI pipeline.',
    buggyCode: `import anthropic

class AIAssistant:
    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)

    def get_response(self, prompt: str) -> str:
        # No error handling!
        message = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text

    def process_batch(self, prompts: list[str]) -> list[str]:
        # Fails entire batch if one fails
        return [self.get_response(p) for p in prompts]`,
    hints: [
      'Handle API rate limits',
      'Add retry logic with backoff',
      'Implement circuit breaker pattern',
      'Add timeout handling'
    ],
    solution: {
      fixes: [
        'Add exponential backoff for retries',
        'Handle rate limits gracefully',
        'Implement timeout handling',
        'Add fallback responses',
        'Use circuit breaker for repeated failures'
      ],
      fixedCode: `import anthropic
from typing import Optional
import time
import logging

logger = logging.getLogger(__name__)

class AIAssistant:
    def __init__(self, api_key: str, max_retries: int = 3):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.max_retries = max_retries
        self.circuit_breaker_threshold = 5
        self.consecutive_failures = 0

    def get_response(
        self,
        prompt: str,
        timeout: int = 30,
        fallback: Optional[str] = None
    ) -> str:
        # Check circuit breaker
        if self.consecutive_failures >= self.circuit_breaker_threshold:
            logger.error("Circuit breaker open, using fallback")
            return fallback or "Service temporarily unavailable"

        for attempt in range(self.max_retries):
            try:
                message = self.client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=1024,
                    messages=[{"role": "user", "content": prompt}],
                    timeout=timeout
                )

                # Success - reset circuit breaker
                self.consecutive_failures = 0
                return message.content[0].text

            except anthropic.RateLimitError as e:
                wait_time = 2 ** attempt  # Exponential backoff
                logger.warning(f"Rate limited, waiting {wait_time}s")
                time.sleep(wait_time)

            except anthropic.APITimeoutError:
                logger.error(f"Timeout on attempt {attempt + 1}")
                if attempt == self.max_retries - 1:
                    self.consecutive_failures += 1
                    return fallback or "Request timed out"

            except anthropic.APIError as e:
                logger.error(f"API error: {e}")
                if attempt == self.max_retries - 1:
                    self.consecutive_failures += 1
                    return fallback or "An error occurred"
                time.sleep(2 ** attempt)

        return fallback or "Failed to get response"

    def process_batch(
        self,
        prompts: list[str],
        fail_fast: bool = False
    ) -> list[dict]:
        results = []

        for i, prompt in enumerate(prompts):
            try:
                response = self.get_response(
                    prompt,
                    fallback=f"Failed to process item {i}"
                )
                results.append({
                    "success": True,
                    "response": response
                })
            except Exception as e:
                logger.error(f"Unexpected error processing prompt {i}: {e}")
                if fail_fast:
                    raise
                results.append({
                    "success": False,
                    "error": str(e)
                })

        return results`
    },
    learningPoints: [
      'Always handle external API failures',
      'Implement retry logic with exponential backoff',
      'Use circuit breakers to prevent cascading failures',
      'Provide meaningful fallback responses'
    ]
  }
];

export default function CodeQualityChallengesScreen() {
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState([]);

  const handleCompleteChallenge = (challengeId, points) => {
    if (!completedChallenges.includes(challengeId)) {
      setCompletedChallenges([...completedChallenges, challengeId]);
      setUserScore(userScore + points);
    }
  };

  if (selectedChallenge) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setSelectedChallenge(null);
              setShowSolution(false);
            }}
          >
            <Text style={styles.backButtonText}>← Back to Challenges</Text>
          </TouchableOpacity>

          <View style={styles.challengeHeader}>
            <Text style={styles.challengeTitle}>{selectedChallenge.title}</Text>
            <View style={styles.challengeMeta}>
              <View style={styles.metaBadge}>
                <Text style={styles.metaText}>{selectedChallenge.category}</Text>
              </View>
              <View style={[styles.metaBadge, styles.pointsBadge]}>
                <Text style={styles.pointsText}>{selectedChallenge.points} pts</Text>
              </View>
              <View style={styles.metaBadge}>
                <Text style={styles.metaText}>⏱️ {selectedChallenge.timeLimit}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.challengeDescription}>{selectedChallenge.description}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buggy Code</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>{selectedChallenge.buggyCode}</Text>
              </View>
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hints</Text>
            {selectedChallenge.hints.map((hint, index) => (
              <View key={index} style={styles.hintItem}>
                <Text style={styles.hintBullet}>💡</Text>
                <Text style={styles.hintText}>{hint}</Text>
              </View>
            ))}
          </View>

          {!showSolution ? (
            <TouchableOpacity
              style={styles.showSolutionButton}
              onPress={() => setShowSolution(true)}
            >
              <Text style={styles.showSolutionButtonText}>Show Solution</Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Solution - Key Fixes</Text>
                {selectedChallenge.solution.fixes.map((fix, index) => (
                  <View key={index} style={styles.fixItem}>
                    <Text style={styles.fixBullet}>✓</Text>
                    <Text style={styles.fixText}>{fix}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Fixed Code</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.codeBlock}>
                    <Text style={styles.codeText}>{selectedChallenge.solution.fixedCode}</Text>
                  </View>
                </ScrollView>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Learning Points</Text>
                {selectedChallenge.learningPoints.map((point, index) => (
                  <View key={index} style={styles.learningItem}>
                    <Text style={styles.learningBullet}>📚</Text>
                    <Text style={styles.learningText}>{point}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => handleCompleteChallenge(selectedChallenge.id, selectedChallenge.points)}
              >
                <Text style={styles.completeButtonText}>
                  {completedChallenges.includes(selectedChallenge.id) ? 'Completed ✓' : 'Mark as Complete'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Code Quality Challenges</Text>
          <Text style={styles.subtitle}>Fix production bugs, optimize code, level up</Text>
        </View>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Your Score</Text>
          <Text style={styles.scoreValue}>{userScore}</Text>
          <Text style={styles.scoreSubtext}>
            {completedChallenges.length}/{CODE_CHALLENGES.length} challenges completed
          </Text>
        </View>

        <ScrollView
          style={styles.challengeList}
          showsVerticalScrollIndicator={false}
        >
          {CODE_CHALLENGES.map(challenge => {
            const isCompleted = completedChallenges.includes(challenge.id);
            return (
              <TouchableOpacity
                key={challenge.id}
                style={[styles.challengeCard, isCompleted && styles.challengeCardCompleted]}
                onPress={() => setSelectedChallenge(challenge)}
              >
                <View style={styles.challengeCardHeader}>
                  <Text style={styles.cardTitle}>{challenge.title}</Text>
                  {isCompleted && <Text style={styles.completedBadge}>✓</Text>}
                </View>

                <View style={styles.cardMeta}>
                  <Text style={styles.cardCategory}>{challenge.category}</Text>
                  <Text style={styles.cardDifficulty}>{challenge.difficulty}</Text>
                  <Text style={styles.cardPoints}>{challenge.points} pts</Text>
                </View>

                <Text style={styles.cardDescription} numberOfLines={2}>
                  {challenge.description}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardTime}>⏱️ {challenge.timeLimit}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
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
  scoreCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  scoreLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.gold,
    marginBottom: 8,
  },
  scoreSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  challengeList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  challengeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  challengeCardCompleted: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + '10',
  },
  challengeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  completedBadge: {
    fontSize: 20,
    color: COLORS.success,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  cardCategory: {
    fontSize: 12,
    color: COLORS.info,
    backgroundColor: COLORS.info + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardDifficulty: {
    fontSize: 12,
    color: COLORS.warning,
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardPoints: {
    fontSize: 12,
    color: COLORS.gold,
    backgroundColor: COLORS.gold + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTime: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  backButton: {
    padding: 20,
    paddingBottom: 10,
  },
  backButtonText: {
    color: COLORS.info,
    fontSize: 16,
  },
  challengeHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  challengeMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  pointsBadge: {
    backgroundColor: COLORS.gold + '20',
  },
  pointsText: {
    fontSize: 13,
    color: COLORS.gold,
    fontWeight: '600',
  },
  challengeDescription: {
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
  hintItem: {
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: COLORS.surfaceLight,
    padding: 12,
    borderRadius: 8,
  },
  hintBullet: {
    fontSize: 16,
    marginRight: 10,
  },
  hintText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  showSolutionButton: {
    backgroundColor: COLORS.warning,
    paddingVertical: 14,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  showSolutionButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  fixItem: {
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: COLORS.success + '10',
    padding: 12,
    borderRadius: 8,
  },
  fixBullet: {
    fontSize: 16,
    color: COLORS.success,
    marginRight: 10,
    fontWeight: 'bold',
  },
  fixText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
    lineHeight: 20,
  },
  learningItem: {
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: COLORS.info + '10',
    padding: 12,
    borderRadius: 8,
  },
  learningBullet: {
    fontSize: 16,
    marginRight: 10,
  },
  learningText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  completeButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 20,
    alignItems: 'center',
  },
  completeButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
