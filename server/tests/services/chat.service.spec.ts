/* eslint-disable @typescript-eslint/no-var-requires */
import mongoose from 'mongoose';

import ChatModel from '../../models/chat.model';
import MessageModel from '../../models/messages.model';
import UserModel from '../../models/users.model';
import {
  saveChat,
  createMessage,
  addMessageToChat,
  getChat,
  addParticipantToChat,
  getChatsByParticipants,
} from '../../services/chat.service';
import { Chat, CreateChatPayload } from '../../types/chat';
import { Message } from '../../types/message';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockingoose = require('mockingoose');

describe('Chat service', () => {
  beforeEach(() => {
    mockingoose.resetAll();
    jest.clearAllMocks();
  });

  // ----------------------------------------------------------------------------
  // 1. saveChat
  // ----------------------------------------------------------------------------
  describe('saveChat', () => {
    // TODO: Task 3 - Write tests for the saveChat function

    it('should successfully save a chat and verify its body (ignore exact IDs)', async () => {
      // 2) Mock message creation
      // 3) Mock chat creation
      mockingoose(ChatModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId(),
          participants: [new mongoose.Types.ObjectId()],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        'create',
      );

      const mockChatPayload: CreateChatPayload = {
        participants: [new mongoose.Types.ObjectId()],
        messages: [],
      };

      // 4) Call the service
      const result = await saveChat(mockChatPayload);
      console.log(result);
      // 5) Verify no error
      if ('error' in result) {
        throw new Error(`Expected a Chat, got error: ${result.error}`);
      }

      expect(result).toHaveProperty('_id');
      expect(Array.isArray(result.participants)).toBe(true);
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.participants[0]?.toString()).toEqual(expect.any(String));
      expect(result.messages.length).toEqual(0);
    });
    it('should handle empty participants array gracefully', async () => {
  const payload: CreateChatPayload = {
    participants: [],
    messages: [],
  };

  const savedChatMock = {
    _id: new mongoose.Types.ObjectId(),
    participants: [],
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockingoose(ChatModel).toReturn(savedChatMock, 'create');

  const result = await saveChat(payload);

  if ('error' in result) throw new Error(result.error);

  expect(result.participants).toHaveLength(0);
  expect(result.messages).toHaveLength(0);
});

  });

  // ----------------------------------------------------------------------------
  // 2. createMessage
  // ----------------------------------------------------------------------------
  describe('createMessage', () => {
    // TODO: Task 3 - Write tests for the createMessage function
    const mockMessage: Message = {
      msg: 'Hey!',
      msgFrom: 'userX',
      msgDateTime: new Date('2025-01-01T10:00:00.000Z'),
      type: 'direct',
    };

    it('should create a message successfully if user exists', async () => {
      // Mock the user existence check
      mockingoose(UserModel).toReturn(
        { _id: new mongoose.Types.ObjectId(), username: 'userX' },
        'findOne',
      );

      // Mock the created message
      const mockCreatedMsg = {
        _id: new mongoose.Types.ObjectId(),
        ...mockMessage,
      };
      mockingoose(MessageModel).toReturn(mockCreatedMsg, 'create');

      const result = await createMessage(mockMessage);

      expect(result).toMatchObject({
        msg: 'Hey!',
        msgFrom: 'userX',
        msgDateTime: new Date('2025-01-01T10:00:00.000Z'),
        type: 'direct',
      });
    });
    
  });

  // ----------------------------------------------------------------------------
  // 3. addMessageToChat
  // ----------------------------------------------------------------------------
  describe('addMessageToChat', () => {
    // TODO: Task 3 - Write tests for the addMessageToChat function
    it('should add a message ID to an existing chat', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messageId = new mongoose.Types.ObjectId().toString();

      const mockUpdatedChat: Chat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['testUser'],
        messages: [new mongoose.Types.ObjectId()],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Chat;

      // Mock findByIdAndUpdate
      mockingoose(ChatModel).toReturn(mockUpdatedChat, 'findOneAndUpdate');

      const result = await addMessageToChat(chatId, messageId);
      if ('error' in result) {
        throw new Error('Expected a chat, got an error');
      }

      expect(result.messages).toEqual(mockUpdatedChat.messages);
    });
  });

  // ----------------------------------------------------------------------------
  // 5. addParticipantToChat
  // ----------------------------------------------------------------------------
  describe('addParticipantToChat', () => {
    // TODO: Task 3 - Write tests for the addParticipantToChat function
    it('should add a participant if user exists', async () => {
      // Mock user
      mockingoose(UserModel).toReturn(
        { _id: new mongoose.Types.ObjectId(), username: 'testUser' },
        'findOne',
      );

      const mockChat: Chat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['testUser'],
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Chat;

      mockingoose(ChatModel).toReturn(mockChat, 'findOneAndUpdate');

      const result = await addParticipantToChat(mockChat._id!.toString(), 'newUserId');
      if ('error' in result) {
        throw new Error('Expected a chat, got an error');
      }
      expect(result._id).toEqual(mockChat._id);
    });
  });

  describe('getChatsByParticipants', () => {
    it('should retrieve chats by participants', async () => {
      const mockUser1 = {
        _id: new mongoose.Types.ObjectId('6858d8559b4d68f861e2a727'),
        username: 'user1',
      };

      const mockUser2 = {
        _id: new mongoose.Types.ObjectId('6858d8559b4d68f861e2a728'),
        username: 'user2',
      };

      const mockChats: Chat[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          participants: [mockUser1._id, mockUser2._id],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          participants: [mockUser1._id, new mongoose.Types.ObjectId()],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockingoose(UserModel).toReturn((query: any) => {
        const { username } = query.getQuery();
        if (username === 'user1') return mockUser1;
        if (username === 'user2') return mockUser2;
        return null;
      }, 'findOne');
      mockingoose(ChatModel).toReturn([mockChats[0]], 'find');

      const result = await getChatsByParticipants(['user1', 'user2']);
      expect(result).toHaveLength(1);
      expect(result).toMatchObject([mockChats[0]]);
    });

    it('should retrieve chats by participants where the provided list is a subset', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId('6858d8559b4d68f861e2a727'),
        username: 'user1',
      };
      const mockChats: Chat[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          participants: [mockUser._id, new mongoose.Types.ObjectId()],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          participants: [mockUser._id, new mongoose.Types.ObjectId()],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          participants: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockingoose(UserModel).toReturn(mockUser, 'findOne');

      mockingoose(ChatModel).toReturn([mockChats[0], mockChats[1]], 'find');

      const result = await getChatsByParticipants(['user1']);
      console.log(result);
      expect(result).toHaveLength(2);
      expect(result).toMatchObject([mockChats[0], mockChats[1]]);
    });

    it('should return an empty array if no chats are found', async () => {
      mockingoose(ChatModel).toReturn([], 'find');

      const result = await getChatsByParticipants(['user1']);
      expect(result).toHaveLength(0);
    });

    it('should return an empty array if chats is null', async () => {
      mockingoose(ChatModel).toReturn(null, 'find');

      const result = await getChatsByParticipants(['user1']);
      expect(result).toHaveLength(0);
    });

    it('should return an empty array if a database error occurs', async () => {
      mockingoose(ChatModel).toReturn(new Error('database error'), 'find');

      const result = await getChatsByParticipants(['user1']);
      expect(result).toHaveLength(0);
    });
  });

  it('should return an empty array if none of the provided usernames exist', async () => {
    mockingoose(UserModel).toReturn(null, 'findOne');
    mockingoose(ChatModel).toReturn([], 'find');

    const result = await getChatsByParticipants(['ghost1', 'ghost2']);
    expect(result).toHaveLength(0);
  });

  it('should return an empty array if participant list is empty', async () => {
    const result = await getChatsByParticipants([]);
    expect(result).toHaveLength(0);
  });
});
