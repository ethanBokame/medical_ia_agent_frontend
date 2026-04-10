import { Component, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, HostListener, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation } from '../conversation/conversation';

@Component({
  selector: 'app-live-mode',
  standalone: true,
  imports: [CommonModule, Conversation],
  templateUrl: './live-mode.html',
  styleUrls: ['./live-mode.css'],
})
export class LiveMode implements AfterViewInit, OnDestroy {
  
  @Output() close = new EventEmitter<void>();
  @Output() sendTranscript = new EventEmitter<string>();
  @ViewChild('cubeContainer') cubeContainer!: ElementRef;
  
  // États publics pour le template
  isSpeaking = false;
  isAiResponding = false;
  isSending = false;  // Rendre public pour le template
  isWaitingSilence = false;
  audioIntensity = 0;
  barHeights: number[] = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];
  glowOpacity = 0.2;
  recognitionError = false;
  errorMessage = '';
  welcomeMessagePlayed = false;
  isLoading = true;

  // Privés
  private recognition: any = null;
  private animationFrame: number | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private finalTranscript: string = '';
  private speechSynthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private privateIsSending: boolean = false;
  private lastMessageSent: string = '';
  private lastSpeechTime: number = 0;
  private readonly silenceDelay = 3000;
  private isInitialized: boolean = false;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: any = null;
  private isMicrophoneMuted: boolean = false;
  private ignoreTranscriptUntil: number = 0;
  private welcomeStartTime: number = 0;

  constructor(private cdr: ChangeDetectorRef) {
    this.speechSynthesis = window.speechSynthesis;
    this.loadVoices();
    console.log('🎤 LiveMode initialisé');
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

  ngAfterViewInit() {
    if (!this.isInitialized) {
      this.isInitialized = true;
      console.log('Démarrage du Live Mode...');
      this.initVoiceDetection();
      this.startBarAnimation();
      
      setTimeout(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }, 2000);
    }
  }

  private startBarAnimation() {
    const animateBars = () => {
      if (!this.isInitialized) return;
      
      if (this.isSpeaking || this.isAiResponding) {
        const intensityFactor = (this.isAiResponding ? 50 : this.audioIntensity) / 100;
        
        for (let i = 0; i < this.barHeights.length; i++) {
          const positionFactor = Math.sin(Date.now() / 100 + i) * 0.5 + 0.5;
          const height = 4 + (intensityFactor * positionFactor * 56);
          this.barHeights[i] = Math.max(4, Math.min(60, height));
        }
        
        this.glowOpacity = 0.4 + this.audioIntensity / 200;
      } else {
        for (let i = 0; i < this.barHeights.length; i++) {
          this.barHeights[i] = 4;
        }
        this.glowOpacity = 0.2;
      }
      
      this.animationFrame = requestAnimationFrame(animateBars);
    };
    
    animateBars();
  }

  private muteMicrophone() {
    if (this.mediaStream && !this.isMicrophoneMuted) {
      this.mediaStream.getTracks().forEach(track => {
        if (track.enabled) {
          track.enabled = false;
          this.isMicrophoneMuted = true;
          console.log('Microphone coupé');
        }
      });
    }
  }

  private unmuteMicrophone() {
    if (this.mediaStream && this.isMicrophoneMuted) {
      this.mediaStream.getTracks().forEach(track => {
        if (!track.enabled) {
          track.enabled = true;
          this.isMicrophoneMuted = false;
          console.log('Microphone réactivé');
        }
      });
    }
  }

  private async playWelcomeMessage() {
    if (this.welcomeMessagePlayed) return;
    
    const welcomeText = "Bonjour, je suis JARVICE, votre agent I A medical, décrivez moi vos symptômes pour que je puisse vous aider.";
    console.log('🎙️ Message d\'accueil:', welcomeText);
    
    this.welcomeStartTime = Date.now();
    this.ignoreTranscriptUntil = this.welcomeStartTime + 8000;
    
    this.finalTranscript = '';
    this.lastMessageSent = '';
    
    this.muteMicrophone();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return new Promise((resolve) => {
      if (!this.speechSynthesis) {
        console.error('Synthèse vocale non supportée');
        this.unmuteMicrophone();
        this.ignoreTranscriptUntil = 0;
        resolve(false);
        return;
      }
      
      this.speechSynthesis.cancel();
      
      this.currentUtterance = new SpeechSynthesisUtterance(welcomeText);
      this.currentUtterance.lang = 'fr-FR';
      
      const femaleVoice = this.getFrenchFemaleVoice();
      if (femaleVoice) {
        this.currentUtterance.voice = femaleVoice;
      }
      
      this.currentUtterance.rate = 1.1;
      this.currentUtterance.pitch = 1.2;
      this.currentUtterance.volume = 1;
      
      this.currentUtterance.onstart = () => {
        this.isAiResponding = true;
        this.cdr.detectChanges();
      };
      
      this.currentUtterance.onend = () => {
        this.isAiResponding = false;
        this.currentUtterance = null;
        this.welcomeMessagePlayed = true;
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.unmuteMicrophone();
          setTimeout(() => {
            this.finalTranscript = '';
            this.lastMessageSent = '';
            this.lastSpeechTime = Date.now();
            console.log('Système prêt - Vous pouvez parler maintenant');
          }, 1000);
        }, 500);
        
        resolve(true);
      };
      
      this.currentUtterance.onerror = (err) => {
        console.error('Erreur message d\'accueil:', err);
        this.isAiResponding = false;
        this.currentUtterance = null;
        this.welcomeMessagePlayed = true;
        this.cdr.detectChanges();
        
        this.unmuteMicrophone();
        this.ignoreTranscriptUntil = 0;
        resolve(false);
      };
      
      this.speechSynthesis.speak(this.currentUtterance);
    });
  }

  private async initVoiceDetection() {
    try {
      console.log('🎙️ Demande d\'accès au microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaStream = stream;
      console.log('Microphone accessible');
      
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await this.audioContext.resume();
      this.sourceNode = this.audioContext.createMediaStreamSource(stream);
      this.analyserNode = this.audioContext.createAnalyser();
      
      this.analyserNode.fftSize = 256;
      this.sourceNode.connect(this.analyserNode);
      
      this.startAudioAnalysis();
      this.startSpeechRecognition();
      
      setTimeout(() => {
        this.playWelcomeMessage();
      }, 1000);
      
    } catch (error) {
      console.error('Erreur microphone:', error);
      this.errorMessage = 'Impossible d\'accéder au microphone';
      this.recognitionError = true;
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private startAudioAnalysis() {
    if (!this.analyserNode) return;
    
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    
    const analyze = () => {
      if (!this.analyserNode || !this.isInitialized) return;
      
      if (!this.isMicrophoneMuted) {
        this.analyserNode.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        
        let intensity = (average / 255) * 100;
        
        if (intensity < 3) {
          intensity = 0;
        }
        
        this.audioIntensity = this.audioIntensity * 0.5 + intensity * 0.5;
        
        const now = Date.now();
        
        if (now >= this.ignoreTranscriptUntil) {
          if (this.audioIntensity > 5 && !this.isAiResponding && !this.privateIsSending) {
            this.lastSpeechTime = now;
            if (!this.isSpeaking) {
              this.isSpeaking = true;
              this.isWaitingSilence = false;
              this.cdr.detectChanges();
            }
          } else {
            if (this.isSpeaking) {
              this.isSpeaking = false;
              this.cdr.detectChanges();
            }
            if (!this.isAiResponding && !this.privateIsSending && this.finalTranscript.trim()) {
              const timeSinceLastSpeech = now - this.lastSpeechTime;
              const wasWaiting = this.isWaitingSilence;
              this.isWaitingSilence = timeSinceLastSpeech < this.silenceDelay && timeSinceLastSpeech > 0;
              if (wasWaiting !== this.isWaitingSilence) {
                this.cdr.detectChanges();
              }
            }
          }
          
          if (
            !this.isSpeaking &&
            !this.isAiResponding &&
            !this.privateIsSending &&
            this.finalTranscript.trim() &&
            now - this.lastSpeechTime > this.silenceDelay
          ) {
            this.sendMessageImmediately();
          }
        }
      }
      
      this.updateCubeAnimation();
      this.animationFrame = requestAnimationFrame(analyze);
    };
    
    analyze();
  }

  private sendMessageImmediately() {
    if (this.privateIsSending || this.isAiResponding) {
      console.log('Envoi bloqué - déjà en cours');
      return;
    }
    
    if (Date.now() < this.ignoreTranscriptUntil) {
      console.log('Message ignoré - période d\'ignorance active');
      this.finalTranscript = '';
      this.lastSpeechTime = Date.now();
      return;
    }
    
    const message = this.finalTranscript.trim();
    
    if (message && message.length > 3 && message !== this.lastMessageSent) {
      this.privateIsSending = true;
      this.isSending = true;  // Mettre à jour public
      this.lastMessageSent = message;
      this.lastSpeechTime = 0;
      this.isWaitingSilence = false;
      
      console.log('MESSAGE DÉTECTÉ:', message);
      console.log('Envoi à l\'agent...');
      
      this.finalTranscript = '';
      this.cdr.detectChanges();
      
      this.sendTranscript.emit(message);
    }
  }

  private updateCubeAnimation() {
    const cube = document.querySelector('.cube') as HTMLElement;
    if (!cube) return;
    
    if (this.isSpeaking) {
      const scale = 1 + (this.audioIntensity / 100) * 0.6;
      cube.style.transform = `scale(${scale}) rotateX(${Date.now() / 40}deg) rotateY(${Date.now() / 40}deg)`;
    } else if (this.isAiResponding) {
      const scale = 1 + Math.sin(Date.now() / 150) * 0.1;
      cube.style.transform = `scale(${scale}) rotateX(${Date.now() / 60}deg) rotateY(${Date.now() / 60}deg)`;
    } else {
      cube.style.transform = `rotateX(${Date.now() / 100}deg) rotateY(${Date.now() / 100}deg)`;
    }
  }

  private startSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Reconnaissance vocale non supportée par le navigateur');
      this.errorMessage = 'Reconnaissance vocale non supportée par le navigateur';
      this.recognitionError = true;
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }
    
    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'fr-FR';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      
      this.recognition.onstart = () => {
        console.log('Reconnaissance vocale ACTIVE - Parlez maintenant');
        this.recognitionError = false;
        this.errorMessage = '';
        this.reconnectAttempts = 0;
        this.cdr.detectChanges();
      };
      
      this.recognition.onresult = (event: any) => {
        if (Date.now() < this.ignoreTranscriptUntil) {
          return;
        }
        
        let latestFinal = '';
        
        for (let i = event.results.length - 1; i >= 0; i--) {
          if (event.results[i].isFinal) {
            latestFinal = event.results[i][0].transcript;
            break;
          }
        }
        
        if (latestFinal && latestFinal !== this.lastMessageSent && latestFinal.length > 0) {
          this.finalTranscript = latestFinal;
          console.log('[FINAL]', this.finalTranscript);
          this.cdr.detectChanges();
        }
      };
      
      this.recognition.onerror = (event: any) => {
        console.error('Erreur reconnaissance:', event.error);
        
        switch(event.error) {
          case 'network':
            this.errorMessage = 'Erreur réseau - Vérifiez votre connexion internet';
            this.recognitionError = true;
            this.scheduleReconnect();
            break;
          case 'not-allowed':
            this.errorMessage = 'Permission microphone refusée - Veuillez autoriser l\'accès';
            this.recognitionError = true;
            break;
          case 'no-speech':
            console.log('Aucune parole détectée');
            break;
          case 'audio-capture':
            this.errorMessage = 'Problème de capture audio - Vérifiez votre microphone';
            this.recognitionError = true;
            this.scheduleReconnect();
            break;
          default:
            this.errorMessage = `Erreur: ${event.error}`;
            this.recognitionError = true;
            this.scheduleReconnect();
        }
        this.cdr.detectChanges();
      };
      
      this.recognition.onend = () => {
        console.log('⏸Reconnaissance vocale arrêtée');
        this.cdr.detectChanges();
        
        if (!this.isAiResponding && this.mediaStream && this.isInitialized && !this.recognitionError && !this.isMicrophoneMuted && !this.privateIsSending) {
          setTimeout(() => {
            if (!this.isAiResponding && this.recognition && this.isInitialized && !this.isMicrophoneMuted && !this.privateIsSending) {
              try {
                this.recognition.start();
                console.log('Reconnaissance redémarrée');
                this.cdr.detectChanges();
              } catch(e) {
                console.log('Impossible de redémarrer:', e);
                this.scheduleReconnect();
              }
            }
          }, 500);
        }
      };
      
      this.recognition.start();
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      this.errorMessage = 'Erreur d\'initialisation de la reconnaissance vocale';
      this.recognitionError = true;
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.isInitialized && !this.isAiResponding) {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.log(`Tentative de reconnexion ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts} dans ${delay}ms`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        if (this.recognition) {
          try {
            this.recognition.stop();
          } catch(e) {}
          this.recognition = null;
        }
        this.startSpeechRecognition();
      }, delay);
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Échec de reconnexion après plusieurs tentatives');
      this.errorMessage = 'Impossible de se connecter au service de reconnaissance vocale';
      this.cdr.detectChanges();
    }
  }

  // Méthode publique appelée par le parent
  async speakResponse(text: string) {
    console.log('IA va parler:', text);
    
    // Réinitialiser l'état d'envoi
    this.privateIsSending = false;
    this.isSending = false;
    this.lastMessageSent = '';
    this.lastSpeechTime = 0;
    this.isWaitingSilence = false;
    this.cdr.detectChanges();
    
    return new Promise((resolve) => {
      if (!this.speechSynthesis) {
        console.error('Synthèse vocale non supportée');
        resolve(false);
        return;
      }
      
      this.isAiResponding = true;
      this.cdr.detectChanges();
      
      if (this.recognition) {
        try {
          this.recognition.stop();
          console.log('Reconnaissance arrêtée pour la réponse');
        } catch(e) {}
      }
      
      this.muteMicrophone();
      this.speechSynthesis?.cancel();
      
      const cleanText = text.replace(/[^\w\s\u00C0-\u00FF]/g, '');
      
      this.currentUtterance = new SpeechSynthesisUtterance(cleanText);
      this.currentUtterance.lang = 'fr-FR';
      
      const femaleVoice = this.getFrenchFemaleVoice();
      if (femaleVoice) {
        this.currentUtterance.voice = femaleVoice;
      }
      
      this.currentUtterance.rate = 1.1;
      this.currentUtterance.pitch = 1.2;
      this.currentUtterance.volume = 1;
      
      this.currentUtterance.onstart = () => {
        console.log('L\'IA parle maintenant avec voix féminine (micro coupé)');
        this.cdr.detectChanges();
      };
      
      this.currentUtterance.onend = () => {
        console.log('L\'IA a fini de parler');
        this.isAiResponding = false;
        this.currentUtterance = null;
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.unmuteMicrophone();
          
          setTimeout(() => {
            if (this.recognition && !this.isAiResponding && this.isInitialized && !this.recognitionError && !this.isMicrophoneMuted) {
              try {
                this.recognition.start();
                console.log('Reconnaissance redémarrée après réponse - Vous pouvez poser une nouvelle question');
                this.cdr.detectChanges();
              } catch(e) {
                console.log('Erreur au redémarrage:', e);
                this.scheduleReconnect();
              }
            }
          }, 500);
        }, 100);
        
        resolve(true);
      };
      
      this.currentUtterance.onerror = (err) => {
        console.error('Erreur synthèse vocale:', err);
        this.isAiResponding = false;
        this.currentUtterance = null;
        this.cdr.detectChanges();
        
        this.unmuteMicrophone();
        resolve(false);
      };
      
      this.speechSynthesis?.speak(this.currentUtterance);
    });
  }

  ngOnDestroy() {
    console.log('🔚 Destruction du Live Mode');
    this.isInitialized = false;
    
    this.unmuteMicrophone();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    if (this.recognition) {
      try {
        this.recognition.stop();
        this.recognition = null;
      } catch(e) {}
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    if (this.speechSynthesis && this.currentUtterance) {
      this.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  @HostListener('window:beforeunload')
  cleanup() {
    this.ngOnDestroy();
  }
}