export class User {
    id!: string;
    nom!: string;
    email!: string;
    updated_at!: Date;
    created_at!: Date;
    token?: string;

    constructor(data?: Partial<User>) {
        if (data) {
            Object.assign(this, data);
        }
    }

    // Méthode utilitaire pour obtenir le nom complet
    getFullName(): string {
        return this.nom;
    }

    // Vérifier si l'utilisateur a un token valide
    hasValidToken(): boolean {
        return !!this.token;
    }

    // Formater la date d'inscription
    getFormattedCreatedAt(): string {
        if (!this.created_at) return '';
        const date = new Date(this.created_at);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data: User;
}

export interface RegisterResponse {
    success: boolean;
    message: string;
    data: User;
}