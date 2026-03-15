import { Route, Switch, Redirect } from 'wouter'
import { useAuth } from '@/hooks/useAuth'
import AuthPage from '@/components/shared/AuthPage'
import TownMap from '@/components/map/TownMap'
import WorkspaceView from '@/components/workspace/WorkspaceView'
import ConstructionSiteView from '@/components/construction/ConstructionSiteView'
import { Toaster } from '@/components/ui/toaster'

export default function App() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>加载中...</p>
      </div>
    )
  }

  // Dev route — accessible without login
  if (import.meta.env.DEV && window.location.pathname === '/dev/site') {
    return (
      <>
        <ConstructionSiteView />
        <Toaster />
      </>
    )
  }

  if (!user) {
    return (
      <>
        <AuthPage />
        <Toaster />
      </>
    )
  }

  return (
    <>
      <Switch>
        <Route path="/">
          <TownMap user={user} onSignOut={signOut} />
        </Route>
        <Route path="/level/:n/desk">
          {(params) => <WorkspaceView level={params.n} />}
        </Route>
        <Route path="/level/:n/site">
          {(params) => <ConstructionSiteView level={params.n} />}
        </Route>
        <Route path="/dev/site">
          <ConstructionSiteView />
        </Route>
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
      <Toaster />
    </>
  )
}
