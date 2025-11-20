
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'betting-calculator',
  templateUrl: './betting-calculator.component.html',
  imports: [FormsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BettingCalculatorComponent {
  stake = signal(100);
  odds = signal(1.8);

  betResult = computed(() => {
    const currentStake = this.stake();
    const currentOdds = this.odds();

    if (currentStake <= 0 || currentOdds <= 1) {
      return null;
    }

    const potentialReturn = currentStake * currentOdds;
    const potentialProfit = potentialReturn - currentStake;
    const profitPercentage = (potentialProfit / currentStake) * 100;

    return {
      potentialReturn: potentialReturn,
      potentialProfit: potentialProfit,
      profitPercentage: profitPercentage,
    };
  });
}
