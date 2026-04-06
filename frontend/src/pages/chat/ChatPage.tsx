import React, { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchChannels, fetchMessages, sendMessage, setActiveChannel, createChannel, editMessage, deleteMessage } from '../../store/slices/chatSlice';
import { socketService } from '../../services/socket/socketService';
import { Hash, Send, Plus, MessageSquare, Loader2, Edit2, Trash2, X, Check } from 'lucide-react';
import Avatar from '../../components/Avatar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

const ChatPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { channels, messages, activeChannel, isLoadingChannels, isLoadingMessages } = useAppSelector(
    (state) => state.chat
  );

  const [messageText, setMessageText] = useState('');
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  
  // Editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  
  // Deleting state
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial load: Fetch list of channels
  useEffect(() => {
    dispatch(fetchChannels(undefined));
  }, [dispatch]);

  // When channels load, default to the first one if none is active
  useEffect(() => {
    if (channels.length > 0 && !activeChannel) {
      dispatch(setActiveChannel(channels[0]));
    }
  }, [channels, activeChannel, dispatch]);

  // Handle active channel change: fetch messages and join socket room
  useEffect(() => {
    if (activeChannel) {
      dispatch(fetchMessages(activeChannel.id));
      socketService.joinChannel(activeChannel.id);
    }
    return () => {
      if (activeChannel) {
        socketService.leaveChannel(activeChannel.id);
      }
    };
  }, [activeChannel, dispatch]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChannel) return;

    try {
      await dispatch(sendMessage({ channelId: activeChannel.id, content: messageText })).unwrap();
      setMessageText('');
    } catch (error: any) {
      toast.error(error || 'Failed to send message');
    }
  };

  const handleEditSave = async (messageId: string) => {
    if (!editContent.trim() || !activeChannel) return;
    try {
      await dispatch(editMessage({ 
        channelId: activeChannel.id, 
        messageId, 
        content: editContent.trim() 
      })).unwrap();
      setEditingMessageId(null);
      setEditContent('');
      toast.success('Message updated');
    } catch (error: any) {
      toast.error(error || 'Failed to update message');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMessageId || !activeChannel) return;
    try {
      await dispatch(deleteMessage({ 
        channelId: activeChannel.id, 
        messageId: deletingMessageId 
      })).unwrap();
      setDeletingMessageId(null);
      toast.success('Message deleted');
    } catch (error: any) {
      toast.error(error || 'Failed to delete message');
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      const channel = await dispatch(createChannel({ name: newChannelName.trim() })).unwrap();
      setNewChannelName('');
      setIsChannelModalOpen(false);
      dispatch(setActiveChannel(channel));
      toast.success('Channel created');
    } catch (error: any) {
      toast.error(error || 'Failed to create channel');
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-surface border border-border rounded-xl shadow-sm overflow-hidden text-left">
      {/* Channels Sidebar */}
      <div className="w-64 border-r border-border flex flex-col bg-surface-hover">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-text-main flex items-center gap-2">
            <MessageSquare size={18} />
            Channels
          </h2>
          <button
            onClick={() => setIsChannelModalOpen(true)}
            className="p-1.5 rounded-md text-text-muted hover:bg-background hover:text-text-main transition-colors"
            title="Create Channel"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {isLoadingChannels && channels.length === 0 ? (
            <div className="flex justify-center p-4">
               <Loader2 size={20} className="text-primary animate-spin" />
            </div>
          ) : (
            channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => dispatch(setActiveChannel(channel))}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeChannel?.id === channel.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-text-muted hover:bg-background hover:text-text-main'
                }`}
              >
                <Hash size={16} />
                <span className="truncate">{channel.name}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background relative">
        {activeChannel ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-surface flex items-center">
              <div className="flex items-center gap-2">
                <Hash size={20} className="text-text-muted" />
                <h2 className="font-bold text-text-main">{activeChannel.name}</h2>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
              {isLoadingMessages && messages.length === 0 ? (
                <div className="flex justify-center p-10">
                  <Loader2 size={24} className="text-primary animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-text-muted">
                  <MessageSquare size={48} className="opacity-20 mb-4" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMine = msg.userId === user?.id;
                  const isAdmin = user?.role === 'admin';
                  const previousMsg = index > 0 ? messages[index - 1] : null;
                  const showHeader = !previousMsg || previousMsg.userId !== msg.userId;
                  const isEditing = editingMessageId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 group/msg max-w-[80%] ${isMine ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      {showHeader ? (
                        <div className="flex-shrink-0 mt-1">
                          <Avatar
                            name={msg.user?.name || 'Unknown'}
                            color={msg.user?.avatarColor || '#6366f1'}
                            size={32}
                          />
                        </div>
                      ) : (
                        <div className="w-8 flex-shrink-0" />
                      )}

                      <div className={`flex flex-col relative ${isMine ? 'items-end' : 'items-start'}`}>
                        {showHeader && (
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-sm font-medium text-text-main">
                              {isMine ? 'You' : msg.user?.name}
                            </span>
                            <span className="text-xs text-text-muted">
                              {formatMessageTime(msg.createdAt)}
                            </span>
                            {msg.isEdited && (
                              <span className="text-[10px] text-text-muted italic">(edited)</span>
                            )}
                          </div>
                        )}
                        
                        <div className="relative group/bubble">
                          {isEditing ? (
                            <div className="flex flex-col gap-2 min-w-[200px] bg-surface p-2 rounded-xl border border-primary/30 shadow-sm">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-transparent text-sm text-text-main focus:outline-none resize-none p-1"
                                rows={2}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleEditSave(msg.id);
                                  }
                                  if (e.key === 'Escape') setEditingMessageId(null);
                                }}
                              />
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => setEditingMessageId(null)}
                                  className="p-1 hover:bg-background rounded text-text-muted transition-colors"
                                >
                                  <X size={14} />
                                </button>
                                <button 
                                  onClick={() => handleEditSave(msg.id)}
                                  className="p-1 bg-primary/10 text-primary hover:bg-primary/20 rounded transition-colors"
                                >
                                  <Check size={14} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div
                                className={`px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap relative ${
                                  isMine
                                    ? 'bg-primary text-white rounded-tr-sm'
                                    : 'bg-surface border border-border text-text-main rounded-tl-sm'
                                }`}
                              >
                                {msg.content}
                              </div>
                              
                              {/* Message Actions */}
                              {(isMine || isAdmin) && (
                                <div className={`absolute top-0 opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center bg-background border border-border shadow-sm rounded-lg overflow-hidden z-10 ${isMine ? 'right-full mr-2' : 'left-full ml-2'}`}>
                                  {isMine && (
                                    <button
                                      onClick={() => {
                                        setEditingMessageId(msg.id);
                                        setEditContent(msg.content);
                                      }}
                                      className="p-1.5 hover:bg-surface text-text-muted hover:text-primary transition-colors border-r border-border"
                                      title="Edit message"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setDeletingMessageId(msg.id)}
                                    className="p-1.5 hover:bg-surface text-text-muted hover:text-danger transition-colors"
                                    title="Delete message"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-surface">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Message #${activeChannel.name}...`}
                  className="flex-1 mb-0"
                />
                <Button type="submit" disabled={!messageText.trim()} className="mt-6 flex-shrink-0">
                  <Send size={18} />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted p-6 text-center">
            <MessageSquare size={64} className="opacity-10 mb-6" />
            <h3 className="text-xl font-medium text-text-main mb-2">Welcome to Team Chat</h3>
            <p className="max-w-md">
              Select an existing channel from the left sidebar or create a new one to start communicating with your team.
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isChannelModalOpen}
        onClose={() => setIsChannelModalOpen(false)}
        title="Create New Channel"
      >
        <form onSubmit={handleCreateChannel} className="space-y-4">
          <Input
            label="Channel Name"
            placeholder="e.g. general, frontend-dev"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            required
            autoComplete="off"
            maxLength={30}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsChannelModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={!newChannelName.trim()}>
              Create Channel
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingMessageId}
        onClose={() => setDeletingMessageId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete Message"
        variant="danger"
      />
    </div>
  );
};

export default ChatPage;
