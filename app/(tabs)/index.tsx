import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { AaPanelApi, SystemTotal, DiskInfo, NetworkInfo } from '@/services/AaPanelApi';
import SetupScreen from '@/components/SetupScreen';
import { Cpu, HardDrive, Wifi, Server, Settings } from 'lucide-react-native';
import Colors from '@/constants/Colors';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [systemData, setSystemData] = useState<SystemTotal | null>(null);
  const [diskData, setDiskData] = useState<DiskInfo[]>([]);
  const [networkData, setNetworkData] = useState<NetworkInfo | null>(null);
  const [api, setApi] = useState<AaPanelApi | null>(null);

  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const dynamicStyles = getDynamicStyles(themeColors);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (isConfigured && api) {
      intervalId = setInterval(() => {
        fetchData(api, false); // Pass the current API instance, no loading indicator
      }, 3000); // Refresh every 3 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isConfigured, api, fetchData]);

  // Effect for initial configuration check and setting up API instance
  useEffect(() => {
    const configureApp = async () => {
      try {
        const panelUrl = await AsyncStorage.getItem('panel_url');
        const apiKey = await AsyncStorage.getItem('api_key');
        
        if (panelUrl && apiKey) {
          const newApiInstance = new AaPanelApi(panelUrl, apiKey);
          setApi(newApiInstance);
          setIsConfigured(true);
          fetchData(newApiInstance, true); // Initial fetch with the new API instance
        } else {
          setIsConfigured(false);
          setApi(null);
        }
      } catch (error) {
        console.error('Error configuring app:', error);
        setIsConfigured(false);
        setApi(null);
      }
    };
    configureApp();
  }, []); // Run only once on mount

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
              setSystemData(null);
              setDiskData([]);
              setNetworkData(null);
            } catch (error) {
              console.error('Error clearing configuration:', error);
              Alert.alert('Error', 'Failed to clear configuration');
            }
          }
        },
      ]
    );
  };
  const fetchData = React.useCallback(async (apiInstance?: AaPanelApi, showLoadingIndicator: boolean = true) => {
    const apiToUse = apiInstance || api;
    if (!apiToUse) return;

    try {
      const [systemTotal, diskInfo, networkInfo] = await Promise.all([
        apiToUse.getSystemTotal(),
        apiToUse.getDiskInfo(),
        apiToUse.getNetWork(),
      ]);

      setSystemData(systemTotal);
      setDiskData(diskInfo);
      setNetworkData(networkInfo);
    } catch (error) {
      console.error('Error fetching data:', error);
      
      let errorMessage = 'Failed to fetch data from panel.';
      
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
        'Error Loading Data',
        errorMessage,
        [
          { text: 'Retry', onPress: () => fetchData() },
          { text: 'OK' }
        ]
      );
    } finally {
    }
  }, [api]);

  const handleSetupComplete = () => {
    checkConfiguration();
  };

  if (isConfigured === null) {
    return null; // Or a blank View if preferred
  }

  if (!isConfigured) {
    return <SetupScreen onSetupComplete={handleSetupComplete} />;
  }

  const formatBytes = (bytes: number | undefined | null) => {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return '(no data)';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMemoryUsagePercent = () => {
    if (!systemData) return 0;
    return Math.round((systemData.memRealUsed / systemData.memTotal) * 100);
  };

  const getCpuUsagePercent = () => {
    if (!networkData || !networkData.cpu) return 0;
    return Math.round(networkData.cpu[0] || 0);
  };

  const getDiskUsageData = () => {
    return diskData.map((disk, index) => ({
      name: disk.path,
      population: parseInt((disk.percent || '0').replace('%', '')),
      color: `hsl(${index * 60}, 70%, 50%)`,
      legendFontColor: themeColors.tabIconDefault,
      legendFontSize: 12,
    }));
  };

  const getBarChartData = () => {
    return {
      labels: ['CPU', 'Memory'],
      datasets: [
        {
          data: [getCpuUsagePercent(), getMemoryUsagePercent()],
          colors: [
            () => '#EF4444',
            () => themeColors.tint,
          ],
        },
      ],
    };
  };

  return (
      <ScrollView
        style={dynamicStyles.container}
        contentContainerStyle={{ flexGrow: 1 }}
      >
      <View style={dynamicStyles.header}>
        <Server size={32} color={themeColors.tint} />
        <Text style={dynamicStyles.title}>Statistics</Text>
      </View>

      <>
          {/* System Info Cards */}
          <View style={dynamicStyles.cardsContainer}>
            <View style={dynamicStyles.card}>
              <Cpu size={24} color={Colors.light.tint} />
              <Text style={dynamicStyles.cardTitle}>CPU Usage</Text>
              <Text style={dynamicStyles.cardValue}>{getCpuUsagePercent()}%</Text>
            </View>
            
            <View style={dynamicStyles.card}>
              <HardDrive size={24} color={Colors.light.tint} />
              <Text style={dynamicStyles.cardTitle}>Memory</Text>
              <Text style={dynamicStyles.cardValue}>{getMemoryUsagePercent()}%</Text>
            </View>
          </View>

          {/* System Details */}
          {systemData && (
            <View style={dynamicStyles.detailsCard}>
              <Text style={dynamicStyles.sectionTitle}>System Information</Text>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>OS:</Text>
                <Text style={dynamicStyles.detailValue}>{systemData.system}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>CPU:</Text>
                <Text style={dynamicStyles.detailValue}>{systemData.cpuType}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>CPU Cores:</Text>
                <Text style={dynamicStyles.detailValue}>{systemData.cpuNum}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Total Memory:</Text>
                <Text style={dynamicStyles.detailValue}>{formatBytes(systemData.memTotal * 1024)}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Used Memory:</Text>
                <Text style={dynamicStyles.detailValue}>{formatBytes(systemData.memRealUsed * 1024)}</Text>
              </View>
            </View>
          )}

          {/* Usage Charts */}
          <View style={dynamicStyles.chartCard}>
            <Text style={dynamicStyles.sectionTitle}>Resource Usage</Text>
            <BarChart
              data={getBarChartData()}
              width={screenWidth - 48}
              height={220}
              yAxisLabel=""
              yAxisSuffix="%"
              chartConfig={{
                backgroundColor: themeColors.tabBarBackground,
                backgroundGradientFrom: themeColors.tabBarBackground,
                backgroundGradientTo: themeColors.tabBarBackground,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(${parseInt(themeColors.tint.slice(1, 3), 16)}, ${parseInt(themeColors.tint.slice(3, 5), 16)}, ${parseInt(themeColors.tint.slice(5, 7), 16)}, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(${parseInt(themeColors.text.slice(1, 3), 16)}, ${parseInt(themeColors.text.slice(3, 5), 16)}, ${parseInt(themeColors.text.slice(5, 7), 16)}, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: themeColors.tint,
                },
              }}
              style={dynamicStyles.chart}
              withCustomBarColorFromData
            />
          </View>

          {/* Disk Usage */}
          {diskData.length > 0 && (
            <View style={dynamicStyles.chartCard}>
              <Text style={dynamicStyles.sectionTitle}>Disk Usage</Text>
              <PieChart
                data={getDiskUsageData()}
                width={screenWidth - 48}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(${parseInt(themeColors.text.slice(1, 3), 16)}, ${parseInt(themeColors.text.slice(3, 5), 16)}, ${parseInt(themeColors.text.slice(5, 7), 16)}, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          )}

          {/* Network Info */}
          {networkData && (
            <View style={dynamicStyles.detailsCard}>
              <Text style={dynamicStyles.sectionTitle}>Network & Load</Text>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Load Average:</Text>
                <Text style={dynamicStyles.detailValue}>
                  {networkData.load.one.toFixed(2)} / {networkData.load.five.toFixed(2)} / {networkData.load.fifteen.toFixed(2)}
                </Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Network Up:</Text>
                <Text style={dynamicStyles.detailValue}>{formatBytes(networkData.network.upTotal)}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Network Down:</Text>
                <Text style={dynamicStyles.detailValue}>{formatBytes(networkData.network.downTotal)}</Text>
              </View>
            </View>
          )}
        </>
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
  cardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 16,
  },
  card: {
    flex: 1,
    backgroundColor: themeColors.tabBarBackground,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: themeColors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    color: themeColors.tabIconDefault,
    marginTop: 8,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: themeColors.text,
  },
  detailsCard: {
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
  chartCard: {
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
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.tabBarBorder,
  },
  detailLabel: {
    fontSize: 14,
    color: themeColors.tabIconDefault,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: themeColors.text,
    flex: 1,
    textAlign: 'right',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});