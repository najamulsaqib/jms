// src/renderer/hooks/useUpdater.ts
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type UpdateChannel = 'latest' | 'beta';

export function useUpdater() {
  const queryClient = useQueryClient();

  // Get current channel
  const { data: currentChannel, isLoading } = useQuery({
    queryKey: ['update-channel'],
    queryFn: async () => {
      const channel = await window.electron.updater.getChannel();
      return channel as UpdateChannel;
    },
  });

  // Get app version
  const { data: appVersion } = useQuery({
    queryKey: ['app-version'],
    queryFn: () => window.electron.updater.getVersion(),
  });

  // Switch channel mutation
  const switchChannel = useMutation({
    mutationFn: async (channel: UpdateChannel) => {
      await window.electron.updater.setChannel(channel);
      return channel;
    },
    onSuccess: (channel) => {
      queryClient.invalidateQueries({ queryKey: ['update-channel'] });
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
