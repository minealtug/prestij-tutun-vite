import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'
import { GuestRoute } from '@/components/routing/GuestRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { UsersPage } from '@/features/users/pages/UsersPage'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'
import { QuestionsPage } from '@/features/questions/pages/QuestionsPage'
import { SurveysPage } from '@/features/surveys/pages/SurveysPage'
import { SurveyResponsesPage } from '@/features/survey-responses/pages/SurveyResponsesPage'
import { SurveyFillPage } from '@/features/survey-fill/pages/SurveyFillPage'
import { ModulePage } from '@/pages/ModulePage'
import { YetkilendirmePage } from '@/features/permissions/pages/YetkilendirmePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [{ path: '/login', element: <LoginPage /> }],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'soru-yonetimi', element: <QuestionsPage /> },
          { path: 'tanimlamalar/soru-tanimlamalari', element: <QuestionsPage /> },
          { path: 'tanimlamalar/anket-tanimlamalari', element: <SurveysPage /> },
          {
            path: 'anket-yonetimi',
            element: <Navigate to="/tanimlamalar/anket-tanimlamalari" replace />,
          },
          { path: 'anket-doldurma', element: <SurveyFillPage /> },
          { path: 'anket-cevaplari', element: <SurveyResponsesPage /> },
          { path: 'raporlar', element: <ModulePage /> },
          { path: 'tanimlamalar', element: <ModulePage /> },
          { path: 'yetkilendirme', element: <YetkilendirmePage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '/404', element: <NotFoundPage /> },
  { path: '*', element: <NotFoundPage /> },
])
