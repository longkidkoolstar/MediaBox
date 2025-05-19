import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserSettings } from '../services/userService';
import { UserSettings } from '../types/user';
import { toast } from 'sonner';
import { VideoProvider } from '../services/videoSourceService';

// Default settings
const defaultSettings: UserSettings = {
  defaultSource: VideoProvider.VIDSRC_DEV,
  preferredQuality: '1080p',
  preferredSubtitle: 'English',
  autoplayEnabled: true,
  mutedAutoplay: true
};

export const useUserSettings = () => {
  const { userData, refreshUserData } = useAuth();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Get current settings or default if not available
  const settings = userData?.settings || defaultSettings;

  const updateSettings = useCallback(
    async (newSettings: Partial<UserSettings>) => {
      if (!userData) {
        toast.error('You need to be logged in to update settings');
        return;
      }

      setIsProcessing(true);
      try {
        // Merge current settings with new settings
        const updatedSettings = {
          ...settings,
          ...newSettings
        };

        await updateUserSettings(userData.id, updatedSettings);
        toast.success('Settings updated successfully');
        
        // Refresh user data to update the UI
        await refreshUserData();
      } catch (error) {
        console.error('Error updating settings:', error);
        toast.error('Failed to update settings');
      } finally {
        setIsProcessing(false);
      }
    },
    [userData, settings, refreshUserData]
  );

  return {
    settings,
    updateSettings,
    isProcessing
  };
};
