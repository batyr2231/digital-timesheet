import React, { useState, useEffect } from 'react';
import { faceIdService } from '../../services/faceIdService';
import type { FaceIdCheckIn } from '../../services/faceIdService';
import type { Employee } from '../../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import './FaceIdMonitor.scss';

interface FaceIdMonitorProps {
  employees: Employee[];
}

export const FaceIdMonitor: React.FC<FaceIdMonitorProps> = ({ employees }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<FaceIdCheckIn[]>([]);
  const [systemStatus, setSystemStatus] = useState({
    online: false,
    lastSync: '',
    devicesConnected: 0,
    accuracy: 0
  });

  useEffect(() => {
    loadRecentCheckIns();
    loadSystemStatus();
  }, []);

    useEffect(() => {
    if (!isOpen || employees.length === 0) return;

    const employeeIds = employees.map(e => e.id);

    // Подключаемся к real-time обновлениям Face ID
    const unsubscribe = faceIdService.connectToFaceIdStream((newCheckIn) => {
        setRecentCheckIns(prev => [newCheckIn, ...prev].slice(0, 20));
        
        // Показываем уведомление
        showNotification(newCheckIn);
    }, employeeIds);

    return unsubscribe;
    }, [isOpen, employees]);
    
  const loadRecentCheckIns = async () => {
    const checkIns = await faceIdService.getRecentCheckIns(20);
    setRecentCheckIns(checkIns);
  };

  const loadSystemStatus = async () => {
    const status = await faceIdService.getSystemStatus();
    setSystemStatus(status);
  };

  const showNotification = (checkIn: FaceIdCheckIn) => {
    const employee = employees.find(e => e.id === checkIn.employeeId);
    if (employee && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Новая отметка Face ID', {
        body: `${employee.name} - ${format(new Date(checkIn.timestamp), 'HH:mm')}`,
        icon: '/favicon.ico'
      });
    }
  };

  const getEmployeeName = (employeeId: string): string => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : 'Неизвестный';
  };

  const formatTimestamp = (timestamp: string): string => {
    return format(new Date(timestamp), 'HH:mm:ss', { locale: ru });
  };

  const getMatchColor = (match: number): string => {
    if (match >= 95) return 'high';
    if (match >= 85) return 'medium';
    return 'low';
  };

  return (
    <>
      <button 
        className="faceid-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Face ID мониторинг"
      >
        <span className="faceid-trigger__icon">👤</span>
        <span className="faceid-trigger__label">Face ID</span>
        {systemStatus.online && (
          <span className="faceid-trigger__badge"></span>
        )}
      </button>

      {isOpen && (
        <div className="faceid-monitor">
          <div className="faceid-monitor__header">
            <div className="faceid-monitor__title">
              <span className="faceid-monitor__icon">🔐</span>
              Face ID Monitor
            </div>
            <button 
              className="faceid-monitor__close"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="faceid-monitor__status">
            <div className="status-card">
              <div className={`status-indicator ${systemStatus.online ? 'online' : 'offline'}`}>
                <span className="status-indicator__dot"></span>
                {systemStatus.online ? 'Online' : 'Offline'}
              </div>
            </div>

            <div className="status-card">
              <div className="status-card__label">Устройств</div>
              <div className="status-card__value">{systemStatus.devicesConnected}</div>
            </div>

            <div className="status-card">
              <div className="status-card__label">Точность</div>
              <div className="status-card__value">{systemStatus.accuracy.toFixed(1)}%</div>
            </div>

            <div className="status-card">
              <div className="status-card__label">Последняя синх.</div>
              <div className="status-card__value status-card__value--small">
                {systemStatus.lastSync ? format(new Date(systemStatus.lastSync), 'HH:mm') : '-'}
              </div>
            </div>
          </div>

          <div className="faceid-monitor__content">
            <div className="faceid-monitor__section-title">
              Последние отметки
              <span className="faceid-monitor__count">{recentCheckIns.length}</span>
            </div>

            <div className="checkins-list">
              {recentCheckIns.length === 0 ? (
                <div className="checkins-list__empty">
                  <span className="checkins-list__empty-icon">📭</span>
                  <p>Нет отметок</p>
                </div>
              ) : (
                recentCheckIns.map((checkIn, index) => (
                  <div key={index} className="checkin-item">
                    <div className="checkin-item__avatar">
                      {getEmployeeName(checkIn.employeeId).charAt(0)}
                    </div>
                    
                    <div className="checkin-item__info">
                      <div className="checkin-item__name">
                        {getEmployeeName(checkIn.employeeId)}
                      </div>
                      <div className="checkin-item__time">
                        {formatTimestamp(checkIn.timestamp)}
                      </div>
                    </div>

                    <div className={`checkin-item__match ${getMatchColor(checkIn.faceMatch)}`}>
                      {checkIn.faceMatch.toFixed(1)}%
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};