import type {
  CreateUserFormErrors,
  CreateUserFormState,
  CreateUserRequest,
  UpdateUserRequest,
  UserWriteRequest,
} from '../types/user.types'

function validateUserFormBase(form: CreateUserFormState): CreateUserFormErrors {
  const errors: CreateUserFormErrors = {}

  if (!form.userName.trim()) {
    errors.userName = 'Kullanıcı adı zorunludur.'
  }

  if (!form.fullName.trim()) {
    errors.fullName = 'Ad soyad zorunludur.'
  }

  const userTypeId = Number(form.userTypeId)
  if (!form.userTypeId || !Number.isFinite(userTypeId) || userTypeId <= 0) {
    errors.userTypeId = 'Kullanıcı tipi seçiniz.'
  }

  return errors
}

export function validateCreateUserForm(form: CreateUserFormState): CreateUserFormErrors {
  const errors = validateUserFormBase(form)

  if (!form.password.trim()) {
    errors.password = 'Şifre zorunludur.'
  }

  return errors
}

export function validateUpdateUserForm(form: CreateUserFormState): CreateUserFormErrors {
  return validateUserFormBase(form)
}

export function buildUserWriteRequest(form: CreateUserFormState): UserWriteRequest {
  return {
    userName: form.userName.trim(),
    fullName: form.fullName.trim(),
    insuranceNumber: form.insuranceNumber.trim() || null,
    userTypeId: Number(form.userTypeId),
    admin: form.admin,
    aktif: form.aktif,
    lokasyon: form.lokasyon.trim() || null,
    departmanId: null,
    supervisorUserId: form.supervisorUserId ? Number(form.supervisorUserId) : null,
    mintikaIds: form.mintikaIds.filter((id) => Number.isFinite(id) && id > 0),
    mintikaId: form.mintikaIds.find((id) => Number.isFinite(id) && id > 0) ?? null,
    uretimMerkeziYetki: form.uretimMerkeziYetki,
    email: form.email.trim() || null,
    tel: form.tel.trim() || null,
    icraOdemeUyari: form.icraOdemeUyari,
  }
}

export function buildCreateUserRequest(form: CreateUserFormState): CreateUserRequest {
  return {
    ...buildUserWriteRequest(form),
    password: form.password,
  }
}

export function buildUpdateUserRequest(form: CreateUserFormState): UpdateUserRequest {
  const payload: UpdateUserRequest = buildUserWriteRequest(form)
  const password = form.password.trim()
  if (password) payload.password = password
  return payload
}
