import { Component, Output, EventEmitter, ElementRef, ViewChild, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-prompt-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prompt-input.html',
  styleUrls: ['./prompt-input.css'],
})
export class PromptInput implements OnDestroy {
  @Output() sendMessageEvent = new EventEmitter<string>();
  @Output() toggleLiveModeEvent = new EventEmitter<void>();
  @ViewChild('promptTextarea') promptTextarea!: ElementRef<HTMLTextAreaElement>;
  
  prompt = '';
  isRecording = false;
  private currentRecognition: any = null;

  constructor(private cdr: ChangeDetectorRef) {}

  onSendMessage() {
    if (this.prompt.trim()) {
      this.sendMessageEvent.emit(this.prompt);
      this.prompt = '';
      this.adjustTextareaHeight();
      this.cdr.detectChanges();
    }
  }

  onToggleLiveMode() {
    this.toggleLiveModeEvent.emit();
    this.cdr.detectChanges();
  }

  adjustTextareaHeight() {
    const textarea = this.promptTextarea.nativeElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 50) + 'px';
  }

  startVoiceRecognition() {
    // Si déjà en train d'enregistrer, on annule
    if (this.isRecording) {
      this.stopRecording();
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      this.isRecording = true;
      this.cdr.detectChanges();
      
      this.currentRecognition = new SpeechRecognition();
      this.currentRecognition.lang = 'fr-FR';
      this.currentRecognition.continuous = false;
      this.currentRecognition.interimResults = false;

      this.currentRecognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.prompt = transcript;
        this.adjustTextareaHeight();
        this.onSendMessage();
        this.stopRecording();
      };

      this.currentRecognition.onerror = () => {
        this.stopRecording();
      };

      this.currentRecognition.onend = () => {
        this.stopRecording();
      };

      this.currentRecognition.start();
    }
  }

  private stopRecording() {
    this.isRecording = false;
    this.cdr.detectChanges();
    
    if (this.currentRecognition) {
      try {
        this.currentRecognition.stop();
      } catch(e) {}
      this.currentRecognition = null;
    }
  }

  ngOnDestroy() {
    this.stopRecording();
  }
}