import type { Employee, Attendance, AttendanceStats } from '../types';

export const calculateStats = (
  employee: Employee,
  attendanceRecords: Attendance[]
): AttendanceStats => {
  let totalHours = 0;
  let lateCount = 0;
  let absentCount = 0;
  let overtimeHours = 0;

  attendanceRecords.forEach(record => {
    if (record.status === 'absent') {
      absentCount++;
      return;
    }

    if (record.status === 'late') {
      lateCount++;
    }

    if (record.checkIn && record.checkOut) {
      const hours = calculateWorkHours(record.checkIn, record.checkOut);
      totalHours += hours;

      // Подсчет переработки
      const [scheduleStartH, scheduleStartM] = employee.schedule.startTime.split(':').map(Number);
      const [scheduleEndH, scheduleEndM] = employee.schedule.endTime.split(':').map(Number);
      const scheduledHours = (scheduleEndH * 60 + scheduleEndM - scheduleStartH * 60 - scheduleStartM) / 60;

      if (hours > scheduledHours) {
        overtimeHours += hours - scheduledHours;
      }
    }
  });

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    lateCount,
    absentCount,
    overtimeHours: Math.round(overtimeHours * 10) / 10
  };
};

export const calculateWorkHours = (checkIn: string, checkOut: string): number => {
  const [inH, inM] = checkIn.split(':').map(Number);
  const [outH, outM] = checkOut.split(':').map(Number);
  
  const inMinutes = inH * 60 + inM;
  const outMinutes = outH * 60 + outM;
  
  return (outMinutes - inMinutes) / 60;
};

export const getMonthDays = (year: number, month: number): Date[] => {
  const days: Date[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month - 1, i));
  }
  
  return days;
};

export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};