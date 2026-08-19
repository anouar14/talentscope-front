import { Injectable, NgZone } from '@angular/core';
import {
  Client,
  IMessage,
  StompSubscription
} from '@stomp/stompjs';
import {
  BehaviorSubject,
  Observable,
  Subject
} from 'rxjs';
import {
  RealtimeMessageEvent,
  RealtimePresenceEvent,
  RealtimeReadEvent,
  RealtimeTypingEvent
} from '../models/messaging';
import { Auth } from './auth';

@Injectable({
  providedIn: 'root'
})
export class MessagingRealtimeService {
  private readonly websocketUrl =
    'ws://localhost:8080/ws';

  private client: Client | null = null;

  private messageSubscription:
    StompSubscription | null = null;

  private typingSubscription:
    StompSubscription | null = null;

  private readSubscription:
    StompSubscription | null = null;

  private presenceSubscription:
    StompSubscription | null = null;

  private readonly messageEventSubject =
    new Subject<RealtimeMessageEvent>();

  private readonly typingEventSubject =
    new Subject<RealtimeTypingEvent>();

  private readonly readEventSubject =
    new Subject<RealtimeReadEvent>();

  private readonly presenceEventSubject =
    new Subject<RealtimePresenceEvent>();

  private readonly connectedSubject =
    new BehaviorSubject<boolean>(false);

  readonly messageEvents$: Observable<RealtimeMessageEvent> =
    this.messageEventSubject.asObservable();

  readonly typingEvents$: Observable<RealtimeTypingEvent> =
    this.typingEventSubject.asObservable();

  readonly readEvents$: Observable<RealtimeReadEvent> =
    this.readEventSubject.asObservable();

  readonly presenceEvents$: Observable<RealtimePresenceEvent> =
    this.presenceEventSubject.asObservable();

  readonly connected$: Observable<boolean> =
    this.connectedSubject.asObservable();

  constructor(
    private readonly authService: Auth,
    private readonly ngZone: NgZone
  ) {}

  connect(): void {
    if (
      this.client?.active ||
      !this.authService.isLoggedIn() ||
      this.authService.hasRole('ADMIN')
    ) {
      return;
    }

    const token = this.authService.getToken();

    if (!token) {
      return;
    }

    this.client = new Client({
      brokerURL: this.websocketUrl,

      connectHeaders: {
        Authorization: `Bearer ${token}`
      },

      reconnectDelay: 5000,

      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      debug: () => {}
    });

    this.client.onConnect = () => {
      this.ngZone.run(() => {
        this.connectedSubject.next(true);
      });

      this.subscribeToMessages();
      this.subscribeToTyping();
      this.subscribeToReadEvents();
      this.subscribeToPresence();
    };

    this.client.onDisconnect = () => {
      this.ngZone.run(() => {
        this.connectedSubject.next(false);
      });
    };

    this.client.onWebSocketClose = () => {
      this.ngZone.run(() => {
        this.connectedSubject.next(false);
      });
    };

    this.client.onWebSocketError = error => {
      console.error(
        'Erreur WebSocket TalentScope :',
        error
      );
    };

    this.client.onStompError = frame => {
      console.error(
        'Erreur STOMP TalentScope :',
        frame.headers['message'],
        frame.body
      );
    };

    this.client.activate();
  }

  disconnect(): void {
    this.messageSubscription?.unsubscribe();
    this.typingSubscription?.unsubscribe();
    this.readSubscription?.unsubscribe();
    this.presenceSubscription?.unsubscribe();

    this.messageSubscription = null;
    this.typingSubscription = null;
    this.readSubscription = null;
    this.presenceSubscription = null;

    if (!this.client) {
      this.connectedSubject.next(false);
      return;
    }

    const client = this.client;

    this.client = null;

    client.deactivate()
      .catch(error => {
        console.error(
          'Erreur lors de la déconnexion WebSocket :',
          error
        );
      })
      .finally(() => {
        this.ngZone.run(() => {
          this.connectedSubject.next(false);
        });
      });
  }

  sendTyping(
    conversationId: string,
    typing: boolean
  ): void {
    if (
      !conversationId ||
      !this.client?.connected
    ) {
      return;
    }

    this.client.publish({
      destination: '/app/messaging/typing',
      body: JSON.stringify({
        conversationId,
        typing
      })
    });
  }

  private subscribeToMessages(): void {
    if (!this.client?.connected) {
      return;
    }

    this.messageSubscription?.unsubscribe();

    this.messageSubscription =
      this.client.subscribe(
        '/user/queue/messages',
        message => {
          this.handleMessage(message);
        }
      );
  }

  private subscribeToTyping(): void {
    if (!this.client?.connected) {
      return;
    }

    this.typingSubscription?.unsubscribe();

    this.typingSubscription =
      this.client.subscribe(
        '/user/queue/typing',
        message => {
          this.handleTyping(message);
        }
      );
  }

  private subscribeToReadEvents(): void {
    if (!this.client?.connected) {
      return;
    }

    this.readSubscription?.unsubscribe();

    this.readSubscription =
      this.client.subscribe(
        '/user/queue/read',
        message => {
          this.handleReadEvent(message);
        }
      );
  }

  private subscribeToPresence(): void {
    if (!this.client?.connected) {
      return;
    }

    this.presenceSubscription?.unsubscribe();

    this.presenceSubscription =
      this.client.subscribe(
        '/user/queue/presence',
        message => {
          this.handlePresence(message);
        }
      );
  }

  private handleMessage(message: IMessage): void {
    try {
      const event =
        JSON.parse(
          message.body
        ) as RealtimeMessageEvent;

      if (
        !event ||
        event.type !== 'MESSAGE_RECEIVED' ||
        !event.conversationId ||
        !event.message
      ) {
        return;
      }

      this.ngZone.run(() => {
        this.messageEventSubject.next(event);
      });
    } catch (error) {
      console.error(
        'Message WebSocket TalentScope invalide :',
        error
      );
    }
  }

  private handleTyping(message: IMessage): void {
    try {
      const event =
        JSON.parse(
          message.body
        ) as RealtimeTypingEvent;

      if (
        !event ||
        event.type !== 'TYPING' ||
        !event.conversationId
      ) {
        return;
      }

      this.ngZone.run(() => {
        this.typingEventSubject.next(event);
      });
    } catch (error) {
      console.error(
        'Événement typing TalentScope invalide :',
        error
      );
    }
  }

  private handleReadEvent(message: IMessage): void {
    try {
      const event =
        JSON.parse(
          message.body
        ) as RealtimeReadEvent;

      if (
        !event ||
        event.type !== 'MESSAGES_READ' ||
        !event.conversationId ||
        !Array.isArray(event.messageIds) ||
        !event.readAt
      ) {
        return;
      }

      this.ngZone.run(() => {
        this.readEventSubject.next(event);
      });
    } catch (error) {
      console.error(
        'Accusé de lecture TalentScope invalide :',
        error
      );
    }
  }

  private handlePresence(message: IMessage): void {
    try {
      const event =
        JSON.parse(
          message.body
        ) as RealtimePresenceEvent;

      if (
        !event ||
        event.type !== 'PRESENCE' ||
        !event.conversationId ||
        typeof event.online !== 'boolean'
      ) {
        return;
      }

      this.ngZone.run(() => {
        this.presenceEventSubject.next(event);
      });
    } catch (error) {
      console.error(
        'Événement de présence TalentScope invalide :',
        error
      );
    }
  }
}