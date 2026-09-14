import { beforeEach, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import {
  loadCurrentUser,
  loadAdminDashboard,
  loadGuruDashboard,
  loadParentProgress,
  loadSuperAdminSchools,
} from '#/server/loaders'

vi.mock('#/server/loaders')
vi.mock('#/server/auth.server', () => ({
  auth: {},
  getAuthenticatedUserByRole: vi.fn(),
}))
beforeEach(() => vi.resetAllMocks())

it.each([
  { role: 'admin', loader: loadAdminDashboard },
  { role: 'guru', loader: loadGuruDashboard },
  { role: 'ortu', loader: loadParentProgress },
  { role: 'super-admin', loader: loadSuperAdminSchools },
] as const)(
  'does not block $role child loaders on authentication',
  async ({ role, loader }) => {
    vi.mocked(loadCurrentUser).mockRejectedValue(new Error('Unauthorized'))
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: [`/${role}`] }),
    })
    await router.load()
    expect(loadCurrentUser).toHaveBeenCalledWith({ data: { role } })
    expect(loader).toHaveBeenCalled()
    expect(router.state.matches.some((match) => match.status === 'error')).toBe(
      true,
    )
  },
)
