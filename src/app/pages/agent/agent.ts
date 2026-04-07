import { Component, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChatMessage } from '../../components/chat-message/chat-message';
import { PromptInput } from '../../components/prompt-input/prompt-input';
import { LiveMode } from '../../components/live-mode/live-mode';
import { Drawer } from '../../components/drawer/drawer';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-agent',
  standalone: true,
  imports: [CommonModule, ChatMessage, PromptInput, LiveMode, Drawer],
  templateUrl: './agent.html',
  styleUrls: ['./agent.css']
})
export default class Agent implements AfterViewChecked {
  @ViewChild('chatMessages') private chatMessagesContainer!: ElementRef;
  @ViewChild('liveModeComponent') liveModeComponent!: LiveMode;
  @ViewChild('drawer') drawerElement!: ElementRef;
  
  messages: Message[] = [];
  isLiveMode = false;
  isLoading = false;
  showWelcomeTitle = true;
  isDrawerOpen = false;

  constructor(private cdr: ChangeDetectorRef, private router: Router) {}

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

  async onSendMessage(prompt: string) {
    if (!prompt.trim()) return;

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

    // Simulation d'attente
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.isLoading = false;
    const response = this.getAIResponse(prompt);
    
    this.messages.push({
      text: response,
      isUser: false,
      timestamp: new Date()
    });
    this.cdr.detectChanges();
    
    // Faire parler l'IA en mode live
    if (this.isLiveMode && this.liveModeComponent) {
      console.log('IA répond vocalement:', response);
      await this.liveModeComponent.speakResponse(response);
      this.cdr.detectChanges();
    }
  }

  onToggleLiveMode() {
    this.isLiveMode = !this.isLiveMode;
    console.log('Live mode:', this.isLiveMode ? 'activé' : 'désactivé');
    this.cdr.detectChanges();
  }

  onReceiveTranscript(transcript: string) {
    console.log('Transcript reçu:', transcript);
    this.onSendMessage(transcript);
  }

  private getAIResponse(userMessage: string): string {
    const responses = [
      "Bonjour, je comprends votre préoccupation. Pouvez-vous me donner plus de détails sur vos symptômes ?",
      "D'après ce que vous décrivez, je vous recommande de consulter un médecin généraliste. Puis-je vous aider autrement ?",
      "Voici quelques conseils qui pourraient vous aider en attendant votre consultation médicale. Reposez-vous et buvez beaucoup d'eau.",
      "Je ne suis pas un médecin, mais je peux vous orienter vers des ressources fiables. Voulez-vous que je vous donne plus d'informations ?",
      "Merci pour votre message. Un professionnel de santé pourra mieux vous aider. Souhaitez-vous que je note vos symptômes ?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}