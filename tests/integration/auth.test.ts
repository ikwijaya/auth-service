import AuthService from '../../src/modules/auth/auth.service'
import { LoginDto, LoginResDto } from '../../src/dto/auth.dto'
import { IApiError } from '../../src/lib/errors'
import { aesCbcDecrypt, aesCbcEncrypt } from '../../src/lib/security'

/**
 * Integration testing is a type of software testing that focuses on testing
 * the interactions between different parts or components of a software application.
 * The goal of integration testing is to ensure that the different parts of the application
 * work together as expected and that they integrate seamlessly with each other.
 *
 * @ref https://en.wikipedia.org/wiki/Integration_testing
 */

beforeAll(async () => {

});

afterAll(async () => {

});

test('[Service] - Auth', async () => {
  jest.resetModules();
  const hash = process.env.ENCRYPTION_HASH
  const password = await aesCbcEncrypt('Chb$2018', hash)
  const hh = await aesCbcDecrypt(password, hash)

  console.log(`has`, hh)
  const _authService = new AuthService()
  const login: LoginResDto | IApiError = await _authService.login({ username: 'chb0002', password: password } as LoginDto)

  console.log(`login => `, login)
});

