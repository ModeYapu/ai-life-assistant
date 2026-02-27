/**
 * 设置页面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import {
  Text,
  List,
  Switch,
  RadioButton,
  Button,
  Divider,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import {
  loadSettings,
  setAIModel,
  setTheme,
  setTemperature,
  toggleStream,
} from '@/store/slices/settingsSlice';
import { storageService } from '@/services/storageService';
import { aiService } from '@/services/aiService';

export const SettingsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { settings } = useSelector((state: RootState) => state.settings);
  const { models, selectedModel } = useSelector((state: RootState) => state.ai);
  
  const [showModelDialog, setShowModelDialog] = useState(false);
  const [showApiKeysDialog, setShowApiKeysDialog] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    google: '',
  });
  const [temperature, setTemperatureLocal] = useState(
    settings.ai.temperature.toString()
  );

  useEffect(() => {
    dispatch(loadSettings());
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    const keys = await storageService.getApiKeys();
    setApiKeys({
      openai: keys.openai || '',
      anthropic: keys.anthropic || '',
      google: keys.google || '',
    });
  };

  const handleSaveApiKeys = async () => {
    try {
      if (apiKeys.openai) {
        await storageService.saveApiKey('openai', apiKeys.openai);
        aiService.setApiKey('openai', apiKeys.openai);
      }
      if (apiKeys.anthropic) {
        await storageService.saveApiKey('anthropic', apiKeys.anthropic);
        aiService.setApiKey('anthropic', apiKeys.anthropic);
      }
      if (apiKeys.google) {
        await storageService.saveApiKey('google', apiKeys.google);
        aiService.setApiKey('google', apiKeys.google);
      }
      
      setShowApiKeysDialog(false);
      Alert.alert('成功', 'API Keys已保存');
    } catch (error) {
      Alert.alert('错误', '保存失败');
    }
  };

  const handleTemperatureChange = (value: string) => {
    setTemperatureLocal(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0 && num <= 2) {
      dispatch(setTemperature(num));
    }
  };

  const getModelName = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    return model?.name || modelId;
  };

  return (
    <ScrollView style={styles.container}>
      {/* AI设置 */}
      <List.Section>
        <List.Subheader>AI设置</List.Subheader>
        
        <List.Item
          title="默认模型"
          description={getModelName(selectedModel)}
          left={(props) => <List.Icon {...props} icon="robot" />}
          onPress={() => setShowModelDialog(true)}
        />
        
        <List.Item
          title="API Keys"
          description="配置AI服务密钥"
          left={(props) => <List.Icon {...props} icon="key" />}
          onPress={() => setShowApiKeysDialog(true)}
        />
        
        <View style={styles.settingItem}>
          <Text>Temperature: {settings.ai.temperature}</Text>
          <TextInput
            style={styles.temperatureInput}
            value={temperature}
            onChangeText={handleTemperatureChange}
            keyboardType="decimal-pad"
            placeholder="0.0 - 2.0"
          />
        </View>
        
        <List.Item
          title="流式输出"
          description="实时显示AI回复"
          left={(props) => <List.Icon {...props} icon="stream" />}
          right={() => (
            <Switch
              value={settings.ai.streamEnabled}
              onValueChange={() => dispatch(toggleStream())}
            />
          )}
        />
      </List.Section>

      <Divider />

      {/* 外观设置 */}
      <List.Section>
        <List.Subheader>外观</List.Subheader>
        
        <List.Item
          title="主题"
          description={settings.ui.theme}
          left={(props) => <List.Icon {...props} icon="palette" />}
          onPress={() => {}}
        />
        
        <RadioButton.Group
          onValueChange={(value) => dispatch(setTheme(value as any))}
          value={settings.ui.theme}
        >
          <View style={styles.themeOptions}>
            <RadioButton.Item label="浅色" value="light" />
            <RadioButton.Item label="深色" value="dark" />
            <RadioButton.Item label="跟随系统" value="auto" />
          </View>
        </RadioButton.Group>
      </List.Section>

      <Divider />

      {/* 任务设置 */}
      <List.Section>
        <List.Subheader>任务</List.Subheader>
        
        <List.Item
          title="默认优先级"
          description={settings.tasks.defaultPriority}
          left={(props) => <List.Icon {...props} icon="flag" />}
        />
        
        <List.Item
          title="自动归档"
          description="自动归档已完成任务"
          left={(props) => <List.Icon {...props} icon="archive" />}
          right={() => (
            <Switch
              value={settings.tasks.autoArchive}
              onValueChange={() => {}}
            />
          )}
        />
      </List.Section>

      <Divider />

      {/* 同步设置 */}
      <List.Section>
        <List.Subheader>数据同步</List.Subheader>
        
        <List.Item
          title="启用同步"
          description="同步数据到云端"
          left={(props) => <List.Icon {...props} icon="cloud-sync" />}
          right={() => (
            <Switch
              value={settings.sync.enabled}
              onValueChange={() => {}}
            />
          )}
        />
        
        {settings.sync.enabled && (
          <List.Item
            title="仅WiFi同步"
            description="仅在WiFi下同步"
            left={(props) => <List.Icon {...props} icon="wifi" />}
            right={() => (
              <Switch
                value={settings.sync.wifiOnly}
                onValueChange={() => {}}
              />
            )}
          />
        )}
      </List.Section>

      <Divider />

      {/* 关于 */}
      <List.Section>
        <List.Subheader>关于</List.Subheader>
        
        <List.Item
          title="版本"
          description="0.1.0"
          left={(props) => <List.Icon {...props} icon="information" />}
        />
        
        <List.Item
          title="隐私政策"
          left={(props) => <List.Icon {...props} icon="shield-account" />}
          onPress={() => {}}
        />
        
        <List.Item
          title="使用条款"
          left={(props) => <List.Icon {...props} icon="file-document" />}
          onPress={() => {}}
        />
      </List.Section>

      {/* 模型选择对话框 */}
      <Portal>
        <Dialog
          visible={showModelDialog}
          onDismiss={() => setShowModelDialog(false)}
        >
          <Dialog.Title>选择AI模型</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={(value) => {
                dispatch(setAIModel(value));
                setShowModelDialog(false);
              }}
              value={selectedModel}
            >
              {models.map((model) => (
                <RadioButton.Item
                  key={model.id}
                  label={`${model.name}\n${model.contextWindow} tokens`}
                  value={model.id}
                />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* API Keys对话框 */}
      <Portal>
        <Dialog
          visible={showApiKeysDialog}
          onDismiss={() => setShowApiKeysDialog(false)}
        >
          <Dialog.Title>配置API Keys</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="OpenAI API Key"
              value={apiKeys.openai}
              onChangeText={(text) => setApiKeys({ ...apiKeys, openai: text })}
              style={styles.apiKeyInput}
              secureTextEntry
            />
            <TextInput
              label="Anthropic API Key"
              value={apiKeys.anthropic}
              onChangeText={(text) =>
                setApiKeys({ ...apiKeys, anthropic: text })
              }
              style={styles.apiKeyInput}
              secureTextEntry
            />
            <TextInput
              label="Google API Key"
              value={apiKeys.google}
              onChangeText={(text) => setApiKeys({ ...apiKeys, google: text })}
              style={styles.apiKeyInput}
              secureTextEntry
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowApiKeysDialog(false)}>取消</Button>
            <Button onPress={handleSaveApiKeys}>保存</Button>
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
  settingItem: {
    padding: 16,
    backgroundColor: '#FFF',
  },
  temperatureInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  themeOptions: {
    backgroundColor: '#FFF',
  },
  apiKeyInput: {
    marginBottom: 16,
  },
});
