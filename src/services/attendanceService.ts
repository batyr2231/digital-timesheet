import type { Employee, Attendance } from '../types';
import { employeeService } from './employeeService';

class AttendanceService {
  // Генерация посещаемости для конкретного сотрудника за месяц
  generateEmployeeAttendance(employee: Employee, year: number, month: number): Attendance[] {
    const attendance: Attendance[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Проверяем - рабочий ли день по графику
      const isWorkDay = this.isWorkDay(date, employee);
      
      if (!isWorkDay) {
        // Выходной по графику
        attendance.push({
          employeeId: employee.id,
          date: dateStr,
          checkIn: null,
          checkOut: null,
          status: 'dayoff'
        });
        continue;
      }

      // Генерируем посещаемость для рабочего дня
      const record = this.generateRealisticAttendance(employee, dateStr, date);
      attendance.push(record);
    }

    return attendance;
  }

  // Определяет, является ли день рабочим для сотрудника
  private isWorkDay(date: Date, employee: Employee): boolean {
    const dayOfWeek = date.getDay();
    const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;
    const schedule = employee.schedule;

    // Убрал 'fixed' и 'shift', оставил только '5/2', '2/2', '1/3'
    if (schedule.type === '5/2' || schedule.type === 'flexible') {
      return schedule.workDays.includes(dayNumber);
    }

    if (schedule.type === '2/2' || schedule.type === '1/3') {
      return this.calculateShiftPattern(date, schedule);
    }

    return schedule.workDays.includes(dayNumber);
  }

  // Расчет сменного графика (2/2 или 1/3)
  private calculateShiftPattern(date: Date, schedule: any): boolean {
    // Базовая дата начала графика (можно настроить под каждого сотрудника)
    const baseDate = new Date('2024-01-01');
    const daysDiff = Math.floor(
      (date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Определяем паттерн по типу смены
    if (schedule.shiftDuration === 12) {
      // График 2/2: работа-работа-выходной-выходной
      const pattern = [true, true, false, false];
      return pattern[daysDiff % 4];
    } else if (schedule.shiftDuration === 24) {
      // График 1/3: работа-выходной-выходной-выходной
      const pattern = [true, false, false, false];
      return pattern[daysDiff % 4];
    }

    return false;
  }

  // Генерация реалистичной посещаемости
  private generateRealisticAttendance(employee: Employee, dateStr: string, _date: Date): Attendance {
    const random = Math.random();
    const today = new Date();
    const currentDate = new Date(dateStr);
    
    // Если дата в будущем - не генерируем
    if (currentDate > today) {
      return {
        employeeId: employee.id,
        date: dateStr,
        checkIn: null,
        checkOut: null,
        status: 'dayoff'
      };
    }

    // 3% вероятность отпуска/больничного
    if (random > 0.97) {
      return {
        employeeId: employee.id,
        date: dateStr,
        checkIn: null,
        checkOut: null,
        status: random > 0.985 ? 'vacation' : 'sickleave'
      };
    }

    // 5% вероятность прогула
    if (random > 0.95) {
      return {
        employeeId: employee.id,
        date: dateStr,
        checkIn: null,
        checkOut: null,
        status: 'absent'
      };
    }

    // 15% вероятность опоздания
    if (random > 0.80) {
      const lateMinutes = Math.floor(Math.random() * 45) + 5; // 5-50 минут опоздания
      const checkIn = this.addMinutesToTime(employee.schedule.startTime, lateMinutes);
      
      // Время ухода с учетом длительности смены
      const shiftDuration = this.getShiftDuration(employee.schedule);
      const checkOut = this.addMinutesToTime(checkIn, shiftDuration * 60 + Math.floor(Math.random() * 20) - 10);
      
      return {
        employeeId: employee.id,
        date: dateStr,
        checkIn,
        checkOut,
        status: 'late',
        lateMinutes,
        duration: this.calculateDuration(checkIn, checkOut)
      };
    }

    // 80% вероятность нормального прихода
    const earlyMinutes = Math.floor(Math.random() * 10); // Приходит на 0-10 минут раньше
    const checkIn = this.addMinutesToTime(employee.schedule.startTime, -earlyMinutes);
    
    // Время ухода
    const shiftDuration = this.getShiftDuration(employee.schedule);
    const checkOut = this.addMinutesToTime(checkIn, shiftDuration * 60 + Math.floor(Math.random() * 15) - 5);
    
    return {
      employeeId: employee.id,
      date: dateStr,
      checkIn,
      checkOut,
      status: 'present',
      lateMinutes: 0,
      duration: this.calculateDuration(checkIn, checkOut)
    };
  }

  // Получить длительность смены в часах
  private getShiftDuration(schedule: any): number {
    if (schedule.shiftDuration) {
      return schedule.shiftDuration; // Для 2/2 (12ч) или 1/3 (24ч)
    }

    // Для обычного графика рассчитываем
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);
    return ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
  }

  // Добавить минуты к времени
  private addMinutesToTime(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number);
    let totalMinutes = h * 60 + m + minutes;
    
    // Обработка перехода через полночь
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    if (totalMinutes >= 24 * 60) totalMinutes %= (24 * 60);
    
    const newH = Math.floor(totalMinutes / 60);
    const newM = totalMinutes % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  }

