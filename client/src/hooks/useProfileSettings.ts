import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
  getUserByUsername,
  deleteUser,
  resetPassword,
  updateBiography,
} from '../services/userService';
import { User } from '../types';
import useUserContext from './useUserContext';

/**
 * A custom hook to encapsulate all logic/state for the ProfileSettings component.
 */
const useProfileSettings = () => {
  // Gets the username of the user being viewed from the URL
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  // This is the user currently logged in
  const { user: currentUser } = useUserContext();

  // Local state
  const [userData, setUserData] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [editBioMode, setEditBioMode] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // For delete-user confirmation modal
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  // TODO: Task 1 - Determine if the current user can edit the profile being viewed
  const canEditProfile = currentUser?.username === username; // Replace false with the correct condition

  useEffect(() => {
    if (!username) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const data = await getUserByUsername(username);
        setUserData(data);
      } catch (error) {
        setSuccessMessage(null);
        setErrorMessage('Error fetching user profile');
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  /**
   * Toggles the visibility of the password fields.
   */
  const togglePasswordVisibility = () => {
    // TODO: Task 1 - Toggle the password visibility.
    setShowPassword(!showPassword);
  };

  /**
   * Validate the password fields before attempting to reset.
   */
  const validatePasswords = () => {
    // TODO: Task 1 - Validate the reset password fields and return whether they match
    if (!newPassword) {
      setSuccessMessage(null);
      setErrorMessage('Please enter the new password');
      return false;
    }
    if (!confirmNewPassword) {
      setSuccessMessage(null);
      setErrorMessage('Please re-enter the new password');
      return false;
    }
    if (newPassword !== confirmNewPassword) {
      setSuccessMessage(null);
      setErrorMessage('Passwords do not match. Try again');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  /**
   * Handler for resetting the password
   */
  const handleResetPassword = async () => {
    if (!username) return;

    // TODO: Task 1 - Implement the password reset functionality.
    // Validate the password fields, then call the resetPassword service.
    // Display success or error messages accordingly, and clear the password fields.
    if (!validatePasswords()) return;

    try {
      const user: User = await resetPassword(username, newPassword);
      setErrorMessage(null);
      setSuccessMessage('Password reset successful!');
      setUserData(user);
    } catch (error) {
      setSuccessMessage(null);
      setErrorMessage(`Password reset failed! ${error}`);
    } finally {
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  const handleUpdateBiography = async () => {
    if (!username) return;

    // TODO: Task 1 - Implement the biography update functionality.
    // Call the updateBiography service, set the updated user,
    // then display success or error messages.

    try {
      const user: User = await updateBiography(username, newBio);
      setErrorMessage(null);
      setSuccessMessage('Biography update successful!');
      setUserData(user);
    } catch (error) {
      setSuccessMessage(null);
      setErrorMessage(`Biography updated Failed ${error}`);
    } finally {
      setEditBioMode(false);
    }
  };

  /**
   * Handler for deleting the user (triggers confirmation modal)
   */
  const handleDeleteUser = () => {
    if (!username) return;

    // Display the confirmation modal
    setShowConfirmation(true);
    setPendingAction(() => async () => {
      // TODO: Task 1 - Call the deleteUser service and handle the response,
      // displating success or error messages accordingly.

      try {
        await deleteUser(username);
        setErrorMessage(null);
        setSuccessMessage('User deleted successfuly');
        // Navigate home after successful deletion
        navigate('/');
      } catch (error) {
        // Error handling
        setSuccessMessage(null);
        setErrorMessage('User deletion failed');
      } finally {
        // Hide the confirmation modal after completion
        setShowConfirmation(false);
      }
    });
  };

  return {
    userData,
    newPassword,
    confirmNewPassword,
    setNewPassword,
    setConfirmNewPassword,
    loading,
    editBioMode,
    setEditBioMode,
    newBio,
    setNewBio,
    successMessage,
    errorMessage,
    showConfirmation,
    setShowConfirmation,
    pendingAction,
    setPendingAction,
    canEditProfile,
    showPassword,
    togglePasswordVisibility,
    handleResetPassword,
    handleUpdateBiography,
    handleDeleteUser,
  };
};

export default useProfileSettings;
