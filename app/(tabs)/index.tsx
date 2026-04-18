import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

export default function DailyMannaHome() {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View className="flex-row justify-between items-center py-6">
          <View>
            <Text className="text-slate-400 text-sm font-medium uppercase tracking-wider">{today}</Text>
            <Text className="text-slate-900 text-3xl font-bold">Daily Manna</Text>
          </View>
          <TouchableOpacity className="bg-white p-3 rounded-full shadow-sm border border-slate-100">
            <SymbolView name="bell" size={24} tintColor="#0f172a" />
          </TouchableOpacity>
        </View>

        {/* Verse of the Day Card */}
        <View className="bg-indigo-600 rounded-3xl p-6 shadow-xl shadow-indigo-200 mb-8 overflow-hidden">
          <View className="absolute -top-10 -right-10 bg-white/10 w-40 h-40 rounded-full" />
          <View className="flex-row items-center mb-4">
            <SymbolView name="quote.opening" size={20} tintColor="#e0e7ff" />
            <Text className="text-indigo-100 ml-2 font-semibold uppercase tracking-widest text-xs">Verse of the Day</Text>
          </View>
          
          <Text className="text-white text-xl font-serif italic mb-6 leading-8">
            "I am the bread of life. Whoever comes to me will never go hungry, and whoever believes in me will never be thirsty."
          </Text>
          
          <View className="flex-row justify-between items-end">
            <Text className="text-indigo-200 font-medium text-sm">John 6:35</Text>
            <TouchableOpacity className="bg-white/20 px-4 py-2 rounded-full">
              <Text className="text-white text-xs font-bold">Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Insight Section */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <Text className="text-slate-900 text-xl font-bold">AI Insight</Text>
            <View className="bg-amber-100 px-2 py-1 rounded ml-2">
              <Text className="text-amber-700 text-[10px] font-bold uppercase tracking-tighter">Powered by AI</Text>
            </View>
          </View>
          
          <View className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <Text className="text-slate-600 leading-6 text-sm">
              Today's manna reminds us that true fulfillment doesn't come from temporary achievements, but from a deeper connection to the source of life. Focus on nourishing your soul today as much as your physical goals.
            </Text>
            <View className="h-[1px] bg-slate-100 my-4" />
            <TouchableOpacity className="flex-row items-center justify-center">
              <Text className="text-indigo-600 font-bold text-sm mr-1">Deep Dive into this Verse</Text>
              <SymbolView name="chevron.right" size={14} tintColor="#4f46e5" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row justify-between mb-10">
          <QuickAction icon="book.fill" label="Scripture" color="#6366f1" />
          <QuickAction icon="hands.sparkles.fill" label="Prayer" color="#ec4899" />
          <QuickAction icon="bubble.left.and.bubble.right.fill" label="AI Chat" color="#14b8a6" />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({ icon, label, color }: { icon: string, label: string, color: string }) {
  return (
    <TouchableOpacity className="items-center">
      <View style={{ backgroundColor: color + '15' }} className="p-4 rounded-2xl mb-2 items-center justify-center">
        <SymbolView name={icon} size={28} tintColor={color} />
      </View>
      <Text className="text-slate-600 text-xs font-semibold">{label}</Text>
    </TouchableOpacity>
  );
}
