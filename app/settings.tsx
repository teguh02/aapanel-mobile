import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useColorScheme,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Save, XCircle } from 'lucide-react-native';
import Colors from '@/constants/Colors';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [panelUrl, setPanelUrl] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [currentIp, setCurrentIp] = useState<string>('Fetching IP...'); // Placeholder for IP

  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const dynamicStyles = getDynamicStyles(themeColors);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedPanelUrl = await AsyncStorage.getItem('panel_url');
        const storedApiKey = await AsyncStorage.getItem('api_key');
        if (storedPanelUrl) setPanelUrl(storedPanelUrl);
        if (storedApiKey) setApiKey(storedApiKey);

        try {
          const response = await fetch('https://ipinfo.io/ip');
          if (response.ok) {
            const ip = await response.text();
            setCurrentIp(ip.trim());
          } else {
            setCurrentIp('Failed to fetch IP');
          }
        } catch (ipError) {
          console.error('Error fetching IP:', ipError);
          setCurrentIp('Failed to fetch IP');
        } 

      } catch (error) {
        console.error('Error loading settings:', error);
        Alert.alert('Error', 'Failed to load settings.');
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!panelUrl || !apiKey) {
      Alert.alert('Error', 'Panel URL and API Key cannot be empty.');
      return;
    }

    try {
      await AsyncStorage.setItem('panel_url', panelUrl);
      await AsyncStorage.setItem('api_key', apiKey);
      Alert.alert('Success', 'Settings saved successfully!');
      router.back(); // Go back to the previous screen (StatsScreen)
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings.');
    }
  };

  return (
    <SafeAreaView style={[dynamicStyles.container, { paddingTop: insets.top }]}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>Settings</Text>
        <TouchableOpacity onPress={() => router.back()} style={dynamicStyles.closeButton}>
          <XCircle size={24} color={themeColors.text} />
        </TouchableOpacity>
      </View>

      <View style={dynamicStyles.formContainer}>
        <Text style={dynamicStyles.label}>Panel URL:</Text>
        <TextInput
          style={dynamicStyles.input}
          value={panelUrl}
          onChangeText={setPanelUrl}
          placeholder="e.g., http://your-panel-ip:8888"
          placeholderTextColor={themeColors.tabIconDefault}
          autoCapitalize="none"
        />

        <Text style={dynamicStyles.label}>API Key:</Text>
        <TextInput
          style={dynamicStyles.input}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="Your aapanel API key"
          placeholderTextColor={themeColors.tabIconDefault}
          secureTextEntry
        />

        <Text style={dynamicStyles.label}>Current Device IP:</Text>
        <Text style={dynamicStyles.ipText}>{currentIp}</Text>

        <TouchableOpacity style={dynamicStyles.saveButton} onPress={handleSave}>
          <Save size={20} color="#FFF" />
          <Text style={dynamicStyles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getDynamicStyles = (themeColors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.tabBarBorder,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: themeColors.text,
  },
  closeButton: {
    padding: 5,
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    color: themeColors.text,
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: themeColors.tabBarBackground,
    color: themeColors.text,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: themeColors.tabBarBorder,
  },
  ipText: {
    fontSize: 16,
    color: themeColors.text,
    padding: 12,
    borderRadius: 8,
    backgroundColor: themeColors.tabBarBackground,
    borderWidth: 1,
    borderColor: themeColors.tabBarBorder,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: Colors.light.tint,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    gap: 10,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
