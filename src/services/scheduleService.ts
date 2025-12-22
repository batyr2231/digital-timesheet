import type { Employee, ScheduleDay, WorkSchedule, Lunch } from '../types';
import { holidayService } from './holidayService';
import { complexScheduleService } from './complexScheduleService';

class ScheduleService {
  // Конвертация формата даты: Date → dd.mm.yyyy
  private formatDateToDDMMYYYY(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  // Конвертация: dd.mm.yyyy → Date
  private parseDDMMYYYY(dateStr: string): Date {
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(year, month - 1, day);
  }

  // Получить название месяца (English)
  private getMonthName(date: Date): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[date.getMonth()];
  }

  // Получить день недели (English)
  private getDayWeekName(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  // Генерация графика на весь месяц для сотрудника
  generateMonthSchedule(
    employee: Employee,
    year: number,
    month: number
  ): ScheduleDay[] {
    
    if (employee.schedule.isComplex && employee.schedule.complexSchedule) {
        return complexScheduleService.generateComplexMonthSchedule(employee, year, month);
    }

    const schedule: ScheduleDay[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = this.formatDateToDDMMYYYY(date);
      
      // Проверяем - рабочий ли день
      const isWorkDay = this.isWorkDay(date, employee);
      
      // Проверяем - праздник ли (пока все не праздники, потом добавим календарь)
      const isHolyday = this.isHoliday(date);
      
      if (!isWorkDay || isHolyday === 1) {
        // Выходной или праздник
        schedule.push({
          id: Date.now() + day,
          employeeId: employee.id,
          employerId: Number(employee.companyId) || 0,
          date: dateStr,
          year: year,
          month: this.getMonthName(date),
          dayWeek: this.getDayWeekName(date),
          unixStart: 0,
          unixEnd: 0,
          isWorkDay: isHolyday === 1 ? 0 : (isWorkDay ? 1 : 0),
          isHolyday: isHolyday,
          overNight: 0,
          planHours: 0,
          dayLunches: [],
          overNightLunches: []
        });
        continue;
      }

      // Рабочий день - создаем смену
      const shift = this.createShift(employee, date);
      const lunches = this.generateLunches(employee, date, shift.unixStart);

      schedule.push({
        id: Date.now() + day,
        employeeId: employee.id,
        employerId: Number(employee.companyId) || 0,
        date: dateStr,
        year: year,
        month: this.getMonthName(date),
        dayWeek: this.getDayWeekName(date),
        unixStart: shift.unixStart,
        unixEnd: shift.unixEnd,
        isWorkDay: 1,
        isHolyday: 0,
        overNight: employee.schedule.mode === 'D+' || employee.schedule.type === '1/3' ? 1 : 0,
        planHours: employee.schedule.shiftDuration || 8,
        dayLunches: lunches.dayLunches,
        overNightLunches: lunches.overNightLunches,
        factHours: 0,
        isLateArrival: 0,
        isEarlyDeparture: 0,
        LAtotalMins: 0,
        EAtotalMins: 0,
        EDtotalMins: 0
      });
    }

    return schedule;
  }

  // Определяет, является ли день рабочим
  private isWorkDay(date: Date, employee: Employee): boolean {
    const dayOfWeek = date.getDay();
    const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;
    const schedule = employee.schedule;

    switch (schedule.type) {
      case '5/2':
        return schedule.workDays.includes(dayNumber);

      case '2/2':
        return this.calculate2_2Pattern(date);

      case '1/3':
        return this.calculate1_3Pattern(date);

      case 'flexible':
        return schedule.workDays.includes(dayNumber);

      default:
        return false;
    }
  }

  // Проверка на праздник (пока заглушка, потом добавим календарь праздников)
    private isHoliday(date: Date): 0 | 1 {
    return holidayService.isHoliday(date) ? 1 : 0;
    }

  // Расчет графика 2/2
  private calculate2_2Pattern(date: Date): boolean {
    const baseDate = new Date('2024-01-01');
    const daysDiff = Math.floor(
      (date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const pattern = [true, true, false, false];
    return pattern[daysDiff % 4];
  }

  // Расчет графика 1/3
  private calculate1_3Pattern(date: Date): boolean {
    const baseDate = new Date('2024-01-01');
    const daysDiff = Math.floor(
      (date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysDiff % 4 === 0;
  }

  // Создает смену с UNIX timestamps
  private createShift(employee: Employee, date: Date): { unixStart: number; unixEnd: number } {
    const schedule = employee.schedule;
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);

    const startDate = new Date(date);
    startDate.setHours(startH, startM, 0, 0);

    let endDate = new Date(date);
    endDate.setHours(endH, endM, 0, 0);

    if (schedule.mode === 'D+' || endH < startH || (endH === startH && endM < startM)) {
      endDate.setDate(endDate.getDate() + 1);
    }

    if (schedule.type === '1/3') {
      endDate.setDate(endDate.getDate() + 1);
    }

    const unixStart = Math.floor(startDate.getTime() / 1000);
    const unixEnd = Math.floor(endDate.getTime() / 1000);

    return { unixStart, unixEnd };
  }

  // Генерация обедов
  private generateLunches(
    employee: Employee,
    date: Date,
    shiftStartUnix: number
  ): { dayLunches: Lunch[]; overNightLunches: Lunch[] } {
    const dayLunches: Lunch[] = [];
    const overNightLunches: Lunch[] = [];

    // Для графика 5/2 - один обед в 13:00-14:00
    if (employee.schedule.type === '5/2') {
      const lunchStart = shiftStartUnix + (4 * 3600); // +4 часа от начала
      const lunchEnd = lunchStart + 3600; // 1 час

      dayLunches.push({
        lunchName: 'lunch_1',
        lunchUstart: lunchStart,
        lunchUend: lunchEnd
      });
    }

    // Для графика 2/2 - два обеда
    if (employee.schedule.type === '2/2') {
      dayLunches.push({
        lunchName: 'lunch_1',
        lunchUstart: shiftStartUnix + (4 * 3600),
        lunchUend: shiftStartUnix + (4.5 * 3600)
      });

      dayLunches.push({
        lunchName: 'lunch_2',
        lunchUstart: shiftStartUnix + (8 * 3600),
        lunchUend: shiftStartUnix + (8.5 * 3600)
      });
    }

    // Для графика 1/3 - обеды днем и ночью
    if (employee.schedule.type === '1/3') {
      dayLunches.push({
        lunchName: 'lunch_1',
        lunchUstart: shiftStartUnix + (3 * 3600),
        lunchUend: shiftStartUnix + (3.5 * 3600)
      });

      dayLunches.push({
        lunchName: 'lunch_2',
        lunchUstart: shiftStartUnix + (5 * 3600),
        lunchUend: shiftStartUnix + (5.5 * 3600)
      });

      overNightLunches.push({
        lunchName: 'lunch_1',
        lunchUstart: shiftStartUnix + (18 * 3600),
        lunchUend: shiftStartUnix + (18.5 * 3600)
      });

      overNightLunches.push({
        lunchName: 'lunch_2',
        lunchUstart: shiftStartUnix + (21 * 3600),
        lunchUend: shiftStartUnix + (21.5 * 3600)
      });
    }

    return { dayLunches, overNightLunches };
  }

  // Проверяет, попадает ли отметка в коридор времени
  checkTimeWindow(
    checkInUnix: number,
    shiftStartUnix: number,
    schedule: WorkSchedule
  ): { 
    isValid: boolean; 
    lateMinutes: number; 
    status: 'early' | 'ontime' | 'late' | 'toolate' 
  } {
    const earlyWindow = (schedule.earlyArrivalMinutes || 120) * 60;
    const lateWindow = (schedule.lateArrivalMinutes || 10) * 60;

    const diffSeconds = checkInUnix - shiftStartUnix;
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffSeconds < -earlyWindow) {
      return {
        isValid: false,
        lateMinutes: diffMinutes,
        status: 'early'
      };
    }

    if (diffSeconds <= lateWindow) {
      return {
        isValid: true,
        lateMinutes: diffSeconds > 0 ? diffMinutes : 0,
        status: diffSeconds <= 0 ? 'ontime' : 'late'
      };
    }

    return {
      isValid: false,
      lateMinutes: diffMinutes,
      status: 'toolate'
    };
  }

  // Форматирует UNIX timestamp в читаемый вид
  formatUnixTime(unixTimestamp: number): string {
    if (!unixTimestamp) return '-';
    const date = new Date(unixTimestamp * 1000);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // Форматирует UNIX timestamp в дату dd.mm.yyyy
  formatUnixDate(unixTimestamp: number): string {
    const date = new Date(unixTimestamp * 1000);
    return this.formatDateToDDMMYYYY(date);
  }

  // Сохранение графика
  saveSchedule(employeeId: string, schedule: ScheduleDay[]): void {
    const key = `schedule_${employeeId}`;
    localStorage.setItem(key, JSON.stringify(schedule));
  }

  // Загрузка графика
  loadSchedule(employeeId: string): ScheduleDay[] | null {
    const key = `schedule_${employeeId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  }

  // Проверка - можно ли изменять график
  canModifySchedule(dateStr: string): boolean {
    const targetDate = this.parseDDMMYYYY(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return targetDate >= today;
  }
}

export const scheduleService = new ScheduleService();