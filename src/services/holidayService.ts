export interface Holiday {
  id: string;
  date: string; // dd.mm формат (без года, т.к. повторяется каждый год)
  name: string;
  year?: number; // Если праздник только для конкретного года
}

class HolidayService {
  private STORAGE_KEY = 'timesheet_holidays';

  // Получить все праздники
  getHolidays(): Holiday[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    
    const defaultHolidays = this.getDefaultHolidays();
    this.saveHolidays(defaultHolidays);
    return defaultHolidays;
  }

  // Дефолтные праздники Казахстана
  private getDefaultHolidays(): Holiday[] {
    return [
      { id: '1', date: '01.01', name: 'Новый год' },
      { id: '2', date: '02.01', name: 'Новый год (2-й день)' },
      { id: '3', date: '07.01', name: 'Рождество' },
      { id: '4', date: '08.03', name: 'Международный женский день' },
      { id: '5', date: '21.03', name: 'Наурыз мейрамы' },
      { id: '6', date: '22.03', name: 'Наурыз мейрамы (2-й день)' },
      { id: '7', date: '23.03', name: 'Наурыз мейрамы (3-й день)' },
      { id: '8', date: '01.05', name: 'День единства народа Казахстана' },
      { id: '9', date: '07.05', name: 'День защитника Отечества' },
      { id: '10', date: '09.05', name: 'День Победы' },
      { id: '11', date: '06.07', name: 'День столицы' },
      { id: '12', date: '30.08', name: 'День Конституции' },
      { id: '13', date: '01.12', name: 'День Первого Президента' },
      { id: '14', date: '16.12', name: 'День Независимости' },
      { id: '15', date: '17.12', name: 'День Независимости (2-й день)' }
    ];
  }

  // Проверить является ли дата праздником
  isHoliday(date: Date): boolean {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dateKey = `${day}.${month}`;
    const year = date.getFullYear();

    const holidays = this.getHolidays();
    
    return holidays.some(h => {
      // Если у праздника указан год - проверяем точное совпадение
      if (h.year) {
        return h.date === dateKey && h.year === year;
      }
      // Иначе - праздник повторяется каждый год
      return h.date === dateKey;
    });
  }

  // Получить название праздника
  getHolidayName(date: Date): string | null {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dateKey = `${day}.${month}`;
    const year = date.getFullYear();

    const holidays = this.getHolidays();
    const holiday = holidays.find(h => {
      if (h.year) {
        return h.date === dateKey && h.year === year;
      }
      return h.date === dateKey;
    });

    return holiday ? holiday.name : null;
  }

  // Сохранить праздники
  saveHolidays(holidays: Holiday[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(holidays));
  }

  // Добавить праздник
  addHoliday(holiday: Omit<Holiday, 'id'>): Holiday {
    const holidays = this.getHolidays();
    const newHoliday: Holiday = {
      ...holiday,
      id: Date.now().toString()
    };
    holidays.push(newHoliday);
    this.saveHolidays(holidays);
    return newHoliday;
  }

  // Удалить праздник
  removeHoliday(id: string): void {
    const holidays = this.getHolidays();
    const filtered = holidays.filter(h => h.id !== id);
    this.saveHolidays(filtered);
  }

  // Получить праздники для конкретного года
  getHolidaysForYear(year: number): Array<{ date: Date; name: string }> {
    const holidays = this.getHolidays();
    return holidays
      .filter(h => !h.year || h.year === year)
      .map(h => {
        const [day, month] = h.date.split('.').map(Number);
        return {
          date: new Date(year, month - 1, day),
          name: h.name
        };
      });
  }
}

export const holidayService = new HolidayService();