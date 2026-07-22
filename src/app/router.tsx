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
import { MySurveyResponsesPage } from '@/features/survey-responses/pages/MySurveyResponsesPage'
import { SurveyFillPage } from '@/features/survey-fill/pages/SurveyFillPage'
import { AnswerUnitsPage } from '@/features/answer-units/pages/AnswerUnitsPage'
import { OptionGroupsPage } from '@/features/option-groups/pages/OptionGroupsPage'
import { EkiciDefinitionsPage } from '@/features/ekici-definitions/pages/EkiciDefinitionsPage'
import { EkicilerimPage } from '@/features/ekici-definitions/pages/EkicilerimPage'
import { ModulePage } from '@/pages/ModulePage'
import { ReportsPage } from '@/features/reports/pages/ReportsPage'
import { AgeGenderReportPage } from '@/features/reports/pages/AgeGenderReportPage'
import { HamVeriReportPage } from '@/features/reports/pages/HamVeriReportPage'
import { AnketCevaplariReportPage } from '@/features/reports/pages/AnketCevaplariReportPage'
import { YetkilendirmePage } from '@/features/permissions/pages/YetkilendirmePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [{ index: true, element: <LoginPage /> }],
      },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'soru-yonetimi', element: <QuestionsPage /> },
          { path: 'tanimlamalar/soru-tanimlamalari', element: <QuestionsPage /> },
          { path: 'tanimlamalar/anket-tanimlamalari', element: <SurveysPage /> },
          { path: 'tanimlamalar/birim-tanimlamalari', element: <AnswerUnitsPage /> },
          { path: 'tanimlamalar/secenek-tanimlamalari', element: <OptionGroupsPage /> },
          { path: 'tanimlamalar/ekici-tanimlamalari', element: <EkiciDefinitionsPage /> },
          {
            path: 'anket-yonetimi',
            element: <Navigate to="/tanimlamalar/anket-tanimlamalari" replace />,
          },
          { path: 'anket-doldurma', element: <SurveyFillPage /> },
          { path: 'ekicilerim', element: <EkicilerimPage /> },
          { path: 'anket-cevaplari', element: <SurveyResponsesPage /> },
          { path: 'cevapladigim-anketler', element: <MySurveyResponsesPage /> },
          {
            path: 'cevapladığım-anketler',
            element: <Navigate to="/cevapladigim-anketler" replace />,
          },
          { path: 'raporlar', element: <ReportsPage /> },
          { path: 'raporlar/yas-cinsiyet', element: <AgeGenderReportPage /> },
          { path: 'raporlar/ham-veri', element: <HamVeriReportPage /> },
          { path: 'raporlar/anket-cevaplari', element: <AnketCevaplariReportPage /> },
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
