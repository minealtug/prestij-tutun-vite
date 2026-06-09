import { useState, type FormEvent } from 'react'
import { LogIn } from 'lucide-react'
import { Logo } from '@/components/branding/Logo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { getLoginErrorMessage, useLogin } from '../hooks/use-login'
import { DEV_TEST_CREDENTIALS, isDevAuthEnabled } from '../dev/dev-auth'

export function LoginPage() {
  const login = useLogin()
  const devAuth = isDevAuthEnabled()
  const [userName, setUserName] = useState(devAuth ? DEV_TEST_CREDENTIALS.userName : '')
  const [password, setPassword] = useState(devAuth ? DEV_TEST_CREDENTIALS.password : '')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    login.mutate({ userName, password })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <Logo variant="login" />
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Kullanıcı adı"
            type="text"
            autoComplete="username"
            required
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="kullanici.adi"
          />
          <Input
            label="Şifre"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {login.isError && (
            <p
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {getLoginErrorMessage(login.error)}
            </p>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={login.isPending}
            className="mt-2 gap-2 rounded-md bg-green-700 font-semibold hover:bg-green-800 focus-visible:ring-green-600"
          >
            {!login.isPending && <LogIn className="h-4 w-4 shrink-0" aria-hidden />}
            Giriş Yap
          </Button>
        </form>

        {devAuth ? (
          <div className="mt-4 rounded-lg border border-accent-500/40 bg-accent-500/10 px-3 py-2 text-center text-xs text-foreground">
            <p className="font-medium">Geliştirme ortamı — örnek kullanıcı</p>
            <p className="mt-1 text-muted">
              {DEV_TEST_CREDENTIALS.userName} / {DEV_TEST_CREDENTIALS.password}
            </p>
          </div>
        ) : null}
      </Card>
    </div>
  )
}
