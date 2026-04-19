import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

export default function ExplorerScreen() {
  const categories = [
    { name: 'Peace', icon: 'leaf.fill', color: '#10b981' },
    { name: 'Strength', icon: 'bolt.fill', color: '#f59e0b' },
    { name: 'Wisdom', icon: 'brain.head.profile', color: '#6366f1' },
    { name: 'Love', icon: 'heart.fill', color: '#ef4444' },
    { name: 'Hope', icon: 'sun.max.fill', color: '#facc15' },
    { name: 'Faith', icon: 'star.fill', color: '#a855f7' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 pt-6 pb-2">
        <Text className="text-slate-900 text-3xl font-bold mb-4">Explore</Text>
        
        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-slate-100 shadow-sm mb-6">
          <SymbolView name="magnifyingglass" size={18} tintColor="#94a3b8" />
          <TextInput 
            placeholder="Search verses, topics, or prayers..." 
            className="ml-3 flex-1 text-slate-900"
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <Text className="text-slate-900 text-xl font-bold mb-4">Categories</Text>
        
        <View className="flex-row flex-wrap justify-between">
          {categories.map((cat, i) => (
            <TouchableOpacity 
              key={i} 
              style={{ width: '48%' }}
              className="bg-white p-5 rounded-2xl mb-4 border border-slate-100 shadow-sm items-center"
            >
              <View style={{ backgroundColor: cat.color + '15' }} className="p-4 rounded-full mb-3">
                <SymbolView name={cat.icon} size={24} tintColor={cat.color} />
              </View>
              <Text className="text-slate-700 font-bold">{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-slate-900 text-xl font-bold mt-4 mb-4">Recent Manna</Text>
        
        {[1, 2, 3].map((item) => (
          <TouchableOpacity key={item} className="bg-white p-4 rounded-2xl mb-4 flex-row items-center border border-slate-100 shadow-sm">
            <View className="w-12 h-12 bg-indigo-50 rounded-xl items-center justify-center mr-4">
              <SymbolView name="calendar" size={20} tintColor="#4f46e5" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 font-bold">April {18 - item}, 2026</Text>
              <Text className="text-slate-500 text-xs" numberOfLines={1}>Psalm {23 + item}:1 - The Lord is my shepherd...</Text>
            </View>
            <SymbolView name="chevron.right" size={16} tintColor="#cbd5e1" />
          </TouchableOpacity>
        ))}
        
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
