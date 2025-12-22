import type { ScheduleDay } from '../types';

class ApiService {
  //private BASE_URL = 'http://localhost:3000/api'; // В продакшене будет реальный сервер

  // Отправка графика на сервер
  async sendScheduleToServer(employeeId: string, schedule: ScheduleDay[]): Promise<boolean> {
    // В production это будет реальный fetch
    // const response = await fetch(`${this.BASE_URL}/schedule`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ employeeId, schedule })
    // });
    // return response.ok;

    // Пока имитируем отправку
    console.log('📤 Отправка графика на сервер:', {
      employeeId,
      scheduleCount: schedule.length,
      workDays: schedule.filter(d => d.isWorkDay).length,
      data: schedule
    });

    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 500));

    // Имитация успешного ответа
    return true;
  }

  // Загрузка графика с сервера
  async loadScheduleFromServer(employeeId: string, year: number, month: number): Promise<ScheduleDay[] | null> {
    // В production:
    // const response = await fetch(`${this.BASE_URL}/schedule/${employeeId}?year=${year}&month=${month}`);
    // return await response.json();

    console.log('📥 Запрос графика с сервера:', { employeeId, year, month });

    // Пока возвращаем null (нет данных)
    return null;
  }

  // Отправка Face ID отметки на сервер
  async sendCheckInToServer(employeeId: string, unixTimestamp: number, faceMatch: number): Promise<boolean> {
    console.log('📤 Отправка Face ID отметки:', {
      employeeId,
      unixTimestamp,
      timestamp: new Date(unixTimestamp * 1000).toLocaleString('ru-RU'),
      faceMatch: `${faceMatch.toFixed(1)}%`
    });

    await new Promise(resolve => setTimeout(resolve, 300));
    return true;
  }
}

export const apiService = new ApiService();