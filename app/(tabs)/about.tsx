import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Info, Mail, User, TriangleAlert as AlertTriangle, Heart, Code, Settings, Github, Share2 } from 'lucide-react-native';
import { Share } from 'react-native';
import Colors from '@/constants/Colors';

export default function AboutScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const dynamicStyles = getDynamicStyles(themeColors);

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
  const handleSharePress = async () => {
    try {
      const result = await Share.share({
        message:
          'Check out AaPanel Mobile, an unofficial mobile interface for aaPanel server management! Get it here: https://github.com/teguh02/aapanel-mobile',
        url: 'https://github.com/teguh02/aapanel-mobile',
        title: 'Share AaPanel Mobile',
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };
  return (
    <ScrollView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.headerLeft}>
          <Info size={32} color={themeColors.tint} />
          <Text style={dynamicStyles.title}>About</Text>
        </View>
        <TouchableOpacity style={dynamicStyles.settingsButton} onPress={handleEditConfiguration}>
          <Settings size={24} color={themeColors.tabIconDefault} />
        </TouchableOpacity>
        <TouchableOpacity style={dynamicStyles.settingsButton} onPress={handleSharePress}>
          <Share2 size={24} color={themeColors.tabIconDefault} />
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={dynamicStyles.card}>
        <View style={dynamicStyles.cardHeader}>
          <Code size={24} color={themeColors.tint} />
          <Text style={dynamicStyles.cardTitle}>AaPanel Mobile</Text>
        </View>
        <Text style={dynamicStyles.cardDescription}>
          An unofficial mobile interface for aaPanel server management.
          Monitor your server statistics and manage websites on the go.
        </Text>
        <View style={dynamicStyles.versionContainer}>
          <Text style={dynamicStyles.versionText}>Version 1.0.1</Text>
        </View>
      </View>

      {/* Creator Info */}
      <View style={dynamicStyles.card}>
        <View style={dynamicStyles.cardHeader}>
          <User size={24} color="#10B981" />
          <Text style={dynamicStyles.cardTitle}>Creator</Text>
        </View>
        <View style={dynamicStyles.creatorInfo}>
          <Text style={dynamicStyles.creatorName}>Teguh Rijanandi</Text>
          <TouchableOpacity style={dynamicStyles.emailButton} onPress={handleEmailPress}>
            <Mail size={16} color={themeColors.tint} />
            <Text style={dynamicStyles.emailText}>teguhrijanandi02@gmail.com</Text>
          </TouchableOpacity>
          <TouchableOpacity style={dynamicStyles.githubButton} onPress={() => Linking.openURL('https://github.com/teguh02/aapanel-mobile')}>
            <Github size={16} color={themeColors.text} />
            <Text style={dynamicStyles.githubText}>teguh02/aapanel-mobile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Disclaimer */}
      <View style={dynamicStyles.disclaimerCard}>
        <View style={dynamicStyles.cardHeader}>
          <AlertTriangle size={24} color="#F59E0B" />
          <Text style={dynamicStyles.cardTitle}>Disclaimer</Text>
        </View>
        <Text style={dynamicStyles.disclaimerText}>
          This app is an unofficial mobile interface for aaPanel.
          It was independently developed as part of the author's personal hobby project,
          with the intent to provide a lightweight alternative for managing servers via smartphone.
        </Text>
        <Text style={dynamicStyles.disclaimerText}>
          This application is not affiliated with or endorsed by the official aaPanel team.
        </Text>
      </View>

      {/* Features */}
      <View style={dynamicStyles.card}>
        <View style={dynamicStyles.cardHeader}>
          <Heart size={24} color="#EF4444" />
          <Text style={dynamicStyles.cardTitle}>Features</Text>
        </View>
        <View style={dynamicStyles.featuresList}>
          <View style={dynamicStyles.featureItem}>
            <View style={dynamicStyles.featureBullet} />
            <Text style={dynamicStyles.featureText}>Real-time system monitoring</Text>
          </View>
          <View style={dynamicStyles.featureItem}>
            <View style={dynamicStyles.featureBullet} />
            <Text style={dynamicStyles.featureText}>Website management (Start/Stop)</Text>
          </View>
          <View style={dynamicStyles.featureItem}>
            <View style={dynamicStyles.featureBullet} />
            <Text style={dynamicStyles.featureText}>CPU and memory usage charts</Text>
          </View>
          <View style={dynamicStyles.featureItem}>
            <View style={dynamicStyles.featureBullet} />
            <Text style={dynamicStyles.featureText}>Disk usage visualization</Text>
          </View>
          <View style={dynamicStyles.featureItem}>
            <View style={dynamicStyles.featureBullet} />
            <Text style={dynamicStyles.featureText}>Network statistics</Text>
          </View>
          <View style={dynamicStyles.featureItem}>
            <View style={dynamicStyles.featureBullet} />
            <Text style={dynamicStyles.featureText}>Secure API authentication</Text>
          </View>
          <View style={dynamicStyles.featureItem}>
            <View style={dynamicStyles.featureBullet} />
            <Text style={dynamicStyles.featureText}>Configuration management</Text>
          </View>
          <View style={dynamicStyles.featureItem}>
            <View style={dynamicStyles.featureBullet} />
            <Text style={dynamicStyles.featureText}>Auto Dark Mode</Text>
          </View>
        </View>
      </View>

      

      {/* Footer */}
      <View style={dynamicStyles.footer}>
        <Text style={dynamicStyles.footerText}>
          Made with ❤️ for the server administration community
        </Text>
        <Text style={dynamicStyles.footerSubtext}>
          Open source • Hobby project • Not for commercial use
        </Text>
      </View>
    </ScrollView>
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
    padding: 24,
    paddingTop: 24,
    gap: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: themeColors.text,
    marginLeft: 12,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: themeColors.tabBarBorder,
  },
  card: {
    backgroundColor: themeColors.tabBarBackground,
    margin: 24,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: themeColors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disclaimerCard: {
    backgroundColor: '#FFFBEB', // Specific warning color
    margin: 24,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B', // Specific warning color
    shadowColor: themeColors.text,
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
    color: themeColors.text,
    marginLeft: 12,
  },
  cardDescription: {
    fontSize: 16,
    color: themeColors.tabIconDefault,
    lineHeight: 24,
    marginBottom: 16,
  },
  versionContainer: {
    alignItems: 'flex-end',
  },
  versionText: {
    fontSize: 14,
    color: themeColors.tabIconDefault,
    fontWeight: '600',
  },
  creatorInfo: {
    alignItems: 'flex-start',
  },
  creatorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeColors.text,
    marginBottom: 12,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.tabBarBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emailText: {
    fontSize: 16,
    color: themeColors.text,
    marginLeft: 8,
    fontWeight: '600',
  },
  githubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.tabBarBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  githubText: {
    fontSize: 16,
    color: themeColors.text,
    marginLeft: 8,
    fontWeight: '600',
  },
  disclaimerText: {
    fontSize: 14,
    color: '#92400E', // Specific warning text color
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
    backgroundColor: themeColors.tint,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: themeColors.tabIconDefault,
    flex: 1,
  },
  
  footer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 16,
  },
  footerText: {
    fontSize: 16,
    color: themeColors.tabIconDefault,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 14,
    color: themeColors.tabIconDefault,
    textAlign: 'center',
  },
});