/**
 * 应用主入口
 * AI Life Assistant - 移动端智能体应用
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { store } from './src/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { theme } from './src/constants/theme';

// 错误边界组件
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>应用出错了</Text>
          <Text style={styles.errorMessage}>{this.state.error?.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <Provider store={store}>
          <PaperProvider theme={theme}>
            <SafeAreaProvider>
              <StatusBar barStyle="dark-content" />
              <AppNavigator />
            </SafeAreaProvider>
          </PaperProvider>
        </Provider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default App;
