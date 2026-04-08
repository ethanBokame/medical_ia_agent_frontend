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
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

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

    this.messages.push({
      text: prompt,
      isUser: true,
      timestamp: new Date()
    });
    this.cdr.detectChanges();

    this.isLoading = true;
    this.cdr.detectChanges();

    this.conversationService.sendMessage(this.currentConversationId, prompt).subscribe({
      next: (response: any) => {
        console.log('RESPONSE COMPLÈTE:', response);
        
        this.isLoading = false;
        
        let agentText = "Désolé, je n'ai pas pu traiter votre demande.";
        
        if (response.success) {
          // Essayer différentes structures possibles
          if (response.data) {
            if (typeof response.data === 'string') {
              agentText = response.data;
            } else if (response.data.content) {
              agentText = response.data.content;
            } else if (response.data.message) {
              agentText = response.data.message;
            } else if (response.data.text) {
              agentText = response.data.text;
            } else if (response.data.response) {
              agentText = response.data.response;
            } else {
              agentText = JSON.stringify(response.data);
            }
          } else if (response.message) {
            agentText = response.message;
          }
        } else {
          agentText = response.message || "Une erreur est survenue";
        }
        
        console.log('Message agent extrait:', agentText);
        
        this.messages.push({
          text: agentText,
          isUser: false,
          timestamp: new Date()
        });
        this.cdr.detectChanges();
        
        if (this.isLiveMode && this.liveModeComponent) {
          console.log('IA répond vocalement:', agentText);
          this.liveModeComponent.speakResponse(agentText);
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
      next: (response: any) => {
        console.log('Réponse API conversation détaillée:', response);
        
        if (response.success && response.data) {
          let messagesList: any[] = [];
          
          if (response.data.messages && Array.isArray(response.data.messages)) {
            messagesList = response.data.messages;
          } else if (response.data.data && response.data.data.messages) {
            messagesList = response.data.data.messages;
          } else if (Array.isArray(response.data)) {
            messagesList = response.data;
          }
          
          console.log('Messages trouvés:', messagesList.length);
          
          const loadedMessages: ChatMessageType[] = messagesList.map((msg: any) => ({
            text: msg.content,
            isUser: msg.sender === 'user',
            timestamp: msg.created_at ? new Date(msg.created_at) : new Date()
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