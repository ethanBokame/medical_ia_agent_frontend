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

  private getFrenchBoyVoice(): SpeechSynthesisVoice | null {
    // Filtrer uniquement les voix françaises
    const frenchVoices = this.availableVoices.filter(voice => 
      voice.lang.startsWith('fr-')
    );
    
    console.log('Voix françaises disponibles:', frenchVoices.map(v => v.name));
    
    // Motifs pour trouver une voix de garçon/homme en français
    const malePatterns = [
      /homme/i,
      /garçon/i,
      /male/i,
      /masculin/i,
      /thomas/i,
      /pierre/i,
      /luc/i,
      /jean/i,
      /paul/i,
      /henri/i,
      /boy/i,
      /young/i,
      /jeune/i,
      /enfant/i,
      /kid/i
    ];
    
    // Chercher une voix française masculine
    for (const pattern of malePatterns) {
      const pattern = /(Paul|Google français)/i;

      const voice = frenchVoices.find(v => pattern.test(v.name));

      if (voice) {
        console.log('✅ Voix de garçon trouvée:', voice.name);
        return voice;
      }
    }
    
    // Sur macOS, voix françaises spécifiques
    const specificFrenchMaleVoices = frenchVoices.find(v => 
      v.name.includes('Paul') || 
      v.name.includes('Amelie') === false // Prendre la moins féminine
    );
    
    if (specificFrenchMaleVoices) {
      return specificFrenchMaleVoices;
    }
    
    // Si aucune voix masculine trouvée, prendre la première voix française
    if (frenchVoices.length > 0) {
      console.warn('Aucune voix masculine trouvée, utilisation de la voix française par défaut');
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
    
    // Sélectionner la voix de garçon française
    const boyVoice = this.getFrenchBoyVoice();
    if (boyVoice) {
      this.currentUtterance.voice = boyVoice;
      console.log('Voix française sélectionnée:', boyVoice.name);
    } else {
      console.warn('Aucune voix française trouvée, utilisation de la voix par défaut');
    }
    
    // Ajuster les paramètres pour une voix de garçon
    this.currentUtterance.rate = 1.3;      // Vitesse normale
    this.currentUtterance.pitch = 1.6;     // Pitch plus élevé pour une voix de garçon
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