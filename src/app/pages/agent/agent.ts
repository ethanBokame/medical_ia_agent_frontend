import { Component, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChatMessage } from '../../components/chat-message/chat-message';
import { PromptInput } from '../../components/prompt-input/prompt-input';
import { LiveMode } from '../../components/live-mode/live-mode';
import { Drawer } from '../../components/drawer/drawer';
import { Conversation } from '../../components/conversation/conversation';
import { ConversationService } from '../../services/conversation';
import { Auth } from '../../services/auth';
import { Message as MessageModel } from '../../model/conversation';

// Renommer l'interface locale pour éviter le conflit
interface ChatMessageType {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-agent',
  standalone: true,
  imports: [CommonModule, ChatMessage, PromptInput, LiveMode, Drawer, Conversation],
  templateUrl: './agent.html',
  styleUrls: ['./agent.css'],
  providers: [ConversationService]
})
export default class Agent implements OnInit, AfterViewChecked {
  @ViewChild('chatMessages') private chatMessagesContainer!: ElementRef;
  @ViewChild('liveModeComponent') liveModeComponent!: LiveMode;
  @ViewChild('drawer') drawerElement!: ElementRef;
  
  messages: ChatMessageType[] = [];
  isLiveMode = false;
  isLoading = false;
  showWelcomeTitle = true;
  isDrawerOpen = false;
  currentConversationId: number | null = null;
  isInitializing = false;
  isAuthenticated = false;

  constructor(
    private cdr: ChangeDetectorRef, 
    private router: Router,
    private conversationService: ConversationService,
    private auth: Auth
  ) {}

  ngOnInit() {
    this.checkAuthentication();
  }

  private checkAuthentication() {
    this.isAuthenticated = this.auth.isLoggedIn();
    if (!this.isAuthenticated) {
      console.log('Non authentifié, redirection vers login...');
      this.router.navigate(['/login']);
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    if (this.chatMessagesContainer && this.messages.length > 0) {
      try {
        this.chatMessagesContainer.nativeElement.scrollTop = 
          this.chatMessagesContainer.nativeElement.scrollHeight;
      } catch(err) { }
    }
  }

  toggleDrawer() {
    this.isDrawerOpen = !this.isDrawerOpen;
    if (this.isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    this.cdr.detectChanges();
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    document.body.style.overflow = '';
    this.cdr.detectChanges();
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    this.closeDrawer();
  }

  async initConversation() {
    if (!this.auth.isLoggedIn()) {
      console.log('Non authentifié, création de conversation impossible');
      this.router.navigate(['/login']);
      return;
    }

    if (this.currentConversationId !== null || this.isInitializing) {
      return;
    }

    this.isInitializing = true;
    
    this.conversationService.createConversation().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Correction: utiliser response.data.id au lieu de response.data.conversation_id
          this.currentConversationId = response.data.id;
          console.log('Conversation créée avec ID:', this.currentConversationId);
        } else {
          console.error('Erreur création conversation:', response.message);
        }
        this.isInitializing = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur API création conversation:', err);
        this.isInitializing = false;
        this.cdr.detectChanges();
      }
    });
  }

  async onSendMessage(prompt: string) {
    if (!this.auth.isLoggedIn()) {
      console.log('Non authentifié, envoi de message impossible');
      this.router.navigate(['/login']);
      return;
    }

    if (!prompt.trim()) return;

    if (this.currentConversationId === null) {
      await this.initConversation();
      // Attendre un peu que la conversation soit créée
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Vérifier à nouveau après l'initialisation
    if (this.currentConversationId === null) {
      console.error('Impossible de créer une conversation');
      this.isLoading = false;
      return;
    }

    console.log('Message reçu:', prompt);

    if (this.messages.length === 0) {
      this.showWelcomeTitle = false;
      this.cdr.detectChanges();
    }

    // Ajouter le message utilisateur
    this.messages.push({
      text: prompt,
      isUser: true,
      timestamp: new Date()
    });
    this.cdr.detectChanges();

    this.isLoading = true;
    this.cdr.detectChanges();

    this.conversationService.sendMessage(this.currentConversationId, prompt).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const agentMessage = response.data;
          console.log('Message envoyé, réponse reçue:', agentMessage);
          
          this.isLoading = false;
          
          // Ajouter la réponse de l'agent
          this.messages.push({
            text: agentMessage.content,
            isUser: false,
            timestamp: new Date(agentMessage.created_at)
          });
          this.cdr.detectChanges();
          
          // Faire parler l'IA en mode live
          if (this.isLiveMode && this.liveModeComponent) {
            console.log('IA répond vocalement:', agentMessage.content);
            this.liveModeComponent.speakResponse(agentMessage.content);
            this.cdr.detectChanges();
          }
        } else {
          console.error('Erreur envoi message:', response.message);
          this.isLoading = false;
          
          this.messages.push({
            text: response.message || "Désolé, une erreur s'est produite. Veuillez réessayer.",
            isUser: false,
            timestamp: new Date()
          });
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Erreur API envoi message:', err);
        this.isLoading = false;
        
        this.messages.push({
          text: "Désolé, une erreur s'est produite. Veuillez vérifier votre connexion.",
          isUser: false,
          timestamp: new Date()
        });
        this.cdr.detectChanges();
      }
    });
  }

  onToggleLiveMode() {
    if (!this.auth.isLoggedIn()) {
      console.log('Non authentifié, activation du live mode impossible');
      this.router.navigate(['/login']);
      return;
    }
    
    this.isLiveMode = !this.isLiveMode;
    console.log('Live mode:', this.isLiveMode ? 'activé' : 'désactivé');
    this.cdr.detectChanges();
  }

  onReceiveTranscript(transcript: string) {
    if (!this.auth.isLoggedIn()) {
      console.log('Non authentifié, traitement du transcript impossible');
      this.router.navigate(['/login']);
      return;
    }
    
    console.log('Transcript reçu:', transcript);
    this.onSendMessage(transcript);
  }

  loadConversation(conversationId: number) {
    if (!this.auth.isLoggedIn()) {
      console.log('Non authentifié, chargement de conversation impossible');
      this.router.navigate(['/login']);
      return;
    }
    
    this.currentConversationId = conversationId;
    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.conversationService.getConversationById(conversationId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Utiliser response.data.messages
          const loadedMessages: ChatMessageType[] = response.data.messages.map(msg => ({
            text: msg.content,
            isUser: msg.sender === 'user',
            timestamp: new Date(msg.created_at)
          }));
          
          this.messages = loadedMessages;
          this.showWelcomeTitle = this.messages.length === 0;
          console.log('Conversation chargée:', loadedMessages.length, 'messages');
        } else {
          console.error('Erreur chargement conversation:', response.message);
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur API chargement conversation:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}