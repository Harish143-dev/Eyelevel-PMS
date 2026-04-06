import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api/axios';
import type { ChatChannel, ChatMessage } from '../../types';

interface ChatState {
  channels: ChatChannel[];
  messages: ChatMessage[];
  activeChannel: ChatChannel | null;
  isLoadingChannels: boolean;
  isLoadingMessages: boolean;
  error: string | null;
}

const initialState: ChatState = {
  channels: [],
  messages: [],
  activeChannel: null,
  isLoadingChannels: false,
  isLoadingMessages: false,
  error: null,
};

export const fetchChannels = createAsyncThunk(
  'chat/fetchChannels',
  async (projectId: string | undefined, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/chat/channels', { params: { projectId } });
      return data.channels;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch channels');
    }
  }
);

export const createChannel = createAsyncThunk(
  'chat/createChannel',
  async (channelData: { name: string; projectId?: string; isDirect?: boolean }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/chat/channels', channelData);
      return data.channel;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create channel');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (channelId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/chat/channels/${channelId}/messages`);
      return data.messages;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ channelId, content }: { channelId: string; content: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/chat/channels/${channelId}/messages`, { content });
      return data.message;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to send message');
    }
  }
);

export const editMessage = createAsyncThunk(
  'chat/editMessage',
  async ({ channelId, messageId, content }: { channelId: string; messageId: string; content: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/chat/channels/${channelId}/messages/${messageId}`, { content });
      return data.message;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to edit message');
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async ({ channelId, messageId }: { channelId: string; messageId: string }, { rejectWithValue }) => {
    try {
      await api.delete(`/chat/channels/${channelId}/messages/${messageId}`);
      return { messageId, channelId };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete message');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChannel: (state, action: PayloadAction<ChatChannel>) => {
      state.activeChannel = action.payload;
    },
    receiveMessage: (state, action: PayloadAction<ChatMessage>) => {
      if (state.activeChannel && state.activeChannel.id === action.payload.channelId) {
        state.messages.push(action.payload);
      }
    },
    receiveEditedMessage: (state, action: PayloadAction<ChatMessage>) => {
      if (state.activeChannel && state.activeChannel.id === action.payload.channelId) {
        const index = state.messages.findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.messages[index] = action.payload;
        }
      }
    },
    receiveDeletedMessage: (state, action: PayloadAction<{ id: string; channelId: string }>) => {
      if (state.activeChannel && state.activeChannel.id === action.payload.channelId) {
        state.messages = state.messages.filter(m => m.id !== action.payload.id);
      }
    },
    clearChatError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChannels.pending, (state) => {
        state.isLoadingChannels = true;
        state.error = null;
      })
      .addCase(fetchChannels.fulfilled, (state, action) => {
        state.isLoadingChannels = false;
        state.channels = action.payload;
      })
      .addCase(fetchChannels.rejected, (state, action) => {
        state.isLoadingChannels = false;
        state.error = action.payload as string;
      })
      .addCase(createChannel.fulfilled, (state, action) => {
        state.channels.push(action.payload);
      })
      .addCase(fetchMessages.pending, (state) => {
        state.isLoadingMessages = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.error = action.payload as string;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const msgExists = state.messages.find(m => m.id === action.payload.id);
        if (!msgExists) {
          state.messages.push(action.payload);
        }
      })
      .addCase(editMessage.fulfilled, (state, action) => {
        const index = state.messages.findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.messages[index] = action.payload;
        }
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.messages = state.messages.filter(m => m.id !== action.payload.messageId);
      });
  },
});

export const { 
  setActiveChannel, 
  receiveMessage, 
  receiveEditedMessage, 
  receiveDeletedMessage, 
  clearChatError 
} = chatSlice.actions;
export default chatSlice.reducer;
