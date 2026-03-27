import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { GlobalExceptionFilter } from '@presentation/filters/global-exception.filter';

function makeHost(url: string) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest:  () => ({ url }),
    }),
    _status: status,
    _json: json,
  };
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
  });

  it('should return correct status and JSON for HttpException', () => {
    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    const { _status, _json, ...host } = makeHost('/api/v1/test') as any;

    filter.catch(exception, host as ArgumentsHost);

    expect(_status).toHaveBeenCalledWith(400);
    expect(_json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        error: 'BAD_REQUEST',
        message: 'Bad Request',
        path: '/api/v1/test',
      }),
    );
  });

  it('should return 500 for non-HTTP exceptions', () => {
    const exception = new Error('Unexpected DB error');
    const { _status, _json, ...host } = makeHost('/api/v1/resource') as any;

    filter.catch(exception, host as ArgumentsHost);

    expect(_status).toHaveBeenCalledWith(500);
    expect(_json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 500,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        path: '/api/v1/resource',
      }),
    );
  });

  it('should include timestamp in error response', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    const { _status, _json, ...host } = makeHost('/api/v1/items/999') as any;

    filter.catch(exception, host as ArgumentsHost);

    const call = _json.mock.calls[0][0];
    expect(call).toHaveProperty('timestamp');
    expect(new Date(call.timestamp).getTime()).toBeGreaterThan(0);
  });

  it('should extract message from object HttpException response', () => {
    const exception = new HttpException({ message: 'Validation failed', error: 'Bad Request' }, HttpStatus.BAD_REQUEST);
    const { _status, _json, ...host } = makeHost('/api/v1/create') as any;

    filter.catch(exception, host as ArgumentsHost);

    expect(_json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Validation failed' }),
    );
  });

  it('should return 401 for UnauthorizedException', () => {
    const { UnauthorizedException } = require('@nestjs/common');
    const exception = new UnauthorizedException('Token inválido');
    const { _status, _json, ...host } = makeHost('/api/v1/protected') as any;

    filter.catch(exception, host as ArgumentsHost);

    expect(_status).toHaveBeenCalledWith(401);
  });

  it('should return 403 for ForbiddenException', () => {
    const { ForbiddenException } = require('@nestjs/common');
    const exception = new ForbiddenException('Sem permissão');
    const { _status, _json, ...host } = makeHost('/api/v1/admin') as any;

    filter.catch(exception, host as ArgumentsHost);

    expect(_status).toHaveBeenCalledWith(403);
  });
});
