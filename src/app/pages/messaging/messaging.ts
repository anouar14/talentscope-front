import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router
} from '@angular/router';
import {
  Subject,
  takeUntil
} from 'rxjs';
import {
  Conversation,
  Message,
  RealtimeMessageEvent,
  RealtimePresenceEvent,
  RealtimeReadEvent,
  RealtimeTypingEvent
} from '../../core/models/messaging';
import { Auth } from '../../core/services/auth';
import { CompanyService } from '../../core/services/company';
import { ConsultantService } from '../../core/services/consultant';
import { MessagingRealtimeService } from '../../core/services/messaging-realtime';
import { MessagingService } from '../../core/services/messaging';

type DeleteTarget = 'message' | 'conversation' | null;

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
export class Messaging implements OnInit, OnDestroy {
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
  deleting = false;

  errorMessage = '';
  messageError = '';

  realtimeConnected = false;
  participantTyping = false;

  onlineConversationIds = new Set<string>();

  participantImageUrls: Record<string, string> = {};

  deleteTarget: DeleteTarget = null;
  messageToDelete: Message | null = null;

  private requestedConversationId: string | null = null;
  private typingSent = false;

  private typingTimeout:
    ReturnType<typeof setTimeout> | null = null;

  private participantTypingTimeout:
    ReturnType<typeof setTimeout> | null = null;

  private readonly loadingParticipantImages =
    new Set<string>();

  private readonly destroy$ =
    new Subject<void>();

