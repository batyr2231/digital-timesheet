import { useState, useEffect } from 'react';
import type { Company } from '../../types';
import { companyService } from '../../services/companyService';
import './CompanySelector.scss';

interface CompanySelectorProps {
  selectedCompanyId: string | null;
  onCompanyChange: (companyId: string | null) => void;
}

const ComponentName = 'CompanySelector';

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  selectedCompanyId,
  onCompanyChange
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    const loadedCompanies = companyService.getCompanies();
    setCompanies(loadedCompanies);
  }, []);

  return (
    <div className={`${ComponentName}-body`}>
      <label className={`${ComponentName}-label`}>Компания:</label>
      <select
        className={`${ComponentName}-select`}
        value={selectedCompanyId || ''}
        onChange={(e) => onCompanyChange(e.target.value || null)}
      >
        <option value="">Все компании</option>
        {companies.map(company => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
    </div>
  );
};