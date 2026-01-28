'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Home, MessageSquare, ChevronRight } from 'lucide-react';
import { Card, StatusBadge, LoadingSpinner, EmptyState, Avatar } from '../../components/ui';

interface Conversation {
  bookingId: string;
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'AWAITING_CONFIRMATION' | 'COMPLETED' | 'CANCELLED';
  scheduledDate: string;
}

export default function MessagesPage() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchUnreadCount();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(response.data.data?.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return t('common', 'yesterday');
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="xl" text={t('common', 'loading')} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Home className="w-7 h-7 text-primary" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">{t('common', 'serenity')}</span>
            </Link>
            <div className="flex items-center gap-4">
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {unreadCount} {t('common', 'unread')}
                </span>
              )}
              <Link href="/dashboard" className="text-sm text-primary hover:underline font-medium">
                {t('common', 'backToDashboard')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{t('messages', 'title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('messages', 'subtitle')}
          </p>
        </div>

        {/* Conversations List */}
        {conversations.length === 0 ? (
          <Card padding="lg">
            <EmptyState
              icon={<MessageSquare className="w-8 h-8 text-gray-400" />}
              title={t('messages', 'noMessagesYet')}
              description={t('messages', 'messagesAfterBooking')}
              action={{
                label: t('common', 'findACleaner'),
                onClick: () => router.push('/cleaners'),
              }}
            />
          </Card>
        ) : (
          <Card padding="none">
            {conversations.map((conversation, index) => (
              <Link
                key={conversation.bookingId}
                href={`/messages/${conversation.bookingId}`}
                className={`flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  index !== conversations.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar
                    src={conversation.otherUser.avatar}
                    fallback={`${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`}
                    size="lg"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold truncate text-gray-900 dark:text-white">
                      {conversation.otherUser.firstName} {conversation.otherUser.lastName}
                    </h3>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={conversation.status} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(conversation.scheduledDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {conversation.lastMessage && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                      {conversation.lastMessage.senderId === user.id ? `${t('common', 'you')}: ` : ''}
                      {conversation.lastMessage.content}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <div className="text-gray-400 flex-shrink-0">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Link>
            ))}
          </Card>
        )}
      </main>
    </div>
  );
}
