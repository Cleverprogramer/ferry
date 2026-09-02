import { describe, expect, it } from 'bun:test';
import { queryPermission } from '../src/index';

describe('queryPermission', () => {
  it("queries 'clipboard-write' by default and returns the state", async () => {
    const queries: string[] = [];
    const original = Object.getOwnPropertyDescriptor(navigator, 'permissions');
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: {
        query: async (descriptor: { name: string }) => {
          queries.push(descriptor.name);
          return { state: 'granted' };
        },
      },
    });
    expect(await queryPermission()).toBe('granted');
    expect(queries).toEqual(['clipboard-write']);
    if (original) Object.defineProperty(navigator, 'permissions', original);
  });

  it("maps the 'read' action to 'clipboard-read'", async () => {
    const queries: string[] = [];
    const original = Object.getOwnPropertyDescriptor(navigator, 'permissions');
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: {
        query: async (descriptor: { name: string }) => {
          queries.push(descriptor.name);
          return { state: 'prompt' };
        },
      },
    });
    expect(await queryPermission('read')).toBe('prompt');
    expect(queries).toEqual(['clipboard-read']);
    if (original) Object.defineProperty(navigator, 'permissions', original);
  });

  it("returns 'unsupported' when the Permissions API is missing", async () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'permissions');
    Object.defineProperty(navigator, 'permissions', { configurable: true, value: undefined });
    expect(await queryPermission('read')).toBe('unsupported');
    if (original) Object.defineProperty(navigator, 'permissions', original);
  });

  it("returns 'unsupported' when the query rejects", async () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'permissions');
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: {
        query: async () => {
          throw new Error('TypeError: invalid name');
        },
      },
    });
    expect(await queryPermission()).toBe('unsupported');
    if (original) Object.defineProperty(navigator, 'permissions', original);
  });
});
