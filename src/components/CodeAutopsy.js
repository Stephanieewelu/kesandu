import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const CodeAutopsy = ({ codeSnippet, onCodeChange, onRunCode, output }) => {
  const [localCode, setLocalCode] = useState(codeSnippet);

  const handleCodeChange = (text) => {
    setLocalCode(text);
    onCodeChange(text);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Code Autopsy 💻</Text>
      <ScrollView style={styles.codeEditor}>
        <TextInput
          style={styles.codeInput}
          multiline
          value={localCode}
          onChangeText={handleCodeChange}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Write your code here..."
          placeholderTextColor="#71717A"
        />
      </ScrollView>
      <TouchableOpacity style={styles.runButton} onPress={onRunCode}>
        <Text style={styles.runButtonText}>Run Code</Text>
      </TouchableOpacity>
      <ScrollView style={styles.outputConsole}>
        <Text style={styles.outputText}>{output}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#18181B',
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  title: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  codeEditor: {
    backgroundColor: '#27272A',
    borderRadius: 6,
    minHeight: 150,
    maxHeight: 300,
    marginBottom: 12,
  },
  codeInput: {
    color: '#FAFAFA',
    fontFamily: 'Menlo', // Monospace font for code
    fontSize: 14,
    padding: 10,
  },
  runButton: {
    backgroundColor: '#EAB308', // Gold color for action
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  runButtonText: {
    color: '#09090B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  outputConsole: {
    backgroundColor: '#09090B',
    borderRadius: 6,
    minHeight: 100,
    maxHeight: 200,
    padding: 10,
  },
  outputText: {
    color: '#22C55E', // Success green for output
    fontFamily: 'Menlo',
    fontSize: 12,
  },
});

export default CodeAutopsy;
