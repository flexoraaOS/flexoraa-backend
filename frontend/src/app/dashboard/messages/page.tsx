"use client";

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/api/supabase-client';
import { useAppSelector } from '@/lib/hooks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Search, User as UserIcon, Loader2, MessageSquare, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export default function MessagesPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Fetch profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id);

        if (error) throw error;
        setProfiles(data || []);
      } catch (error) {
        console.error('Error fetching profiles:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [user]);

  // Fetch messages when selectedUser changes
  useEffect(() => {
    if (!user || !selectedUser) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);
        scrollToBottom();
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.sender_id === selectedUser.id) {
            setMessages((prev) => [...prev, newMessage]);
            scrollToBottom();
          } else {
            toast.info(`New message from a user`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUser]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedUser) return;

    setSending(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedUser.id,
          content: newMessage.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) => [...prev, data]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const filteredProfiles = profiles.filter((profile) => {
    const fullName = `${profile.first_name} ${profile.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-background border rounded-xl overflow-hidden shadow-sm">
      {/* Sidebar - Users List */}
      <div className={`w-full md:w-80 border-r flex flex-col bg-muted/10 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Messages
          </h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredProfiles.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No users found
              </div>
            ) : (
              filteredProfiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => setSelectedUser(profile)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    selectedUser?.id === profile.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  <Avatar>
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback>{getInitials(profile.first_name, profile.last_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium truncate">
                      {profile.first_name} {profile.last_name}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center gap-3 bg-background/50 backdrop-blur-sm">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSelectedUser(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar>
                <AvatarImage src={selectedUser.avatar_url} />
                <AvatarFallback>{getInitials(selectedUser.first_name, selectedUser.last_name)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">
                  {selectedUser.first_name} {selectedUser.last_name}
                </h3>
              </div>
            </div>

            {/* Messages List */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                    <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-br-none'
                              : 'bg-muted rounded-bl-none'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <span className={`text-[10px] block mt-1 opacity-70 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {format(new Date(msg.created_at), 'HH:mm')}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-background">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={sending}
                />
                <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <UserIcon className="h-8 w-8 opacity-50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Select a user</h3>
            <p className="text-center max-w-sm">
              Choose a user from the sidebar to start messaging.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
