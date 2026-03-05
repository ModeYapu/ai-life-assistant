import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { usePerformanceTracking } from '@/hooks/usePerformanceTracking';
import { useNetworkMonitor } from '@/hooks/useNetworkMonitor';
import { Skeleton } from '@/components/common/Skeleton';
import { TaskCardSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { TaskCard } from '@/components/optimized/TaskCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { logger } from '@/utils/logger';
import { isTaskArray } from '@/utils/typeGuards';

interface OptimizedTasksScreenProps {
  tasks: any[];
  loading: boolean;
  onRefresh: () => void;
  onTaskPress: (task: any) => void;
  onTaskComplete: (taskId: string) => void;
}

/**
 * 优化后的任务列表示例屏幕
 * 展示所有优化技术的使用
 */
export const OptimizedTasksScreen: React.FC<OptimizedTasksScreenProps> = ({
  tasks,
  loading,
  onRefresh,
  onTaskPress,
  onTaskComplete,
}) => {
  // 性能监控
  const { logAllMetrics, networkMonitor } = usePerformanceTracking('TasksScreen');

  // 网络监控
  const { isSlowNetwork, logNetworkInfo } = networkMonitor;

  // 刷新状态
  const [refreshing, setRefreshing] = React.useState(false);

  // 性能日志（开发环境）
  React.useEffect(() => {
    if (__DEV__) {
      logNetworkInfo();
    }
  }, []);

  // 处理刷新
  const handleRefresh = async () => {
    setRefreshing(true);
    logger.time('任务刷新');

    try {
      await onRefresh();
    } catch (error) {
      logger.error('刷新失败', error);
    } finally {
      setRefreshing(false);
      logger.timeEnd('任务刷新');

      // 记录性能指标
      if (__DEV__) {
        logAllMetrics();
      }
    }
  };

  // 渲染任务项（使用React.memo优化）
  const renderTask = ({ item, index }: { item: any; index: number }) => {
    // 类型安全检查
    if (!isTaskArray([item])) {
      logger.warn('无效的任务数据', item);
      return null;
    }

    return (
      <TaskCard
        task={item}
        onPress={() => onTaskPress(item)}
        onComplete={() => onTaskComplete(item.id)}
      />
    );
  };

  // 渲染空状态
  const renderEmpty = () => {
    if (loading) {
      // 显示骨架屏
      return <TaskListSkeleton count={3} />;
    }

    return (
      <EmptyState
        icon="checkmark-circle-outline"
        title="暂无任务"
        message="点击右下角按钮创建新任务"
        actionLabel="创建任务"
        onAction={() => logger.info('创建任务')}
      />
    );
  };

  // 渲染底部加载
  const renderFooter = () => {
    if (!loading || refreshing) return null;
    return <LoadingSpinner message="加载更多..." />;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}

        // 性能优化配置
        windowSize={isSlowNetwork() ? 3 : 5}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}

        // 下拉刷新
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#6200EE']}
            tintColor="#6200EE"
          />
        }

        // 性能优化
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"

        // 滚动优化
        scrollEventThrottle={16}
        decelerationRate="fast"
      />
    </View>
  );
};

/**
 * 任务列表骨架屏
 */
const TaskListSkeleton: React.FC<{ count: number }> = ({ count }) => {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <TaskCardSkeleton key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  skeletonContainer: {
    padding: 16,
  },
});

/**
 * 使用示例：
 *
 * import { OptimizedTasksScreen } from '@/screens/examples/OptimizedTasksScreen';
 *
 * const TasksScreen = () => {
 *   const [tasks, setTasks] = useState([]);
 *   const [loading, setLoading] = useState(true);
 *
 *   const handleRefresh = async () => {
 *     const newTasks = await fetchTasks();
 *     setTasks(newTasks);
 *   };
 *
 *   return (
 *     <OptimizedTasksScreen
 *       tasks={tasks}
 *       loading={loading}
 *       onRefresh={handleRefresh}
 *       onTaskPress={(task) => console.log('Task pressed:', task)}
 *       onTaskComplete={(id) => console.log('Task completed:', id)}
 *     />
 *   );
 * };
 */
