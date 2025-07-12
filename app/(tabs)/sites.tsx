import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AaPanelApi, Site } from '@/services/AaPanelApi';
import SetupScreen from '@/components/SetupScreen';
import { Globe, Play, Square, Calendar, Folder, Settings, StopCircle } from 'lucide-react-native';
import Colors from '@/constants/Colors';

export default function SitesScreen() {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [api, setApi] = useState<AaPanelApi | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});

  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const dynamicStyles = getDynamicStyles(themeColors);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const panelUrl = await AsyncStorage.getItem('panel_url');
      const apiKey = await AsyncStorage.getItem('api_key');
      
      if (panelUrl && apiKey) {
        setApi(new AaPanelApi(panelUrl, apiKey));
        setIsConfigured(true);
        fetchSites(new AaPanelApi(panelUrl, apiKey));
      } else {
        setIsConfigured(false);
      }
    } catch (error) {
      console.error('Error checking configuration:', error);
      setIsConfigured(false);
    }
  };

  const handleEditConfiguration = () => {
    Alert.alert(
      'Edit Configuration',
      'Do you want to update your panel URL and API key?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Edit', 
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('panel_url');
              await AsyncStorage.removeItem('api_key');
              setIsConfigured(false);
              setApi(null);
              setSites([]);
            } catch (error) {
              console.error('Error clearing configuration:', error);
              Alert.alert('Error', 'Failed to clear configuration');
            }
          }
        },
      ]
    );
  };
  const fetchSites = async (apiInstance?: AaPanelApi) => {
    const apiToUse = apiInstance || api;
    if (!apiToUse) return;

    setLoading(true);
    try {
      const response = await apiToUse.getSites();
      setSites(response.data || []);
    } catch (error) {
      console.error('Error fetching sites:', error);
      
      let errorMessage = 'Failed to fetch sites from panel.';
      
      if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          errorMessage = 'CORS Error: Panel is blocking requests from this app.\n\nPlease add your device IP to panel\'s allowed origins or contact your server administrator.';
        } else if (error.message.includes('Network Error') || error.message.includes('NETWORK_ERROR')) {
          errorMessage = 'Network Error: Cannot connect to panel.\n\nPlease check:\n• Internet connection\n• Panel URL is correct\n• Panel is running';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Timeout Error: Panel is not responding.\n\nThe panel might be overloaded or experiencing issues.';
        } else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
          errorMessage = 'Authentication Error: Invalid API credentials.\n\nPlease check your API key in settings.';
        } else {
          errorMessage = `Connection Error: ${error.message}`;
        }
      }
      
      Alert.alert(
        'Error Loading Sites',
        errorMessage,
        [
          { text: 'Retry', onPress: () => fetchSites() },
          { text: 'OK' }
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSites();
  };

  const handleSetupComplete = () => {
    checkConfiguration();
  };

  const handleSiteAction = async (site: Site, action: 'start' | 'stop') => {
    if (!api) return;

    setActionLoading(prev => ({ ...prev, [site.id]: true }));
    
    try {
      let response;
      if (action === 'start') {
        response = await api.startSite(site.id, site.name);
      } else {
        response = await api.stopSite(site.id, site.name);
      }

      if (response && response.status) {
        Alert.alert('Success', `Site ${action}ed successfully!`);
        fetchSites(); // Refresh the list
      } else {
        Alert.alert('Error', response?.msg || `Failed to ${action} site`);
      }
    } catch (error) {
      console.error(`Error ${action}ing site:`, error);
      
      let errorMessage = `Failed to ${action} site.`;
      
      if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          errorMessage = `CORS Error: Cannot ${action} site due to panel security settings.\n\nPlease contact your server administrator.`;
        } else if (error.message.includes('Network Error') || error.message.includes('NETWORK_ERROR')) {
          errorMessage = `Network Error: Cannot connect to panel to ${action} site.\n\nPlease check your connection.`;
        } else if (error.message.includes('timeout')) {
          errorMessage = `Timeout Error: Panel is taking too long to ${action} the site.\n\nPlease try again.`;
        } else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
          errorMessage = `Authentication Error: No permission to ${action} sites.\n\nPlease check your API key permissions.`;
        } else {
          errorMessage = `${action.charAt(0).toUpperCase() + action.slice(1)} Error: ${error.message}`;
        }
      }
      
      Alert.alert(
        `Failed to ${action.charAt(0).toUpperCase() + action.slice(1)} Site`,
        errorMessage,
        [
          { text: 'Retry', onPress: () => handleSiteAction(site, action) },
          { text: 'OK' }
        ]
      );
    } finally {
      setActionLoading(prev => ({ ...prev, [site.id]: false }));
    }
  };

  const confirmSiteAction = (site: Site, action: 'start' | 'stop') => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} the site "${site.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => handleSiteAction(site, action) },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(parseInt(dateString) * 1000);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getSiteStatusColor = (status: string) => {
    return status === '1' ? '#10B981' : '#EF4444';
  };

  const getSiteStatusText = (status: string) => {
    return status === '1' ? 'Active' : 'Inactive';
  };

  if (isConfigured === null) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.tint} />
      </View>
    );
  }

  if (!isConfigured) {
    return <SetupScreen onSetupComplete={handleSetupComplete} />;
  }

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.headerLeft}>
          <Globe size={32} color={themeColors.tint} />
          <Text style={dynamicStyles.title}>Website</Text>
        </View>
        <TouchableOpacity style={dynamicStyles.settingsButton} onPress={handleEditConfiguration}>
          <Settings size={24} color={themeColors.tabIconDefault} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={dynamicStyles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.tint} />
        </View>
      ) : (
        <ScrollView
          style={dynamicStyles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.tint} />}
        >
          {sites.length === 0 ? (
            <View style={dynamicStyles.emptyContainer}>
              <Globe size={64} color={themeColors.tabIconDefault} />
              <Text style={dynamicStyles.emptyText}>No websites found</Text>
              <Text style={dynamicStyles.emptySubtext}>Pull down to refresh</Text>
            </View>
          ) : (
            sites.map((site) => (
              <View key={site.id} style={dynamicStyles.siteCard}>
                <View style={dynamicStyles.siteHeader}>
                  <View style={dynamicStyles.siteInfo}>
                    <Text style={dynamicStyles.siteName}>{site.name}</Text>
                    <View style={dynamicStyles.statusContainer}>
                      <View
                        style={[
                          dynamicStyles.statusDot,
                          { backgroundColor: getSiteStatusColor(site.status) },
                        ]}
                      />
                      <Text
                        style={[
                          dynamicStyles.statusText,
                          { color: getSiteStatusColor(site.status) },
                        ]}
                      >
                        {getSiteStatusText(site.status)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={dynamicStyles.siteDetails}>
                  <View style={dynamicStyles.detailRow}>
                    <Folder size={16} color={themeColors.tabIconDefault} />
                    <Text style={dynamicStyles.detailText}>{site.path}</Text>
                  </View>
                  <View style={dynamicStyles.detailRow}>
                    <Calendar size={16} color={themeColors.tabIconDefault} />
                    <Text style={dynamicStyles.detailText}>Created: {formatDate(site.addtime)}</Text>
                  </View>
                  {site.ps && (
                    <View style={dynamicStyles.detailRow}>
                      <Text style={dynamicStyles.detailText}>Note: {site.ps}</Text>
                    </View>
                  )}
                </View>

                <View style={dynamicStyles.actionButtons}>
                  {site.status === '1' ? (
                    <TouchableOpacity
                      style={[dynamicStyles.actionButton, dynamicStyles.stopButton]}
                      onPress={() => confirmSiteAction(site, 'stop')}
                      disabled={actionLoading[site.id]}
                    >
                      {actionLoading[site.id] ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <StopCircle size={16} color="#FFFFFF" />
                          <Text style={dynamicStyles.actionButtonText}>Stop</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[dynamicStyles.actionButton, dynamicStyles.startButton]}
                      onPress={() => confirmSiteAction(site, 'start')}
                      disabled={actionLoading[site.id]}
                    >
                      {actionLoading[site.id] ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Play size={16} color="#FFFFFF" />
                          <Text style={dynamicStyles.actionButtonText}>Start</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: themeColors.tabIconDefault,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: themeColors.tabIconDefault,
    marginTop: 8,
  },
  siteCard: {
    backgroundColor: themeColors.tabBarBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: themeColors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  siteHeader: {
    marginBottom: 16,
  },
  siteInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  siteName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.text,
    flex: 1,
    marginRight: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  siteDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: themeColors.tabIconDefault,
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#10B981',
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});