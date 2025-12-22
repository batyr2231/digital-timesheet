import type { FC } from 'react';
import type { Employee, Attendance } from '../../types';
import { calculateStats } from '../../utils/calculations';
import './Statistics.scss';

interface StatisticsProps {
  employees: Employee[];
  attendance: Attendance[];
}

const ComponentName = 'Statistics';

export const Statistics: FC<StatisticsProps> = ({ employees, attendance }) => {
  const totalStats = employees.reduce(
    (acc, employee) => {
      const employeeAttendance = attendance.filter(a => a.employeeId === employee.id);
      const stats = calculateStats(employee, employeeAttendance);
      
      return {
        totalHours: acc.totalHours + stats.totalHours,
        totalLate: acc.totalLate + stats.lateCount,
        totalAbsent: acc.totalAbsent + stats.absentCount,
        totalOvertime: acc.totalOvertime + stats.overtimeHours
      };
    },
    { totalHours: 0, totalLate: 0, totalAbsent: 0, totalOvertime: 0 }
  );

  const averageHours = employees.length > 0 
    ? Math.round((totalStats.totalHours / employees.length) * 10) / 10 
    : 0;

  const presentToday = employees.filter(emp => {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.find(a => 
      a.employeeId === emp.id && 
      a.date === today && 
      (a.status === 'present' || a.status === 'late')
    );
    return todayAttendance;
  }).length;

  return (
    <div className={`${ComponentName}-body`}>
      <div className={`${ComponentName}-card`}>
        <div className={`${ComponentName}-label`}>Всего сотрудников</div>
        <div className={`${ComponentName}-value`}>{employees.length}</div>
      </div>

      <div className={`${ComponentName}-card ${ComponentName}-card--green`}>
        <div className={`${ComponentName}-label`}>Присутствуют</div>
        <div className={`${ComponentName}-value`}>{presentToday}</div>
      </div>

      <div className={`${ComponentName}-card ${ComponentName}-card--yellow`}>
        <div className={`${ComponentName}-label`}>Опоздания</div>
        <div className={`${ComponentName}-value`}>{totalStats.totalLate}</div>
      </div>

      <div className={`${ComponentName}-card ${ComponentName}-card--red`}>
        <div className={`${ComponentName}-label`}>Прогулы</div>
        <div className={`${ComponentName}-value`}>{totalStats.totalAbsent}</div>
      </div>

      <div className={`${ComponentName}-card`}>
        <div className={`${ComponentName}-label`}>Общие часы</div>
        <div className={`${ComponentName}-value`}>{totalStats.totalHours}ч</div>
      </div>

      <div className={`${ComponentName}-card`}>
        <div className={`${ComponentName}-label`}>Средние часы</div>
        <div className={`${ComponentName}-value`}>{averageHours}ч</div>
      </div>
    </div>
  );
};