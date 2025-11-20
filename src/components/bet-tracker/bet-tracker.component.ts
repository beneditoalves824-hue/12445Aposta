import { Component, ChangeDetectionStrategy, signal, effect, viewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface PlanEntry {
  date: string;
  initialBankroll: number;
  stakedValue: number;
  predictedProfit: number;
  isWin: boolean;
  finalBankroll: number;
  isLocked: boolean;
}

declare var d3: any;

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

  chartContainer = viewChild<ElementRef<HTMLDivElement>>('chartContainer');

  constructor() {
    effect(() => {
      const planData = this.plan();
      const containerEl = this.chartContainer()?.nativeElement;

      if (planData.length > 0 && containerEl) {
        this.drawChart(planData, containerEl);
      } else if (containerEl) {
        // Clear chart if plan is empty
        d3.select(containerEl).select('svg').remove();
      }
    });
  }

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

    for (let d = new Date(start), i = 0; d <= end; d.setDate(d.getDate() + 1), i++) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;

      if (i === 0) {
        const initialBankroll = this.initialBankroll();
        const stakedValue = this.stakeValue();
        const predictedProfit = stakedValue * this.fixedOdd() - stakedValue;
        const finalBankroll = initialBankroll + predictedProfit;
        
        planArray.push({
          date: formattedDate,
          initialBankroll: initialBankroll,
          stakedValue: stakedValue,
          predictedProfit: predictedProfit,
          isWin: false,
          finalBankroll: finalBankroll, // This is the predicted final bankroll
          isLocked: false,
        });
      } else {
        const previousInitialBankroll = planArray[i - 1].initialBankroll;
        planArray.push({
          date: formattedDate,
          initialBankroll: previousInitialBankroll, // Placeholder, will be updated
          stakedValue: 0,
          predictedProfit: 0,
          isWin: false,
          finalBankroll: previousInitialBankroll, // Placeholder, will be updated
          isLocked: true,
        });
      }
    }
    this.plan.set(planArray);
  }

  updatePlanOnToggle(index: number): void {
    this.plan.update(currentPlan => {
      const planCopy = [...currentPlan];
      const entry = planCopy[index];

      // 1. Calculate this entry's final bankroll based on win/loss
      if (entry.isWin) {
        entry.finalBankroll = entry.initialBankroll + entry.predictedProfit;
      } else {
        entry.finalBankroll = entry.initialBankroll - entry.stakedValue;
      }

      // 2. Lock or unlock the next day and cascade the lock status
      if (planCopy[index + 1]) {
        if (entry.isWin) {
          planCopy[index + 1].isLocked = false;
        } else {
          // If it's a loss, lock all subsequent days
          for (let i = index + 1; i < planCopy.length; i++) {
            planCopy[i].isLocked = true;
            planCopy[i].isWin = false; // Reset their state
          }
        }
      }

      // 3. Recalculate the entire chain from the next day onwards
      for (let i = index + 1; i < planCopy.length; i++) {
        const previousEntry = planCopy[i - 1];
        const currentEntry = planCopy[i];
        
        currentEntry.initialBankroll = previousEntry.finalBankroll;

        if (currentEntry.isLocked) {
          // Reset values for locked days
          currentEntry.stakedValue = 0;
          currentEntry.predictedProfit = 0;
          currentEntry.finalBankroll = currentEntry.initialBankroll;
        } else {
          // Calculate values for newly unlocked day
          currentEntry.stakedValue = previousEntry.finalBankroll > 0 ? previousEntry.finalBankroll : 0;
          if (currentEntry.stakedValue > 0) {
            currentEntry.predictedProfit = currentEntry.stakedValue * this.fixedOdd() - currentEntry.stakedValue;
          } else {
            currentEntry.predictedProfit = 0;
          }
          // The final bankroll is based on a *predicted* win for an unlocked day
          currentEntry.finalBankroll = currentEntry.initialBankroll + currentEntry.predictedProfit;
        }
      }

      return planCopy;
    });
  }

  private drawChart(planData: PlanEntry[], container: HTMLElement): void {
    const parseDate = d3.timeParse("%d/%m/%Y");

    const chartData = planData
        .filter(d => !d.isLocked)
        .map(d => ({
            date: parseDate(d.date),
            value: d.finalBankroll
        }))
        .filter(d => d.date);
    
    if (chartData.length < 1) {
        d3.select(container).select('svg').remove();
        return;
    }

    d3.select(container).select('svg').remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain(d3.extent(chartData, (d:any) => d.date) as [Date, Date])
      .range([0, width]);

    const yMin = d3.min(chartData, (d:any) => d.value) as number;
    const yMax = d3.max(chartData, (d:any) => d.value) as number;

    const y = d3.scaleLinear()
      .domain([Math.min(this.initialBankroll(), yMin) * 0.98, Math.max(this.initialBankroll(), yMax) * 1.02])
      .range([height, 0]);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(Math.min(5, chartData.length)).tickSize(0).tickPadding(10))
      .attr('class', 'text-slate-400')
      .select(".domain").remove();
      
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickSize(0).tickPadding(10))
      .attr('class', 'text-slate-400')
      .select(".domain").remove();
      
    svg.selectAll('g.tick')
      .filter(function(this: any) {
        return d3.select(this).attr('transform') !== `translate(0,${height})`;
       })
      .append('line')
      .attr('stroke', '#374151')
      .attr('stroke-dasharray', '3,3')
      .attr('x2', width);
      
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", "area-gradient")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "0%").attr("y2", "100%");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#10B981").attr("stop-opacity", 0.5);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#10B981").attr("stop-opacity", 0);

    const area = d3.area()
        .x((d: any) => x(d.date))
        .y0(height)
        .y1((d: any) => y(d.value))
        .curve(d3.curveMonotoneX);

    svg.append("path")
       .datum(chartData)
       .attr("fill", "url(#area-gradient)")
       .attr("d", area);

    const line = d3.line()
        .x((d: any) => x(d.date))
        .y((d: any) => y(d.value))
        .curve(d3.curveMonotoneX);
        
    svg.append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "#34D399")
      .attr("stroke-width", 2.5)
      .attr("d", line);
  }
}