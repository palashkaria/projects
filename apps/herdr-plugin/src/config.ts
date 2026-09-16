import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
export const pluginId = 'local.herdr-activity';
export function configPath(env: NodeJS.ProcessEnv = process.env) {
  return join(
    env.HERDR_PLUGIN_CONFIG_DIR ??
      join(
        env.XDG_CONFIG_HOME ?? join(homedir(), '.config'),
        'herdr',
        'plugins',
        'config',
        pluginId
      ),
    'activity.json'
  );
}
export function apiUrl(value: string): string {
  const url = new URL(value);
  if (
    url.protocol !== 'http:' ||
    url.hostname !== '127.0.0.1' ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error('Activity API must be an http://127.0.0.1:PORT origin');
  return url.origin;
}
function content(url: string) {
  return (
    JSON.stringify(
      { owner: pluginId, version: 1, apiUrl: apiUrl(url) },
      null,
      2
    ) + '\n'
  );
}
export async function setup(path: string, url: string) {
  const expected = content(url);
  await mkdir(dirname(path), { recursive: true });
  try {
    await writeFile(path, expected, { flag: 'wx', mode: 0o600 });
  } catch (error) {
    if (
      (error as NodeJS.ErrnoException).code !== 'EEXIST' ||
      (await readFile(path, 'utf8')) !== expected
    )
      throw error;
  }
}
export async function unsetup(path: string) {
  let original: string;
  try {
    original = await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
  const parsed = JSON.parse(original);
  if (
    parsed.owner !== pluginId ||
    parsed.version !== 1 ||
    original !== content(parsed.apiUrl)
  )
    throw new Error(
      'Configuration was edited or is not owned by this plugin; preserving it'
    );
  await unlink(path);
}
export async function readApiUrl(path: string) {
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8'));
    if (parsed.owner !== pluginId || parsed.version !== 1)
      throw new Error('Invalid activity configuration');
    return apiUrl(parsed.apiUrl);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return 'http://127.0.0.1:43187';
    throw error;
  }
}
