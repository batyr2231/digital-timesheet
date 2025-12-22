import { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Statistics } from './components/Statistics/Statistics';
import { TimesheetGrid } from './components/TimesheetGrid/TimesheetGrid';
import { EmployeeManagement } from './components/EmployeeManagement/EmployeeManagement';
import { FaceIdMonitor } from './components/FaceIdMonitor/FaceIdMonitor';
import { employees as defaultEmployees } from './data/mockData';
import { employeeService } from './services/employeeService';
import { attendanceService } from './services/attendanceService';
import { companyService } from './services/companyService';
import type { Filters as FiltersType, Employee, Company } from './types';
import './App.scss';
import { HolidayManager } from './components/HolidayManager/HolidayManager';

const ComponentName = 'App';

function App() {
  const [filters, setFilters] = useState<FiltersType>({
    department: '',
    position: '',
    status: '',
    searchQuery: '',
    companyId: undefined,
    objectLocation: undefined,
    scheduleType: undefined,
    isActive: true // По умолчанию показываем действующих
  });

const [currentYear, setCurrentYear] = useState(2025);
const [currentMonth, setCurrentMonth] = useState(1);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Загружаем компании
    const loadedCompanies = companyService.getCompanies();
    setCompanies(loadedCompanies);

    // Загружаем сотрудников
    const storedEmployees = employeeService.getEmployees();
    
    if (storedEmployees.length === 0) {
      employeeService.saveEmployees(defaultEmployees);
      setEmployees(defaultEmployees);
    } else {
      setEmployees(storedEmployees);
    }

    // Генерируем посещаемость
    attendanceService.updateAllAttendance(currentYear, currentMonth);

    // Запрашиваем разрешение на уведомления
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [refreshKey, currentYear, currentMonth]);

  const attendance = useMemo(() => {
    return employeeService.getAttendance();
  }, [refreshKey]);

  const handleLoadFromServer = async () => {
    try {
      // В продакшене это будет реальный API запрос
      console.log('📥 Загрузка данных с сервера...');
      
      // Имитация загрузки
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('📥 Данные загружены с сервера!\n\n(В продакшене здесь будет реальная загрузка посещаемости и графиков)');
      
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      alert('❌ Ошибка при загрузке данных с сервера');
    }
  };

    const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setRefreshKey(prev => prev + 1); // Обновляем данные
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setRefreshKey(prev => prev + 1);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1);
    setRefreshKey(prev => prev + 1);
  };

  // Фильтруем сотрудников
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      // Фильтр по статусу (действующие/уволенные)
      if (filters.isActive !== undefined && employee.isActive !== filters.isActive) {
        return false;
      }

      // Фильтр по компании
      if (filters.companyId && employee.companyId !== filters.companyId) {
        return false;
      }

      // Фильтр по отделу
      if (filters.department && employee.department !== filters.department) {
        return false;
      }

      // Фильтр по должности
      if (filters.position && employee.position !== filters.position) {
        return false;
      }

      // Фильтр по объекту
      if (filters.objectLocation && employee.objectLocation !== filters.objectLocation) {
        return false;
      }

      // Фильтр по графику
      if (filters.scheduleType && employee.schedule.type !== filters.scheduleType) {
        return false;
      }

      // Фильтр по поиску
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchName = employee.name.toLowerCase().includes(query);
        const matchPosition = employee.position.toLowerCase().includes(query);
        const matchDepartment = employee.department.toLowerCase().includes(query);
        
        if (!matchName && !matchPosition && !matchDepartment) {
          return false;
        }
      }

      // Фильтр по статусу посещаемости
      if (filters.status) {
        const employeeAttendance = attendance.filter(a => a.employeeId === employee.id);
        const hasStatus = employeeAttendance.some(a => a.status === filters.status);
        
        if (!hasStatus) {
          return false;
        }
      }

      return true;
    });
  }, [filters, attendance, employees]);

  // Получаем уникальные значения для фильтров
  const departments = useMemo(
    () => [...new Set(employees.map(e => e.department))],
    [employees]
  );

  const positions = useMemo(
    () => [...new Set(employees.map(e => e.position))],
    [employees]
  );

  const objectLocations = useMemo(
    () => [...new Set(employees.map(e => e.objectLocation).filter(Boolean) as string[])],
    [employees]
  );

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('ru-RU', {
    month: 'long',
    year: 'numeric'
  });

  const handleEmployeeAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className={`${ComponentName}-body`}>
      {/* HEADER */}
      <header className={`${ComponentName}-header`}>
        <div className={`${ComponentName}-header-left`}>
          <h1 className={`${ComponentName}-title`}>📋 Цифровой табель</h1>
          <div className={`${ComponentName}-period-controls`}>
            <button 
              className={`${ComponentName}-month-btn`}
              onClick={handlePrevMonth}
              title="Предыдущий месяц"
            >
              ◀
            </button>
            <div className={`${ComponentName}-period`}>{monthName}</div>
            <button 
              className={`${ComponentName}-month-btn`}
              onClick={handleNextMonth}
              title="Следующий месяц"
            >
              ▶
            </button>
            <button 
              className={`${ComponentName}-month-btn ${ComponentName}-month-btn--today`}
              onClick={handleToday}
              title="Текущий месяц"
            >
              Сегодня
            </button>
          </div>
        </div>
        <div className={`${ComponentName}-header-right`}>
          <button 
            className={`${ComponentName}-load-btn`}
            onClick={handleLoadFromServer}
            title="Загрузить данные с сервера"
          >
            🔄 Загрузить данные
          </button>
          <HolidayManager year={currentYear} /> {/* ДОБАВИЛИ */}
          <FaceIdMonitor employees={filteredEmployees} />
          <EmployeeManagement onEmployeeAdded={handleEmployeeAdded} />
        </div>
      </header>

      {/* MAIN */}
      <div className={`${ComponentName}-main`}>
        {/* SIDEBAR */}
        <Sidebar
          filters={filters}
          onFilterChange={setFilters}
          departments={departments}
          positions={positions}
          companies={companies}
          objectLocations={objectLocations}
        />

        {/* CONTENT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Statistics 
            employees={filteredEmployees} 
            attendance={attendance} 
          />

          <div style={{ flex: 1, overflow: 'auto', padding: '0 1.5rem 1.5rem' }}>
            <TimesheetGrid
              employees={filteredEmployees}
              attendance={attendance}
              year={currentYear}
              month={currentMonth}
            />
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className={`${ComponentName}-footer`}>
        <p>© 2024 Digital Timesheet System • BAYRK & CO</p>
      </footer>
    </div>
  );
}

export default App;