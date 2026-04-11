import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TermsOfServiceScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const sections = [
    {
      title: "1. Acceptance of Terms",
      body: `By accessing and using Daily Manna AI, you agree to be bound by these Terms of Service and all applicable laws and regulations.`,
    },
    {
      title: "2. Use License",
      body: `Permission is granted to use the AI search and devotional features for personal, non-commercial use. You may not:\n\n• Modify or copy the materials\n• Use for any commercial purpose\n• Attempt to reverse engineer any software contained in the app\n• Use the service for any illegal or harmful activities`,
    },
    {
      title: "3. Disclaimer",
      body: `The materials on Daily Manna AI are provided on an 'as is' basis. While we strive for accuracy, the AI-generated responses are for educational and inspirational purposes only and should be verified against official scripture.`,
    },
    {
      title: "4. Limitations",
      body: `In no event shall Daily Manna AI or its suppliers be liable for any damages arising out of the use or inability to use the materials on the platform.`,
    },
    {
        title: "5. Governing Law",
        body: `These terms and conditions are governed by and construed in accordance with the laws applicable to our operations.`,
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'Terms of Service', headerTitle: 'Terms of Service' }} />
      <View style={styles.content}>
        <Text style={[styles.lastUpdated, { color: '#888' }]}>Last Updated: March 8, 2026</Text>
        {sections.map((sec, i) => (
          <View key={i} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{sec.title}</Text>
            <Text style={[styles.body, { color: colorScheme === 'dark' ? '#ccc' : '#444' }]}>{sec.body}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  lastUpdated: {
    fontSize: 14,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
});
