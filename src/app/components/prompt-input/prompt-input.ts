import { Component, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-prompt-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prompt-input.html',
  styleUrls: ['./prompt-input.css'],
})
export class PromptInput {
  @Output() sendMessageEvent = new EventEmitter<string>();
  @Output() toggleLiveModeEvent = new EventEmitter<void>(); // Renommé pour éviter la confusion
  @ViewChild('promptInput') promptInput!: ElementRef<HTMLInputElement>;
  
  prompt = '';

  onSendMessage() {
    if (this.prompt.trim()) {
      this.sendMessageEvent.emit(this.prompt);
      this.prompt = '';
      this.promptInput.nativeElement.focus();
    }
  }

  onToggleLiveMode() { // Méthode qui émet l'événement
    this.toggleLiveModeEvent.emit();
  }

  startVoiceRecognition() {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.prompt = transcript;
        this.onSendMessage();
      };

      recognition.start();
    } else {
      alert('Votre navigateur ne supporte pas la reconnaissance vocale');
    }
  }
}