import { useState } from 'react';
import type { Employee, ScheduleDay } from '../../types';
import { scheduleService } from '../../services/scheduleService';
import './ScheduleManager.scss';
import { apiService } from '../../services/apiService';

interface ScheduleManagerProps {
  employee: Employee;
  year: number;
  month: number;
  onScheduleCreated?: () => void;
}

const ComponentName = 'ScheduleManager';

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  employee,
  year,
  month,
  onScheduleCreated
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleDay[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateSchedule = async () => {
    setIsGenerating(true);

    try {
        // 1. Генерируем график на месяц
        const monthSchedule = scheduleService.generateMonthSchedule(employee, year, month); // ← ЭТА СТРОКА БЫЛА УДАЛЕНА!
        
        // 2. ВРЕМЕННО: генерируем весь месяц (в продакшене будет фильтр)
        const validSchedule = monthSchedule;
        
        // const validSchedule = monthSchedule.filter(day => 
        //   scheduleService.canModifySchedule(day.date)
        // );

        // 3. Отправляем на сервер
        const serverResponse = await apiService.sendScheduleToServer(employee.id, validSchedule);
        
        if (!serverResponse) {
        throw new Error('Сервер не принял график');
        }

        // 4. Сохраняем локально только после успешной отправки
        setSchedule(validSchedule);
        scheduleService.saveSchedule(employee.id, validSchedule);

        // 5. Уведомление
        if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('График создан ✅', {
            body: `${employee.name}: ${validSchedule.filter((d: ScheduleDay) => d.isWorkDay).length} рабочих дней, ${(validSchedule.reduce((acc: number, d: ScheduleDay) => acc + (d.isWorkDay ? (d.unixEnd - d.unixStart) / 3600 : 0), 0)).toFixed(0)} часов`
        });
        }

        alert(`✅ График успешно создан и отправлен на сервер!\n\nРабочих дней: ${validSchedule.filter((d: ScheduleDay) => d.isWorkDay).length}\nВсего часов: ${(validSchedule.reduce((acc: number, d: ScheduleDay) => acc + (d.isWorkDay ? (d.unixEnd - d.unixStart) / 3600 : 0), 0)).toFixed(1)}`);

        if (onScheduleCreated) {
        onScheduleCreated();
        }
    } catch (error) {
        console.error('❌ Ошибка генерации графика:', error);
        alert('❌ Произошла ошибка при создании графика. Проверьте консоль.');
    } finally {
        setIsGenerating(false);
    }
    };

  const handleViewSchedule = () => {
    const saved = scheduleService.loadSchedule(employee.id);
    if (saved) {
      setSchedule(saved);
      setIsOpen(true);
    } else {
      alert('График не найден. Создайте график сначала.');
    }
  };

    const handleExportJSON = () => {
    if (!schedule) return;

    const dataStr = JSON.stringify(schedule, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schedule_${employee.name}_${year}-${month}.json`;
    link.click();
    URL.revokeObjectURL(url);
    }; 

  const getMonthName = (m: number): string => {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    return months[m - 1];
  };

  const workDaysCount = schedule?.filter(d => d.isWorkDay).length || 0;
  const totalHours = schedule?.reduce((acc, day) => {
    if (!day.isWorkDay) return acc;
    const hours = (day.unixEnd - day.unixStart) / 3600; // В часах
    return acc + hours;
  }, 0) || 0;

  return (
    <div className={`${ComponentName}-body`}>
      <button 
        className={`${ComponentName}-btn ${ComponentName}-btn--create`}
        onClick={handleGenerateSchedule}
        disabled={isGenerating}
      >
        {isGenerating ? '⏳ Создание...' : '📅 Создать график'}
      </button>

      <button 
        className={`${ComponentName}-btn ${ComponentName}-btn--view`}
        onClick={handleViewSchedule}
      >
        👁️ Просмотр
      </button>

      {isOpen && schedule && (
        <div className={`${ComponentName}-modal-overlay`} onClick={() => setIsOpen(false)}>
          <div className={`${ComponentName}-modal`} onClick={(e) => e.stopPropagation()}>
            <div className={`${ComponentName}-modal-header`}>
              <h3 className={`${ComponentName}-modal-title`}>
                График: {employee.name}
              </h3>
              <button 
                className={`${ComponentName}-modal-close`}
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>

            <div className={`${ComponentName}-modal-content`}>
              <div className={`${ComponentName}-info`}>
                <div className={`${ComponentName}-info-item`}>
                  <span className={`${ComponentName}-info-label`}>Месяц:</span>
                  <span className={`${ComponentName}-info-value`}>{getMonthName(month)} {year}</span>
                </div>
                <div className={`${ComponentName}-info-item`}>
                  <span className={`${ComponentName}-info-label`}>График:</span>
                  <span className={`${ComponentName}-info-value`}>{employee.schedule.type} {employee.schedule.mode || ''}</span>
                </div>
                <div className={`${ComponentName}-info-item`}>
                  <span className={`${ComponentName}-info-label`}>Рабочих дней:</span>
                  <span className={`${ComponentName}-info-value`}>{workDaysCount}</span>
                </div>
                <div className={`${ComponentName}-info-item`}>
                  <span className={`${ComponentName}-info-label`}>Всего часов:</span>
                  <span className={`${ComponentName}-info-value`}>{totalHours.toFixed(1)}ч</span>
                </div>
                  <div className={`${ComponentName}-info-item`}>
                        <span className={`${ComponentName}-info-label`}>Праздников:</span>
                        <span className={`${ComponentName}-info-value`}>{schedule?.filter(d => d.isHolyday === 1).length || 0}</span>
                    </div>
                    <div className={`${ComponentName}-info-item`}>
                        <span className={`${ComponentName}-info-label`}>Ночных смен:</span>
                        <span className={`${ComponentName}-info-value`}>{schedule?.filter(d => d.overNight === 1).length || 0}</span>
                    </div>
              </div>

            <button 
                className={`${ComponentName}-export-btn`}
                onClick={handleExportJSON}
                >
                💾 Экспорт в JSON
            </button>

            <div className={`${ComponentName}-schedule-list`}>
            {schedule.map(day => (
                <div 
                key={day.date} 
                className={`${ComponentName}-schedule-item ${
                    day.isWorkDay === 0 ? 'dayoff' : ''
                } ${
                    day.isHolyday === 1 ? 'holiday' : ''
                }`}
                >
                <div className={`${ComponentName}-schedule-date`}>
                    <div>{day.date}</div>
                    <div className={`${ComponentName}-schedule-dayname`}>
                    {day.dayWeek.substring(0, 3)}
                    </div>
                </div>
                
                {day.isHolyday === 1 ? (
                    <div className={`${ComponentName}-schedule-holiday`}>
                    🎉 Праздник
                    </div>
                ) : day.isWorkDay === 1 ? (
                    <div className={`${ComponentName}-schedule-details`}>
                    <div className={`${ComponentName}-schedule-time`}>
                        <span>{scheduleService.formatUnixTime(day.unixStart)}</span>
                        <span>→</span>
                        <span>{scheduleService.formatUnixTime(day.unixEnd)}</span>
                        {day.overNight === 1 && (
                        <span className={`${ComponentName}-overnight-badge`}>🌙</span>
                        )}
                    </div>
                    <div className={`${ComponentName}-schedule-hours`}>
                        {day.planHours}ч
                    </div>
                    {day.dayLunches && day.dayLunches.length > 0 && (
                        <div className={`${ComponentName}-schedule-lunches`}>
                        🍽️ {day.dayLunches.length} обед(а)
                        </div>
                    )}
                    </div>
                ) : (
                    <div className={`${ComponentName}-schedule-dayoff`}>Выходной</div>
                )}
                </div>
            ))}
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};