import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardClient from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  console.log("SERVER: Kontrola session na dashboardu:", !!session);
  
  if (!session) {
    redirect('/login');
  }

  return <DashboardClient session={session} />;
}
