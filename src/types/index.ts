export type ScheduleType = '5/2' | '2/2' | '1/3' | 'flexible';
export type ScheduleMode = 'D' | 'D+';

export interface Lunch {
  lunchName: string;
  lunchUstart: number; // UNIX timestamp начала
  startFact?: number; // UNIX timestamp фактического начала
  lunchUend: number; // UNIX timestamp конца
  endFact?: number; // UNIX timestamp фактического конца
}

export interface WorkSchedule {
  type: ScheduleType;
  mode?: ScheduleMode;
  startTime: string;
  endTime: string;
  workDays: number[];
  shiftDuration?: number;
  earlyArrivalMinutes?: number;
  lateArrivalMinutes?: number;
  earlyDepartureMinutes?: number;
  lateDepartureMinutes?: number;
}

export interface Company {
  id: string;
  name: string;
  inn?: string;
}

export interface Employee {
  id: string;
  faceId?: string;
  name: string;
  position: string;
  department: string;
  companyId: string;
  objectLocation?: string;
  schedule: WorkSchedule;
  isActive?: boolean;
}

export type AttendanceStatus = 
  | 'present'    
  | 'late'       
  | 'absent'     
  | 'dayoff'     
  | 'vacation'   
  | 'sickleave';

export interface Attendance {
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  lateMinutes?: number;
  duration?: number;
  unixCheckIn?: number;
  unixCheckOut?: number;
}

// НОВАЯ СТРУКТУРА ДНЯ ПО ТРЕБОВАНИЯМ ЗАКАЗЧИКА
export interface ScheduleDay {
  id?: number;
  employeeId: string;
  employerId: number; // ID компании
  date: string; // Формат dd.mm.yyyy
  year: number;
  month: string; // "December"
  dayWeek: string; // "Monday"
  isWorkDay: 0 | 1; // 0 - выходной, 1 - рабочий
  isHolyday: 0 | 1; // 0 - обычный день, 1 - праздник
  overNight: 0 | 1; // 0 - дневная смена, 1 - ночная
  unixStart: number; // UNIX timestamp начала смены
  unixEnd: number; // UNIX timestamp конца смены
  planHours: number; // Плановые часы
  factHours?: number; // Фактические часы (заполняется после отработки)
  dayLunches?: Lunch[]; // Обеды в течение дня
  overNightLunches?: Lunch[]; // Обеды для ночных смен
  isLateArrival?: 0 | 1; // Было ли опоздание
  isEarlyDeparture?: 0 | 1; // Был ли ранний уход
  LAtotalMins?: number; // Минут опоздания
  EAtotalMins?: number; // Минут раннего прихода
  EDtotalMins?: number; // Минут раннего ухода
}

export interface AttendanceStats {
  totalHours: number;
  lateCount: number;
  absentCount: number;
  overtimeHours: number;
}

export interface Filters {
  department: string;
  position: string;
  status: string;
  searchQuery: string;
  companyId?: string;
  objectLocation?: string;
  scheduleType?: string;
  isActive?: boolean;
}

export interface SystemStatus {
  online: boolean;
  lastSync: string;
  devicesConnected: number;
  accuracy: number;
}

export interface MonthData {
  year: number;
  month: number;
  name: string;
}

export interface WorkDayConfig {
  startLocTime: string; // "09:00"
  endLocTime: string; // "18:00"
  overNight: 0 | 1; // Переход на следующий день
  workHours: number; // Количество часов
  lunchHour: number; // Количество часов на обед
  dayLunches: Array<{
    lunchName: string;
    lunchStart: string;
    lunchEnd: string;
  }>;
  overNightLunches?: Array<{
    lunchName: string;
    lunchStart: string;
    lunchEnd: string;
  }>;
}

// Блок графика (например 5 дней работы + 2 выходных)
export interface ScheduleBlock {
  workDays: WorkDayConfig[];
  unWorkDays: Array<{ day: 1 }>; // Массив выходных дней
}

// Сложный график (массив блоков, которые повторяются циклически)
export interface ComplexSchedule {
  schedID: number;
  LATolerance_mins: [number, number]; // [ранний приход, опоздание]
  EDTolerance_mins: [number, number]; // [ранний уход, поздний уход]
  lunchesLAED: number; // Допуск на обеды (минуты)
  LAalerts: 0 | 1; // Уведомления об опоздании
  EDalerts: 0 | 1; // Уведомления о раннем уходе
  isValidLateArrival: 0 | 1; // Опоздание по уважительной причине
  schedName: string;
  schedArrays: ScheduleBlock[]; // Массив блоков графика
}

// Обнови WorkSchedule - добавь поддержку сложных графиков
export interface WorkSchedule {
  type: ScheduleType;
  mode?: ScheduleMode;
  startTime: string;
  endTime: string;
  workDays: number[];
  shiftDuration?: number;
  earlyArrivalMinutes?: number;
  lateArrivalMinutes?: number;
  earlyDepartureMinutes?: number;
  lateDepartureMinutes?: number;
  
  // ДОБАВИЛИ ДЛЯ СЛОЖНЫХ ГРАФИКОВ:
  isComplex?: boolean; // Является ли график сложным
  complexSchedule?: ComplexSchedule; // Конфигурация сложного графика
}