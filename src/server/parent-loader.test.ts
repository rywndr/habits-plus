import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import ts from 'typescript'

it('keeps parent progress input-free and binds the query to the authenticated parent', () => {
  const source = readFileSync(new URL('./loaders.ts', import.meta.url), 'utf8')
  const file = ts.createSourceFile(
    'loaders.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
  )
  const declarations = file.statements.flatMap((statement) =>
    ts.isVariableStatement(statement)
      ? [...statement.declarationList.declarations]
      : [],
  )
  const loader = declarations.find(
    (declaration) => declaration.name.getText(file) === 'loadParentProgress',
  )
  if (!loader?.initializer || !ts.isCallExpression(loader.initializer))
    throw new Error('Missing parent loader')
  const handler = loader.initializer.arguments.at(0)
  if (!handler || !ts.isArrowFunction(handler))
    throw new Error('Missing parent handler')
  expect(handler.parameters).toHaveLength(0)
  expect(loader.getText(file)).not.toContain('.validator(')
  expect(handler.body.getText(file)).toContain(
    "getAuthenticatedUserByRole('ortu')",
  )
  expect(handler.body.getText(file)).toContain(
    'getParentProgress(parent.tenant, parent.id)',
  )
})
