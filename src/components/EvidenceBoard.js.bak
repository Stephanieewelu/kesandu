import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const EvidenceBoard = ({ scenario, onSubmitHypothesis }) => {
  const [revealedClues, setRevealedClues] = useState([]);
  const [hypotheses, setHypotheses] = useState([]);
  const [selectedClueIds, setSelectedClueIds] = useState([]);

  const revealClue = (clueId) => {
    setRevealedClues(prev => [...prev, clueId]);
  };

  return (
    <View style={styles.evidenceBoard}>
      <Text style={styles.evidenceBoardTitle}>🔍 Evidence Board</Text>
      <View style={styles.clueGrid}>
        {scenario.clues.map(clue => (
          <TouchableOpacity
            key={clue.id}
            onPress={() => {
              if (!revealedClues.includes(clue.id)) revealClue(clue.id);
              else setSelectedClueIds(prev => prev.includes(clue.id) ? prev.filter(id => id !== clue.id) : [...prev, clue.id]);
            }}
            style={styles.clueCard}
          >
            {revealedClues.includes(clue.id) ? (
              <>
                <Text style={styles.clueLabel}>{clue.label}</Text>
                <Text style={styles.clueValue}>{clue.value}</Text>
              </>
            ) : (
              <Text style={styles.clueHidden}>? Tap to reveal</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  evidenceBoard: {
    backgroundColor: '#18181B',
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  evidenceBoardTitle: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  clueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  clueCard: {
    backgroundColor: '#27272A',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    width: '48%', // Two cards per row
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  clueLabel: {
    color: '#A1A1AA',
    fontSize: 12,
    marginBottom: 4,
  },
  clueValue: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  clueHidden: {
    color: '#71717A',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default EvidenceBoard;
