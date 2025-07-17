import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, Stack } from 'expo-router';
import Purchases from 'react-native-purchases';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Button from '@/components/ui/Button';


export default function SubscriptionScreen() {
  return (
    <View>
      <Text>Subscription</Text>
    </View>
  );
}
