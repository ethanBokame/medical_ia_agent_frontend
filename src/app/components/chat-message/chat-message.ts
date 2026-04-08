import { Component, Input, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-message.html',
  styleUrls: ['./chat-message.css'],
})
export class ChatMessage implements OnInit, OnDestroy {
  @Input() message = '';
  @Input() isUser = false;
  @Input() timestamp: Date | string = new Date();
  
  isCopied = false;
  isSpeaking = false;
  formattedTime = '';
  private speechSynthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor(private cdr: ChangeDetectorRef) {
    this.speechSynthesis = window.speechSynthesis;
    this.loadVoices();
  }

  ngOnInit() {
    this.formatTimestamp();
  }

  private formatTimestamp() {
    try {
      const date = this.timestamp instanceof Date ? this.timestamp : new Date(this.timestamp);
      if (date && !isNaN(date.getTime())) {
        this.formattedTime = date.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        this.formattedTime = new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.error('Erreur formatage date:', error);
      this.formattedTime = new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  private loadVoices() {
    if (this.speechSynthesis) {
      this.speechSynthesis.onvoiceschanged = () => {
        this.availableVoices = this.speechSynthesis!.getVoices();
      };
      this.availableVoices = this.speechSynthesis.getVoices();
    }
  }

  private getFrenchFemaleVoice(): SpeechSynthesisVoice | null {
    const frenchVoices = this.availableVoices.filter(voice => 
      voice.lang.startsWith('fr-')
    );
    
    const femalePatterns = [
      /femme/i, /fille/i, /female/i, /feminin/i, /amelie/i,
      /julie/i, /sophie/i, /marie/i, /claire/i, /lucie/i,
      /girl/i, /woman/i, /Google français/i
    ];
    
    for (const pattern of femalePatterns) {
      const voice = frenchVoices.find(v => pattern.test(v.name));
      if (voice) return voice;
    }
    
    const specificFrenchFemaleVoices = frenchVoices.find(v => 
      v.name.includes('Amelie') || v.name.includes('Google français')
    );
    
    if (specificFrenchFemaleVoices) return specificFrenchFemaleVoices;
    if (frenchVoices.length > 0) return frenchVoices[0];
    
    return null;
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.message).then(() => {
      this.isCopied = true;
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.isCopied = false;
        this.cdr.detectChanges();
      }, 2000);
    }).catch(err => {
      console.error('Erreur de copie:', err);
    });
  }

  speakMessage() {
    if (!this.speechSynthesis) {
      console.error('Synthèse vocale non supportée');
      return;
    }

    if (this.isSpeaking) {
      this.stopSpeaking();
      return;
    }

    this.speechSynthesis.cancel();

    this.currentUtterance = new SpeechSynthesisUtterance(this.message);
    this.currentUtterance.lang = 'fr-FR';
    
    const femaleVoice = this.getFrenchFemaleVoice();
    if (femaleVoice) {
      this.currentUtterance.voice = femaleVoice;
    }
    
    this.currentUtterance.rate = 1.1;
    this.currentUtterance.pitch = 1.2;
    this.currentUtterance.volume = 1;

    this.currentUtterance.onstart = () => {
      this.isSpeaking = true;
      this.cdr.detectChanges();
    };

    this.currentUtterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.cdr.detectChanges();
    };

    this.currentUtterance.onerror = (event) => {
      console.error('Erreur de synthèse vocale:', event);
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.cdr.detectChanges();
    };

    this.speechSynthesis.speak(this.currentUtterance);
  }

  stopSpeaking() {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy() {
    this.stopSpeaking();
  }
}