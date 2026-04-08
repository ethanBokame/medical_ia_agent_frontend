import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-message.html',
  styleUrls: ['./chat-message.css'],
})
export class ChatMessage {
  @Input() message = '';
  @Input() isUser = false;
  @Input() timestamp = new Date();
  
  isCopied = false;
  isSpeaking = false;
  private speechSynthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor(private cdr: ChangeDetectorRef) {
    this.speechSynthesis = window.speechSynthesis;
    this.loadVoices();
  }

  private loadVoices() {
    if (this.speechSynthesis) {
      this.speechSynthesis.onvoiceschanged = () => {
        this.availableVoices = this.speechSynthesis!.getVoices();
        console.log('Voices disponibles:', this.availableVoices.map(v => ({name: v.name, lang: v.lang})));
      };
      this.availableVoices = this.speechSynthesis.getVoices();
    }
  }

  private getFrenchFemaleVoice(): SpeechSynthesisVoice | null {
    // Filtrer uniquement les voix françaises
    const frenchVoices = this.availableVoices.filter(voice => 
      voice.lang.startsWith('fr-')
    );
    
    console.log('Voix françaises disponibles:', frenchVoices.map(v => v.name));
    
    // Motifs pour trouver une voix féminine en français
    const femalePatterns = [
      /femme/i,
      /fille/i,
      /female/i,
      /feminin/i,
      /amelie/i,
      /julie/i,
      /sophie/i,
      /marie/i,
      /claire/i,
      /lucie/i,
      /girl/i,
      /woman/i,
      /Google français/i  // Les voix Google sont souvent féminines par défaut
    ];
    
    // Chercher une voix française féminine
    for (const pattern of femalePatterns) {
      const voice = frenchVoices.find(v => pattern.test(v.name));
      if (voice) {
        console.log('Voix féminine trouvée:', voice.name);
        return voice;
      }
    }
    
    // Sur macOS, voix françaises spécifiques (Amelie est féminine)
    const specificFrenchFemaleVoices = frenchVoices.find(v => 
      v.name.includes('Amelie') || 
      v.name.includes('Google français')
    );
    
    if (specificFrenchFemaleVoices) {
      console.log('Voix féminine spécifique trouvée:', specificFrenchFemaleVoices.name);
      return specificFrenchFemaleVoices;
    }
    
    // Si aucune voix féminine trouvée, prendre la première voix française
    if (frenchVoices.length > 0) {
      console.warn('Aucune voix féminine trouvée, utilisation de la voix française par défaut');
      return frenchVoices[0];
    }
    
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

    // Annuler toute lecture en cours
    this.speechSynthesis.cancel();

    this.currentUtterance = new SpeechSynthesisUtterance(this.message);
    
    // Définir la langue en français
    this.currentUtterance.lang = 'fr-FR';
    
    // Sélectionner la voix féminine française
    const femaleVoice = this.getFrenchFemaleVoice();
    if (femaleVoice) {
      this.currentUtterance.voice = femaleVoice;
      console.log('Voix française féminine sélectionnée:', femaleVoice.name);
    } else {
      console.warn('Aucune voix française trouvée, utilisation de la voix par défaut');
    }
    
    // Ajuster les paramètres pour une voix féminine
    this.currentUtterance.rate = 1.1;      // Vitesse légèrement plus lente
    this.currentUtterance.pitch = 1.2;     // Pitch normal pour voix féminine
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

    // Démarrer la lecture
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