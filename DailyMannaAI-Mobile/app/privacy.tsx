import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function PrivacyPolicyScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const sections = [
    {
      title: "1. Information We Collect",
      body: `We collect information you provide directly to us, such as when you use our search features, contact us, or interact with our AI assistant. This may include:\n\n• Search queries you enter into our platform\n• Email address if you contact us\n• Usage data such as pages visited and features used\n• Device and browser information (anonymized)\n• Cookies and similar tracking technologies\n\nWe do NOT collect sensitive personal information such as financial data, passwords, or government IDs.`,
    },
    {
      title: "2. How We Use Your Information",
      body: `We use the information we collect to:\n\n• Provide, maintain, and improve our services\n• Power the AI search and devotional responses\n• Analyze usage patterns to improve user experience\n• Respond to your comments, questions, and requests\n• Send periodic updates about new features (only if you opt in)\n• Comply with legal obligations`,
    },
    {
      title: "3. Third-party Vendors",
      body: `DailyMannaAI uses third-party vendors for AI processing and hosting. We do not sell, trade, or rent your personal information to third parties. We may share anonymized, aggregated data with analytics providers.`,
    },
    {
      title: "4. Data Retention & Deletion",
      body: `We retain personal data only as long as necessary to provide our services. You have the right to request deletion of your data at any time. To request data deletion, please contact us at support@dailymannaai.com.`,
    },
    {
        title: "5. Contact Us",
        body: `If you have any questions about this Privacy Policy, please contact us:\n\nEmail: support@dailymannaai.com\nWebsite: https://www.dailymannaai.com`,
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'Privacy Policy', headerTitle: 'Privacy Policy' }} />
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
