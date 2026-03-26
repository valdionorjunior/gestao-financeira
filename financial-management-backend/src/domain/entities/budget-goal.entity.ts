export enum BudgetPeriod {
  MONTHLY   = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY    = 'YEARLY',
}

export class Budget {
  id!: string;
  userId!: string;
  familyId?: string;
  categoryId!: string;
  name!: string;
  period!: BudgetPeriod;
  amount!: number;
  spentAmount!: number;
  startDate!: Date;
  endDate!: Date;
  alertThreshold!: number;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  isOwnedBy(userId: string): boolean { return this.userId === userId; }

  percentUsed(): number {
    return this.amount > 0 ? (this.spentAmount / this.amount) * 100 : 0;
  }

  isOverBudget(): boolean { return this.spentAmount > this.amount; }

  isAlertThresholdExceeded(): boolean { return this.percentUsed() >= this.alertThreshold; }
}

export enum GoalStatus {
  ACTIVE    = 'ACTIVE',
  ACHIEVED  = 'ACHIEVED',
  PAUSED    = 'PAUSED',
  CANCELED  = 'CANCELED',
}

export class Goal {
  id!: string;
  userId!: string;
  familyId?: string;
  accountId?: string;
  name!: string;
  description?: string;
  targetAmount!: number;
  currentAmount!: number;
  targetDate?: Date;
  color!: string;
  icon?: string;
  status!: GoalStatus;
  createdAt!: Date;
  updatedAt!: Date;

  isOwnedBy(userId: string): boolean { return this.userId === userId; }

  progressPercent(): number {
    return this.targetAmount > 0 ? Math.min((this.currentAmount / this.targetAmount) * 100, 100) : 0;
  }

  remainingAmount(): number {
    return Math.max(this.targetAmount - this.currentAmount, 0);
  }

  isAchieved(): boolean { return this.currentAmount >= this.targetAmount; }
}
