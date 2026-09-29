import { DashboardShell } from "@/components/shared/DashboardShell"
import { ClientDossierView } from "@/components/features/agency/ClientDossierView"

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Client Account Dossier | Agency CRM",
  description: "Manage client company contacts, communications timeline, tasks, and project castings.",
}

export default async function ClientDossierPage({ params }: PageProps) {
  const resolvedParams = await params
  const { id } = resolvedParams

  return (
    <DashboardShell role="agency">
      <ClientDossierView clientId={id} />
    </DashboardShell>
  )
}
