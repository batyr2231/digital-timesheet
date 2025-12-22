import { useState, useEffect } from 'react';
import type { Employee, WorkSchedule, Company } from '../../types';
import { employeeService } from '../../services/employeeService';
import { faceIdService } from '../../services/faceIdService';
import { attendanceService } from '../../services/attendanceService';
import { companyService } from '../../services/companyService';
import './EmployeeManagement.scss';

interface EmployeeManagementProps {
  onEmployeeAdded: () => void;
}

const ComponentName = 'EmployeeManagement';

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ onEmployeeAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    department: '',
    companyId: '',
    objectLocation: '',
    scheduleType: '5/2' as '5/2' | '2/2' | '1/3' | 'flexible',
    scheduleMode: 'D' as 'D' | 'D+',
    startTime: '09:00',
    endTime: '18:00',
    workDays: [1, 2, 3, 4, 5],
    shiftDuration: 8
  });

  useEffect(() => {
    const loadedCompanies = companyService.getCompanies();
    setCompanies(loadedCompanies);
    if (loadedCompanies.length > 0) {
      setFormData(prev => ({ ...prev, companyId: loadedCompanies[0].id }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Определяем shiftDuration в зависимости от графика
      let shiftDuration = formData.shiftDuration;
      if (formData.scheduleType === '2/2') {
        shiftDuration = 12;
      } else if (formData.scheduleType === '1/3') {
        shiftDuration = 24;
      }

      const schedule: WorkSchedule = {
        type: formData.scheduleType,
        mode: formData.scheduleMode,
        startTime: formData.startTime,
        endTime: formData.endTime,
        workDays: formData.workDays,
        shiftDuration: formData.scheduleType !== '5/2' ? shiftDuration : undefined,
        earlyArrivalMinutes: 120,
        lateArrivalMinutes: 10
      };

      const newEmployee: Omit<Employee, 'id'> = {
        name: formData.name,
        position: formData.position,
        department: formData.department,
        companyId: formData.companyId,
        isActive: true,
        schedule
      };

      // Сохраняем сотрудника
      const savedEmployee = employeeService.addEmployee(newEmployee);
      
      // Регистрируем в Face ID
      await faceIdService.registerEmployee(savedEmployee.id, savedEmployee.name);
      
      // Генерируем посещаемость
      attendanceService.updateAllAttendance(2024, 12);
      
      onEmployeeAdded();
      setIsOpen(false);
      resetForm();
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Сотрудник добавлен', {
          body: `${formData.name} зарегистрирован в системе и Face ID`,
        });
      }
    } catch (error) {
      console.error('Ошибка при добавлении сотрудника:', error);
      alert('Произошла ошибка при добавлении сотрудника');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      position: '',
      department: '',
      companyId: companies.length > 0 ? companies[0].id : '',
      objectLocation: '',
      scheduleType: '5/2',
      scheduleMode: 'D',
      startTime: '09:00',
      endTime: '18:00',
      workDays: [1, 2, 3, 4, 5],
      shiftDuration: 8
    });
  };

  const toggleWorkDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day].sort()
    }));
  };

  const handleScheduleTypeChange = (type: '5/2' | '2/2' | '1/3' | 'flexible') => {
    let newData = { 
      ...formData, 
      scheduleType: type,
      scheduleMode: 'D' as 'D' | 'D+' // Сбрасываем mode
    };

    // Автоматически настраиваем параметры в зависимости от графика
    if (type === '2/2') {
      newData.startTime = '08:00';
      newData.endTime = '20:00';
      newData.shiftDuration = 12;
      newData.workDays = [1, 2, 3, 4, 5, 6, 7]; // Все дни
    } else if (type === '1/3') {
      newData.startTime = '08:00';
      newData.endTime = '08:00';
      newData.shiftDuration = 24;
      newData.workDays = [1, 2, 3, 4, 5, 6, 7]; // Все дни
    } else if (type === '5/2') {
      newData.startTime = '09:00';
      newData.endTime = '18:00';
      newData.shiftDuration = 8;
      newData.workDays = [1, 2, 3, 4, 5]; // Пн-Пт
    }

    setFormData(newData);
  };

  const weekDays = [
    { value: 1, label: 'Пн' },
    { value: 2, label: 'Вт' },
    { value: 3, label: 'Ср' },
    { value: 4, label: 'Чт' },
    { value: 5, label: 'Пт' },
    { value: 6, label: 'Сб' },
    { value: 7, label: 'Вс' }
  ];

  return (
    <div className={`${ComponentName}-body`}>
      <button 
        className={`${ComponentName}-addBtn`}
        onClick={() => setIsOpen(true)}
      >
        <span className={`${ComponentName}-addIcon`}>+</span>
        Добавить сотрудника
      </button>

      {isOpen && (
        <div className={`${ComponentName}-modalOverlay`} onClick={() => !isSubmitting && setIsOpen(false)}>
          <div className={`${ComponentName}-modal`} onClick={(e) => e.stopPropagation()}>
            <div className={`${ComponentName}-modal-header`}>
              <h2 className={`${ComponentName}-modal-title`}>Новый сотрудник</h2>
              <button 
                className={`${ComponentName}-modal-close`}
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className={`${ComponentName}-modal-form`}>
              <div className={`${ComponentName}-formGroup`}>
                <label className={`${ComponentName}-formLabel`}>Компания *</label>
                <select
                  className={`${ComponentName}-formSelect`}
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  required
                  disabled={isSubmitting}
                >
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={`${ComponentName}-formGroup`}>
                <label className={`${ComponentName}-formLabel`}>ФИО *</label>
                <input
                  type="text"
                  className={`${ComponentName}-formInput`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Иванов Иван Иванович"
                  disabled={isSubmitting}
                />
              </div>

              <div className={`${ComponentName}-formRow`}>
                <div className={`${ComponentName}-formGroup`}>
                  <label className={`${ComponentName}-formLabel`}>Должность *</label>
                  <input
                    type="text"
                    className={`${ComponentName}-formInput`}
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    required
                    placeholder="Frontend Developer"
                    disabled={isSubmitting}
                  />
                </div>

                <div className={`${ComponentName}-formGroup`}>
                  <label className={`${ComponentName}-formLabel`}>Отдел *</label>
                  <input
                    type="text"
                    className={`${ComponentName}-formInput`}
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                    placeholder="IT"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className={`${ComponentName}-formGroup`}>
                <label className={`${ComponentName}-formLabel`}>Объект работы</label>
                <input
                  type="text"
                  className={`${ComponentName}-formInput`}
                  value={formData.objectLocation}
                  onChange={(e) => setFormData({ ...formData, objectLocation: e.target.value })}
                  placeholder="SYGANAQ, Офис и т.д."
                  disabled={isSubmitting}
                />
              </div>

              <div className={`${ComponentName}-formGroup`}>
                <label className={`${ComponentName}-formLabel`}>Тип графика *</label>
                <select
                  className={`${ComponentName}-formSelect`}
                  value={formData.scheduleType}
                  onChange={(e) => handleScheduleTypeChange(e.target.value as any)}
                  disabled={isSubmitting}
                >
                  <option value="5/2">5/2 (Пятидневка, 8ч)</option>
                  <option value="2/2">2/2 (Двухдневка, 12ч)</option>
                  <option value="1/3">1/3 (Сутки через трое, 24ч)</option>
                  <option value="flexible">Гибкий график</option>
                </select>
              </div>

              <div className={`${ComponentName}-formGroup`}>
                <label className={`${ComponentName}-formLabel`}>Режим работы *</label>
                <select
                  className={`${ComponentName}-formSelect`}
                  value={formData.scheduleMode}
                  onChange={(e) => setFormData({ ...formData, scheduleMode: e.target.value as 'D' | 'D+' })}
                  disabled={isSubmitting}
                >
                  <option value="D">D - Дневной (в рамках одного дня)</option>
                  <option value="D+">D+ - Ночной (переход на следующий день)</option>
                </select>
                <div className={`${ComponentName}-formHint`}>
                  <small>
                    {formData.scheduleMode === 'D' 
                      ? '📅 Смена начинается и заканчивается в один день (например 09:00-18:00)' 
                      : '🌙 Смена переходит на следующий день (например 21:00-06:00)'}
                  </small>
                </div>
              </div>

              <div className={`${ComponentName}-formRow`}>
                <div className={`${ComponentName}-formGroup`}>
                  <label className={`${ComponentName}-formLabel`}>Начало работы *</label>
                  <input
                    type="time"
                    className={`${ComponentName}-formInput`}
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className={`${ComponentName}-formGroup`}>
                  <label className={`${ComponentName}-formLabel`}>Конец работы *</label>
                  <input
                    type="time"
                    className={`${ComponentName}-formInput`}
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {formData.scheduleType === '5/2' && (
                <div className={`${ComponentName}-formGroup`}>
                  <label className={`${ComponentName}-formLabel`}>Рабочие дни *</label>
                  <div className={`${ComponentName}-weekdays`}>
                    {weekDays.map(day => (
                      <button
                        key={day.value}
                        type="button"
                        className={`${ComponentName}-weekdayBtn ${
                          formData.workDays.includes(day.value) ? 'active' : ''
                        }`}
                        onClick={() => toggleWorkDay(day.value)}
                        disabled={isSubmitting}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={`${ComponentName}-modal-actions`}>
                <button
                  type="button"
                  className={`${ComponentName}-btn ${ComponentName}-btn--secondary`}
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  className={`${ComponentName}-btn ${ComponentName}-btn--primary`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Добавление...' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};