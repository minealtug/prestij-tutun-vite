import type {
  CreateUserFormState,
  UserDto,
  UserTypeOptionDto,
} from '../types/user.types'
import { resolveMintikaIds } from './resolve-mintika-ids'

function resolveUserTypeId(
  user: UserDto,
  userTypes: UserTypeOptionDto[] | undefined,
): string {
  if (user.userTypeId != null) return String(user.userTypeId)
  const match = userTypes?.find((item) => item.description === user.userTypeDescription)
  return match ? String(match.id) : ''
}

export function mapUserToFormState(
  user: UserDto,
  options?: {
    userTypes?: UserTypeOptionDto[]
  },
): CreateUserFormState {
  return {
    userName: user.userName,
    fullName: user.fullName,
    password: '',
    insuranceNumber: user.insuranceNumber ?? '',
    userTypeId: resolveUserTypeId(user, options?.userTypes),
    admin: user.admin,
    aktif: user.aktif,
    lokasyon: user.lokasyon ?? '',
    departmanAdi: user.departmanAdi ?? '',
    supervisorUserId: user.supervisorUserId != null ? String(user.supervisorUserId) : '',
    mintikaIds: resolveMintikaIds(user),
    uretimMerkeziYetki: user.uretimMerkeziYetki,
    email: user.email ?? '',
    tel: user.tel ?? '',
    icraOdemeUyari: user.icraOdemeUyari,
  }
}
