import { ObjectId } from 'mongodb';
import ChatModel from '../models/chat.model';
import MessageModel from '../models/messages.model';
import UserModel from '../models/users.model';
import { AddMessagePayload, Chat, ChatResponse, CreateChatPayload } from '../types/chat';
import { MessageResponse } from '../types/message';

/**
 * Creates and saves a new chat document in the database, saving messages dynamically.
 *
 * @param chat - The chat object to be saved, including full message objects.
 * @returns {Promise<ChatResponse>} - Resolves with the saved chat or an error message.
 */
export const saveChat = async (chatPayload: CreateChatPayload): Promise<ChatResponse> =>
  // TODO: Task 3 - Implement the saveChat function. Refer to other service files for guidance.
  {
    try {
      const savedChat = await ChatModel.create(chatPayload);
      if (!savedChat) throw new Error('Error fetching chats');
      return savedChat;
    } catch (error) {
      return { error: 'Failed to save chat' };
    }
  };

/**
 * Creates and saves a new message document in the database.
 * @param messageData - The message data to be created.
 * @returns {Promise<MessageResponse>} - Resolves with the created message or an error message.
 */
export const createMessage = async (messageData: AddMessagePayload): Promise<MessageResponse> =>
  // TODO: Task 3 - Implement the createMessage function. Refer to other service files for guidance.
  {
    try {
      const savedMessage = await MessageModel.create(messageData);
      if (!savedMessage) throw new Error('Failed to save the message');
      return savedMessage;
    } catch (error) {
      return { error: 'Failed to save the message' };
    }
  };

/**
 * Adds a message ID to an existing chat.
 * @param chatId - The ID of the chat to update.
 * @param messageId - The ID of the message to add to the chat.
 * @returns {Promise<ChatResponse>} - Resolves with the updated chat object or an error message.
 */
export const addMessageToChat = async (chatId: string, messageId: string): Promise<ChatResponse> =>
  // TODO: Task 3 - Implement the addMessageToChat function. Refer to other service files for guidance.
  {
    try {
      if (!messageId) {
        throw new Error('Invalid message Id');
      }
      const res = await ChatModel.findOneAndUpdate(
        { _id: chatId },
        { $push: { messages: messageId } },
        { new: true },
      );
      if (res == null) {
        throw new Error('Error when adding message to chat');
      }
      return res;
    } catch (error) {
      return { error: 'Error when adding message to chat' };
    }
  };

/**
 * Retrieves a chat document by its ID.
 * @param chatId - The ID of the chat to retrieve.
 * @returns {Promise<ChatResponse>} - Resolves with the found chat object or an error message.
 */
export const getChat = async (chatId: ObjectId): Promise<ChatResponse> =>
  // TODO: Task 3 - Implement the getChat function. Refer to other service files for guidance.
  {
    try {
      const chat = await ChatModel.findById(chatId);
      if (chat == null) {
        throw new Error('Error when retrieving the chat.');
      }
      return chat;
    } catch (error) {
      return { error: 'Error when retrieving the chat.' };
    }
  };

/**
 * Retrieves chats that include all the provided participants.
 * @param p An array of participant usernames to match in the chat's participants.
 * @returns {Promise<Chat[]>} A promise that resolves to an array of chats where the participants match.
 * If no chats are found or an error occurs, the promise resolves to an empty array.
 */
export const getChatsByParticipants = async (p: string[]): Promise<Chat[]> => {
  try {
    // Run all DB lookups in parallel
    const participantDocs = await Promise.all(p.map(username => UserModel.findOne({ username })));

    // Extract non-null _id values
    const users = new Set(
      participantDocs
        .filter(participant => participant) // remove nulls
        .map(participant => participant!._id),
    );

    const chats = await ChatModel.find({ participants: { $all: Array.from(users) } });
    if (!chats) throw new Error('Error fetching chats');

    return chats;
  } catch (error) {
    return [];
  }
};

/**
 * Adds a participant to an existing chat.
 *
 * @param chatId - The ID of the chat to update.
 * @param userId - The ID of the user to add to the chat.
 * @returns {Promise<ChatResponse>} - Resolves with the updated chat object or an error message.
 */
export const addParticipantToChat = async (chatId: string, userId: string): Promise<ChatResponse> =>
  // TODO: Task 3 - Implement the addParticipantToChat function. Refer to other service files for guidance.
  {
    try {
      const chat = await ChatModel.findByIdAndUpdate(chatId, { $push: { participants: userId } });
      if (!chat) {
        throw new Error('Error when adding a participant to an existing chat');
      }
      return chat;
    } catch (error) {
      return { error: 'Error when adding a participant to an existing chat' };
    }
  };
