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
    console.log('API URL:', this.apiUrl);
  }

  login(credentials: {email: string; password: string}): Observable<any> {
    console.log('Appel API login vers:', `${this.apiUrl}/login`);
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }
  
  register(userData: {nom: string; email: string; password: string}): Observable<any> {
    console.log('Appel API register vers:', `${this.apiUrl}/register`);
    return this.http.post(`${this.apiUrl}/register`, userData);
  }
  
  saveToken(token: string): void {
    localStorage.setItem('user-auth', token);
    console.log('Token sauvegardé');
  }

  getToken(): string | null {
    return localStorage.getItem('user-auth');
  }

  logout(): void {
    localStorage.removeItem('user-auth');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}