import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const source = readFileSync(
  new URL('../src/layouts/Layout.astro', import.meta.url),
  'utf8',
).match(/<script is:inline>([\s\S]*?)<\/script>/)![1];
function visit(
  language: string,
  pathname = '/',
  saved?: string,
  blocked = false,
) {
  let redirect: string | undefined;
  let listener: (event: object) => void;
  let value = saved;
  class Element {
    href = 'https://machtrap.github.io/';
    closest() {
      return this;
    }
  }
  runInNewContext(source, {
    window: {},
    navigator: { languages: [language] },
    location: {
      pathname,
      search: '?effects=off',
      hash: '#mobile',
      replace: (url: string) => {
        redirect = url;
      },
    },
    localStorage: {
      getItem: () => {
        if (blocked) throw Error();
        return value;
      },
      setItem: (_key: string, next: string) => {
        if (blocked) throw Error();
        value = next;
      },
    },
    document: {
      addEventListener: (_type: string, callback: typeof listener) => {
        listener = callback;
      },
    },
    Element,
    URL,
  });
  return {
    redirect,
    click: () => listener!({ target: new Element(), button: 0 }),
    saved: () => value,
  };
}
test('browser Russian selects RU and preserves query and section', () => {
  assert.equal(visit('ru-RU').redirect, '/ru/?effects=off#mobile');
  assert.equal(visit('ru').redirect, '/ru/?effects=off#mobile');
  assert.equal(visit('en-US').redirect, undefined);
  assert.equal(visit('de-DE', '/ru/').redirect, '/?effects=off#mobile');
});
test('manual language takes precedence on future visits', () => {
  assert.equal(visit('ru', '/', 'en').redirect, undefined);
  assert.equal(visit('en', '/', 'ru').redirect, '/ru/?effects=off#mobile');
  const page = visit('ru', '/ru/');
  page.click();
  assert.equal(page.saved(), 'en');
  assert.equal(visit('ru', '/', page.saved()).redirect, undefined);
});
test('invalid or unavailable storage keeps automatic selection and switches usable', () => {
  assert.equal(visit('ru', '/', 'invalid').redirect, '/ru/?effects=off#mobile');
  const page = visit('ru', '/ru/', undefined, true);
  assert.equal(page.redirect, undefined);
  assert.doesNotThrow(page.click);
});
