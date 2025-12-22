import { useState } from 'react';
import type { Filters, Company } from '../../types';
import './Sidebar.scss';

interface SidebarProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  departments: string[];
  positions: string[];
  companies: Company[];
  objectLocations: string[];
}

const ComponentName = 'Sidebar';

export const Sidebar: React.FC<SidebarProps> = ({
  filters,
  onFilterChange,
  departments,
  positions,
  companies,
  objectLocations
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (key: keyof Filters, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onFilterChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters: Filters = {
      department: '',
      position: '',
      status: '',
      searchQuery: '',
      companyId: '',
      objectLocation: '',
      scheduleType: '',
      isActive: undefined
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <aside className={`${ComponentName}-body`}>
      <div className={`${ComponentName}-section`}>
        <label className={`${ComponentName}-label`}>Поиск</label>
        <input
          type="text"
          className={`${ComponentName}-input`}
          placeholder="Поиск по имени..."
          value={localFilters.searchQuery}
          onChange={(e) => handleChange('searchQuery', e.target.value)}
        />
      </div>

      <div className={`${ComponentName}-section`}>
        <label className={`${ComponentName}-label`}>Статус сотрудника</label>
        <div className={`${ComponentName}-statusFilter`}>
          <label className={`${ComponentName}-statusItem ${localFilters.isActive === true ? 'active' : ''}`}>
            <input
              type="radio"
              name="status"
              checked={localFilters.isActive === true}
              onChange={() => handleChange('isActive', true)}
            />
            <span>Действующие</span>
          </label>
          <label className={`${ComponentName}-statusItem ${localFilters.isActive === false ? 'active' : ''}`}>
            <input
              type="radio"
              name="status"
              checked={localFilters.isActive === false}
              onChange={() => handleChange('isActive', false)}
            />
            <span>Уволенные</span>
          </label>
          <label className={`${ComponentName}-statusItem ${localFilters.isActive === undefined ? 'active' : ''}`}>
            <input
              type="radio"
              name="status"
              checked={localFilters.isActive === undefined}
              onChange={() => handleChange('isActive', undefined)}
            />
            <span>Все</span>
          </label>
        </div>
      </div>

      <div className={`${ComponentName}-section`}>
        <label className={`${ComponentName}-label`}>Компания</label>
        <select
          className={`${ComponentName}-select`}
          value={localFilters.companyId || ''}
          onChange={(e) => handleChange('companyId', e.target.value)}
        >
          <option value="">Все компании</option>
          {companies.map(company => (
            <option key={company.id} value={company.id}>{company.name}</option>
          ))}
        </select>
      </div>

      <div className={`${ComponentName}-section`}>
        <label className={`${ComponentName}-label`}>Отдел</label>
        <select
          className={`${ComponentName}-select`}
          value={localFilters.department}
          onChange={(e) => handleChange('department', e.target.value)}
        >
          <option value="">Все отделы</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      <div className={`${ComponentName}-section`}>
        <label className={`${ComponentName}-label`}>Должность</label>
        <select
          className={`${ComponentName}-select`}
          value={localFilters.position}
          onChange={(e) => handleChange('position', e.target.value)}
        >
          <option value="">Все должности</option>
          {positions.map(pos => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
      </div>

      <div className={`${ComponentName}-section`}>
        <label className={`${ComponentName}-label`}>Объект</label>
        <select
          className={`${ComponentName}-select`}
          value={localFilters.objectLocation || ''}
          onChange={(e) => handleChange('objectLocation', e.target.value)}
        >
          <option value="">Все объекты</option>
          {objectLocations.map(obj => (
            <option key={obj} value={obj}>{obj}</option>
          ))}
        </select>
      </div>

      <div className={`${ComponentName}-section`}>
        <label className={`${ComponentName}-label`}>График работы</label>
        <select
          className={`${ComponentName}-select`}
          value={localFilters.scheduleType || ''}
          onChange={(e) => handleChange('scheduleType', e.target.value)}
        >
          <option value="">Все графики</option>
          <option value="5/2">5/2 (Пятидневка)</option>
          <option value="2/2">2/2 (Двухдневка)</option>
          <option value="1/3">1/3 (Сутки)</option>
          <option value="flexible">Гибкий</option>
        </select>
      </div>

      <button 
        className={`${ComponentName}-btn ${ComponentName}-btn--primary`}
        onClick={handleApply}
      >
        Применить фильтры
      </button>
      <button 
        className={`${ComponentName}-btn ${ComponentName}-btn--secondary`}
        onClick={handleReset}
      >
        Сбросить
      </button>
    </aside>
  );
};