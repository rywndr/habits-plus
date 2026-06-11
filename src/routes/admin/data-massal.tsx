import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { TemplatePicker } from '#/components/admin/data-massal/template-picker'
import { UploadPanel } from '#/components/admin/data-massal/upload-panel'
import { UpdateFilterDialog } from '#/components/admin/data-massal/update-filter-dialog'
import {
  activeColumns,
  templates,
} from '#/components/admin/data-massal/templates'
import type {
  ImportKind,
  ImportMode,
  Template,
} from '#/components/admin/data-massal/templates'
import {
  downloadBlankTemplate,
  downloadFilledTemplate,
  parseUploadedRows,
} from '#/components/admin/data-massal/workbook'
import {
  buildFilledRows,
  diffChangedRows,
} from '#/components/admin/data-massal/rows'
import { bulkImportAdminRows } from '#/server/actions'
import {
  loadTenantClasses,
  loadTenantStudents,
  loadTenantUsers,
} from '#/server/loaders'

export const Route = createFileRoute('/admin/data-massal')({
  loader: async () => {
    const [classes, users, students] = await Promise.all([
      loadTenantClasses(),
      loadTenantUsers(),
      loadTenantStudents(),
    ])
    return { classes, users, students }
  },
  component: DataMassal,
  staleTime: 30_000,
  staticData: { title: 'Data Massal' },
})

function DataMassal() {
  const router = useRouter()
  const data = Route.useLoaderData()
  const [mode, setMode] = useState<ImportMode>('create')
  const [selectedKind, setSelectedKind] = useState<ImportKind>('teachers')
  const [rows, setRows] = useState<Array<Record<string, string>>>([])
  const [skipped, setSkipped] = useState(0)
  const [fileName, setFileName] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [filterKind, setFilterKind] = useState<ImportKind | null>(null)
  const [result, setResult] = useState<{
    imported: number
    errors: Array<string>
  } | null>(null)
  const template = templates.find((item) => item.kind === selectedKind)!
  const filterTemplate =
    filterKind === null
      ? null
      : (templates.find((item) => item.kind === filterKind) ?? null)

  function reset() {
    setRows([])
    setSkipped(0)
    setFileName('')
    setResult(null)
  }

  async function handleFileChange(file: File | undefined) {
    setResult(null)
    setFileName(file?.name ?? '')
    if (!file) {
      setRows([])
      setSkipped(0)
      return
    }
    const parsed = await parseUploadedRows(file, template, mode)
    if (mode === 'update') {
      const { changed, unchanged } = diffChangedRows(parsed, selectedKind, data)
      setRows(changed)
      setSkipped(unchanged)
    } else {
      setRows(parsed)
      setSkipped(0)
    }
  }

  async function handleImport() {
    setIsImporting(true)
    try {
      const next = await bulkImportAdminRows({
        data: { kind: selectedKind, mode, rows },
      })
      setResult(next)
      await router.invalidate()
    } finally {
      setIsImporting(false)
    }
  }

  function handleTemplate(item: Template) {
    if (mode === 'create') {
      downloadBlankTemplate(item)
      return
    }
    setFilterKind(item.kind)
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Data Massal" />

        <TemplatePicker
          mode={mode}
          selectedKind={selectedKind}
          onModeChange={(nextMode) => {
            if (nextMode === mode) return
            setMode(nextMode)
            reset()
          }}
          onSelectKind={(kind) => {
            setSelectedKind(kind)
            reset()
          }}
          onTemplate={handleTemplate}
        />

        <UploadPanel
          mode={mode}
          template={template}
          columns={activeColumns(template, mode)}
          rows={rows}
          fileName={fileName}
          skipped={skipped}
          isImporting={isImporting}
          result={result}
          onFileChange={(file) => void handleFileChange(file)}
          onImport={() => void handleImport()}
        />
      </div>

      <UpdateFilterDialog
        template={filterTemplate}
        classes={data.classes}
        open={filterTemplate !== null}
        onOpenChange={(open) => {
          if (!open) setFilterKind(null)
        }}
        onDownload={(item, classId) => {
          downloadFilledTemplate(
            item,
            buildFilledRows(item.kind, classId, data),
          )
          setFilterKind(null)
        }}
      />
    </ContentPanel>
  )
}
