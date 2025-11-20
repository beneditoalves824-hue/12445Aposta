import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BetTrackerComponent } from './components/bet-tracker/bet-tracker.component';
import { CompoundInterestCalculatorComponent } from './components/compound-interest-calculator/compound-interest-calculator.component';
import { BettingCalculatorComponent } from './components/betting-calculator/betting-calculator.component';
import { ApaComponent } from './components/apa/apa.component';
import { AiMentorComponent } from './components/ai-mentor/ai-mentor.component';
import { AuthService } from './services/auth.service';
import { AuthComponent } from './components/auth/auth.component';

type View = 'tracker' | 'compound' | 'betting' | 'apa' | 'mentor';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    BetTrackerComponent,
    CompoundInterestCalculatorComponent,
    BettingCalculatorComponent,
    ApaComponent,
    AiMentorComponent,
    AuthComponent,
  ],
})
export class AppComponent {
  private authService = inject(AuthService);

  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.currentUser;
  
  userMenuOpen = signal(false);
  activeView = signal<View>('tracker');

  isProfileModalOpen = signal(false);
  newProfilePictureUrl = signal('');

  menuItems = [
    { id: 'tracker', label: 'Monitoramento', icon: 'M3 13.5V8.25A1.5 1.5 0 014.5 6.75h15A1.5 1.5 0 0121 8.25v5.25m-18 0A1.5 1.5 0 004.5 15h15a1.5 1.5 0 001.5-1.5m-18 0v-2.25A1.5 1.5 0 014.5 9h15a1.5 1.5 0 011.5 1.5v2.25' },
    { id: 'compound', label: 'Juros Compostos', icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'betting', label: 'Calculadora de Aposta', icon: 'M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 3h.008v.008H8.25v-.008zm0 3h.008v.008H8.25v-.008zm3-6h.008v.008H11.25v-.008zm0 3h.008v.008H11.25v-.008zm0 3h.008v.008H11.25v-.008zm3-6h.008v.008H14.25v-.008zm0 3h.008v.008H14.25v-.008zM12 21a9 9 0 100-18 9 9 0 000 18z' },
    { id: 'apa', label: 'Secção APA', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6-2.292m0 0v14.25' },
    { id: 'mentor', label: 'Mentor IA', icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m3.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M10.5 13.5h3M7.5 13.5h3m-3.375-3a.375.375 0 11-.75 0 .375.375 0 01.75 0z' }
  ];

  setView(view: View) {
    this.activeView.set(view);
  }

  logout() {
    this.authService.logout();
    this.userMenuOpen.set(false);
  }

  toggleUserMenu() {
    this.userMenuOpen.update(v => !v);
  }

  openProfileModal() {
    this.newProfilePictureUrl.set(this.currentUser()?.picture || '');
    this.isProfileModalOpen.set(true);
    this.userMenuOpen.set(false);
  }

  closeProfileModal() {
    this.isProfileModalOpen.set(false);
  }

  saveProfilePicture() {
    if (this.newProfilePictureUrl()) {
      this.authService.updateProfilePicture(this.newProfilePictureUrl());
    }
    this.closeProfileModal();
  }
}