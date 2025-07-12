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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { AaPanelApi, SystemTotal, DiskInfo, NetworkInfo } from '@/services/AaPanelApi';
import SetupScreen from '@/components/SetupScreen';
import { Cpu, HardDrive, Wifi, Server, Settings } from 'lucide-react-native';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [systemData, setSystemData] = useState<SystemTotal | null>(null);
  const [diskData, setDiskData] = useState<DiskInfo[]>([]);
  const [networkData, setNetworkData] = useState<NetworkInfo | null>(null);
  const [api, setApi] = useState<AaPanelApi | null>(null);

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
        fetchData(new AaPanelApi(panelUrl, apiKey));
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
  const fetchData = async (apiInstance?: AaPanelApi) => {
    const apiToUse = apiInstance || api;
    if (!apiToUse) return;

    setLoading(true);
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
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSetupComplete = () => {
    checkConfiguration();
  };

  if (isConfigured === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!isConfigured) {
    return <SetupScreen onSetupComplete={handleSetupComplete} />;
  }

  const formatBytes = (bytes: number) => {
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
      population: parseInt(disk.percent.replace('%', '')),
      color: `hsl(${index * 60}, 70%, 50%)`,
      legendFontColor: '#7F7F7F',
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
            () => '#3B82F6',
          ],
        },
      ],
    };
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Server size={32} color="#3B82F6" />
        <Text style={styles.title}>System Statistics</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={handleEditConfiguration}>
          <Settings size={24} color="#6B7280" />
        </TouchableOpacity>
      ) : (
        <>
          {/* System Info Cards */}
          <View style={styles.cardsContainer}>
            <View style={styles.card}>
              <Cpu size={24} color="#EF4444" />
              <Text style={styles.cardTitle}>CPU Usage</Text>
              <Text style={styles.cardValue}>{getCpuUsagePercent()}%</Text>
            </View>
            
            <View style={styles.card}>
              <HardDrive size={24} color="#3B82F6" />
              <Text style={styles.cardTitle}>Memory</Text>
              <Text style={styles.cardValue}>{getMemoryUsagePercent()}%</Text>
            </View>
          </View>

          {/* System Details */}
          {systemData && (
            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>System Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>OS:</Text>
                <Text style={styles.detailValue}>{systemData.system}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>CPU:</Text>
                <Text style={styles.detailValue}>{systemData.cpuType}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>CPU Cores:</Text>
                <Text style={styles.detailValue}>{systemData.cpuNum}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Memory:</Text>
                <Text style={styles.detailValue}>{formatBytes(systemData.memTotal * 1024)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Used Memory:</Text>
                <Text style={styles.detailValue}>{formatBytes(systemData.memRealUsed * 1024)}</Text>
              </View>
            </View>
          )}

          {/* Usage Charts */}
          <View style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Resource Usage</Text>
            <BarChart
              data={getBarChartData()}
              width={screenWidth - 48}
              height={220}
              yAxisLabel=""
              yAxisSuffix="%"
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#ffa726',
                },
              }}
              style={styles.chart}
              withCustomBarColorFromData
            />
          </View>

          {/* Disk Usage */}
          {diskData.length > 0 && (
            <View style={styles.chartCard}>
              <Text style={styles.sectionTitle}>Disk Usage</Text>
              <PieChart
                data={getDiskUsageData()}
                width={screenWidth - 48}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
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
            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Network & Load</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Load Average:</Text>
                <Text style={styles.detailValue}>
                  {networkData.load.one.toFixed(2)} / {networkData.load.five.toFixed(2)} / {networkData.load.fifteen.toFixed(2)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Network Up:</Text>
                <Text style={styles.detailValue}>{formatBytes(networkData.network.upTotal)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Network Down:</Text>
                <Text style={styles.detailValue}>{formatBytes(networkData.network.downTotal)}</Text>
              </View>
            </View>
          )}
        </>
      )}
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
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  detailsCard: {
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
  chartCard: {
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
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});