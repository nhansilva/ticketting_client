import { useQuery } from '@tanstack/react-query';
import { eventApi } from '../api/event.api';
import type { ListEventsParams } from '../api/event.api';

export function useEvents(params: ListEventsParams) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => eventApi.listEvents(params),
    staleTime: 60_000,  // 1 min — event list rarely changes
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => eventApi.getEvent(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useVenue(venueId: string | undefined) {
  return useQuery({
    queryKey: ['venue', venueId],
    queryFn: () => eventApi.getVenue(venueId!),
    enabled: !!venueId,
    staleTime: 5 * 60_000,  // 5 min — venue doesn't change
  });
}

export function useSeats(eventId: string | undefined) {
  return useQuery({
    queryKey: ['seats', eventId],
    queryFn: () => eventApi.getSeats(eventId!),
    enabled: !!eventId,
    staleTime: 30_000,  // 30 sec — seat status changes frequently
  });
}
