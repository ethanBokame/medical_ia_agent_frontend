export class User {
    id!: string;
    nom!: string;
    email!: string;
    updated_at!: Date;
    created_at!: Date;
    token?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: User;
}
