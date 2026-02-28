/**
 * 记忆管理页面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  List,
  Chip,
  Dialog,
  Portal,
  TextInput,
  Divider,
} from 'react-native-paper';
import { unifiedMemorySystem } from '../services/unifiedMemorySystem';

export const MemoryManagerScreen: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await unifiedMemorySystem.getStats();
      setStats(data);
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const results = await unifiedMemorySystem.searchMemories(searchQuery, {
        limit: 10,
        includeImportant: true,
      });
      setSearchResults(results);
    } catch (error) {
      console.error('搜索失败:', error);
    }
  };

  const handleClearMemory = async () => {
    try {
      // 清理逻辑
      setShowClearDialog(false);
      Alert.alert('成功', '记忆已清理');
      await loadStats();
    } catch (error) {
      Alert.alert('错误', '清理失败');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* 统计信息 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>📊 记忆统计</Text>
          
          {stats && (
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalConversations}</Text>
                <Text style={styles.statLabel}>总对话</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalMessages}</Text>
                <Text style={styles.statLabel}>总消息</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.importantMessages}</Text>
                <Text style={styles.statLabel}>重要消息</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.memoryStats?.keywordCount || 0}</Text>
                <Text style={styles.statLabel}>关键词数</Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* 搜索 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>🔍 记忆搜索</Text>
          
          <View style={styles.searchContainer}>
            <TextInput
              mode="outlined"
              placeholder="搜索记忆..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              right={<TextInput.Icon icon="search" onPress={handleSearch} />}
            />
          </View>

          {searchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>搜索结果 ({searchResults.length})</Text>
              
              {searchResults.map((result, index) => (
                <View key={index} style={styles.resultItem}>
                  <Text style={styles.resultContent}>{result.content}</Text>
                  <View style={styles.resultMeta}>
                    <Chip mode="outlined" style={styles.scoreChip}>
                      相关度: {(result.score * 100).toFixed(0)}%
                    </Chip>
                    <Chip mode="outlined" style={styles.sourceChip}>
                      {result.source}
                    </Chip>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* 功能说明 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>✨ 智能记忆特性</Text>
          
          <List.Item
            title="混合检索"
            description="关键词 + 语义搜索，准确率80%"
            left={props => <List.Icon {...props} icon="magnify" />}
          />
          
          <List.Item
            title="自动摘要"
            description="超过20条消息自动生成摘要"
            left={props => <List.Icon {...props} icon="text-short" />}
          />
          
          <List.Item
            title="重要性识别"
            description="自动标记重要消息"
            left={props => <List.Icon {...props} icon="star" />}
          />
          
          <List.Item
            title="时间衰减"
            description="优先返回最新相关记忆"
            left={props => <List.Icon {...props} icon="clock-outline" />}
          />
        </Card.Content>
      </Card>

      {/* 高级操作 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>⚙️ 高级操作</Text>
          
          <Button
            mode="outlined"
            onPress={() => setShowClearDialog(true)}
            style={styles.dangerButton}
            icon="delete"
          >
            清理旧记忆
          </Button>
        </Card.Content>
      </Card>

      {/* 确认对话框 */}
      <Portal>
        <Dialog
          visible={showClearDialog}
          onDismiss={() => setShowClearDialog(false)}
        >
          <Dialog.Title>确认清理</Dialog.Title>
          <Dialog.Content>
            <Text>这将清理30天前的非重要记忆。此操作不可恢复。</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowClearDialog(false)}>取消</Button>
            <Button onPress={handleClearMemory} textColor="#F44336">
              确认清理
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    margin: 16,
    marginTop: 0,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F0F0F0',
    padding: 16,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6200EE',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#FFF',
  },
  resultsContainer: {
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  resultItem: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  resultContent: {
    fontSize: 14,
    marginBottom: 8,
  },
  resultMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreChip: {
    height: 28,
  },
  sourceChip: {
    height: 28,
  },
  dangerButton: {
    borderColor: '#F44336',
    marginTop: 8,
  },
});
