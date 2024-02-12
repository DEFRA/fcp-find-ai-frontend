const view = require('../../../app/plugins/views')

jest.mock('nunjucks')
const nunjucks = require('nunjucks')

jest.mock('path')
const path = require('path')

describe('viewPlugin', () => {
  test('should export the plugin object', () => {
    expect(view).toBeDefined()
  })

  test('should call the compile and prepare functions in njk', () => {
    const mockCompile = {
      render: jest.fn()
    }
    const mockConfigure = jest.fn()
    nunjucks.compile.mockReturnValue(mockCompile)
    nunjucks.configure.mockReturnValue(mockConfigure)

    const src = 'test'
    const options = {
      environment: {},
      compileOptions: {}
    }

    view.options.engines.njk.compile(src, options)
    expect(nunjucks.compile).toHaveBeenCalledWith(src, options.environment)

    const next = jest.fn()
    view.options.engines.njk.prepare(options, next)
    expect(nunjucks.configure).toHaveBeenCalledWith([
      path.join(options.relativeTo || process.cwd(), options.path),
      'node_modules/govuk-frontend/'
    ], {
      autoescape: true
    })
    expect(next).toHaveBeenCalled()
  })
})
