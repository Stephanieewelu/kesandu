require('dotenv').config({ path: './.env' });

export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
    },
  };
};
