import { attendanceService } from './attendanceService';

export interface FaceIdCheckIn {
  employeeId: string;
  timestamp: string;
  faceMatch: number;
  photo?: string;
}

class FaceIdService {
  private checkInHistory: FaceIdCheckIn[] = [];

  async getRecentCheckIns(limit: number = 10): Promise<FaceIdCheckIn[]> {
    return this.checkInHistory.slice(0, limit);
  }

  connectToFaceIdStream(onCheckIn: (data: FaceIdCheckIn) => void, employeeIds: string[]) {
    // Симуляция: каждые 8-15 секунд "приходит" новый сотрудник
    const scheduleNextCheckIn = () => {
      const delay = 8000 + Math.random() * 7000; // 8-15 секунд
      
      setTimeout(() => {
        if (employeeIds.length > 0) {
          const randomEmployeeId = employeeIds[Math.floor(Math.random() * employeeIds.length)];
          const checkIn = this.simulateCheckIn(randomEmployeeId);
          
          // Добавляем в историю
          this.checkInHistory.unshift(checkIn);
          this.checkInHistory = this.checkInHistory.slice(0, 50);
          
          // Сохраняем в базу посещаемости
          attendanceService.addFaceIdCheckIn(randomEmployeeId, new Date(checkIn.timestamp));
          
          // Уведомляем UI
          onCheckIn(checkIn);
        }
        
        scheduleNextCheckIn();
      }, delay);
    };

    scheduleNextCheckIn();

    return () => {
      // Cleanup при размонтировании
    };
  }

  private simulateCheckIn(employeeId: string): FaceIdCheckIn {
    return {
      employeeId,
      timestamp: new Date().toISOString(),
      faceMatch: 85 + Math.random() * 15 // 85-100%
    };
  }

  async getSystemStatus() {
    return {
      online: true,
      lastSync: new Date().toISOString(),
      devicesConnected: 3,
      accuracy: 98.5
    };
  }

  // Симуляция регистрации нового сотрудника в Face ID системе
  async registerEmployee(employeeId: string, employeeName: string): Promise<boolean> {
    
    // для регистрации лица сотрудника
    
    console.log(`Face ID: Регистрация сотрудника ${employeeName} (ID: ${employeeId})`);
    
    // Симулируем задержку регистрации
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return true;
  }
}

export const faceIdService = new FaceIdService();