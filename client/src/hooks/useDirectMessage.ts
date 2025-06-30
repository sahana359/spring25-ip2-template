import { useEffect, useState } from 'react';
import { Chat, ChatUpdatePayload, Message, User } from '../types';
import useUserContext from './useUserContext';
import { createChat, getChatById, getChatsByUser, sendMessage } from '../services/chatService';

/**
 * useDirectMessage is a custom hook that provides state and functions for direct messaging between users.
 * It includes a selected user, messages, and a new message state.
 */

const useDirectMessage = () => {
  const { user, socket } = useUserContext();
  const [showCreatePanel, setShowCreatePanel] = useState<boolean>(false);
  const [chatToCreate, setChatToCreate] = useState<User | null>(null);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const handleJoinChat = (chatID: string) => {
    // TODO: Task 3 - Emit a 'joinChat' event to the socket with the chat ID function argument.
    if (socket && chatID) socket.emit('joinChat', chatID);
  };

  const handleSendMessage = async () => {
    // TODO: Task 3 - Implement the send message handler function.
    // Whitespace-only messages should not be sent, and the current chat to send this message to
    // should be defined. Use the appropriate service function to make an API call, and update the
    // states accordingly.
    const chatId = selectedChat?._id;
    if (newMessage.trim() && chatId && user._id) {
      const message: Message = {
        msg: newMessage,
        msgDateTime: new Date(),
        msgFrom: user.username,
        type: 'direct',
      };
      try {
        const updatedChat = await sendMessage(message, chatId);
        if (!updatedChat) throw new Error('Error when fetching selected chat');
        setSelectedChat(updatedChat);
        setNewMessage('');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleChatSelect = async (chatID: string | undefined) => {
    // TODO: Task 3 - Implement the chat selection handler function.
    // If the chat ID is defined, fetch the chat details using the appropriate service function,
    // and update the appropriate state variables. Make sure the client emits a socket event to
    // subscribe to the chat room.
    if (socket && chatID) {
      try {
        const fetchedChat = await getChatById(chatID);
        if (!fetchedChat) {
          throw new Error('Error when fetching selected chat');
        }
        setSelectedChat(fetchedChat);
        setNewMessage('');
        handleJoinChat(chatID);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUserSelect = (selectedUser: User) => {
    setChatToCreate(selectedUser);
  };

  const handleCreateChat = async () => {
    // TODO: Task 3 - Implement the create chat handler function.
    // If the username to create a chat is defined, use the appropriate service function to create a new chat
    // between the current user and the chosen user. Update the appropriate state variables and emit a socket
    // event to join the chat room. Hide the create panel after creating the chat.
    if (chatToCreate && chatToCreate?._id && user._id) {
      try {
        const fetchedChat = await createChat([chatToCreate?._id, user._id]);
        if (!fetchedChat) {
          throw new Error('Error when fetching selected chat');
        }
        setSelectedChat(fetchedChat);
        setNewMessage('');
        handleJoinChat(fetchedChat._id);
        setShowCreatePanel(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    const fetchChats = async () => {
      // TODO: Task 3 - Fetch all the chats with the current user and update the state variable.
      try {
        const fetchedChats = await getChatsByUser(user.username);
        if (!fetchedChats) throw new Error('Error when fetching the chats');
        setChats(fetchedChats);
      } catch (err) {
        console.error(err);
      }
    };

    const handleChatUpdate = (chatUpdate: ChatUpdatePayload) => {
      // TODO: Task 3 - Implement the chat update handler function.
      // This function is responsible for updating the state variables based on the
      // socket events received. The function should handle the following cases:
      // - A new chat is created (add the chat to the current list of chats)
      // - A new message is received (update the selected chat with the new message)
      // - Throw an error for an invalid chatUpdate type
      // NOTE: For new messages, the user will only receive the update if they are
      // currently subscribed to the chat room.
      try {
        if (chatUpdate.type === 'created') {
          setChats(prev => [...prev, chatUpdate.result]);
        } else if (chatUpdate.type === 'newMessage') {
          if (selectedChat && chatUpdate.result._id === selectedChat._id)
            setSelectedChat(chatUpdate.result);
        } else {
          throw new Error('Error when updating chat');
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchChats();

    // TODO: Task 3 - Register the 'chatUpdate' event listener

    socket?.on('chatUpdate', handleChatUpdate);
    return () => {
      // TODO: Task 3 - Unsubscribe from the socket event
      // TODO: Task 3 - Emit a socket event to leave the particular chat room
      // they are currently in when the component unmounts.
      if (selectedChat?._id) {
        socket?.emit('leaveChat', selectedChat._id);
      }
      socket?.off('chatUpdate', handleChatUpdate);
    };
  }, [user.username, socket, selectedChat?._id]);

  return {
    selectedChat,
    chatToCreate,
    chats,
    newMessage,
    setNewMessage,
    showCreatePanel,
    setShowCreatePanel,
    handleSendMessage,
    handleChatSelect,
    handleUserSelect,
    handleCreateChat,
  };
};

export default useDirectMessage;
