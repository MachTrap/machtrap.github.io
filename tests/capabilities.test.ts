import test from 'node:test';
import assert from 'node:assert/strict';
import { capabilityData, capabilityIds } from '../src/data/capabilities';
test('localized scenarios provide complete descriptions and delivery stages', () => {
  assert.deepEqual(capabilityIds, ['mobile', 'systems', 'craft']);
  for (const lang of ['en', 'ru'] as const) {
    const data = capabilityData(lang);
    assert.equal(data.stages.length, 4);
    assert.equal(data.stageText.length, 4);
    assert.equal(data.stageTools.length, 4);
    assert.equal(data.systemsModes.length, 3);
    assert.equal(data.scenarios.length, 3);
    for (const scenario of data.scenarios) {
      assert.ok(scenario.title && scenario.description);
      assert.equal(scenario.tags.length, 4);
    }
  }
});
test('requested technologies and areas are represented', () => {
  const text = JSON.stringify(capabilityData('en'));
  for (const term of [
    'SwiftUI',
    'UIKit',
    'Objective-C',
    'React Native',
    'Telegram',
    'MAX',
    'Java',
    'Go',
    'TypeScript',
    'PostgreSQL',
    'ComfyUI',
    'Figma',
    'VIPER',
    'Reverse engineering',
    'Selenium',
    'Playwright',
    'TeamCity',
    'Docker Compose',
  ])
    assert.ok(text.includes(term), `Missing ${term}`);
});

test('the expanded iOS toolkit stays compact in both languages', () => {
  for (const locale of ['en', 'ru'] as const) {
    const c = capabilityData(locale);
    assert.equal(c.specialtyTabs.length, 3);
    assert.equal(c.specialtyRows.length, 3);
    c.specialtyRows.forEach((rows) => assert.equal(rows.length, 3));
    assert.equal(c.apiSkills.length, 4);
    assert.equal(c.infrastructure.length, 3);
  }
});
test('all selected additions are present in the relevant capability data', () => {
  const text = JSON.stringify(capabilityData('en')).toLowerCase();
  for (const item of [
    'Swift Concurrency',
    'async/await',
    'actors',
    'Dependency injection',
    'protocol-oriented programming',
    'Swift Package Manager',
    'CocoaPods',
    'APNs',
    'push notifications',
    'background tasks',
    'WidgetKit',
    'Live Activities',
    'App Intents',
    'Deep linking',
    'Universal Links',
    'StoreKit',
    'subscriptions',
    'Core Data',
    'SwiftData',
    'SQLite',
    'Realm',
    'URLSession',
    'REST',
    'WebSockets',
    'Offline synchronization',
    'caching',
    'XCTest',
    'Swift Testing',
    'XCUITest',
    'snapshots',
    'Instruments',
    'memory debugging',
    'accessibility',
    'VoiceOver',
    'localization',
    'Fastlane',
    'TestFlight',
    'App Store Connect',
    'code signing',
    'provisioning',
    'Linux',
    'Nginx',
    'Docker',
    'release automation',
    'Python',
    'generative-model APIs',
    'custom ComfyUI nodes',
    'diffusion workflows',
    'Image-processing pipelines',
    'OpenAPI',
    'Swagger',
    'GraphQL',
    'gRPC',
    'Webhooks',
    'OAuth 2.0',
    'OIDC',
    'GitHub Actions',
  ])
    assert.ok(text.includes(item.toLowerCase()), `Missing ${item}`);
});