  constructor(
    private readonly messagingService: MessagingService,
    private readonly messagingRealtimeService: MessagingRealtimeService,
    private readonly consultantService: ConsultantService,
    private readonly companyService: CompanyService,
    private readonly authService: Auth,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.requestedConversationId =
      this.activatedRoute.snapshot.queryParamMap.get(
        'conversationId'
      );

    this.messagingRealtimeService.connected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.realtimeConnected = connected;

        if (connected) {
          this.loadPresence();
        }
      });

    this.messagingRealtimeService.messageEvents$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.handleRealtimeMessage(event);
      });

    this.messagingRealtimeService.typingEvents$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.handleRealtimeTyping(event);
      });

    this.messagingRealtimeService.readEvents$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.handleRealtimeRead(event);
      });

    this.messagingRealtimeService.presenceEvents$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.handleRealtimePresence(event);
      });

    this.loadConversations();
  }

  ngOnDestroy(): void {
    this.stopTyping();

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    if (this.participantTypingTimeout) {
      clearTimeout(
        this.participantTypingTimeout
      );
    }

    this.revokeAllParticipantImageUrls();

    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (
      document.visibilityState !== 'visible' ||
      !this.selectedConversation
    ) {
      return;
    }

    this.markConversationAsRead(
      this.selectedConversation.id,
      true
    );
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    if (!this.selectedConversation) {
      return;
    }

    this.markConversationAsRead(
      this.selectedConversation.id,
      true
    );
  }

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    if (this.deleteTarget) {
      this.closeDeleteModal();
    }
  }

  get filteredConversations(): Conversation[] {
    const search =
      this.searchTerm
        .trim()
        .toLowerCase();

    if (!search) {
      return this.conversations;
    }

    return this.conversations.filter(
      conversation => {
        const searchableContent = [
          conversation.participantName,
          conversation.participantTitle,
          conversation.lastMessage
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableContent.includes(search);
      }
    );
  }

  get canSendMessage(): boolean {
    return (
      !!this.selectedConversation &&
      this.newMessage.trim().length > 0 &&
      !this.sendingMessage
    );
  }

  get selectedParticipantOnline(): boolean {
    if (!this.selectedConversation) {
      return false;
    }

    return this.isParticipantOnline(
      this.selectedConversation.id
    );
  }

  get deleteModalTitle(): string {
    return this.deleteTarget === 'message'
      ? 'Supprimer le message'
      : 'Supprimer la conversation';
  }

  get deleteModalDescription(): string {
    if (this.deleteTarget === 'message') {
      return 'Ce message sera supprimé uniquement de votre messagerie. L’autre participant pourra toujours le consulter.';
    }

    return 'Cette conversation et son historique seront masqués uniquement pour vous. L’autre participant conservera toujours la conversation.';
  }

  loadConversations(
    preserveSelection = false
  ): void {
    this.loadingConversations = true;
    this.errorMessage = '';

    const selectedId = preserveSelection
      ? this.selectedConversation?.id
      : this.requestedConversationId;

    this.messagingService
      .getConversations()
      .subscribe({
        next: conversations => {
          this.conversations = conversations ?? [];
          this.loadingConversations = false;

          this.loadParticipantImages(
            this.conversations
          );

          this.loadPresence();

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
      if (this.isPageVisible()) {
        this.markConversationAsRead(
          conversation.id,
          true
        );
      }

      return;
    }

    this.stopTyping();

    this.participantTyping = false;
    this.selectedConversation = conversation;
    this.messages = [];
    this.messageError = '';

    this.loadParticipantImage(
      conversation
    );

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

          if (this.isPageVisible()) {
            this.markConversationAsRead(
              conversationId,
              true
            );
          }

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

  onMessageInput(): void {
    if (!this.selectedConversation) {
      return;
    }

    if (!this.newMessage.trim()) {
      this.stopTyping();
      return;
    }

    if (!this.typingSent) {
      this.messagingRealtimeService.sendTyping(
        this.selectedConversation.id,
        true
      );

      this.typingSent = true;
    }

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(
      () => this.stopTyping(),
      1200
    );
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

    this.stopTyping();

    this.sendingMessage = true;
    this.messageError = '';

    this.messagingService
      .sendMessage(
        conversationId,
        content
      )
      .subscribe({
        next: message => {
          this.addMessageIfMissing(message);

          this.newMessage = '';
          this.sendingMessage = false;

          this.updateConversationPreview(
            conversationId,
            message.content,
            message.sentAt,
            false
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

  onMessageKeydown(
    event: KeyboardEvent
  ): void {
    if (
      event.key !== 'Enter' ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    this.sendMessage();
  }

  openMessageDeleteModal(
    message: Message,
    event?: MouseEvent
  ): void {
    event?.stopPropagation();

    this.messageToDelete = message;
    this.deleteTarget = 'message';
  }

  openConversationDeleteModal(): void {
    if (!this.selectedConversation) {
      return;
    }

    this.messageToDelete = null;
    this.deleteTarget = 'conversation';
  }

  closeDeleteModal(): void {
    if (this.deleting) {
      return;
    }

    this.deleteTarget = null;
    this.messageToDelete = null;
  }

  confirmDelete(): void {
    if (this.deleting) {
      return;
    }

    if (
      this.deleteTarget === 'message' &&
      this.messageToDelete
    ) {
      this.deleteMessage(
        this.messageToDelete
      );
      return;
    }

    if (
      this.deleteTarget === 'conversation' &&
      this.selectedConversation
    ) {
      this.deleteConversation(
        this.selectedConversation
      );
    }
  }

  isParticipantOnline(
    conversationId: string
  ): boolean {
    return this.onlineConversationIds.has(
      conversationId
    );
  }

  getParticipantImageUrl(
    conversation: Conversation
  ): string | null {
    return (
      this.participantImageUrls[
        conversation.id
      ] ?? null
    );
  }

  getInitial(
    conversation: Conversation
  ): string {
    return (
      conversation.participantName
        ?.charAt(0)
        .toUpperCase() ||
      '?'
    );
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
      return new Intl.DateTimeFormat(
        'fr-FR',
        {
          hour: '2-digit',
          minute: '2-digit'
        }
      ).format(messageDate);
    }

    return new Intl.DateTimeFormat(
      'fr-FR',
      {
        day: '2-digit',
        month: '2-digit'
      }
    ).format(messageDate);
  }

  formatMessageTime(date: string): string {
    return new Intl.DateTimeFormat(
      'fr-FR',
      {
        hour: '2-digit',
        minute: '2-digit'
      }
    ).format(new Date(date));
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

  private loadParticipantImages(
    conversations: Conversation[]
  ): void {
    conversations.forEach(
      conversation => {
        this.loadParticipantImage(
          conversation
        );
      }
    );
  }

  private loadParticipantImage(
    conversation: Conversation
  ): void {
    if (
      this.participantImageUrls[conversation.id] ||
      this.loadingParticipantImages.has(conversation.id)
    ) {
      return;
    }

    const role = this.authService.getRole();

    if (
      role !== 'COMPANY' &&
      role !== 'CONSULTANT'
    ) {
      return;
    }

    this.loadingParticipantImages.add(
      conversation.id
    );

    const imageRequest =
      role === 'COMPANY'
        ? this.consultantService.getProfileImage(
            conversation.consultantId
          )
        : this.companyService.getProfileImage(
            conversation.companyId
          );

    imageRequest
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: blob => {
          this.loadingParticipantImages.delete(
            conversation.id
          );

          if (!blob || blob.size === 0) {
            return;
          }

          const previousUrl =
            this.participantImageUrls[
              conversation.id
            ];

          if (previousUrl) {
            URL.revokeObjectURL(
              previousUrl
            );
          }

          this.participantImageUrls = {
            ...this.participantImageUrls,
            [conversation.id]:
              URL.createObjectURL(blob)
          };
        },
        error: () => {
          this.loadingParticipantImages.delete(
            conversation.id
          );
        }
      });
  }

  private revokeParticipantImageUrl(
    conversationId: string
  ): void {
    const imageUrl =
      this.participantImageUrls[
        conversationId
      ];

    if (!imageUrl) {
      return;
    }

    URL.revokeObjectURL(imageUrl);

    const updatedImageUrls = {
      ...this.participantImageUrls
    };

    delete updatedImageUrls[
      conversationId
    ];

    this.participantImageUrls =
      updatedImageUrls;
  }

  private revokeAllParticipantImageUrls(): void {
    Object.values(
      this.participantImageUrls
    ).forEach(imageUrl => {
      URL.revokeObjectURL(imageUrl);
    });

    this.participantImageUrls = {};
    this.loadingParticipantImages.clear();
  }

  private deleteMessage(
    message: Message
  ): void {
    this.deleting = true;
    this.messageError = '';

    this.messagingService
      .deleteMessageForMe(message.id)
      .subscribe({
        next: () => {
          this.messages = this.messages.filter(
            current =>
              current.id !== message.id
          );

          this.deleting = false;
          this.closeDeleteModal();

          this.refreshSelectedConversationAfterMessageDelete();

          this.messagingService.refreshUnreadCount();
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors de la suppression du message :',
            error
          );

          this.deleting = false;
          this.closeDeleteModal();

          this.messageError =
            'Impossible de supprimer ce message.';
        }
      });
  }

  private deleteConversation(
    conversation: Conversation
  ): void {
    this.deleting = true;
    this.messageError = '';

    this.stopTyping();

    this.messagingService
      .deleteConversationForMe(
        conversation.id
      )
      .subscribe({
        next: () => {
          this.revokeParticipantImageUrl(
            conversation.id
          );

          this.conversations =
            this.conversations.filter(
              current =>
                current.id !== conversation.id
            );

          const updatedPresence =
            new Set(
              this.onlineConversationIds
            );

          updatedPresence.delete(
            conversation.id
          );

          this.onlineConversationIds =
            updatedPresence;

          this.selectedConversation = null;
          this.messages = [];
          this.participantTyping = false;
          this.newMessage = '';

          this.deleting = false;
          this.closeDeleteModal();

          this.router.navigate([], {
            relativeTo: this.activatedRoute,
            queryParams: {
              conversationId: null
            },
            queryParamsHandling: 'merge',
            replaceUrl: true
          });

          this.messagingService.refreshUnreadCount();

          if (this.conversations.length > 0) {
            this.selectConversation(
              this.conversations[0]
            );
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors de la suppression de la conversation :',
            error
          );

          this.deleting = false;
          this.closeDeleteModal();

          this.messageError =
            'Impossible de supprimer cette conversation.';
        }
      });
  }

  private refreshSelectedConversationAfterMessageDelete(): void {
    if (!this.selectedConversation) {
      return;
    }

    const lastVisibleMessage =
      this.messages.length > 0
        ? this.messages[this.messages.length - 1]
        : null;

    const conversationId =
      this.selectedConversation.id;

    this.conversations =
      this.conversations.map(
        conversation => {
          if (
            conversation.id !==
            conversationId
          ) {
            return conversation;
          }

          return {
            ...conversation,
            lastMessage:
              lastVisibleMessage?.content ?? null,
            lastMessageAt:
              lastVisibleMessage?.sentAt ?? null
          };
        }
      );

    const updatedConversation =
      this.conversations.find(
        conversation =>
          conversation.id === conversationId
      );

    if (updatedConversation) {
      this.selectedConversation =
        updatedConversation;
    }
  }

  private loadPresence(): void {
    if (!this.realtimeConnected) {
      return;
    }

    this.messagingService
      .getPresence()
      .subscribe({
        next: events => {
          this.onlineConversationIds =
            new Set(
              events
                .filter(event => event.online)
                .map(event => event.conversationId)
            );
        },
        error: error => {
          console.error(
            'Impossible de récupérer la présence des utilisateurs :',
            error
          );
        }
      });
  }

  private handleRealtimePresence(
    event: RealtimePresenceEvent
  ): void {
    const updatedPresence =
      new Set(this.onlineConversationIds);

    if (event.online) {
      updatedPresence.add(
        event.conversationId
      );
    } else {
      updatedPresence.delete(
        event.conversationId
      );
    }

    this.onlineConversationIds =
      updatedPresence;
  }

  private handleRealtimeMessage(
    event: RealtimeMessageEvent
  ): void {
    const conversationId =
      event.conversationId;

    const isSelected =
      this.selectedConversation?.id === conversationId;

    if (isSelected) {
      this.participantTyping = false;

      this.addMessageIfMissing(
        event.message
      );

      if (this.isPageVisible()) {
        this.updateConversationPreview(
          conversationId,
          event.message.content,
          event.message.sentAt,
          false
        );

        this.markConversationAsRead(
          conversationId,
          true
        );
      } else {
        this.updateConversationPreview(
          conversationId,
          event.message.content,
          event.message.sentAt,
          true
        );

        this.messagingService.setUnreadCount(
          event.unreadCount
        );
      }

      setTimeout(
        () => this.scrollToBottom(),
        0
      );

      return;
    }

    this.messagingService.setUnreadCount(
      event.unreadCount
    );

    const conversationExists =
      this.conversations.some(
        conversation =>
          conversation.id === conversationId
      );

    if (!conversationExists) {
      this.loadConversations(true);
      return;
    }

    this.updateConversationPreview(
      conversationId,
      event.message.content,
      event.message.sentAt,
      true
    );
  }

  private handleRealtimeTyping(
    event: RealtimeTypingEvent
  ): void {
    if (
      !this.selectedConversation ||
      event.conversationId !==
        this.selectedConversation.id
    ) {
      return;
    }

    this.participantTyping = event.typing;

    if (this.participantTypingTimeout) {
      clearTimeout(
        this.participantTypingTimeout
      );

      this.participantTypingTimeout = null;
    }

    if (!event.typing) {
      return;
    }

    this.participantTypingTimeout =
      setTimeout(() => {
        this.participantTyping = false;
        this.participantTypingTimeout = null;
      }, 2500);
  }

  private handleRealtimeRead(
    event: RealtimeReadEvent
  ): void {
    if (
      !this.selectedConversation ||
      event.conversationId !==
        this.selectedConversation.id
    ) {
      return;
    }

    const readMessageIds =
      new Set(event.messageIds);

    this.messages = this.messages.map(
      message => {
        if (
          !message.sentByMe ||
          !readMessageIds.has(message.id)
        ) {
          return message;
        }

        return {
          ...message,
          read: true,
          readAt: event.readAt
        };
      }
    );
  }

  private stopTyping(): void {
    if (
      !this.typingSent ||
      !this.selectedConversation
    ) {
      return;
    }

    this.messagingRealtimeService.sendTyping(
      this.selectedConversation.id,
      false
    );

    this.typingSent = false;

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  private addMessageIfMissing(
    message: Message
  ): void {
    const messageExists =
      this.messages.some(
        current =>
          current.id === message.id
      );

    if (messageExists) {
      return;
    }

    this.messages = [
      ...this.messages,
      message
    ];
  }

  private updateConversationPreview(
    conversationId: string,
    content: string,
    sentAt: string,
    incrementUnread: boolean
  ): void {
    const conversation =
      this.conversations.find(
        current =>
          current.id === conversationId
      );

    if (!conversation) {
      return;
    }

    const updatedConversation: Conversation = {
      ...conversation,
      lastMessage: content,
      lastMessageAt: sentAt,
      updatedAt: sentAt,
      unreadCount:
        incrementUnread
          ? conversation.unreadCount + 1
          : 0
    };

    if (
      this.selectedConversation?.id ===
      conversationId
    ) {
      this.selectedConversation =
        updatedConversation;
    }

    this.conversations = [
      updatedConversation,
      ...this.conversations.filter(
        current =>
          current.id !== conversationId
      )
    ];
  }

  private markConversationAsRead(
    conversationId: string,
    force = false
  ): void {
    if (!this.isPageVisible()) {
      return;
    }

    const conversation =
      this.conversations.find(
        current =>
          current.id === conversationId
      );

    if (!conversation) {
      return;
    }

    if (
      !force &&
      conversation.unreadCount === 0
    ) {
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

          this.messagingService.refreshUnreadCount();
        },
        error: error => {
          console.error(
            'Impossible de marquer les messages comme lus :',
            error
          );
        }
      });
  }

  private isPageVisible(): boolean {
    return (
      document.visibilityState === 'visible' &&
      document.hasFocus()
    );
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