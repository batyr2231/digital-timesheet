import type { Employee, Attendance } from '../types';

class EmployeeService {
  private STORAGE_KEY = 'timesheet_employees';
  private ATTENDANCE_KEY = 'timesheet_attendance';

  // Получить всех сотрудников
  getEmployees(): Employee[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Если нет данных, вернуть дефолтных
    return [];
  }

  // Сохранить сотрудников
  saveEmployees(employees: Employee[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(employees));
  }

  // Добавить сотрудника
  addEmployee(employee: Omit<Employee, 'id'>): Employee {
    const employees = this.getEmployees();
    const newEmployee: Employee = {
      ...employee,
      id: Date.now().toString()
    };
    employees.push(newEmployee);
    this.saveEmployees(employees);
    return newEmployee;
  }

  // Обновить сотрудника
  updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    const employees = this.getEmployees();
    const index = employees.findIndex(e => e.id === id);
    
    if (index === -1) return null;
    
    employees[index] = { ...employees[index], ...updates };
    this.saveEmployees(employees);
    return employees[index];
  }

  // Удалить сотрудника
  deleteEmployee(id: string): boolean {
    const employees = this.getEmployees();
    const filtered = employees.filter(e => e.id !== id);
    
    if (filtered.length === employees.length) return false;
    
    this.saveEmployees(filtered);
    return true;
  }

  // Получить посещаемость
  getAttendance(): Attendance[] {
    const stored = localStorage.getItem(this.ATTENDANCE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  }

  // Сохранить посещаемость
  saveAttendance(attendance: Attendance[]): void {
    localStorage.setItem(this.ATTENDANCE_KEY, JSON.stringify(attendance));
  }

  // Добавить запись о посещении (от Face ID)
  addAttendanceRecord(record: Attendance): void {
    const attendance = this.getAttendance();
    
    // Проверяем, есть ли уже запись за этот день
    const existingIndex = attendance.findIndex(
      a => a.employeeId === record.employeeId && a.date === record.date
    );
    
    if (existingIndex !== -1) {
      // Обновляем существующую запись (например, время ухода)
      attendance[existingIndex] = { ...attendance[existingIndex], ...record };
    } else {
      attendance.push(record);
    }
    
    this.saveAttendance(attendance);
  }
}

export const employeeService = new EmployeeService();