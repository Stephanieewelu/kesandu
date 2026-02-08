import React from 'react';
import { View, Platform } from 'react-native';

const WebView =
  Platform.OS === 'web'
    ? require('react-native-web-webview').default
    : require('react-native-webview').default;

export default function StreamlitScreen({ url }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <WebView
        source={{ uri: url }}
        style={{ flex: 1 }}
      />
    </View>
  );
}
