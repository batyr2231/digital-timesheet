import type { Employee } from '../types';

export const employees: Employee[] = [
  {
    id: '1',
    faceId: '8422233398',
    name: 'Асет Нурланов',
    position: 'Frontend Developer',
    department: 'IT',
    companyId: '1',
    objectLocation: 'SYGANAQ',
    isActive: true,
    schedule: {
      type: '5/2',
      mode: 'D',
      startTime: '09:00',
      endTime: '18:00',
      workDays: [1, 2, 3, 4, 5],
      earlyArrivalMinutes: 120,
      lateArrivalMinutes: 10
    }
  },
  {
    id: '2',
    faceId: '4653396400',
    name: 'Айгуль Сериков',
    position: 'HR Manager',
    department: 'HR',
    companyId: '1',
    objectLocation: 'Офис центральный',
    isActive: true,
    schedule: {
      type: '5/2',
      mode: 'D',
      startTime: '09:00',
      endTime: '18:00',
      workDays: [1, 2, 3, 4, 5],
      earlyArrivalMinutes: 120,
      lateArrivalMinutes: 10
    }
  },
  {
    id: '3',
    faceId: '1006657267',
    name: 'Ержан Токаев',
    position: 'Backend Developer',
    department: 'IT',
    companyId: '1',
    objectLocation: 'SYGANAQ',
    isActive: true,
    schedule: {
      type: '2/2',
      mode: 'D',
      startTime: '08:00',
      endTime: '20:00',
      workDays: [1, 2, 3, 4, 5, 6, 7],
      shiftDuration: 12,
      earlyArrivalMinutes: 120,
      lateArrivalMinutes: 10
    }
  },
  {
    id: '4',
    faceId: '1997952804',
    name: 'Динара Омарова',
    position: 'QA Engineer',
    department: 'IT',
    companyId: '2',
    objectLocation: 'J MOBILE',
    isActive: true,
    schedule: {
      type: '5/2',
      mode: 'D',
      startTime: '09:00',
      endTime: '18:00',
      workDays: [1, 2, 3, 4, 5],
      earlyArrivalMinutes: 120,
      lateArrivalMinutes: 10
    }
  },
  {
    id: '5',
    faceId: '5739211880',
    name: 'Марат Алиев',
    position: 'Security Guard',
    department: 'Security',
    companyId: '2',
    objectLocation: 'HLPRO',
    isActive: true,
    schedule: {
      type: '1/3',
      mode: 'D',
      startTime: '08:00',
      endTime: '08:00',
      workDays: [1, 2, 3, 4, 5, 6, 7],
      shiftDuration: 24,
      earlyArrivalMinutes: 120,
      lateArrivalMinutes: 10
    }
  },
  {
    id: '6',
    faceId: '6771701147',
    name: 'Батыркан Серикбаев',
    position: 'Full-Stack Developer',
    department: 'IT',
    companyId: '1',
    objectLocation: 'SYGANAQ',
    isActive: true,
    schedule: {
      type: '5/2',
      mode: 'D+', // Ночная смена с переходом
      startTime: '21:00',
      endTime: '06:00',
      workDays: [1, 2, 3, 4, 5],
      earlyArrivalMinutes: 120,
      lateArrivalMinutes: 10
    }
  }
];