import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Server, Key, Wifi } from 'lucide-react-native';
import { AaPanelApi } from '@/services/AaPanelApi';

interface SetupScreenProps {
  onSetupComplete: () => void;
}

export default function SetupScreen({ onSetupComplete }: SetupScreenProps) {
  const [panelUrl, setPanelUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [publicIp, setPublicIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingIp, setLoadingIp] = useState(true);

  useEffect(() => {
    fetchPublicIp();
  }, []);

  const fetchPublicIp = async () => {
    try {
      const response = await axios.get('https://ipinfo.io/ip', { timeout: 10000 });
      setPublicIp(response.data.trim());
    } catch (error) {
      console.error('Failed to fetch public IP:', error);
      setPublicIp('Unable to fetch');
    } finally {
      setLoadingIp(false);
    }
  };

  const handleSave = async () => {
    if (!panelUrl.trim() || !apiKey.trim()) {
      Alert.alert('Error', 'Please fill in both Panel URL and API Key');
      return;
    }

    // Validate URL format
    try {
      new URL(panelUrl);
    } catch {
      Alert.alert('Error', 'Please enter a valid Panel URL (e.g., https://192.168.0.1:7800)');
      return;
    }

    setLoading(true);
    try {
      // Test the connection before saving
      Alert.alert(
        'Testing Connection',
        'Testing connection to your panel...',
        [{ text: 'OK' }]
      );
      
      const testApi = new AaPanelApi(panelUrl.trim(), apiKey.trim());
      await testApi.getSystemTotal();
      
      await AsyncStorage.setItem('panel_url', panelUrl.trim());
      await AsyncStorage.setItem('api_key', apiKey.trim());
      
      Alert.alert('Success', 'Configuration saved successfully!', [
        { text: 'OK', onPress: onSetupComplete }
      ]);
    } catch (error) {
      console.error('Setup error:', error);
      
      let errorMessage = 'Failed to connect to the panel. ';
      
      if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          errorMessage += '\n\nCORS Error: Your panel is blocking requests from this app. Please add your device IP to the panel\'s allowed origins or disable CORS restrictions.';
        } else if (error.message.includes('Network Error') || error.message.includes('NETWORK_ERROR')) {
          errorMessage += '\n\nNetwork Error: Cannot reach the panel. Please check:\n• Panel URL is correct\n• Panel is running\n• Network connection is stable';
        } else if (error.message.includes('timeout')) {
          errorMessage += '\n\nTimeout Error: Panel is taking too long to respond. Please check if the panel is running properly.';
        } else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
          errorMessage += '\n\nAuthentication Error: Invalid API key. Please check your API key in the panel settings.';
        } else {
          errorMessage += `\n\nError details: ${error.message}`;
        }
      }
      
      Alert.alert(
        'Connection Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Server size={64} color="#3B82F6" />
        <Text style={styles.title}>AaPanel Mobile</Text>
        <Text style={styles.subtitle}>Setup your panel connection</Text>
      </View>

      <View style={styles.ipContainer}>
        <Wifi size={20} color="#6B7280" />
        <Text style={styles.ipLabel}>Your Public IP:</Text>
        {loadingIp ? (
          <ActivityIndicator size="small" color="#3B82F6" />
        ) : (
          <Text style={styles.ipText}>{publicIp}</Text>
        )}
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Server size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Panel URL (e.g., https://192.168.0.1:7800)"
            value={panelUrl}
            onChangeText={setPanelUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={true}
            selectTextOnFocus={true}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputContainer}>
          <Key size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="API Key"
            value={apiKey}
            onChangeText={setApiKey}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            editable={true}
            selectTextOnFocus={true}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Configuration</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          This is an unofficial mobile interface for aaPanel.
          Make sure your panel is accessible from this device.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  ipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  ipLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    marginRight: 8,
  },
  ipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#1F2937',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  disclaimerText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
});