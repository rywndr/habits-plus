import { Download, FileSpreadsheet, Pencil, Upload } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { templates } from './templates'
import type { ImportKind, ImportMode, Template } from './templates'

type Props = {
  mode: ImportMode
  selectedKind: ImportKind
  onModeChange: (mode: ImportMode) => void
  onSelectKind: (kind: ImportKind) => void
  onTemplate: (template: Template) => void
}

export function TemplatePicker({
  mode,
  selectedKind,
  onModeChange,
  onSelectKind,
  onTemplate,
}: Props) {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={mode === 'create' ? 'default' : 'outline'}
          className="gap-2"
          onClick={() => onModeChange('create')}
        >
          <Upload />
          Upload Massal
        </Button>
        <Button
          type="button"
          variant={mode === 'update' ? 'default' : 'outline'}
          className="gap-2"
          onClick={() => onModeChange('update')}
        >
          <Pencil />
          Update Massal
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {templates.map((item) => (
          <Card key={item.kind} className="rounded-lg">
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                type="button"
                variant={selectedKind === item.kind ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => onSelectKind(item.kind)}
              >
                <FileSpreadsheet />
                Pilih
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                onClick={() => onTemplate(item)}
              >
                <Download />
                {mode === 'create' ? 'Template' : 'Template Terisi'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
