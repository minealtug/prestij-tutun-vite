import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  CografiFiltreCascadeValues,
  CografiFiltreOptionsDto,
  CografiFiltreQueryParams,
} from '../types'
import { toCografiFiltreQueryParams } from '../types'
import {
  getAlimNoktalariForMintika,
  getBolgelerForMensei,
  getKoylerForAlimNoktasi,
  getMintikalarForBolge,
  toSelectOptions,
} from '../utils/cografi-filtre'

const EMPTY_VALUES: CografiFiltreCascadeValues = {
  menseiId: '',
  bolgeId: '',
  mintikaId: '',
  alimNoktasiId: '',
  koyId: '',
}

function applyAutoSelect(
  options: CografiFiltreOptionsDto,
  values: CografiFiltreCascadeValues,
): CografiFiltreCascadeValues {
  const next = { ...values }

  if (!next.menseiId && options.menseiler.length === 1) {
    next.menseiId = String(options.menseiler[0].id)
  }

  const menseiIdNum = next.menseiId ? Number(next.menseiId) : undefined
  const bolgeler = getBolgelerForMensei(options, menseiIdNum)
  if (!next.bolgeId && bolgeler.length === 1) {
    next.bolgeId = String(bolgeler[0].id)
  }

  const bolgeIdNum = next.bolgeId ? Number(next.bolgeId) : undefined
  const mintikalar = getMintikalarForBolge(options, bolgeIdNum)
  if (!next.mintikaId && mintikalar.length === 1) {
    next.mintikaId = String(mintikalar[0].id)
  }

  return next
}

function toCascadeValues(params: CografiFiltreQueryParams): CografiFiltreCascadeValues {
  const toStr = (value?: number) => (value != null && value > 0 ? String(value) : '')
  return {
    menseiId: toStr(params.menseiId),
    bolgeId: toStr(params.bolgeId),
    mintikaId: toStr(params.mintikaId),
    alimNoktasiId: toStr(params.alimNoktasiId),
    koyId: toStr(params.koyId),
  }
}

export function useCografiFiltreCascade(options: CografiFiltreOptionsDto | undefined) {
  const [values, setValues] = useState<CografiFiltreCascadeValues>(EMPTY_VALUES)

  useEffect(() => {
    if (!options) return
    setValues((prev) => {
      const auto = applyAutoSelect(options, prev)
      if (
        auto.menseiId === prev.menseiId &&
        auto.bolgeId === prev.bolgeId &&
        auto.mintikaId === prev.mintikaId
      ) {
        return prev
      }
      return auto
    })
  }, [options, values.menseiId, values.bolgeId, values.mintikaId])

  const menseiIdNum = values.menseiId ? Number(values.menseiId) : undefined
  const bolgeIdNum = values.bolgeId ? Number(values.bolgeId) : undefined
  const mintikaIdNum = values.mintikaId ? Number(values.mintikaId) : undefined
  const alimNoktasiIdNum = values.alimNoktasiId ? Number(values.alimNoktasiId) : undefined

  const menseiler = options?.menseiler ?? []
  const bolgeler = useMemo(
    () => (options ? getBolgelerForMensei(options, menseiIdNum) : []),
    [options, menseiIdNum],
  )
  const mintikalar = useMemo(
    () => (options ? getMintikalarForBolge(options, bolgeIdNum) : []),
    [options, bolgeIdNum],
  )
  const alimNoktalari = useMemo(
    () => (options ? getAlimNoktalariForMintika(options, mintikaIdNum) : []),
    [options, mintikaIdNum],
  )
  const koyler = useMemo(
    () => (options ? getKoylerForAlimNoktasi(options, alimNoktasiIdNum) : []),
    [options, alimNoktasiIdNum],
  )

  const queryParams = useMemo(
    (): CografiFiltreQueryParams => toCografiFiltreQueryParams(values),
    [values],
  )

  const selectOptions = useMemo(
    () => ({
      mensei: toSelectOptions(menseiler, 'Tümü'),
      bolge: toSelectOptions(bolgeler, 'Tümü'),
      mintika: toSelectOptions(mintikalar, 'Tümü'),
      alimNoktasi: toSelectOptions(alimNoktalari, 'Tümü'),
      koy: toSelectOptions(koyler, 'Tümü'),
    }),
    [menseiler, bolgeler, mintikalar, alimNoktalari, koyler],
  )

  const lockedLevels = useMemo(
    () => ({
      mensei: menseiler.length <= 1,
      bolge: bolgeler.length <= 1,
      mintika: mintikalar.length <= 1,
    }),
    [menseiler.length, bolgeler.length, mintikalar.length],
  )

  const setMenseiId = (menseiId: string) => {
    setValues({
      menseiId,
      bolgeId: '',
      mintikaId: '',
      alimNoktasiId: '',
      koyId: '',
    })
  }

  const setBolgeId = (bolgeId: string) => {
    setValues((prev) => ({
      ...prev,
      bolgeId,
      mintikaId: '',
      alimNoktasiId: '',
      koyId: '',
    }))
  }

  const setMintikaId = (mintikaId: string) => {
    setValues((prev) => ({
      ...prev,
      mintikaId,
      alimNoktasiId: '',
      koyId: '',
    }))
  }

  const setAlimNoktasiId = (alimNoktasiId: string) => {
    setValues((prev) => ({
      ...prev,
      alimNoktasiId,
      koyId: '',
    }))
  }

  const setKoyId = (koyId: string) => {
    setValues((prev) => ({ ...prev, koyId }))
  }

  const reset = () => setValues(EMPTY_VALUES)

  const resetToScopedDefaults = useCallback(() => {
    setValues((prev) => {
      if (!options) return EMPTY_VALUES
      const next = applyAutoSelect(options, EMPTY_VALUES)
      if (
        next.menseiId === prev.menseiId &&
        next.bolgeId === prev.bolgeId &&
        next.mintikaId === prev.mintikaId &&
        next.alimNoktasiId === prev.alimNoktasiId &&
        next.koyId === prev.koyId
      ) {
        return prev
      }
      return next
    })
  }, [options])

  const applyFromQueryParams = useCallback(
    (params: CografiFiltreQueryParams) => {
      setValues((prev) => {
        const seeded = toCascadeValues(params)
        const next = options ? applyAutoSelect(options, seeded) : seeded
        if (
          next.menseiId === prev.menseiId &&
          next.bolgeId === prev.bolgeId &&
          next.mintikaId === prev.mintikaId &&
          next.alimNoktasiId === prev.alimNoktasiId &&
          next.koyId === prev.koyId
        ) {
          return prev
        }
        return next
      })
    },
    [options],
  )

  return {
    values,
    queryParams,
    selectOptions,
    lockedLevels,
    setMenseiId,
    setBolgeId,
    setMintikaId,
    setAlimNoktasiId,
    setKoyId,
    reset,
    resetToScopedDefaults,
    applyFromQueryParams,
  }
}