  // Рассчитать продолжительность работы
  private calculateDuration(checkIn: string, checkOut: string): number {
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    
    let inMinutes = inH * 60 + inM;
    let outMinutes = outH * 60 + outM;
    
    // Если выход раньше входа - значит переход через полночь
    if (outMinutes < inMinutes) {
      outMinutes += 24 * 60;
    }
    
    return (outMinutes - inMinutes) / 60;
  }

  // Обновить посещаемость для всех сотрудников
  updateAllAttendance(year: number, month: number): void {
    const employees = employeeService.getEmployees();
    const existingAttendance = employeeService.getAttendance();
    
    // Группируем существующую посещаемость по сотрудникам
    const attendanceMap = new Map<string, Set<string>>();
    existingAttendance.forEach(record => {
      if (!attendanceMap.has(record.employeeId)) {
        attendanceMap.set(record.employeeId, new Set());
      }
      attendanceMap.get(record.employeeId)!.add(record.date);
    });

    // Генерируем недостающие записи
    const newRecords: Attendance[] = [...existingAttendance];
    
    employees.forEach(employee => {
      const employeeDates = attendanceMap.get(employee.id) || new Set();
      const employeeAttendance = this.generateEmployeeAttendance(employee, year, month);
      
      employeeAttendance.forEach(record => {
        if (!employeeDates.has(record.date)) {
          newRecords.push(record);
        }
      });
    });

    employeeService.saveAttendance(newRecords);
  }

  // Добавить отметку Face ID в реальном времени
  addFaceIdCheckIn(employeeId: string, timestamp: Date): void {
    const dateStr = timestamp.toISOString().split('T')[0];
    const timeStr = timestamp.toTimeString().split(' ')[0].substring(0, 5);
    
    const attendance = employeeService.getAttendance();
    const existingIndex = attendance.findIndex(
      a => a.employeeId === employeeId && a.date === dateStr
    );

    const employee = employeeService.getEmployees().find(e => e.id === employeeId);
    if (!employee) return;

    // Определяем статус на основе времени прихода
    const [scheduleHours, scheduleMinutes] = employee.schedule.startTime.split(':').map(Number);
    const [actualHours, actualMinutes] = timeStr.split(':').map(Number);
    
    const scheduledTime = scheduleHours * 60 + scheduleMinutes;
    const actualTime = actualHours * 60 + actualMinutes;
    
    const lateMinutes = actualTime > scheduledTime ? actualTime - scheduledTime : 0;
    const status = lateMinutes > 0 ? 'late' : 'present';

    const newRecord: Attendance = {
      employeeId,
      date: dateStr,
      checkIn: timeStr,
      checkOut: null,
      status,
      lateMinutes: lateMinutes > 0 ? lateMinutes : undefined
    };

    if (existingIndex !== -1) {
      // Обновляем существующую запись (добавляем время ухода если уже есть приход)
      if (attendance[existingIndex].checkIn && !attendance[existingIndex].checkOut) {
        attendance[existingIndex].checkOut = timeStr;
        attendance[existingIndex].duration = this.calculateDuration(
          attendance[existingIndex].checkIn!,
          timeStr
        );
      } else {
        attendance[existingIndex] = newRecord;
      }
    } else {
      attendance.push(newRecord);
    }

    employeeService.saveAttendance(attendance);
  }
}

export const attendanceService = new AttendanceService();