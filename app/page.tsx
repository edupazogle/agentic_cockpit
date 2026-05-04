import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { listScenarios } from '@/lib/server/services/scenarios'

export default async function HomePage() {
  const scenarios = await listScenarios()
  return <DashboardPage scenarios={scenarios} />
}
