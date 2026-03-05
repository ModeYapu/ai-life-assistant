import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/**
 * 骨架屏基础组件
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = new Animated.Value(0);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * 文本骨架屏
 */
export const TextSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <View style={styles.textContainer}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '60%' : '100%'}
          height={16}
          style={styles.textLine}
        />
      ))}
    </View>
  );
};

/**
 * 头像骨架屏
 */
export const AvatarSkeleton: React.FC<{ size?: number }> = ({ size = 48 }) => {
  return (
    <View style={[styles.avatar, { width: size, height: size }]}>
      <Skeleton width={size} height={size} borderRadius={size / 2} />
    </View>
  );
};

/**
 * 卡片骨架屏
 */
export const CardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <AvatarSkeleton size={40} />
        <View style={styles.cardHeaderText}>
          <Skeleton width={120} height={14} />
          <Skeleton width={80} height={12} style={styles.cardSubtitle} />
        </View>
      </View>
      <TextSkeleton lines={3} />
    </View>
  );
};

/**
 * 列表项骨架屏
 */
export const ListItemSkeleton: React.FC = () => {
  return (
    <View style={styles.listItem}>
      <AvatarSkeleton />
      <View style={styles.listItemContent}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="50%" height={14} style={styles.listItemSubtitle} />
      </View>
    </View>
  );
};

/**
 * 任务卡片骨架屏
 */
export const TaskCardSkeleton: React.FC = () => {
  return (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Skeleton width={24} height={24} borderRadius={12} />
        <Skeleton width="60%" height={18} style={styles.taskTitle} />
      </View>
      <Skeleton width="100%" height={14} style={styles.taskDescription} />
      <View style={styles.taskFooter}>
        <Skeleton width={80} height={12} />
        <Skeleton width={60} height={12} />
      </View>
    </View>
  );
};

/**
 * 消息骨架屏
 */
export const MessageSkeleton: React.FC<{ isUser?: boolean }> = ({
  isUser = false,
}) => {
  return (
    <View style={[styles.message, isUser && styles.messageUser]}>
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.messageBubbleUser : styles.messageBubbleAssistant,
        ]}
      >
        <TextSkeleton lines={2} />
      </View>
    </View>
  );
};

/**
 * 聊天列表骨架屏
 */
export const ChatListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <View style={styles.chatList}>
      {Array.from({ length: count }).map((_, index) => (
        <MessageSkeleton key={index} isUser={index % 2 === 0} />
      ))}
    </View>
  );
};

/**
 * 任务列表骨架屏
 */
export const TaskListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <View style={styles.taskList}>
      {Array.from({ length: count }).map((_, index) => (
        <TaskCardSkeleton key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
  textContainer: {
    marginVertical: 8,
  },
  textLine: {
    marginBottom: 8,
  },
  avatar: {
    borderRadius: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  cardSubtitle: {
    marginTop: 4,
  },
  listItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  listItemContent: {
    marginLeft: 12,
    flex: 1,
  },
  listItemSubtitle: {
    marginTop: 4,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskTitle: {
    marginLeft: 8,
  },
  taskDescription: {
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  message: {
    marginVertical: 8,
    marginHorizontal: 16,
    alignItems: 'flex-start',
  },
  messageUser: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  messageBubbleUser: {
    backgroundColor: '#6200EE',
    borderBottomRightRadius: 4,
  },
  messageBubbleAssistant: {
    backgroundColor: '#E8E8E8',
    borderBottomLeftRadius: 4,
  },
  chatList: {
    paddingVertical: 8,
  },
  taskList: {
    padding: 16,
  },
});
