import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Link } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const SettingItem = ({ icon, title, href, subtitle }: { icon: string, title: string, href: any, subtitle?: string }) => (
    <Link href={href} asChild>
      <Pressable style={[styles.item, { borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
        <View style={styles.iconContainer}>
          <SymbolView 
            name={{ 
              ios: icon, 
              android: icon === 'doc.text' ? 'description' : icon === 'shield' ? 'security' : 'settings',
              web: 'settings' 
            }} 
            size={22} 
            tintColor={theme.tint} 
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <SymbolView 
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} 
          size={18} 
          tintColor="#ccc" 
        />
      </Pressable>
    </Link>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings & Legal</Text>
        <Text style={styles.headerSubtitle}>Legal requirements for App Stores</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>LEGAL & PRIVACY</Text>
        <SettingItem 
          icon="shield" 
          title="Privacy Policy" 
          href="/privacy" 
          subtitle="How we protect your data"
        />
        <SettingItem 
          icon="doc.text" 
          title="Terms of Service" 
          href="/terms" 
          subtitle="Rules for using Daily Manna AI"
        />
        <SettingItem 
          icon="trash" 
          title="Data Deletion Request" 
          href="/contact" 
          subtitle="Request to remove your account data"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>SUPPORT</Text>
        <SettingItem 
          icon="envelope" 
          title="Contact Us" 
          href="/contact" 
          subtitle="Get help or give feedback"
        />
        <SettingItem 
          icon="info.circle" 
          title="About Daily Manna AI" 
          href="/modal" 
          subtitle="Learn more about our mission"
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>Version 1.0.0</Text>
        <Text style={styles.copyright}>© 2026 Daily Manna AI</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 40,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    marginLeft: 8,
    letterSpacing: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 36,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '500',
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginLeft: 12,
    marginTop: 2,
  },
  footer: {
    padding: 40,
    alignItems: 'center',
  },
  version: {
    fontSize: 14,
    color: '#ccc',
  },
  copyright: {
    fontSize: 12,
    color: '#ddd',
    marginTop: 4,
  },
});
