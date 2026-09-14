// @vitest-environment jsdom
import { expect, it } from 'vitest'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { affectsAdminData } from './route-invalidation'

it('reloads affected active and cached pages while keeping shell and unrelated data fresh', async () => {
  const calls = { root: 0, shell: 0, teachers: 0, classes: 0, costs: 0 }
  const root = createRootRoute({
    loader: () => ++calls.root,
    staleTime: Infinity,
  })
  const admin = createRoute({
    getParentRoute: () => root,
    path: 'admin',
    loader: () => ++calls.shell,
    staleTime: Infinity,
  })
  const teachers = createRoute({
    getParentRoute: () => admin,
    path: 'guru',
    loader: () => ++calls.teachers,
    staleTime: Infinity,
  })
  const classes = createRoute({
    getParentRoute: () => admin,
    path: 'kelas',
    loader: () => ++calls.classes,
    staleTime: Infinity,
  })
  const costs = createRoute({
    getParentRoute: () => root,
    path: 'login',
    loader: () => ++calls.costs,
    staleTime: Infinity,
  })
  const router = createRouter({
    routeTree: root.addChildren([
      admin.addChildren([teachers, classes]),
      costs,
    ]),
    history: createMemoryHistory({ initialEntries: ['/login'] }),
    isServer: false,
  })
  await router.load()
  await router.navigate({ to: '/admin/kelas' })
  await router.navigate({ to: '/admin/guru' })
  await router.invalidate({
    filter: (match) => affectsAdminData(match),
    sync: true,
  })
  expect(calls).toEqual({
    root: 1,
    shell: 1,
    teachers: 2,
    classes: 1,
    costs: 1,
  })
  await router.navigate({ to: '/admin/kelas' })
  expect(calls.classes).toBe(2)
  await router.navigate({ to: '/login' })
  expect(calls.costs).toBe(1)
})
