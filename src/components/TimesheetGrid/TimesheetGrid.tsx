import type { FC } from 'react';
import type { Employee, Attendance } from '../../types';
import { getMonthDays, formatDate, calculateStats } from '../../utils/calculations';
import './TimesheetGrid.scss';
import { ScheduleManager } from '../ScheduleManager/ScheduleManager';
import { scheduleService } from '../../services/scheduleService';

interface TimesheetGridProps {
  employees: Employee[];
  attendance: Attendance[];
  year: number;
  month: number;
}

const ComponentName = 'TimesheetGrid';

export const TimesheetGrid: FC<TimesheetGridProps> = ({
  employees,
  attendance,
  year,
  month
}) => {
  const days = getMonthDays(year, month);

  const getAttendanceForDay = (employeeId: string, date: Date): Attendance | undefined => {
    const dateStr = formatDate(date);
    return attendance.find(
      a => a.employeeId === employeeId && a.date === dateStr
    );
  };

  const getStatusClass = (status?: string) => {
    switch (status) {
      case 'present':
        return 'status-present';
      case 'late':
        return 'status-late';
      case 'absent':
        return 'status-absent';
      case 'vacation':
        return 'status-vacation';
      case 'sickleave':
        return 'status-sickleave';
      default:
        return 'status-dayoff';
    }
  };

  const getDayName = (date: Date): string => {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[date.getDay()];
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'present':
        return '✓';
      case 'late':
        return '⚠';
      case 'absent':
        return '✗';
      case 'vacation':
        return '🏖';
      case 'sickleave':
        return '🏥';
      default:
        return '-';
    }
  };

  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className={`${ComponentName}-body`}>
      <div className={`${ComponentName}-wrapper`}>
        <table className={`${ComponentName}-table`}>
          <thead>
            <tr>
              <th className={`${ComponentName}-header ${ComponentName}-header--photo`}>
                Face ID
              </th>
              <th className={`${ComponentName}-header ${ComponentName}-header--employee`}>
                Сотрудник
              </th>
              <th className={`${ComponentName}-header ${ComponentName}-header--company`}>
                Компания
              </th>
              <th className={`${ComponentName}-header ${ComponentName}-header--department`}>
                Отдел
              </th>
              <th className={`${ComponentName}-header ${ComponentName}-header--schedule`}>
                График
              </th>
              <th className={`${ComponentName}-header ${ComponentName}-header--object`}>
                Объект
              </th>
              <th className={`${ComponentName}-header ${ComponentName}-header--actions`}>  {/* ДОБАВИЛИ */}
                Действия
              </th>
              {days.map((day) => (
                <th
                  key={day.toISOString()}
                  className={`${ComponentName}-header ${ComponentName}-header--day ${
                    day.getDay() === 0 || day.getDay() === 6 ? 'weekend' : ''
                  }`}
                >
                  <div className={`${ComponentName}-dayHeader`}>
                    <div className={`${ComponentName}-dayHeader-number`}>{day.getDate()}</div>
                    <div className={`${ComponentName}-dayHeader-name`}>{getDayName(day)}</div>
                  </div>
                </th>
              ))}
              <th className={`${ComponentName}-header ${ComponentName}-header--total`}>
                Итого
              </th>
              <th className={`${ComponentName}-header ${ComponentName}-header--total`}>
                Опоздания
              </th>
              <th className={`${ComponentName}-header ${ComponentName}-header--total`}>
                Прогулы
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => {
              const employeeAttendance = attendance.filter(
                a => a.employeeId === employee.id
              );
              const stats = calculateStats(employee, employeeAttendance);

              return (
                <tr key={employee.id} className={`${ComponentName}-row`}>
                  <td className={`${ComponentName}-cell ${ComponentName}-cell--photo`}>
                    <div className={`${ComponentName}-photo`}>
                      {getInitials(employee.name)}
                    </div>
                  </td>
                  <td className={`${ComponentName}-cell ${ComponentName}-cell--employee`}>
                    <div className={`${ComponentName}-employeeInfo`}>
                      <div className={`${ComponentName}-employeeInfo-name`}>{employee.name}</div>
                      <div className={`${ComponentName}-employeeInfo-position`}>{employee.position}</div>
                    </div>
                  </td>
                  <td className={`${ComponentName}-cell`}>
                    {employee.companyId || '-'}
                  </td>
                  <td className={`${ComponentName}-cell`}>
                    {employee.department}
                  </td>
                  <td className={`${ComponentName}-cell`}>
                    <span className={`${ComponentName}-badge ${ComponentName}-badge--schedule`}>
                      {employee.schedule.type}
                    </span>
                  </td>
                  <td className={`${ComponentName}-cell`}>
                    {employee.objectLocation || '-'}
                  </td>
                  <td className={`${ComponentName}-cell ${ComponentName}-cell--actions`}>
                    <ScheduleManager 
                      employee={employee}
                      year={year}
                      month={month}
                    />
                    {scheduleService.loadSchedule(employee.id) && (
                      <div className={`${ComponentName}-schedule-indicator`}>
                        ✅ График создан
                      </div>
                    )} 
                  </td>
                  {days.map((day) => {
                    const dayAttendance = getAttendanceForDay(employee.id, day);
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                    return (
                      <td
                        key={day.toISOString()}
                        className={`${ComponentName}-cell ${ComponentName}-cell--day ${
                          isWeekend ? 'weekend' : ''
                        }`}
                      >
                        {dayAttendance && dayAttendance.status !== 'dayoff' ? (
                          <div
                            className={`${ComponentName}-attendanceMark ${getStatusClass(dayAttendance.status)}`}
                            title={
                              dayAttendance.checkIn
                                ? `Вход: ${dayAttendance.checkIn}\nВыход: ${dayAttendance.checkOut || '-'}\nЧасов: ${dayAttendance.duration?.toFixed(1) || '-'}`
                                : dayAttendance.status === 'vacation'
                                ? 'Отпуск'
                                : dayAttendance.status === 'sickleave'
                                ? 'Больничный'
                                : 'Отсутствует'
                            }
                          >
                            <div className={`${ComponentName}-attendanceMark-icon`}>
                              {getStatusIcon(dayAttendance.status)}
                            </div>
                            {dayAttendance.checkIn && (
                              <div className={`${ComponentName}-attendanceMark-time`}>
                                <div>{dayAttendance.checkIn}</div>
                                <div>{dayAttendance.checkOut || '-'}</div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={`${ComponentName}-attendanceMark status-dayoff`}>-</div>
                        )}
                      </td>
                    );
                  })}
                  <td className={`${ComponentName}-cell ${ComponentName}-cell--total`}>
                    <strong>{stats.totalHours}ч</strong>
                  </td>
                  <td className={`${ComponentName}-cell ${ComponentName}-cell--total`}>
                    <span className={stats.lateCount > 0 ? 'text-warning' : ''}>
                      {stats.lateCount}
                    </span>
                  </td>
                  <td className={`${ComponentName}-cell ${ComponentName}-cell--total`}>
                    <span className={stats.absentCount > 0 ? 'text-danger' : ''}>
                      {stats.absentCount}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};