import { Injectable, signal, computed, effect } from '@angular/core';

// This interface is for storing user data in localStorage.
interface UserWithPassword {
  name: string;
  passwordHash: string; // Storing plain text password for simplicity in this context.
  picture: string;
}

// This interface is for the public user profile.
export interface UserProfile {
  name: string;
  picture: string;
}

const USERS_STORAGE_KEY = 'bda_users';
const SESSION_STORAGE_KEY = 'bda_session';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Use a signal to store all users, making it reactive.
  // This signal is initialized from localStorage.
  private users = signal<Map<string, UserWithPassword>>(this.loadUsersFromStorage());

  currentUser = signal<UserProfile | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());

  constructor() {
    this.checkForActiveSession();

    // Effect to automatically save users to localStorage whenever the signal changes.
    effect(() => {
      this.saveUsersToStorage(this.users());
    });
  }

  private loadUsersFromStorage(): Map<string, UserWithPassword> {
    try {
      const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
      return usersJson ? new Map(JSON.parse(usersJson)) : new Map();
    } catch (e) {
      console.error('Error loading users from localStorage', e);
      return new Map();
    }
  }

  private saveUsersToStorage(users: Map<string, UserWithPassword>): void {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(Array.from(users.entries())));
    } catch (e) {
      console.error('Error saving users to localStorage', e);
    }
  }
  
  private checkForActiveSession(): void {
    // Check localStorage first (for "remember me"), then sessionStorage.
    const rememberedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    const session = rememberedSession || sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (session) {
      try {
        const userProfile: UserProfile = JSON.parse(session);
        // Verify this user still exists in our user list
        if (this.users().has(userProfile.name)) {
          this.currentUser.set(userProfile);
        } else {
            // Clean up stale session if user was deleted
            this.logout();
        }
      } catch (e) {
        console.error('Error parsing session data', e);
        this.logout();
      }
    }
  }

  register(username: string, password: string): void {
    if (this.users().has(username)) {
      throw new Error('Utilizador já existe.');
    }
    
    const newUser: UserWithPassword = {
      name: username,
      passwordHash: password, // In a real app, hash the password!
      picture: `https://i.pravatar.cc/150?u=${username}`,
    };

    // Update the signal, which will trigger the effect to save to localStorage.
    this.users.update(currentUsers => {
      currentUsers.set(username, newUser);
      return new Map(currentUsers); // Return a new map to ensure change detection
    });

    // Automatically log in the new user
    this.login(username, password, false);
  }

  login(username: string, password: string, rememberMe: boolean = false): void {
    const user = this.users().get(username);
    
    if (!user || user.passwordHash !== password) {
      throw new Error('Nome de utilizador ou senha inválidos.');
    }
    
    const userProfile: UserProfile = {
        name: user.name,
        picture: user.picture,
    };
    
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userProfile));

    // Also clear the other storage to avoid session conflicts
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    otherStorage.removeItem(SESSION_STORAGE_KEY);

    this.currentUser.set(userProfile);
  }

  logout(): void {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    this.currentUser.set(null);
  }

  updateProfilePicture(newUrl: string): void {
    const currentUsername = this.currentUser()?.name;
    if (!currentUsername) {
        throw new Error("Utilizador não autenticado.");
    }
    
    const user = this.users().get(currentUsername);
    if (!user) {
        throw new Error("Utilizador não encontrado.");
    }

    const updatedUser = { ...user, picture: newUrl };

    // Update the signal
    this.users.update(currentUsers => {
      currentUsers.set(currentUsername, updatedUser);
      return new Map(currentUsers);
    });

    // Update the current user signal immediately for better UX
    this.currentUser.update(current => {
      if (current) {
        return { ...current, picture: newUrl };
      }
      return null;
    });

    // Also update the session storage to reflect the change immediately
    const rememberedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    const storage = rememberedSession ? localStorage : sessionStorage;
    const session = storage.getItem(SESSION_STORAGE_KEY);
    if (session) {
      try {
        const userProfile: UserProfile = JSON.parse(session);
        userProfile.picture = newUrl;
        storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userProfile));
      } catch (e) {
        console.error('Failed to update session picture', e);
      }
    }
  }
}