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

  constructor(private readonly http: HttpClient) {}

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

  refreshUnreadCount(): void {
    this.http.get<UnreadMessageCountResponse>(
      `${this.apiUrl}/unread-count`
    ).subscribe({
      next: response => {
        this.unreadCountSubject.next(
          response.unreadCount
        );
      },
      error: () => {
        this.unreadCountSubject.next(0);
      }
    });
  }

  clearUnreadCount(): void {
    this.unreadCountSubject.next(0);
  }
}