import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import THEME from '../constants/theme';
import { FORBIDDEN_PENALTY } from '../../utils';

const ConceptBreakdown = React.memo(({ breakdown }) => {
  if (!breakdown) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CONCEPT COVERAGE</Text>
      {breakdown.concepts.map((c, i) => (
        <View key={i} style={styles.row}>
          <Text style={{ fontSize: 14 }}>{c.matched ? '\u2705' : '\u274C'}</Text>
          <Text style={styles.text}>
            Area {c.groupIndex + 1}
            {c.matchedTerm ? ` \u2014 "${c.matchedTerm}"` : ' \u2014 not detected'}
          </Text>
          <View style={[styles.weightBadge, { opacity: c.weight / 3 }]}>
            <Text style={styles.weightText}>{'\u00D7'}{c.weight}</Text>
          </View>
        </View>
      ))}

      <View style={styles.row}>
        <Text style={{ fontSize: 14 }}>{breakdown.wordCount.passed ? '\u2705' : '\u26A0\uFE0F'}</Text>
        <Text style={styles.text}>
          Words: {breakdown.wordCount.actual}/{breakdown.wordCount.required}
        </Text>
      </View>

      {breakdown.depthBonus > 0 && (
        <View style={styles.row}>
          <Text style={{ fontSize: 14 }}>{'\uD83E\uDDE0'}</Text>
          <Text style={styles.text}>
            Depth bonus: +{breakdown.depthBonus} pts
          </Text>
        </View>
      )}

      {breakdown.whyDepthBonus > 0 && (
        <View style={styles.row}>
          <Text style={{ fontSize: 14 }}>{'\uD83D\uDD0D'}</Text>
          <Text style={styles.text}>
            Why-depth bonus: +{Math.min(10, breakdown.whyDepthBonus)} pts
          </Text>
        </View>
      )}

      {breakdown.analogyBonus > 0 && (
        <View style={styles.row}>
          <Text style={{ fontSize: 14 }}>{'\uD83C\uDF1F'}</Text>
          <Text style={styles.text}>
            Analogy bonus: +{breakdown.analogyBonus} pts
          </Text>
        </View>
      )}

      {breakdown.contrastBonus > 0 && (
        <View style={styles.row}>
          <Text style={{ fontSize: 14 }}>{'\uD83E\uDD14'}</Text>
          <Text style={styles.text}>
            Critical thinking bonus: +{breakdown.contrastBonus} pts
          </Text>
        </View>
      )}

      {breakdown.readingLevel && (
        <View style={styles.row}>
          <Text style={{ fontSize: 14 }}>{breakdown.readingLevel.passed ? '\u2705' : '\u26A0\uFE0F'}</Text>
          <Text style={styles.text}>
            Reading level: grade {breakdown.readingLevel.actual} (max {breakdown.readingLevel.max})
          </Text>
        </View>
      )}

      {breakdown.forbidden.length > 0 && (
        <>
          <Text style={[styles.title, { marginTop: 10, color: THEME.danger }]}>
            JARGON VIOLATIONS
          </Text>
          {breakdown.forbidden.map((v, i) => (
            <View key={i} style={styles.row}>
              <Text style={{ fontSize: 14 }}>{'\uD83D\uDEAB'}</Text>
              <Text style={[styles.text, { color: THEME.danger }]}>
                "{v.term}" (-{FORBIDDEN_PENALTY} pts)
              </Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    maxWidth: '88%',
    gap: 6,
    marginTop: 4,
  },
  title: {
    color: '#666',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: '#AAA',
    fontSize: 12,
    flex: 1,
  },
  weightBadge: {
    backgroundColor: '#00D9FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  weightText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default ConceptBreakdown;
