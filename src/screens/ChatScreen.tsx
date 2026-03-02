/**
 * AI对话页面
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Text as RNText,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { sendMessage, createConversation, clearError } from '../store/slices/aiSlice';
import { AIMessage } from '../types';
import { aiService } from '@services/aiService';
import { WebViewContentExtractor, WebViewContentExtractorRef } from '@components/WebViewContentExtractor';

export const ChatScreen: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const dispatch = useDispatch<any>();
  const { currentConversation, loading, selectedModel, error, agent } = useSelector(
    (state: RootState) => state.ai
  );
  const flatListRef = React.useRef<FlatList>(null);
  const webExtractorRef = React.useRef<WebViewContentExtractorRef>(null);

  // 创建对话
  useEffect(() => {
    if (!currentConversation) {
      console.log('Creating new conversation...');
      dispatch(createConversation());
    }
  }, [currentConversation, dispatch]);

  // 显示错误
  useEffect(() => {
    if (error) {
      Alert.alert('发送失败', error, [
        { text: '确定', onPress: () => dispatch(clearError()) }
      ]);
    }
  }, [error, dispatch]);

  useEffect(() => {
    aiService.setDynamicExtractor((request) => {
      if (!webExtractorRef.current) {
        throw new Error('Dynamic extractor is not ready');
      }
      return webExtractorRef.current.extract(request);
    });
    return () => {
      aiService.setDynamicExtractor(undefined);
    };
  }, []);

  const handleSend = useCallback(() => {
    console.log('handleSend called', { inputText: inputText.trim(), currentConversation: !!currentConversation, loading });

    if (!inputText.trim()) {
      console.log('No input text');
      return;
    }

    if (!currentConversation) {
      console.log('No current conversation');
      Alert.alert('提示', '对话正在初始化，请稍后再试');
      return;
    }

    if (loading) {
      console.log('Already loading');
      return;
    }

    const message = inputText.trim();
    setInputText('');

    console.log('Sending message:', message, 'to conversation:', currentConversation.id);

    dispatch(
      sendMessage({
        conversationId: currentConversation.id,
        content: message,
      })
    ).then(() => {
      console.log('Message sent successfully');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd();
      }, 100);
    }).catch((err: any) => {
      console.error('Send message error:', err);
    });
  }, [inputText, currentConversation, loading, dispatch]);

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
            <>
              <Text style={styles.metadata}>
                {item.metadata.model} · {item.metadata.tokens} tokens · {item.metadata.latency}ms
              </Text>
              {!!item.metadata.agentWebExtractionSummary && (
                <Text style={styles.metadata}>
                  WebExtract: {item.metadata.agentWebExtractionSummary}
                </Text>
              )}
              {!!item.metadata.agentWebExtractions && item.metadata.agentWebExtractions.length > 0 && (
                <Text style={styles.metadata} numberOfLines={2}>
                  {item.metadata.agentWebExtractions
                    .map((it) => `${it.ok ? 'OK' : 'FAIL'} ${it.url}`)
                    .join(' | ')}
                </Text>
              )}
              {item.metadata.agentToolLoopUsed === true && (
                <Text style={styles.metadata}>ToolLoop: used</Text>
              )}
              {!!item.metadata.agentToolCallRaw && (
                <Text style={styles.metadata} numberOfLines={2}>
                  ToolCallRaw: {item.metadata.agentToolCallRaw}
                </Text>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>开始对话</Text>
      <Text style={styles.emptyText}>
        发送消息开始与AI助手对话
      </Text>
      <Text style={styles.hintText}>
        请先在设置中配置API Key
      </Text>
    </View>
  );

  const canSend = inputText.trim().length > 0 && !!currentConversation && !loading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* 模型选择器 */}
      <View style={styles.modelSelector}>
        <View testID="chat-agent-banner">
          <Text style={styles.modelText}>当前模型: {selectedModel}</Text>
          <Text style={styles.agentText}>
            Agent: {agent.enabled ? `ON · Stage ${agent.stage}` : 'OFF'}
            {agent.lastMode ? ` · ${agent.lastMode}` : ''}
          </Text>
        </View>
        {!currentConversation && (
          <Text style={styles.loadingText}>初始化中...</Text>
        )}
      </View>

      {/* 消息列表 */}
      <FlatList
        ref={flatListRef}
        data={currentConversation?.messages || []}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={renderEmpty}
      />

      {/* 输入框 */}
      <View style={styles.inputContainer}>
        <TextInput
          testID="chat-input"
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="输入消息..."
          multiline
          editable={!loading}
        />
        <TouchableOpacity
          testID="chat-send-button"
          onPress={handleSend}
          disabled={!canSend}
          style={[
            styles.sendButton,
            !canSend && styles.sendButtonDisabled
          ]}
          activeOpacity={0.7}
        >
          <RNText style={styles.sendButtonText}>发送</RNText>
        </TouchableOpacity>
        {loading && (
          <ActivityIndicator
            size="small"
            color="#6200EE"
            style={styles.loading}
          />
        )}
      </View>
      <WebViewContentExtractor ref={webExtractorRef} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modelText: {
    fontSize: 12,
    color: '#666',
  },
  agentText: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  loadingText: {
    fontSize: 12,
    color: '#999',
  },
  messageList: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  hintText: {
    fontSize: 12,
    color: '#999',
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
    backgroundColor: '#FAFAFA',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#6200EE',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loading: {
    position: 'absolute',
    right: 80,
  },
});
