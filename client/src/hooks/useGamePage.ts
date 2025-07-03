import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useUserContext from './useUserContext';
import { GameErrorPayload, GameInstance, GameUpdatePayload } from '../types';
import { joinGame, leaveGame } from '../services/gamesService';

/**
 * Custom hook to manage the state and logic for the game page, including joining, leaving the game, and handling game updates.
 * @returns An object containing the following:
 * - `gameState`: The current state of the game, or null if no game is joined.
 * - `error`: A string containing any error messages related to the game, or null if no errors exist.
 * - `handleLeaveGame`: A function to leave the current game and navigate back to the game list.
 */
const useGamePage = () => {
  const { user, socket } = useUserContext();
  const { gameID } = useParams();
  const navigate = useNavigate();

  // TODO: Task 2 - Define the state variables:
  // - `gameState` to store the current game state or null if no game is joined.
  // - `joinedGameID` to store the ID of the joined game.
  // - `error` to display any error messages related to the game, or null if no error message.
  const [gameState, setGameState] = useState<GameInstance | null>(null);
  const [joinedGameID, setJoinedGameID] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLeaveGame = async () => {
    // TODO: Task 2 - Implement the logic to leave the current game.
    // - If a game is joined and not over, make the appropriate API call to leave the game, and
    // emit a 'leaveGame' event to the server using the socket.
    if (joinedGameID && gameState?.state.status !== 'OVER') {
      try {
        if (!user.username) throw new Error('Error when fetching user id.');
        const leaveGameState = await leaveGame(joinedGameID, user.username);
        socket?.emit('leaveGame', joinedGameID);
        setGameState(leaveGameState);
        setJoinedGameID(null);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error leaving game:', err);
      }
    }

    // Always navigate back to the games page
    navigate('/games');
  };

  useEffect(() => {
    const handleJoinGame = async (id: string) => {
      // TODO: Task 2 - Implement the logic to join the game with the provided ID,
      // making an API call, emitting a 'joinGame' event to the server using the socket,
      // and setting apporoiate state variables.
      try {
        if (!user.username) throw new Error('Error when fetching username.');
        const joinGameState = await joinGame(id, user.username);
        socket?.emit('joinGame', id);
        setGameState(joinGameState);
        setJoinedGameID(id);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error joining game:', err);
      }
    };

    if (gameID) {
      handleJoinGame(gameID);
    }

    const handleGameUpdate = (updatedState: GameUpdatePayload) => {
      // TODO: Task 2 - Update the game state based on the received update
      if (updatedState.gameState.gameID === joinedGameID) {
        setGameState(updatedState.gameState);
      }
    };

    const handleGameError = (gameError: GameErrorPayload) => {
      // TODO: Task 2 - Display the error if this user caused the error
      if (gameError.player === user.username) {
        setError(gameError.error);
      }
    };

    // TODO: Task 2 - Register socket listeners for 'gameUpdate' and 'gameError' events
    socket?.on('gameUpdate', handleGameUpdate);
    socket?.on('gameError', handleGameError);

    return () => {
      // TODO: Task 2 -  Unsubscribe from the socket event on cleanup
      socket?.off('gameUpdate', handleGameUpdate);
      socket?.off('gameError', handleGameError);
    };
  }, [gameID, socket, user.username, gameState, joinedGameID]);

  return {
    gameState,
    error,
    handleLeaveGame,
  };
};

export default useGamePage;
