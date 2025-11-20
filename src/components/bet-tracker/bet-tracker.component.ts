import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface PlanEntry {
  date: string;
  initialBankroll: number;
  stakedValue: number;
  predictedProfit: number;
  actualProfit: number | null;
  isWin: boolean;
  finalBankroll: number;
  isLocked: boolean;
}

@Component({
  selector: 'bet-tracker',
  templateUrl: './bet-tracker.component.html',
  imports: [FormsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BetTrackerComponent {
  startDate = signal<string>(new Date().toISOString().split('T')[0]);
  endDate = signal<string>('');
  initialBankroll = signal<number>(1000);
  stakeValue = signal<number>(100);
  fixedOdd = signal<number>(1.15);

  plan = signal<PlanEntry[]>([]);
  configError = signal<string | null>(null);
  oddError = signal<string | null>(null);


  validateOdd(odd: number): void {
    if (odd < 1.10) {
      this.oddError.set('Odd inválida: valores abaixo de 1,10 não fazem parte da estratégia.');
    } else if (odd > 1.20) {
      this.oddError.set('Erro: odds acima de 1,20 representam risco elevado de perda.');
    } else {
      this.oddError.set(null);
    }
  }

  generatePlan(): void {
    this.configError.set(null);
    this.validateOdd(this.fixedOdd());
    if (this.oddError()) {
      return;
    }

    if (!this.startDate() || !this.endDate() || !this.initialBankroll() || !this.stakeValue()) {
      this.configError.set('Por favor, preencha todos os campos de configuração.');
      return;
    }
    const start = new Date(this.startDate() + 'T00:00:00');
    const end = new Date(this.endDate() + 'T00:00:00');

    if (start > end) {
      this.configError.set('A data de início não pode ser posterior à data de fim.');
      return;
    }

    const planArray: PlanEntry[] = [];
    let currentBankroll = this.initialBankroll();
    let previousPredictedProfit = 0;

    for (let d = new Date(start), i = 0; d <= end; d.setDate(d.getDate() + 1), i++) {
      const stakedValue = (i === 0) ? this.stakeValue() : this.stakeValue() + previousPredictedProfit;
      const predictedProfit = stakedValue * this.fixedOdd() - stakedValue;
      const initialBankrollForEntry = currentBankroll;
      const finalBankroll = initialBankrollForEntry + predictedProfit;
      
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();

      planArray.push({
        date: `${day}/${month}/${year}`,
        initialBankroll: initialBankrollForEntry,
        stakedValue: stakedValue,
        predictedProfit: predictedProfit,
        actualProfit: null,
        isWin: false,
        finalBankroll: finalBankroll,
        isLocked: i > 0, // Lock all but the first day
      });
      
      currentBankroll = finalBankroll;
      previousPredictedProfit = predictedProfit;
    }
    this.plan.set(planArray);
  }

  updateEntry(index: number): void {
    this.plan.update(currentPlan => {
      const planCopy = [...currentPlan];
      const entry = planCopy[index];

      // 1. Calculate Final Bankroll for current entry
      // If actualProfit is null (e.g., input cleared), the profit is 0 for the day.
      entry.finalBankroll = entry.initialBankroll + (entry.actualProfit ?? 0);
      if (entry.actualProfit !== null && planCopy[index + 1]) {
        planCopy[index + 1].isLocked = false;
      }

      // 2. Update all subsequent entries based on the new reality
      for (let i = index + 1; i < planCopy.length; i++) {
        const previousEntry = planCopy[i - 1];
        const currentEntry = planCopy[i];

        currentEntry.initialBankroll = previousEntry.finalBankroll;
        
        // Staked value depends on the previous day's ACTUAL profit if available, otherwise its PREDICTED profit
        const prevProfitForCompounding = previousEntry.actualProfit ?? previousEntry.predictedProfit;
        currentEntry.stakedValue = this.stakeValue() + prevProfitForCompounding;

        // Recalculate the prediction for the current day
        currentEntry.predictedProfit = currentEntry.stakedValue * this.fixedOdd() - currentEntry.stakedValue;
        
        // Final bankroll is based on its own actual profit if present, otherwise the new prediction
        currentEntry.finalBankroll = currentEntry.initialBankroll + (currentEntry.actualProfit ?? currentEntry.predictedProfit);
      }

      return planCopy;
    });
  }
}