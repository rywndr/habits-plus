import { createServerFn } from '@tanstack/react-start'
import { requireAdmin } from '../authorization'
import { withTenantCache } from '../tenant-data'
import { bulkImportSchema } from './schemas'
import { importAdminRows } from './import-admin-rows'

export const bulkImportAdminRows = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .validator(bulkImportSchema)
  .handler(({ data, context }) =>
    withTenantCache(() => importAdminRows(context.admin.tenant, data)),
  )
