import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeActiveSectionId,
  computeCircularRevealRadius,
  easeOutCubic,
  interpolateNumber,
  type SectionId,
} from './motionCraft';

test('easeOutCubic clamps boundaries and produces smooth cubic ease-out curve', () => {
  assert.equal(easeOutCubic(-0.5), 0);
  assert.equal(easeOutCubic(0), 0);
  assert.equal(easeOutCubic(1), 1);
  assert.equal(easeOutCubic(1.5), 1);

  const mid = easeOutCubic(0.5);
  assert.ok(mid > 0.85 && mid < 0.9, `Expected cubic ease-out midpoint ~0.875, got ${mid}`);
});

test('interpolateNumber eases smoothly between start and target values', () => {
  assert.equal(interpolateNumber(10000, 25000, 0), 10000);
  assert.equal(interpolateNumber(10000, 25000, 1), 25000);

  const half = interpolateNumber(0, 100, 0.5);
  assert.equal(Number(half.toFixed(1)), 87.5);
});

test('computeCircularRevealRadius covers farthest viewport corner from click origin', () => {
  const fromOrigin = computeCircularRevealRadius(0, 0, 1200, 800);
  assert.equal(Math.round(fromOrigin), Math.round(Math.hypot(1200, 800)));

  const fromCenter = computeCircularRevealRadius(600, 400, 1200, 800);
  assert.equal(Math.round(fromCenter), Math.round(Math.hypot(600, 400)));

  const fromThemeBtn = computeCircularRevealRadius(1150, 32, 1200, 800);
  assert.equal(Math.round(fromThemeBtn), Math.round(Math.hypot(1150, 768)));
});

test('computeActiveSectionId tracks sections monotonically top-to-bottom including tall sections', () => {
  const sections: { id: SectionId; top: number }[] = [
    { id: 'beranda', top: 0 },
    { id: 'studio-3d', top: 960 },
    { id: 'menu', top: 1850 },
    { id: 'cerita', top: 4100 },
    { id: 'lokasi', top: 5100 },
  ];
  const vh = 900;
  const docHeight = 6000;

  assert.equal(computeActiveSectionId(0, vh, docHeight, sections), 'beranda');
  assert.equal(computeActiveSectionId(25, vh, docHeight, sections), 'beranda');
  assert.equal(computeActiveSectionId(900, vh, docHeight, sections), 'studio-3d');
  // Middle of very tall catalog section (#menu spans 1850..4100) stays locked on 'menu'
  assert.equal(computeActiveSectionId(3100, vh, docHeight, sections), 'menu');
  assert.equal(computeActiveSectionId(4050, vh, docHeight, sections), 'cerita');
  // Reached bottom of document -> clamps to last section 'lokasi'
  assert.equal(computeActiveSectionId(5080, vh, docHeight, sections), 'lokasi');
});
