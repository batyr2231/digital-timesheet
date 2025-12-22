import type { WorkSchedule } from '../types';

export class ScheduleCalculator {
  // Определяет рабочий ли день для сотрудника
  static isWorkDay(date: Date, schedule: WorkSchedule, hireDate?: Date): boolean {
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();

    switch (schedule.type) {
      case '5/2':
        return schedule.workDays.includes(dayOfWeek);

      case '2/2':
        return this.calculate2_2Pattern(date, hireDate);

      case '1/3':
        return this.calculate1_3Pattern(date, hireDate);

      case 'flexible':
        return schedule.workDays.includes(dayOfWeek);

      default:
        return false;
    }
  }

  // Расчет графика 2/2
  private static calculate2_2Pattern(date: Date, hireDate?: Date): boolean {
    if (!hireDate) hireDate = new Date('2024-01-01'); // дефолтная дата
    
    const daysDiff = Math.floor(
      (date.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Паттерн: работа-работа-выходной-выходной
    const pattern = [true, true, false, false];
    return pattern[daysDiff % 4];
  }

  // Расчет графика 1/3 (сутки через трое)
  private static calculate1_3Pattern(date: Date, hireDate?: Date): boolean {
    if (!hireDate) hireDate = new Date('2024-01-01');
    
    const daysDiff = Math.floor(
      (date.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Паттерн: работа-выходной-выходной-выходной
    return daysDiff % 4 === 0;
  }

  // Расчет продолжительности смены
  static getShiftDuration(schedule: WorkSchedule): number {
    switch (schedule.type) {
      case '5/2': {
        const [startH, startM] = schedule.startTime.split(':').map(Number);
        const [endH, endM] = schedule.endTime.split(':').map(Number);
        return ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
      }

      case '2/2':
        return schedule.shiftDuration || 12;

      case '1/3':
        return schedule.shiftDuration || 24;

      default:
        return 8;
    }
  }

  // Определяет опоздание
  static calculateLateMinutes(
    checkIn: string,
    schedule: WorkSchedule
  ): number {
    const [checkInH, checkInM] = checkIn.split(':').map(Number);
    const [scheduleH, scheduleM] = schedule.startTime.split(':').map(Number);

    const checkInMinutes = checkInH * 60 + checkInM;
    const scheduleMinutes = scheduleH * 60 + scheduleM;

    const diff = checkInMinutes - scheduleMinutes;
    return diff > 0 ? diff : 0;
  }
}