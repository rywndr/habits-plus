import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ClassRequiredContent } from './class-required-content'

describe('ClassRequiredContent', () => {
  it('shows the prompt and hides class data without a selection', () => {
    const html = renderToStaticMarkup(
      <ClassRequiredContent classId="">
        <div>Data kelas</div>
      </ClassRequiredContent>,
    )

    expect(html).toContain('Pilih kelas terlebih dahulu')
    expect(html).not.toContain('Data kelas')
  })

  it('shows class data after a class is selected', () => {
    const html = renderToStaticMarkup(
      <ClassRequiredContent classId="class-a">
        <div>Data kelas</div>
      </ClassRequiredContent>,
    )

    expect(html).toContain('Data kelas')
    expect(html).not.toContain('Pilih kelas terlebih dahulu')
  })
})
