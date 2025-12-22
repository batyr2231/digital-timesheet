import React from 'react';
import type { Filters as FiltersType } from '../../types';
import './Filters.scss';

interface FiltersProps {
  filters: FiltersType;
  onFilterChange: (filters: FiltersType) => void;
  departments: string[];
  positions: string[];
}

export const Filters: React.FC<FiltersProps> = ({
  filters,
  onFilterChange,
  departments,
  positions
}) => {
  const handleChange = (key: keyof FiltersType, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="filters">
      <div className="filters__group">
        <input
          type="text"
          placeholder="Поиск по имени..."
          className="filters__search"
          value={filters.searchQuery}
          onChange={(e) => handleChange('searchQuery', e.target.value)}
        />
      </div>

      <div className="filters__group">
        <select
          className="filters__select"
          value={filters.department}
          onChange={(e) => handleChange('department', e.target.value)}
        >
          <option value="">Все отделы</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      <div className="filters__group">
        <select
          className="filters__select"
          value={filters.position}
          onChange={(e) => handleChange('position', e.target.value)}
        >
          <option value="">Все должности</option>
          {positions.map(pos => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
      </div>

      <div className="filters__group">
        <select
          className="filters__select"
          value={filters.status}
          onChange={(e) => handleChange('status', e.target.value)}
        >
          <option value="">Все статусы</option>
          <option value="present">Присутствует</option>
          <option value="late">Опоздал</option>
          <option value="absent">Отсутствует</option>
        </select>
      </div>
    </div>
  );
};