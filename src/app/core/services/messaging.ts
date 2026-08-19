import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  tap
} from 'rxjs';
import {
  Conversation,
  Message,
  RealtimePresenceEvent,
  SendMessageRequest,
  UnreadMessageCountResponse
} from '../models/messaging';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private readonly apiUrl =
    'http://localhost:8080/api/messaging';

  private readonly unreadCountSubject =
    new BehaviorSubject<number>(0);

  readonly unreadCount$ =
    this.unreadCountSubject.asObservable();

  constructor(
    private readonly http: HttpClient
  ) {}

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(
      `${this.apiUrl}/conversations`
    );
  }

  openConversation(
    participantId: string
  ): Observable<Conversation> {
    return this.http.post<Conversation>(
      `${this.apiUrl}/conversations/${participantId}`,
      {}
    );
  }

  getMessages(
    conversationId: string
  ): Observable<Message[]> {
    return this.http.get<Message[]>(
      `${this.apiUrl}/conversations/${conversationId}/messages`
    );
  }

  sendMessage(
    conversationId: string,
    content: string
  ): Observable<Message> {
    const request: SendMessageRequest = {
      content
    };

    return this.http.post<Message>(
      `${this.apiUrl}/conversations/${conversationId}/messages`,
      request
    );
  }

  markConversationAsRead(
    conversationId: string
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/conversations/${conversationId}/read`,
      {}
    ).pipe(
      tap(() => this.refreshUnreadCount())
    );
  }

  deleteMessageForMe(
    messageId: string
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/messages/${messageId}`
    );
  }

  deleteConversationForMe(
    conversationId: string
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/conversations/${conversationId}`
    ).pipe(
      tap(() => this.refreshUnreadCount())
    );
  }

  getPresence(): Observable<RealtimePresenceEvent[]> {
    return this.http.get<RealtimePresenceEvent[]>(
      `${this.apiUrl}/presence`
    );
  }

  refreshUnreadCount(): void {
    this.http.get<UnreadMessageCountResponse>(
      `${this.apiUrl}/unread-count`
    ).subscribe({
      next: response => {
        this.setUnreadCount(
          response.unreadCount
        );
      },
      error: () => {
        this.setUnreadCount(0);
      }
    });
  }

  setUnreadCount(count: number): void {
    this.unreadCountSubject.next(
      Math.max(0, count)
    );
  }

  clearUnreadCount(): void {
    this.unreadCountSubject.next(0);
  }
}