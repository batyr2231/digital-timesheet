import { useState, useEffect } from 'react';
import { holidayService, type Holiday } from '../../services/holidayService';
import './HolidayManager.scss';

interface HolidayManagerProps {
  year: number;
}

const ComponentName = 'HolidayManager';

export const HolidayManager: React.FC<HolidayManagerProps> = ({ year }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '', year: 0 });

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = () => {
    const all = holidayService.getHolidays();
    setHolidays(all);
  };

  const handleAdd = () => {
    if (!newHoliday.date || !newHoliday.name) {
      alert('Заполните дату и название праздника');
      return;
    }

    holidayService.addHoliday({
      date: newHoliday.date,
      name: newHoliday.name,
      year: newHoliday.year || undefined
    });

    setNewHoliday({ date: '', name: '', year: 0 });
    loadHolidays();
    alert('✅ Праздник добавлен');
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Удалить праздник?')) return;
    holidayService.removeHoliday(id);
    loadHolidays();
  };

  const getMonthName = (dateStr: string): string => {
    const [, month] = dateStr.split('.');
    const months = ['', 'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    return months[parseInt(month)] || '';
  };

  return (
    <div className={`${ComponentName}-body`}>
      <button 
        className={`${ComponentName}-open-btn`}
        onClick={() => setIsOpen(true)}
        title="Управление праздниками"
      >
        🎉 Праздники
      </button>

      {isOpen && (
        <div className={`${ComponentName}-modal-overlay`} onClick={() => setIsOpen(false)}>
          <div className={`${ComponentName}-modal`} onClick={(e) => e.stopPropagation()}>
            <div className={`${ComponentName}-modal-header`}>
              <h3 className={`${ComponentName}-modal-title`}>Праздники ({year})</h3>
              <button 
                className={`${ComponentName}-modal-close`}
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>

            <div className={`${ComponentName}-modal-content`}>
              {/* ФОРМА ДОБАВЛЕНИЯ */}
              <div className={`${ComponentName}-add-form`}>
                <h4>Добавить праздник</h4>
                <div className={`${ComponentName}-form-row`}>
                  <input
                    type="text"
                    className={`${ComponentName}-input`}
                    placeholder="дд.мм (например 01.01)"
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                  />
                  <input
                    type="text"
                    className={`${ComponentName}-input`}
                    placeholder="Название праздника"
                    value={newHoliday.name}
                    onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                    style={{ flex: 2 }}
                  />
                  <input
                    type="number"
                    className={`${ComponentName}-input`}
                    placeholder="Год (опц.)"
                    value={newHoliday.year || ''}
                    onChange={(e) => setNewHoliday({ ...newHoliday, year: parseInt(e.target.value) || 0 })}
                    style={{ maxWidth: '100px' }}
                  />
                  <button 
                    className={`${ComponentName}-add-btn`}
                    onClick={handleAdd}
                  >
                    +
                  </button>
                </div>
                <small className={`${ComponentName}-hint`}>
                  💡 Если год не указан, праздник будет повторяться каждый год
                </small>
              </div>

              {/* СПИСОК ПРАЗДНИКОВ */}
              <div className={`${ComponentName}-list`}>
                <h4>Все праздники ({holidays.length})</h4>
                {holidays.length === 0 ? (
                  <p className={`${ComponentName}-empty`}>Нет праздников</p>
                ) : (
                  <div className={`${ComponentName}-items`}>
                    {holidays.map(holiday => (
                      <div key={holiday.id} className={`${ComponentName}-item`}>
                        <div className={`${ComponentName}-item-date`}>
                          {holiday.date}
                          <span className={`${ComponentName}-item-month`}>
                            {getMonthName(holiday.date)}
                          </span>
                        </div>
                        <div className={`${ComponentName}-item-name`}>
                          {holiday.name}
                          {holiday.year && (
                            <span className={`${ComponentName}-item-year`}>({holiday.year})</span>
                          )}
                        </div>
                        <button 
                          className={`${ComponentName}-delete-btn`}
                          onClick={() => handleDelete(holiday.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};