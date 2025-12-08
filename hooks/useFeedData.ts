import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FeedItem } from '../types';
import * as dataService from '../services/dataService';
import { refreshAllFeeds } from '../services/feedService';

// Query Keys
export const feedKeys = {
  all: ['feed'] as const,
  lists: () => [...feedKeys.all, 'list'] as const,
  list: (filters: string) => [...feedKeys.lists(), filters] as const,
  details: () => [...feedKeys.all, 'detail'] as const,
  detail: (id: string) => [...feedKeys.details(), id] as const,
};

// Hook to fetch all feed items
export function useFeedItems() {
  return useQuery({
    queryKey: feedKeys.lists(),
    queryFn: async () => {
      const items = await dataService.getFeedItems();
      return items;
    },
  });
}

// Hook to fetch a single feed item by ID
export function useFeedItem(id: string) {
  return useQuery({
    queryKey: feedKeys.detail(id),
    queryFn: async () => {
      const items = await dataService.getFeedItems();
      return items.find(item => item.id === id);
    },
    enabled: !!id,
  });
}

// Hook to update a feed item
export function useUpdateFeedItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FeedItem> }) => {
      await dataService.updateFeedItem(id, updates);
      return { id, updates };
    },
    onSuccess: () => {
      // Invalidate and refetch feed items
      queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
    },
  });
}

// Hook to delete feed items
export function useDeleteFeedItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      // Delete one by one using the general deletePersonalItem function
      await Promise.all(ids.map(id => dataService.removeFeedItem(id)));
      return ids;
    },
    onSuccess: () => {
      // Invalidate and refetch feed items
      queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
    },
  });
}

// Hook to mark items as read
export function useMarkFeedItemsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, read }: { ids: string[]; read: boolean }) => {
      await Promise.all(ids.map(id => dataService.updateFeedItem(id, { is_read: read })));
      return { ids, read };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
    },
  });
}

// ...

// Hook to refresh feed items
export function useRefreshFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await refreshAllFeeds();
      const items = await dataService.getFeedItems();
      return items;
    },
    onSuccess: data => {
      // Update the cache with fresh data
      queryClient.setQueryData(feedKeys.lists(), data);
    },
  });
}
