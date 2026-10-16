import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import monthlyReportData from '@/lib/monthlyReportData';

export default function useMonthlyReportData(month) {
  const { user } = useAuth();
  return useQuery({ queryKey: ['monthly-report', user?.id, month.getFullYear(), month.getMonth()], enabled: !!user,
    queryFn: () => monthlyReportData(user.id, month), staleTime: 300000 });
}