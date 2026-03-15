import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput as RNTextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Pressable,
} from 'react-native';
import { Text, Avatar, IconButton, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chatApi } from '../services';
import { Message, User } from '../types';
import { colors, useThemeColors, spacing, borderRadius } from '../theme';

interface ChatScreenProps {
  navigation: any;
  route: {
    params: {
      conversationId?: number;
      otherUser: User;
      signalId?: number;
      demandId?: number;
    };
  };
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const colors = useThemeColors();
  const { conversationId: initialConversationId, otherUser, signalId, demandId } = route.params;
  const [conversationId, setConversationId] = useState<number | null>(initialConversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(!!initialConversationId);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    return () => showSub.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (conversationId) {
        loadMessages();
        markAsRead();
      } else {
        setLoading(false);
      }
    }, [conversationId])
  );

  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(() => {
      loadMessages(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  const loadMessages = async (silent = false) => {
    if (!conversationId) return;
    try {
      if (!silent) setLoading(true);
      const response = await chatApi.getMessages(conversationId);
      setMessages(response.data.data.reverse());
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!conversationId) return;
    try {
      await chatApi.markRead(conversationId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    Keyboard.dismiss();
    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    const tempMessage: Message = {
      id: Date.now(),
      conversation_id: conversationId || 0,
      sender: { id: 0, name: '' },
      content: messageText,
      type: 'text',
      media_url: null,
      is_mine: true,
      is_read: false,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      if (!conversationId) {
        const response = await chatApi.startConversation({
          user_id: otherUser.id,
          signal_id: signalId,
          demand_id: demandId,
          initial_message: messageText,
        });
        setConversationId(response.data.data.id);
        await loadMessagesById(response.data.data.id);
      } else {
        await chatApi.sendMessage(conversationId, messageText);
        await loadMessages(true);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const loadMessagesById = async (convId: number) => {
    try {
      const response = await chatApi.getMessages(convId);
      setMessages(response.data.data.reverse());
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const renderDateSeparator = (dateString: string) => (
    <View style={styles.dateSeparator}>
      <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
      <Text style={[styles.dateText, { color: colors.text.light }]}>{formatDate(dateString)}</Text>
      <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
    </View>
  );

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const showDate = index === 0 || formatDate(item.created_at) !== formatDate(messages[index - 1].created_at);
    return (
      <>
        {showDate && renderDateSeparator(item.created_at)}
        <Pressable style={[
          styles.messageBubble, 
          item.is_mine ? styles.myMessage : [styles.theirMessage, { backgroundColor: colors.background.light }]
        ]}>
          <Text style={[
            styles.messageText, 
            item.is_mine ? styles.myMessageText : [styles.theirMessageText, { color: colors.text.header }]
          ]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime, 
              item.is_mine ? styles.myMessageTime : [styles.theirMessageTime, { color: colors.text.light }]
            ]}>
              {formatTime(item.created_at)}
            </Text>
            {item.is_mine && <Text style={styles.readStatus}>{item.read_at ? '✓✓' : '✓'}</Text>}
          </View>
        </Pressable>
      </>
    );
  };

  if (loading && messages.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.default }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.default }]}>
      {/* Custom Header */}
      <View style={[styles.customHeader, { paddingTop: insets.top, backgroundColor: colors.background.default, borderBottomColor: colors.border }]}>
        <IconButton icon="arrow-left" iconColor={colors.text.header} onPress={() => navigation.goBack()} />
        <Avatar.Text size={36} label={otherUser.name?.[0]?.toUpperCase() || 'U'} style={{ backgroundColor: colors.primary }} />
        <Text style={[styles.headerTitle, { color: colors.text.header }]} numberOfLines={1}>{otherUser.name}</Text>
        <IconButton icon="dots-vertical" iconColor={colors.text.light} size={24} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={[styles.inputContainer, { 
          paddingBottom: Math.max(insets.bottom, spacing.md),
          backgroundColor: colors.background.default,
          borderTopColor: colors.border
        }]}>
          <RNTextInput
            style={[styles.textInput, { backgroundColor: colors.background.light, color: colors.text.header }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.text.light}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <IconButton icon="send" iconColor="#fff" size={22} style={styles.sendIcon} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginLeft: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  messagesList: {
    padding: spacing.md,
    flexGrow: 1,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dateText: {
    paddingHorizontal: spacing.md,
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  theirMessageTime: {
    color: 'rgba(255,255,255,0.5)',
  },
  readStatus: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
  sendIcon: {
    margin: 0,
  },
});

export default ChatScreen;
