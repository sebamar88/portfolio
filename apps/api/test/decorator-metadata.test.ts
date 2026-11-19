import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { expect, it } from 'vitest';

// Guards the test setup itself: if decorator metadata stops being emitted (e.g. someone removes
// `oxc.decorator` from vitest.config.mts), Nest injects `undefined` and this fails first, with a
// clear name, instead of breaking some unrelated feature test later.

@Injectable()
class Greeter {
  hi() {
    return 'hi';
  }
}

@Controller()
class GreetController {
  constructor(private readonly greeter: Greeter) {}

  @Get()
  get() {
    return this.greeter.hi();
  }
}

@Module({ controllers: [GreetController], providers: [Greeter] })
class GreetModule {}

it('injects constructor dependencies (decorator metadata is emitted in tests)', async () => {
  const moduleRef = await Test.createTestingModule({ imports: [GreetModule] }).compile();
  expect(moduleRef.get(GreetController).get()).toBe('hi');
});
