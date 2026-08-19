import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Conversation,
  Message
} from '../../core/models/messaging';
import { MessagingService } from '../../core/services/messaging';

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './messaging.html',
  styleUrl: './messaging.css'
})
export class Messaging implements OnInit {
  @ViewChild('messagesContainer')
  messagesContainer?: ElementRef<HTMLDivElement>;

  conversations: Conversation[] = [];
  messages: Message[] = [];

  selectedConversation: Conversation | null = null;

  searchTerm = '';
  newMessage = '';

  loadingConversations = false;
  loadingMessages = false;
  sendingMessage = false;

  errorMessage = '';
  messageError = '';

  private requestedConversationId: string | null = null;

  constructor(
    private readonly messagingService: MessagingService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.requestedConversationId =
      this.activatedRoute.snapshot.queryParamMap.get(
        'conversationId'
      );

    this.loadConversations();
  }

  get filteredConversations(): Conversation[] {
    const search = this.searchTerm.trim().toLowerCase();

    if (!search) {
      return this.conversations;
    }

    return this.conversations.filter(conversation => {
      const searchableContent = [
        conversation.participantName,
        conversation.participantTitle,
        conversation.lastMessage
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableContent.includes(search);
    });
  }

  get canSendMessage(): boolean {
    return (
      !!this.selectedConversation &&
      this.newMessage.trim().length > 0 &&
      !this.sendingMessage
    );
  }

  loadConversations(preserveSelection = false): void {
    this.loadingConversations = true;
    this.errorMessage = '';

    const selectedId = preserveSelection
      ? this.selectedConversation?.id
      : this.requestedConversationId;

    this.messagingService.getConversations().subscribe({
      next: conversations => {
        this.conversations = conversations ?? [];
        this.loadingConversations = false;

        if (selectedId) {
          const selectedConversation =
            this.conversations.find(
              conversation =>
                conversation.id === selectedId
            );

          if (selectedConversation) {
            this.selectConversation(
              selectedConversation
            );

            this.requestedConversationId = null;
            return;
          }
        }

        if (
          !this.selectedConversation &&
          this.conversations.length > 0
        ) {
          this.selectConversation(
            this.conversations[0]
          );
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error(
          'Erreur lors du chargement des conversations :',
          error
        );

        this.loadingConversations = false;

        this.errorMessage =
          error.status === 403
            ? 'Vous n’êtes pas autorisé à accéder à la messagerie.'
            : 'Impossible de charger vos conversations.';
      }
    });
  }

  selectConversation(
    conversation: Conversation
  ): void {
    if (
      this.selectedConversation?.id === conversation.id &&
      this.messages.length > 0
    ) {
      return;
    }

    this.selectedConversation = conversation;
    this.messages = [];
    this.messageError = '';

    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {
        conversationId: conversation.id
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });

    this.loadMessages(conversation.id);
  }

  loadMessages(conversationId: string): void {
    this.loadingMessages = true;
    this.messageError = '';

    this.messagingService
      .getMessages(conversationId)
      .subscribe({
        next: messages => {
          this.messages = messages ?? [];
          this.loadingMessages = false;

          this.markConversationAsRead(
            conversationId
          );

          setTimeout(
            () => this.scrollToBottom(),
            0
          );
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors du chargement des messages :',
            error
          );

          this.loadingMessages = false;

          this.messageError =
            'Impossible de charger cette conversation.';
        }
      });
  }

  sendMessage(): void {
    if (
      !this.canSendMessage ||
      !this.selectedConversation
    ) {
      return;
    }

    const content = this.newMessage.trim();
    const conversationId =
      this.selectedConversation.id;

    this.sendingMessage = true;
    this.messageError = '';

    this.messagingService
      .sendMessage(
        conversationId,
        content
      )
      .subscribe({
        next: message => {
          this.messages = [
            ...this.messages,
            message
          ];

          this.newMessage = '';
          this.sendingMessage = false;

          this.updateConversationAfterSend(
            message
          );

          setTimeout(
            () => this.scrollToBottom(),
            0
          );
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors de l’envoi du message :',
            error
          );

          this.sendingMessage = false;

          if (error.status === 400) {
            this.messageError =
              'Le message est invalide.';
            return;
          }

          if (error.status === 403) {
            this.messageError =
              'Vous n’êtes pas autorisé à envoyer un message dans cette conversation.';
            return;
          }

          this.messageError =
            'Impossible d’envoyer le message.';
        }
      });
  }

  onMessageKeydown(event: KeyboardEvent): void {
    if (
      event.key !== 'Enter' ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    this.sendMessage();
  }

  getInitial(conversation: Conversation): string {
    return conversation.participantName
      ?.charAt(0)
      .toUpperCase() || '?';
  }

  formatConversationTime(
    date: string | null
  ): string {
    if (!date) {
      return '';
    }

    const messageDate = new Date(date);
    const today = new Date();

    const sameDay =
      messageDate.getFullYear() === today.getFullYear() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getDate() === today.getDate();

    if (sameDay) {
      return new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(messageDate);
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    }).format(messageDate);
  }

  formatMessageTime(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  trackConversation(
    index: number,
    conversation: Conversation
  ): string {
    return conversation.id;
  }

  trackMessage(
    index: number,
    message: Message
  ): string {
    return message.id;
  }

  private markConversationAsRead(
    conversationId: string
  ): void {
    const conversation =
      this.conversations.find(
        current =>
          current.id === conversationId
      );

    if (!conversation || conversation.unreadCount === 0) {
      return;
    }

    this.messagingService
      .markConversationAsRead(
        conversationId
      )
      .subscribe({
        next: () => {
          this.conversations =
            this.conversations.map(
              current =>
                current.id === conversationId
                  ? {
                      ...current,
                      unreadCount: 0
                    }
                  : current
            );

          if (
            this.selectedConversation?.id ===
            conversationId
          ) {
            this.selectedConversation = {
              ...this.selectedConversation,
              unreadCount: 0
            };
          }
        },
        error: error => {
          console.error(
            'Impossible de marquer les messages comme lus :',
            error
          );
        }
      });
  }

  private updateConversationAfterSend(
    message: Message
  ): void {
    if (!this.selectedConversation) {
      return;
    }

    const conversationId =
      this.selectedConversation.id;

    const updatedConversation: Conversation = {
      ...this.selectedConversation,
      lastMessage: message.content,
      lastMessageAt: message.sentAt,
      updatedAt: message.sentAt
    };

    this.selectedConversation =
      updatedConversation;

    this.conversations = [
      updatedConversation,
      ...this.conversations.filter(
        conversation =>
          conversation.id !== conversationId
      )
    ];
  }

  private scrollToBottom(): void {
    const container =
      this.messagesContainer?.nativeElement;

    if (!container) {
      return;
    }

    container.scrollTop =
      container.scrollHeight;
  }
}