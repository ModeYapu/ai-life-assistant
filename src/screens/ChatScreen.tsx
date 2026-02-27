/**
 * AI对话页面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { IconButton, Text, Bubble } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { sendMessage, createConversation } from '@/store/slices/aiSlice';
import { AIMessage } from '@/types';

export const ChatScreen: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const dispatch = useDispatch();
  const { currentConversation, loading, selectedModel } = useSelector(
    (state: RootState) => state.ai
  );
  const flatListRef = React.useRef<FlatList>(null);

  useEffect(() => {
    // 如果没有当前对话，创建一个新对话
    if (!currentConversation) {
      dispatch(createConversation());
    }
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || !currentConversation) return;

    const message = inputText.trim();
    setInputText('');

    await dispatch(
      sendMessage({
        conversationId: currentConversation.id,
        content: message,
      })
    );

    // 滚动到底部
    setTimeout(() => {
      flatListRef.current?.scrollToEnd();
    }, 100);
  };

  const renderMessage = ({ item }: { item: AIMessage }) => {
    const isUser = item.role === 'user';
    
    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.assistantMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          <Text style={isUser ? styles.userText : styles.assistantText}>
            {item.content}
          </Text>
          {item.metadata && (
            <Text style={styles.metadata}>
              {item.metadata.tokens} tokens · {item.metadata.latency}ms
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 模型选择器 */}
      <View style={styles.modelSelector}>
        <Text style={styles.modelText}>模型: {selectedModel}</Text>
      </View>

      {/* 消息列表 */}
      <FlatList
        ref={flatListRef}
        data={currentConversation?.messages || []}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {/* 输入框 */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="输入消息..."
          multiline
          editable={!loading}
        />
        <IconButton
          icon="send"
          onPress={handleSend}
          disabled={!inputText.trim() || loading}
          style={styles.sendButton}
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color="#6200EE"
            style={styles.loading}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modelSelector: {
    padding: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modelText: {
    fontSize: 12,
    color: '#666',
  },
  messageList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#6200EE',
  },
  assistantBubble: {
    backgroundColor: '#FFF',
  },
  userText: {
    color: '#FFF',
  },
  assistantText: {
    color: '#000',
  },
  metadata: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#6200EE',
    borderRadius: 20,
  },
  loading: {
    position: 'absolute',
    right: 60,
  },
});
