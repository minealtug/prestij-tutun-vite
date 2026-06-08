import type { CreateUserFormErrors, CreateUserFormState, CreateUserRequest } from '../types/user.types'

export function validateCreateUserForm(form: CreateUserFormState): CreateUserFormErrors {
  const errors: CreateUserFormErrors = {}

  if (!form.userName.trim()) {
    errors.userName = 'Kullanıcı adı zorunludur.'
  }

  if (!form.fullName.trim()) {
    errors.fullName = 'Ad soyad zorunludur.'
  }

  if (!form.password.trim()) {
    errors.password = 'Şifre zorunludur.'
  }

  const userTypeId = Number(form.userTypeId)
  if (!form.userTypeId || !Number.isFinite(userTypeId) || userTypeId <= 0) {
    errors.userTypeId = 'Kullanıcı tipi seçiniz.'
  }

  return errors
}

export function buildCreateUserRequest(form: CreateUserFormState): CreateUserRequest {
  return {
    userName: form.userName.trim(),
    fullName: form.fullName.trim(),
    password: form.password,
    insuranceNumber: form.insuranceNumber.trim() || null,
    userTypeId: Number(form.userTypeId),
    admin: form.admin,
    aktif: form.aktif,
    lokasyon: form.lokasyon.trim() || null,
    departmanId: null,
    supervisorUserId: form.supervisorUserId ? Number(form.supervisorUserId) : null,
    mintikaId: form.mintikaId ? Number(form.mintikaId) : null,
    uretimMerkeziYetki: form.uretimMerkeziYetki,
    email: form.email.trim() || null,
    tel: form.tel.trim() || null,
    icraOdemeUyari: form.icraOdemeUyari,
  }
}
