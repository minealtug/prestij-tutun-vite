import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { surveyResponsesApi } from '../api/survey-responses-api'

export function useMenseiler() {
  return useQuery({
    queryKey: queryKeys.surveyResponses.menseiler,
    queryFn: () => surveyResponsesApi.getMenseiler(),
  })
}

export function useBolgeler(menseiId?: number) {
  return useQuery({
    queryKey: queryKeys.surveyResponses.bolgeler(menseiId),
    queryFn: () => surveyResponsesApi.getBolgeler(menseiId),
  })
}

export function useMintikalar(bolgeId?: number) {
  return useQuery({
    queryKey: queryKeys.surveyResponses.mintikalar(bolgeId),
    queryFn: () => surveyResponsesApi.getMintikalar(bolgeId),
  })
}

export function useAlimNoktalari(mintikaId?: number) {
  return useQuery({
    queryKey: queryKeys.surveyResponses.alimNoktalari(mintikaId),
    queryFn: () => surveyResponsesApi.getAlimNoktalari(mintikaId),
  })
}

export function useKoyler(alimNoktasiId?: number) {
  return useQuery({
    queryKey: queryKeys.surveyResponses.koyler(alimNoktasiId),
    queryFn: () => surveyResponsesApi.getKoyler(alimNoktasiId),
  })
}
