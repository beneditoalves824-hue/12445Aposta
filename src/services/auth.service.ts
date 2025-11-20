import { Injectable, signal, computed, WritableSignal } from '@angular/core';

export interface UserProfile {
  name: string;
  picture: string;
}

interface StoredUser {
  username: string;
  password: string; // Em uma aplicação real, isso deve ser um hash
  picture: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentUser = signal<UserProfile | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());
  private users: WritableSignal<StoredUser[]> = signal([]);

  constructor() {
    this.loadUsersFromStorage();
    this.checkSession();
  }

  private loadUsersFromStorage(): void {
    const storedUsers = localStorage.getItem('betting_app_users');
    if (storedUsers) {
      // Handle migration for users that might not have a picture property
      const users = JSON.parse(storedUsers).map((u: any) => ({
        ...u,
        picture: u.picture || `https://i.pravatar.cc/150?u=${u.username}`
      }));
      this.users.set(users);
    }
  }

  private checkSession(): void {
    const persistentSession = localStorage.getItem('betting_app_session');
    if (persistentSession) {
      this.currentUser.set(JSON.parse(persistentSession));
      return;
    }
    const sessionUser = sessionStorage.getItem('betting_app_session');
    if (sessionUser) {
      this.currentUser.set(JSON.parse(sessionUser));
    }
  }

  async register(username: string, password: string): Promise<void> {
    if (!username || !password) {
      throw new Error('Nome de utilizador e senha são obrigatórios.');
    }
    const userExists = this.users().find(u => u.username.toLowerCase() === username.toLowerCase());
    if (userExists) {
      throw new Error('Este nome de utilizador já existe.');
    }

    const newUser: StoredUser = { 
      username, 
      password, 
      picture: `https://i.pravatar.cc/150?u=${username}` 
    };
    this.users.update(users => [...users, newUser]);
    localStorage.setItem('betting_app_users', JSON.stringify(this.users()));

    // Auto-login after registration (temporary session)
    return this.login(username, password, false);
  }

  async login(username: string, password: string, rememberMe: boolean = false): Promise<void> {
     if (!username || !password) {
      throw new Error('Nome de utilizador e senha são obrigatórios.');
    }
    const user = this.users().find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (user) {
      const userProfile: UserProfile = {
        name: user.username,
        picture: user.picture, // Use the stored picture
      };
      this.currentUser.set(userProfile);
      
      // Store session based on rememberMe flag
      if (rememberMe) {
        localStorage.setItem('betting_app_session', JSON.stringify(userProfile));
      } else {
        sessionStorage.setItem('betting_app_session', JSON.stringify(userProfile));
      }
    } else {
      throw new Error('Nome de utilizador ou senha inválida.');
    }
  }

  logout(): void {
    this.currentUser.set(null);
    sessionStorage.removeItem('betting_app_session');
    localStorage.removeItem('betting_app_session');
  }

  updateProfilePicture(newUrl: string): void {
    const currentUsername = this.currentUser()?.name;
    if (!currentUsername) return;

    // Update the user in the main user list
    this.users.update(currentUsers => {
      const userToUpdate = currentUsers.find(u => u.username === currentUsername);
      if (userToUpdate) {
        userToUpdate.picture = newUrl;
      }
      return [...currentUsers]; // Return a new array to trigger signal update
    });
    localStorage.setItem('betting_app_users', JSON.stringify(this.users()));

    // Update the current session
    this.currentUser.update(current => {
      if (current) {
        const updatedProfile = { ...current, picture: newUrl };
        // Update both storages in case the user's "remember me" status changes
        if(localStorage.getItem('betting_app_session')) {
            localStorage.setItem('betting_app_session', JSON.stringify(updatedProfile));
        }
        if(sessionStorage.getItem('betting_app_session')) {
            sessionStorage.setItem('betting_app_session', JSON.stringify(updatedProfile));
        }
        return updatedProfile;
      }
      return null;
    });
  }
}