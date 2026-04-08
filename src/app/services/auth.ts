import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Auth {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    console.log('API URL:', this.apiUrl); // Ajoutez ce log pour vérifier
  }

  login(credentials: {email: string; password: string}): Observable<any> {
    console.log('Appel API vers:', `${this.apiUrl}/login`);
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }
  
  saveToken(token: string): void {
    localStorage.setItem('user-auth', token);
    console.log('Token sauvegardé');
  }

  getToken(): string | null {
    return localStorage.getItem('user-auth');
  }

  logout(): void {
    localStorage.removeItem('user-auth'); // Correction: 'user-auth' au lieu de 'user.auth'
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}