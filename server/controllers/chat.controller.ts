import express, { Response } from 'express';
import { ObjectId } from 'mongodb';
import {
  saveChat,
  createMessage,
  addMessageToChat,
  getChat,
  addParticipantToChat,
  getChatsByParticipants,
} from '../services/chat.service';
import { populateDocument } from '../utils/database.util';
import {
  CreateChatRequest,
  AddMessageRequestToChat,
  AddParticipantRequest,
  ChatIdRequest,
  GetChatByParticipantsRequest,
  AddMessagePayload,
  ChatResponse,
} from '../types/chat';
import { FakeSOSocket } from '../types/socket';

/*
 * This controller handles chat-related routes.
 * @param socket The socket instance to emit events.
 * @returns {express.Router} The router object containing the chat routes.
 * @throws {Error} Throws an error if the chat creation fails.
 */
const chatController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Validates that the request body contains all required fields for a chat.
   * @param req The incoming request containing chat data.
   * @returns `true` if the body contains valid chat fields; otherwise, `false`.
   */
  const isCreateChatRequestValid = (req: CreateChatRequest): boolean =>
    !!req.body.participants && !!req.body.messages;
  // TODO: Task 3 - Implement the isCreateChatRequestValid function.

  /**
   * Validates that the request body contains all required fields for a message.
   * @param req The incoming request containing message data.
   * @returns `true` if the body contains valid message fields; otherwise, `false`.
   */
  const isAddMessageRequestValid = (req: AddMessageRequestToChat): boolean =>
    !!req.body.msg && !!req.body.msgFrom;
  // TODO: Task 3 - Implement the isAddMessageRequestValid function.

  /**
   * Validates that the request body contains all required fields for a participant.
   * @param req The incoming request containing participant data.
   * @returns `true` if the body contains valid participant fields; otherwise, `false`.
   */
  const isAddParticipantRequestValid = (req: AddParticipantRequest): boolean =>
    !!req.body.participant && !!req.params.chatId;
  // TODO: Task 3 - Implement the isAddParticipantRequestValid function.

  /**
   * Creates a new chat with the given participants (and optional initial messages).
   * @param req The request object containing the chat data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the chat is created.
   * @throws {Error} Throws an error if the chat creation fails.
   */
  const createChatRoute = async (req: CreateChatRequest, res: Response): Promise<void> => {
    // TODO: Task 3 - Implement the createChatRoute function
    // Emit a `chatUpdate` event to share the creation of a new chat
    if (!isCreateChatRequestValid(req)) {
      res.status(400).send('Invalid request');
      return;
    }
    try {
      const savedChat = await saveChat(req.body);

      if (savedChat && 'error' in savedChat) {
        throw new Error(savedChat.error);
      }

      const populatedDoc = await populateDocument(savedChat._id?.toString(), 'chat');

      if (populatedDoc && 'error' in populatedDoc) {
        throw new Error(populatedDoc.error);
      }

      socket.emit('chatUpdate', {
        result: populatedDoc,
        type: 'created',
      });

      res.json(populatedDoc);
    } catch (error) {
      res.status(500).send(`Error when saving chat: ${(error as Error).message}`);
    }
  };

  /**
   * Adds a new message to an existing chat.
   * @param req The request object containing the message data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the message is added.
   * @throws {Error} Throws an error if the message addition fails.
   */
  const addMessageToChatRoute = async (
    req: AddMessageRequestToChat,
    res: Response,
  ): Promise<void> => {
    // TODO: Task 3 - Implement the addMessageToChatRoute function
    // Emit a `chatUpdate` event to share the updated chat, specifically to
    // the chat room where the message was added (hint: look into socket rooms)
    // NOTE: Make sure to define the message type to be a direct message when creating it.
    if (!isAddMessageRequestValid(req)) {
      res.status(400).send('Invalid request');
      return;
    }
    const { chatId } = req.params;
    const message: AddMessagePayload = req.body;
    try {
      const msgFromDb = await createMessage(message);

      if (msgFromDb && 'error' in msgFromDb) {
        throw new Error(msgFromDb.error);
      }

      if (!msgFromDb || !msgFromDb._id) {
        throw new Error('Error when creating the message');
      }

      const status: ChatResponse = await addMessageToChat(
        chatId.toString(),
        msgFromDb._id.toString(),
      );
      if (status && 'error' in status) {
        throw new Error(status.error);
      }

      const populatedDoc = await populateDocument(status._id?.toString(), 'chat');

      socket.to(chatId.toString()).emit('chatUpdate', {
        result: populatedDoc,
        type: 'newMessage',
      });
      res.json(populatedDoc);
    } catch (error) {
      res.status(500).send(`Error when adding message: ${(error as Error).message}`);
    }
  };

  /**
   * Retrieves a chat by its ID, optionally populating participants and messages.
   * @param req The request object containing the chat ID.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the chat is retrieved.
   * @throws {Error} Throws an error if the chat retrieval fails.
   */
  const getChatRoute = async (req: ChatIdRequest, res: Response): Promise<void> => {
    // TODO: Task 3 - Implement the getChatRoute function
    const { chatId } = req.params;

    if (!ObjectId.isValid(chatId)) {
      res.status(400).send('Invalid ID format');
      return;
    }

    try {
      const chat = await getChat(chatId);

      if (!chat) throw new Error('Error getching the chat');

      if (chat && 'error' in chat) {
        throw new Error(chat.error);
      }
      const populatedDoc = await populateDocument(chat._id?.toString(), 'chat');
      if (chat && !chat._id) throw new Error('Invalid chat id');
      socket.to(chatId.toString()).emit('chatUpdate', {
        result: chat,
        type: 'populatedDoc',
      });

      res.json(populatedDoc);
    } catch (err) {
      if (err instanceof Error) {
        res.status(500).send(`Error when fetching chat: ${err}`);
      } else {
        res.status(500).send(`Error when fetching chat`);
      }
    }
  };

  /**
   * Retrieves chats for a user based on their username.
   * @param req The request object containing the username parameter in `req.params`.
   * @param res The response object to send the result, either the populated chats or an error message.
   * @returns {Promise<void>} A promise that resolves when the chats are successfully retrieved and populated.
   */
  const getChatsByUserRoute = async (
    req: GetChatByParticipantsRequest,
    res: Response,
  ): Promise<void> => {
    if (!req.params.username) {
      res.status(400).send('Invalid request');
      return;
    }

    const { username } = req.params;

    try {
      const chats = await getChatsByParticipants([username]);

      if (!Array.isArray(chats)) {
        throw new Error('Unexpected chats response');
      }

      // Run all populateDocument calls in parallel
      const populatedChats = await Promise.all(
        chats.map(async chat => {
          const populated = await populateDocument(chat._id?.toString(), 'chat');

          if (!('participants' in populated && 'messages' in populated)) {
            throw new Error('Failed populating chats');
          }

          return populated;
        }),
      );

      res.status(200).json(populatedChats);
    } catch (err) {
      res.status(500).send(`Error retrieving chat: ${(err as Error).message}`);
    }
  };

  /**
   * Adds a participant to an existing chat.
   * @param req The request object containing the participant data.
   * @param res The response object to send the result.
   * @returns {Promise<void>} A promise that resolves when the participant is added.
   * @throws {Error} Throws an error if the participant addition fails.
   */
  const addParticipantToChatRoute = async (
    req: AddParticipantRequest,
    res: Response,
  ): Promise<void> => {
    // TODO: Task 3 - Implement the addParticipantToChatRoute function
    if (!isAddParticipantRequestValid) {
      res.status(400).send('Invalid request');
      return;
    }
    const { chatId } = req.params;
    const { participant } = req.body;
    try {
      const chat = await addParticipantToChat(chatId.toString(), participant.toString());
      if (!chat) throw new Error('Error when adding participants to chat');
      res.status(200).json(chat);
    } catch (err) {
      res.status(500).send(`Error when adding answer: ${(err as Error).message}`);
    }
  };

  socket.on('connection', conn => {
    // TODO: Task 3 - Implement the `joinChat` event listener on `conn`
    // The socket room will be defined to have the chat ID as the room name
    conn.on('joinChat', (chatID: string) => {
      if (chatID) {
        conn.join(chatID);
      }
    });

    // TODO: Task 3 - Implement the `leaveChat` event listener on `conn`
    // You should only leave the chat if the chat ID is provided/defined
    conn.on('leaveChat', (chatID: string | undefined) => {
      if (chatID) {
        conn.leave(chatID);
      }
    });
  });

  // Register the routes
  // TODO: Task 3 - Add appropriate HTTP verbs and endpoints to the router
  router.get('/getChatsByUser/:username', getChatsByUserRoute);
  router.get('/:chatId', getChatRoute);
  router.post('/:chatId/addMessage', addMessageToChatRoute);
  router.post('/createChat', createChatRoute);

  return router;
};

export default chatController;
