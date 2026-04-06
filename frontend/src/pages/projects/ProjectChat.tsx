import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api/axios';
import type { ChatMessage } from '../../types';
import Avatar from '../../components/Avatar';
import { Send } from 'lucide-react';
import { socketService } from '../../services/socket/socketService';
import { useAppSelector } from '../../hooks/useRedux';

interface Props {
  projectId: string;
}

const ProjectChat: React.FC<Props> = ({ projectId }) => {
  const { user } = useAppSelector(state => state.auth);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch or create channel for project
    initChannel();
  }, [projectId]);

  const initChannel = async () => {
    try {
      let res = await api.get(`/chat/channels?projectId=${projectId}`);
      let channel = res.data.channels[0];
      
      if (!channel) {
        res = await api.post(`/chat/channels`, { name: 'General', projectId, isDirect: false });
        channel = res.data.channel;
      }
      
      setChannelId(channel.id);
      
      const msgRes = await api.get(`/chat/channels/${channel.id}/messages`);
      setMessages(msgRes.data.messages);

      // join socket
      socketService.socket?.emit('channel:join', channel.id);
      
      // Clean up any stale listener before adding
      socketService.socket?.off('chat:message');
      socketService.socket?.on('chat:message', (msg: ChatMessage) => {
        if (msg.channelId === channel.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      });
      
    } catch (err) {
      console.error('Chat init error', err);
    }
  };

  useEffect(() => {
    return () => {
      if (channelId) socketService.socket?.emit('channel:leave', channelId);
      socketService.socket?.off('chat:message');
    };
  }, [channelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !channelId) return;
    
    try {
      // The socket event comes back and adds the message, so we don't need to manually update state here
      // But we can eagerly update for snappiness if needed. Let's rely on socket for simplicity.
      await api.post(`/chat/channels/${channelId}/messages`, { content: newMessage });
      setNewMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-[600px] border border-border rounded-xl bg-surface overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-background/50 flex justify-between items-center">
        <h3 className="font-bold text-text-main">Team Chat</h3>
        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-bold">Live</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-background/30">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted italic text-sm">
            Begin the conversation...
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.userId === user?.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-end gap-2 max-w-[80%]">
                  {!isMe && msg.user && <Avatar name={msg.user.name} color={msg.user.avatarColor} size={28} />}
                  <div className={`p-3 rounded-2xl ${isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-surface border border-border rounded-bl-sm text-text-main'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
                <span className="text-[10px] text-text-muted mt-1 px-1">{msg.user?.name} &bull; {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-background border-t border-border">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProjectChat;
