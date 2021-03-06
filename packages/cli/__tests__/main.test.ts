import main, { run } from '../src/run';

test('throws error for unknown args', async () => {
  expect.assertions(1);

  try {
    await run('foo', {});
  } catch (error) {
    expect(error).toEqual(new Error("idk what i'm doing."));
  }
});

test('throws exits for caught error', async () => {
  console.log = jest.fn() as any;
  process.exit = jest.fn() as any;

  await main('foo', {});

  expect(process.exit).toHaveBeenCalledWith(1);
});
