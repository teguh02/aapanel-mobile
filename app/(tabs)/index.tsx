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
import { BarChart } from 'react-native-chart-kit';
import { AaPanelApi, SystemTotal, DiskInfo, NetworkInfo } from '@/services/AaPanelApi';
import SetupScreen from '@/components/SetupScreen';
import { Cpu, HardDrive, Wifi, Server, Settings } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
    router.push('/settings');
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

      // console.log('systemTotal:', systemTotal);
      // console.log('diskInfo:', diskInfo);
      // console.log('networkInfo:', networkInfo);

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

  const checkConfiguration = React.useCallback(async () => {
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
        setSystemData(null);
        setDiskData([]);
        setNetworkData(null);
      }
    } catch (error) {
      console.error('Error checking configuration:', error);
      setIsConfigured(false);
      setApi(null);
      setSystemData(null);
      setDiskData([]);
      setNetworkData(null);
    }
  }, [fetchData]);

  const handleSetupComplete = React.useCallback(() => {
    checkConfiguration();
  }, [checkConfiguration]);

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
    if (!networkData || !networkData.mem) return 0;
    const { memRealUsed, memTotal } = networkData.mem;
    return Math.round((memRealUsed / memTotal) * 100);
  };

  const getCpuUsagePercent = () => {
    if (!networkData || !networkData.cpu || networkData.cpu.length === 0) return 0;
    // Assuming the first element of networkData.cpu is the CPU usage percentage
    return Math.round(networkData.cpu[0] as number || 0);
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
        <View style={dynamicStyles.headerLeft}>
          <Server size={32} color={themeColors.tint} />
          <Text style={dynamicStyles.title}>Statistics</Text>
        </View>
        <TouchableOpacity onPress={handleEditConfiguration} style={dynamicStyles.settingsButton}>
          <Settings size={24} color={themeColors.text} />
        </TouchableOpacity>
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
          {systemData && networkData && (
            <View style={dynamicStyles.detailsCard}>
              <Text style={dynamicStyles.sectionTitle}>System Information</Text>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>OS:</Text>
                <Text style={dynamicStyles.detailValue}>{systemData.system}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Version:</Text>
                <Text style={dynamicStyles.detailValue}>{systemData.version}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>CPU Cores:</Text>
                <Text style={dynamicStyles.detailValue}>{systemData.cpuNum}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>CPU Type:</Text>
                <Text style={dynamicStyles.detailValue}>{networkData.cpu[3]}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>CPU Real Used:</Text>
                <Text style={dynamicStyles.detailValue}>{systemData.cpuRealUsed.toFixed(2)}%</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Total Memory:</Text>
                <Text style={dynamicStyles.detailValue}>{formatBytes(systemData.memTotal * 1024)}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Used Memory:</Text>
                <Text style={dynamicStyles.detailValue}>{formatBytes(systemData.memRealUsed * 1024)}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Free Memory:</Text>
                <Text style={dynamicStyles.detailValue}>{formatBytes(systemData.memFree * 1024)}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Buffered Memory:</Text>
                <Text style={dynamicStyles.detailValue}>{formatBytes(systemData.memBuffers * 1024)}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Cached Memory:</Text>
                <Text style={dynamicStyles.detailValue}>{formatBytes(systemData.memCached * 1024)}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Uptime:</Text>
                <Text style={dynamicStyles.detailValue}>{systemData.time}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Is Port:</Text>
                <Text style={dynamicStyles.detailValue}>{systemData.isport ? 'Yes' : 'No'}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Is User:</Text>
                <Text style={dynamicStyles.detailValue}>{systemData.isuser}</Text>
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
            <View style={dynamicStyles.detailsCard}>
              <Text style={dynamicStyles.sectionTitle}>Disk Usage</Text>
              {diskData.map((disk, index) => (
                <View key={index} style={dynamicStyles.diskItemContainer}>
                  <Text style={dynamicStyles.diskItemTitle}>{disk.path} ({disk.filesystem})</Text>
                  <View style={dynamicStyles.detailRow}>
                    <Text style={dynamicStyles.detailLabel}>Type:</Text>
                    <Text style={dynamicStyles.detailValue}>{disk.type}</Text>
                  </View>
                  <View style={dynamicStyles.detailRow}>
                    <Text style={dynamicStyles.detailLabel}>Size (Total/Used/Avail/Percent):</Text>
                    <Text style={dynamicStyles.detailValue}>
                      {disk.size[0]} / {disk.size[1]} / {disk.size[2]} / {disk.size[3]}
                    </Text>
                  </View>
                  <View style={dynamicStyles.detailRow}>
                    <Text style={dynamicStyles.detailLabel}>Inodes (Total/Used/Avail/Percent):</Text>
                    <Text style={dynamicStyles.detailValue}>
                      {disk.inodes[0]} / {disk.inodes[1]} / {disk.inodes[2]} / {disk.inodes[3]}
                    </Text>
                  </View>
                </View>
              ))}
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
                <Text style={dynamicStyles.detailValue}>{formatBytes(networkData.upTotal)}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Network Down:</Text>
                <Text style={dynamicStyles.detailValue}>{formatBytes(networkData.downTotal)}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Total Sites:</Text>
                <Text style={dynamicStyles.detailValue}>{networkData.site_total}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Total FTP Accounts:</Text>
                <Text style={dynamicStyles.detailValue}>{networkData.ftp_total}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Total Databases:</Text>
                <Text style={dynamicStyles.detailValue}>{networkData.database_total}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Installed:</Text>
                <Text style={dynamicStyles.detailValue}>{networkData.installed ? 'Yes' : 'No'}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>Title:</Text>
                <Text style={dynamicStyles.detailValue}>{networkData.title}</Text>
              </View>
              <View style={dynamicStyles.detailRow}>
                <Text style={dynamicStyles.detailLabel}>User:</Text>
                <Text style={dynamicStyles.detailValue}>{networkData.user_info.data.username}</Text>
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
  diskItemContainer: {
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.tabBarBorder,
  },
  diskItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: themeColors.text,
    marginBottom: 8
  }, 
});