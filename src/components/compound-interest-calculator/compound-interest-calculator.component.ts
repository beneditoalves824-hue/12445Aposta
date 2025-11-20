
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'compound-interest-calculator',
  templateUrl: './compound-interest-calculator.component.html',
  imports: [FormsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompoundInterestCalculatorComponent {
  initialInvestment = signal(1000);
  dailyInterestRate = signal(5);
  period = signal(30);

  calculationResult = computed(() => {
    const P = this.initialInvestment();
    const r = this.dailyInterestRate() / 100;
    const t = this.period();

    if (P <= 0 || r < 0 || t <= 0) {
      return null;
    }

    const finalAmount = P * Math.pow((1 + r), t);
    const totalInterest = finalAmount - P;

    return {
      finalAmount: finalAmount,
      totalInterest: totalInterest
    };
  });
}
