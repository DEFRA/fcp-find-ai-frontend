const {
  cookie: { cookieNameCookiePolicy }
} = require('../../app/config')
const cookies = require('../../app/cookie-manager')
let request
let h
const defaultCookie = { confirmed: false, essential: true, analytics: false }

const cookieOptions = {
  isSecure: true,
  isHttpOnly: true,
  strictHeader: true,
  sameSite: 'strict'
}

describe('cookie-manager', () => {
  beforeEach(() => {
    request = {
      state: {
        [cookieNameCookiePolicy]: undefined,
        _ga: '123',
        _gid: '123'
      }
    }
    h = {
      state: jest.fn(),
      unstate: jest.fn()
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('getCurrentPolicy returns default cookie if does not exist', () => {
    const result = cookies.getCurrentPolicy(request, h)
    expect(result).toStrictEqual(defaultCookie, cookieOptions)
  })

  test('getCurrentPolicy sets default cookie if does not exist', () => {
    cookies.getCurrentPolicy(request, h)
    expect(h.state).toHaveBeenCalledWith(cookieNameCookiePolicy, defaultCookie, cookieOptions)
  })

  test('getCurrentPolicy returns cookie if exists', () => {
    request.state[cookieNameCookiePolicy] = { confirmed: true, essential: false, analytics: true }
    const result = cookies.getCurrentPolicy(request, h)
    expect(result).toStrictEqual({ confirmed: true, essential: false, analytics: true }, cookieOptions)
  })

  test('getCurrentPolicy does not set default cookie if exists', () => {
    request.state[cookieNameCookiePolicy] = { confirmed: true, essential: false, analytics: true }
    cookies.getCurrentPolicy(request, h)
    expect(h.state).not.toHaveBeenCalled()
  })

  test('updatePolicy sets cookie twice if does not exist', () => {
    cookies.updatePolicy(request, h, true)
    expect(h.state).toHaveBeenCalledTimes(2)
  })

  test('updatePolicy sets confirmed cookie second if does not exist', () => {
    cookies.updatePolicy(request, h, true)
    expect(h.state).toHaveBeenNthCalledWith(
      2,
      cookieNameCookiePolicy,
      {
        confirmed: true,
        essential: true,
        analytics: true
      },
      cookieOptions
    )
  })

  test('updatePolicy sets cookie to accepted', () => {
    request.state[cookieNameCookiePolicy] = { confirmed: false, essential: true, analytics: false }
    cookies.updatePolicy(request, h, true)
    expect(h.state).toHaveBeenCalledWith(
      cookieNameCookiePolicy,
      { confirmed: true, essential: true, analytics: true },
      cookieOptions
    )
  })

  test('updatePolicy sets cookie to rejected', () => {
    request.state[cookieNameCookiePolicy] = { confirmed: false, essential: true, analytics: false }
    cookies.updatePolicy(request, h, false)
    expect(h.state).toHaveBeenCalledWith(
      cookieNameCookiePolicy,
      { confirmed: true, essential: true, analytics: false },
      cookieOptions
    )
  })

  test('updatePolicy denying analytics removes Google cookies', () => {
    request.state.cookies_policy = { confirmed: false, essential: true, analytics: false }
    cookies.updatePolicy(request, h, false)
    expect(h.unstate).toHaveBeenCalledWith('_ga')
    expect(h.unstate).toHaveBeenCalledWith('_gid')
  })

  test('updatePolicy approving analytics does not remove Google cookies', () => {
    request.state.cookies_policy = { confirmed: false, essential: true, analytics: true }
    cookies.updatePolicy(request, h, true)
    expect(h.unstate).not.toHaveBeenCalled()
  })
})
