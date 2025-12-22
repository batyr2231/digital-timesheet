import type { Company } from '../types';

class CompanyService {
  private STORAGE_KEY = 'timesheet_companies';

  getCompanies(): Company[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    const defaultCompanies = this.getDefaultCompanies();
    this.saveCompanies(defaultCompanies);
    return defaultCompanies;
  }

  private getDefaultCompanies(): Company[] {
    return [
      { id: '1', name: 'ТОО "BAYRK & CO"', inn: '123456789012' },
      { id: '2', name: 'ТОО "ТехноСервис"', inn: '987654321098' },
      { id: '3', name: 'ИП Серикбаев Б.', inn: '456789123456' }
    ];
  }

  saveCompanies(companies: Company[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(companies));
  }

  addCompany(company: Omit<Company, 'id'>): Company {
    const companies = this.getCompanies();
    const newCompany: Company = {
      ...company,
      id: Date.now().toString()
    };
    companies.push(newCompany);
    this.saveCompanies(companies);
    return newCompany;
  }

  getCompanyById(id: string): Company | undefined {
    const companies = this.getCompanies();
    return companies.find(c => c.id === id);
  }
}

export const companyService = new CompanyService();