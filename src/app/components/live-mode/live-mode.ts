import { Component, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-live-mode',
  imports: [],
  templateUrl: './live-mode.html',
  styleUrl: './live-mode.css',
})
export class LiveMode implements AfterViewInit {
  @Output() close = new EventEmitter<void>();
  @ViewChild('cubeContainer') cubeContainer!: ElementRef;
  
  isSpeaking = false;
  private recognition: any;

  ngAfterViewInit() {
    this.initVoiceDetection();
  }

  private initVoiceDetection() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'fr-FR';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      this.recognition.onstart = () => {
        this.isSpeaking = false;
      };

      this.recognition.onresult = (event: any) => {
        this.isSpeaking = true;
        setTimeout(() => {
          this.isSpeaking = false;
        }, 500);
      };

      this.recognition.start();
    }
  }

  @HostListener('window:beforeunload')
  cleanup() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}