import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Info, Mail, User, TriangleAlert as AlertTriangle, Heart, Code, Settings, Github } from 'lucide-react-native';

export default function AboutScreen() {
  const handleEmailPress = () => {
    const email = 'teguhrijanandi02@gmail.com';
    const subject = 'AaPanel Mobile App';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Email client not available');
        }
      })
      .catch((err) => console.error('Error opening email:', err));
  };

  const handleEditConfiguration = () => {
    Alert.alert(
      'Edit Configuration',
      'Do you want to update your panel URL and API key? This will restart the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Edit', 
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('panel_url');
              await AsyncStorage.removeItem('api_key');
              Alert.alert(
                'Configuration Cleared',
                'Please restart the app to enter new configuration.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error clearing configuration:', error);
              Alert.alert('Error', 'Failed to clear configuration');
            }
          }
        },
      ]
    );
  };
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Info size={32} color="#3B82F6" />
          <Text style={styles.title}>About</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={handleEditConfiguration}>
          <Settings size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Code size={24} color="#3B82F6" />
          <Text style={styles.cardTitle}>AaPanel Mobile</Text>
        </View>
        <Text style={styles.cardDescription}>
          An unofficial mobile interface for aaPanel server management.
          Monitor your server statistics and manage websites on the go.
        </Text>
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </View>

      {/* Creator Info */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <User size={24} color="#10B981" />
          <Text style={styles.cardTitle}>Creator</Text>
        </View>
        <View style={styles.creatorInfo}>
          <Text style={styles.creatorName}>Teguh Rijanandi</Text>
          <TouchableOpacity style={styles.emailButton} onPress={handleEmailPress}>
            <Mail size={16} color="#3B82F6" />
            <Text style={styles.emailText}>teguhrijanandi02@gmail.com</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.githubButton} onPress={() => Linking.openURL('https://github.com/teguh02/aapanel-mobile')}>
            <Github size={16} color="#1F2937" />
            <Text style={styles.githubText}>teguh02/aapanel-mobile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimerCard}>
        <View style={styles.cardHeader}>
          <AlertTriangle size={24} color="#F59E0B" />
          <Text style={styles.cardTitle}>Disclaimer</Text>
        </View>
        <Text style={styles.disclaimerText}>
          This app is an unofficial mobile interface for aaPanel.
          It was independently developed as part of the author's personal hobby project,
          with the intent to provide a lightweight alternative for managing servers via smartphone.
        </Text>
        <Text style={styles.disclaimerText}>
          This application is not affiliated with or endorsed by the official aaPanel team.
        </Text>
      </View>

      {/* Features */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Heart size={24} color="#EF4444" />
          <Text style={styles.cardTitle}>Features</Text>
        </View>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>Real-time system monitoring</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>Website management (Start/Stop)</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>CPU and memory usage charts</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>Disk usage visualization</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>Network statistics</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>Secure API authentication</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>Configuration management</Text>
          </View>
        </View>
      </View>

      {/* Technical Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Technical Information</Text>
        <View style={styles.techInfo}>
          <View style={styles.techRow}>
            <Text style={styles.techLabel}>Framework:</Text>
            <Text style={styles.techValue}>React Native (Expo)</Text>
          </View>
          <View style={styles.techRow}>
            <Text style={styles.techLabel}>API:</Text>
            <Text style={styles.techValue}>aaPanel Official API</Text>
          </View>
          <View style={styles.techRow}>
            <Text style={styles.techLabel}>Authentication:</Text>
            <Text style={styles.techValue}>MD5 Token Signature</Text>
          </View>
          <View style={styles.techRow}>
            <Text style={styles.techLabel}>Charts:</Text>
            <Text style={styles.techValue}>React Native Chart Kit</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Made with ❤️ for the server administration community
        </Text>
        <Text style={styles.footerSubtext}>
          Open source • Hobby project • Not for commercial use
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 60,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disclaimerCard: {
    backgroundColor: '#FFFBEB',
    margin: 24,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  cardDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  versionContainer: {
    alignItems: 'flex-end',
  },
  versionText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  creatorInfo: {
    alignItems: 'flex-start',
  },
  creatorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emailText: {
    fontSize: 16,
    color: '#3B82F6',
    marginLeft: 8,
    fontWeight: '600',
  },
  githubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  githubText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
    fontWeight: '600',
  },
  disclaimerText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    marginBottom: 12,
  },
  featuresList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#4B5563',
    flex: 1,
  },
  techInfo: {
    marginTop: 16,
  },
  techRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  techLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  techValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 16,
  },
  footerText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});