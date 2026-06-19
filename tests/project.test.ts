import { describe, expect, it } from 'vitest';
import pkg from '../package.json';

describe('project metadata', () => {
  it('uses the requested Checkin project name', () => {
    expect(pkg.name).toBe('checkin');
  });
});
