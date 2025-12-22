import type { ComplexSchedule, ScheduleBlock, ScheduleDay, Employee } from '../types';

class ComplexScheduleService {
  // Генерация графика на месяц по сложной схеме
  generateComplexMonthSchedule(
    employee: Employee,
    year: number,
    month: number
  ): ScheduleDay[] {
    if (!employee.schedule.complexSchedule) {
      throw new Error('Сложный график не настроен');
    }

    const schedule: ScheduleDay[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    const complexConfig = employee.schedule.complexSchedule;
    
    // Вычисляем общую длину цикла
    const cycleDays = this.calculateCycleDays(complexConfig.schedArrays);
    
    let cycleDay = 0; // Текущий день в цикле
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = this.formatDateToDDMMYYYY(date);
      
      // Определяем в каком блоке графика мы находимся
      const { block, dayInBlock, isWorkDay } = this.getDayConfig(
        cycleDay,
        complexConfig.schedArrays
      );
      
      if (!isWorkDay) {
        // Выходной день
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
          isWorkDay: 0,
          isHolyday: 0,
          overNight: 0,
          planHours: 0,
          dayLunches: [],
          overNightLunches: []
        });
      } else {
        // Рабочий день
        const workDayConfig = block!.workDays[dayInBlock!];
        const shift = this.createShiftFromConfig(date, workDayConfig);
        
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
          overNight: workDayConfig.overNight,
          planHours: workDayConfig.workHours,
          dayLunches: shift.dayLunches,
          overNightLunches: shift.overNightLunches || [],
          factHours: 0,
          isLateArrival: 0,
          isEarlyDeparture: 0,
          LAtotalMins: 0,
          EAtotalMins: 0,
          EDtotalMins: 0
        });
      }
      
      cycleDay = (cycleDay + 1) % cycleDays;
    }
    
    return schedule;
  }

  // Вычисляем общую длину цикла (сумма всех рабочих и выходных дней)
  private calculateCycleDays(blocks: ScheduleBlock[]): number {
    return blocks.reduce((total, block) => {
      return total + block.workDays.length + block.unWorkDays.length;
    }, 0);
  }

  // Определяем конфигурацию для конкретного дня цикла
  private getDayConfig(
    cycleDay: number,
    blocks: ScheduleBlock[]
  ): {
    block: ScheduleBlock | null;
    dayInBlock: number | null;
    isWorkDay: boolean;
  } {
    let currentDay = cycleDay;
    
    for (const block of blocks) {
      const blockTotalDays = block.workDays.length + block.unWorkDays.length;
      
      if (currentDay < blockTotalDays) {
        // День находится в этом блоке
        if (currentDay < block.workDays.length) {
          // Рабочий день
          return {
            block,
            dayInBlock: currentDay,
            isWorkDay: true
          };
        } else {
          // Выходной день
          return {
            block: null,
            dayInBlock: null,
            isWorkDay: false
          };
        }
      }
      
      currentDay -= blockTotalDays;
    }
    
    // Не должны сюда попасть, но на всякий случай
    return { block: null, dayInBlock: null, isWorkDay: false };
  }

  // Создаем смену из конфигурации
  private createShiftFromConfig(
    date: Date,
    config: any
  ): {
    unixStart: number;
    unixEnd: number;
    dayLunches: any[];
    overNightLunches: any[];
  } {
    const [startH, startM] = config.startLocTime.split(':').map(Number);
    const [endH, endM] = config.endLocTime.split(':').map(Number);

    const startDate = new Date(date);
    startDate.setHours(startH, startM, 0, 0);

    let endDate = new Date(date);
    endDate.setHours(endH, endM, 0, 0);

    if (config.overNight === 1) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const unixStart = Math.floor(startDate.getTime() / 1000);
    const unixEnd = Math.floor(endDate.getTime() / 1000);

    // Конвертируем обеды в UNIX timestamps
    const dayLunches = config.dayLunches.map((lunch: any) => {
      const [lunchStartH, lunchStartM] = lunch.lunchStart.split(':').map(Number);
      const [lunchEndH, lunchEndM] = lunch.lunchEnd.split(':').map(Number);

      const lunchStartDate = new Date(date);
      lunchStartDate.setHours(lunchStartH, lunchStartM, 0, 0);

      const lunchEndDate = new Date(date);
      lunchEndDate.setHours(lunchEndH, lunchEndM, 0, 0);

      return {
        lunchName: lunch.lunchName,
        lunchUstart: Math.floor(lunchStartDate.getTime() / 1000),
        lunchUend: Math.floor(lunchEndDate.getTime() / 1000)
      };
    });

    const overNightLunches = (config.overNightLunches || []).map((lunch: any) => {
      const [lunchStartH, lunchStartM] = lunch.lunchStart.split(':').map(Number);
      const [lunchEndH, lunchEndM] = lunch.lunchEnd.split(':').map(Number);

      const lunchStartDate = new Date(date);
      lunchStartDate.setHours(lunchStartH, lunchStartM, 0, 0);
      lunchStartDate.setDate(lunchStartDate.getDate() + 1); // Следующий день

      const lunchEndDate = new Date(date);
      lunchEndDate.setHours(lunchEndH, lunchEndM, 0, 0);
      lunchEndDate.setDate(lunchEndDate.getDate() + 1);

      return {
        lunchName: lunch.lunchName,
        lunchUstart: Math.floor(lunchStartDate.getTime() / 1000),
        lunchUend: Math.floor(lunchEndDate.getTime() / 1000)
      };
    });

    return { unixStart, unixEnd, dayLunches, overNightLunches };
  }

  // Вспомогательные методы
  private formatDateToDDMMYYYY(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  private getMonthName(date: Date): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[date.getMonth()];
  }

  private getDayWeekName(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  // Пример сложного графика (как в требованиях заказчика)
  getExampleComplexSchedule(): ComplexSchedule {
    return {
      schedID: 1,
      LATolerance_mins: [90, 15],
      EDTolerance_mins: [15, 90],
      lunchesLAED: 5,
      LAalerts: 1,
      EDalerts: 1,
      isValidLateArrival: 0,
      schedName: "Sched_5_2_and_5_2_and_3_3",
      schedArrays: [
        // Блок 1: 5 дней 09:00-18:00 + 2 выходных
        {
          workDays: [
            { startLocTime: "09:00", endLocTime: "18:00", overNight: 0, workHours: 8, lunchHour: 1, dayLunches: [{ lunchName: "lunch_1", lunchStart: "13:00", lunchEnd: "14:00" }] },
            { startLocTime: "09:00", endLocTime: "18:00", overNight: 0, workHours: 8, lunchHour: 1, dayLunches: [{ lunchName: "lunch_1", lunchStart: "13:00", lunchEnd: "14:00" }] },
            { startLocTime: "09:00", endLocTime: "18:00", overNight: 0, workHours: 8, lunchHour: 1, dayLunches: [{ lunchName: "lunch_1", lunchStart: "13:00", lunchEnd: "14:00" }] },
            { startLocTime: "09:00", endLocTime: "18:00", overNight: 0, workHours: 8, lunchHour: 1, dayLunches: [{ lunchName: "lunch_1", lunchStart: "13:00", lunchEnd: "14:00" }] },
            { startLocTime: "09:00", endLocTime: "18:00", overNight: 0, workHours: 8, lunchHour: 1, dayLunches: [{ lunchName: "lunch_1", lunchStart: "13:00", lunchEnd: "14:00" }] }
          ],
          unWorkDays: [{ day: 1 }, { day: 1 }]
        },
        // Блок 2: 5 дней 11:00-20:00 + 2 выходных
        {
          workDays: [
            { startLocTime: "11:00", endLocTime: "20:00", overNight: 0, workHours: 8, lunchHour: 1, dayLunches: [{ lunchName: "lunch_1", lunchStart: "15:00", lunchEnd: "16:00" }] },
            { startLocTime: "11:00", endLocTime: "20:00", overNight: 0, workHours: 8, lunchHour: 1, dayLunches: [{ lunchName: "lunch_1", lunchStart: "15:00", lunchEnd: "16:00" }] },
            { startLocTime: "11:00", endLocTime: "20:00", overNight: 0, workHours: 8, lunchHour: 1, dayLunches: [{ lunchName: "lunch_1", lunchStart: "15:00", lunchEnd: "16:00" }] },
            { startLocTime: "11:00", endLocTime: "20:00", overNight: 0, workHours: 8, lunchHour: 1, dayLunches: [{ lunchName: "lunch_1", lunchStart: "15:00", lunchEnd: "16:00" }] },
            { startLocTime: "11:00", endLocTime: "20:00", overNight: 0, workHours: 8, lunchHour: 1, dayLunches: [{ lunchName: "lunch_1", lunchStart: "15:00", lunchEnd: "16:00" }] }
          ],
          unWorkDays: [{ day: 1 }, { day: 1 }]
        },
        // Блок 3: 3 дня 16:00-16:00 (сутки) + 3 выходных
        {
          workDays: [
            {
              startLocTime: "16:00",
              endLocTime: "16:00",
              overNight: 1,
              workHours: 22,
              lunchHour: 2,
              dayLunches: [
                { lunchName: "lunch_1", lunchStart: "19:00", lunchEnd: "19:30" },
                { lunchName: "lunch_2", lunchStart: "21:00", lunchEnd: "21:30" }
              ],
              overNightLunches: [
                { lunchName: "lunch_3", lunchStart: "02:00", lunchEnd: "02:30" },
                { lunchName: "lunch_4", lunchStart: "11:00", lunchEnd: "11:30" }
              ]
            },
            {
              startLocTime: "16:00",
              endLocTime: "16:00",
              overNight: 1,
              workHours: 22,
              lunchHour: 2,
              dayLunches: [
                { lunchName: "lunch_1", lunchStart: "19:00", lunchEnd: "19:30" },
                { lunchName: "lunch_2", lunchStart: "21:00", lunchEnd: "21:30" }
              ],
              overNightLunches: [
                { lunchName: "lunch_3", lunchStart: "02:00", lunchEnd: "02:30" },
                { lunchName: "lunch_4", lunchStart: "11:00", lunchEnd: "11:30" }
              ]
            },
            {
              startLocTime: "16:00",
              endLocTime: "16:00",
              overNight: 1,
              workHours: 22,
              lunchHour: 2,
              dayLunches: [
                { lunchName: "lunch_1", lunchStart: "19:00", lunchEnd: "19:30" },
                { lunchName: "lunch_2", lunchStart: "21:00", lunchEnd: "21:30" }
              ],
              overNightLunches: [
                { lunchName: "lunch_3", lunchStart: "02:00", lunchEnd: "02:30" },
                { lunchName: "lunch_4", lunchStart: "11:00", lunchEnd: "11:30" }
              ]
            }
          ],
          unWorkDays: [{ day: 1 }, { day: 1 }, { day: 1 }]
        }
      ]
    };
  }
}

export const complexScheduleService = new ComplexScheduleService();