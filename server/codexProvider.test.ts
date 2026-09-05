import { describe, expect, it, vi, beforeEach } from 'vitest';
const exec = vi.hoisted(() => vi.fn());
vi.mock('node:child_process', () => ({ execFile: exec }));
import { codexArguments, CodexTextProvider, parseCodexResult } from './codexProvider';

beforeEach(() => { exec.mockReset(); });
describe('local Codex adapter', () => {
  it('uses an ephemeral read-only call with tools disabled and input on stdin', () => {
    const args = codexArguments();
    expect(args).toContain('--ephemeral');
    expect(args).toContain('read-only');
    expect(args).toContain('--ignore-user-config');
    expect(args).toContain('approval_policy="never"');
    expect(args).toContain('shell_tool');
    expect(args).toContain('plugins');
    expect(args.at(-1)).toBe('-');
  });
  it('rejects prose, arrays and malformed responses instead of inventing a result', () => {
    expect(parseCodexResult('```json\n{"value":"中文建议"}\n```')).toEqual({value:'中文建议'});
    for (const invalid of ['这里是一段解释', '[]', 'null', '{bad}']) expect(()=>parseCodexResult(invalid)).toThrow('返回格式');
  });
  it('returns only a login availability flag without exposing command output', async () => {
    exec.mockImplementation((_bin, _args, _opts, callback) => callback(new Error('private diagnostic')));
    expect(await new CodexTextProvider().available()).toBe(false);
    exec.mockImplementation((_bin, _args, _opts, callback) => callback(null));
    expect(await new CodexTextProvider().available()).toBe(true);
  });
  it('sends instructions as data and normalizes CLI failures', async () => {
    let stdin = '';
    exec.mockImplementation((_bin, _args, _opts, callback) => ({stdin:{on:vi.fn(),end:(text:string)=>{stdin=text;callback(null,'{"value":"保留依据"}');}}}));
    expect(await new CodexTextProvider().complete([{role:'user',content:'资料里包含 $(touch nope)'}])).toEqual({value:'保留依据'});
    expect(stdin).toContain('$(touch nope)');
    expect(exec.mock.calls[0][1]).not.toContain('$(touch nope)');
    exec.mockImplementation((_bin, _args, _opts, callback) => ({stdin:{on:vi.fn(),end:()=>callback(new Error('private diagnostic'))}}));
    await expect(new CodexTextProvider().complete([])).rejects.toThrow('本地 Codex 调用失败');
  });
});
