// src/renderer/hooks/useUpdater.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type UpdateChannel = 'latest' | 'beta';

const UPDATE_CHANNEL_KEY = ['update-channel'] as const;
const APP_VERSION_KEY = ['app-version'] as const;

export function useUpdater() {
  const queryClient = useQueryClient();

  // Get current channel
  const { data: currentChannel, isLoading } = useQuery({
    queryKey: UPDATE_CHANNEL_KEY,
    queryFn: async () => {
      const channel = await window.electron.updater.getChannel();
      return channel as UpdateChannel;
    },
  });

  // Get app version
  const { data: appVersion } = useQuery({
    queryKey: APP_VERSION_KEY,
    queryFn: () => window.electron.updater.getVersion(),
  });

  // Switch channel mutation
  const switchChannel = useMutation({
    mutationFn: async (channel: UpdateChannel) => {
      await window.electron.updater.setChannel(channel);
      return channel;
    },
    onSuccess: (channel) => {
      queryClient.invalidateQueries({ queryKey: UPDATE_CHANNEL_KEY });
      toast.success(
        `Switched to ${channel === 'beta' ? 'Beta' : 'Stable'} channel`,
        {
          description: 'Checking for updates...',
        },
      );
    },
    onError: () => {
      toast.error('Failed to switch update channel');
    },
  });

  // Check for updates
  const checkForUpdates = () => {
    window.electron.updater.checkForUpdates();
    toast.info('Checking for updates...', {
      description: 'This may take a few moments',
    });
  };

  return {
    currentChannel,
    appVersion,
    isLoading,
    switchChannel: switchChannel.mutate,
    isSwitching: switchChannel.isPending,
    checkForUpdates,
  };
}
