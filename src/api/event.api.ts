import { eventAxiosInstance } from './eventAxios';
import type { ApiResponse } from '../types/auth.types';
import type { EventSummary, Event, Venue, Seat, EventType, EventStatus } from '../types/event.types';

export interface ListEventsParams {
  type?: EventType;
  status?: EventStatus;
  page?: number;
  size?: number;
}

export const eventApi = {
  listEvents: async (params: ListEventsParams): Promise<EventSummary[]> => {
    const res = await eventAxiosInstance.get<ApiResponse<EventSummary[]>>('/api/v1/events', { params });
    return res.data.data;
  },

  getEvent: async (id: string): Promise<Event> => {
    const res = await eventAxiosInstance.get<ApiResponse<Event>>(`/api/v1/events/${id}`);
    return res.data.data;
  },

  getVenue: async (id: string): Promise<Venue> => {
    const res = await eventAxiosInstance.get<ApiResponse<Venue>>(`/api/v1/venues/${id}`);
    return res.data.data;
  },

  getSeats: async (eventId: string): Promise<Seat[]> => {
    const res = await eventAxiosInstance.get<ApiResponse<Seat[]>>(`/api/v1/events/${eventId}/seats`);
    return res.data.data;
  },
};
