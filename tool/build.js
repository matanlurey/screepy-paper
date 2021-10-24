import esbuild from 'esbuild';
import fs from 'fs-extra';
import glob from 'glob';
import minimist from 'minimist';
import fetch from 'node-fetch';
import path from 'path';

(async () => {
  const args = minimist(process.argv.slice(2));
  const watch = args.watch || false;
  const upload = args.upload;

  const transformForScreepsCompat = (input) => {
    return input.replaceAll(/require\(\".\/((\w|\.)+)\.js\"\)/g, (_, match) => {
      return `require(\"${match}\")`;
    });
  };

  const resolveModuleName = (name) => {
    const key = path.basename(name);
    return key.substring(0, key.length - '.ts'.length);
  };

  const getModules = async () => {
    const modules = {};
    for (const name of await fs.readdir('dist')) {
      const value = await fs.readFile(`dist/${name}`, 'utf-8');
      modules[resolveModuleName(name)] = transformForScreepsCompat(value);
    }
    return modules;
  };

  const onRebuild = async () => {
    const configs = await fs.readJson('screepy.json');
    const results = await fetch('https://screeps.com/api/user/code', {
      body: JSON.stringify({
        branch: typeof upload === 'string' ? upload : 'default',
        modules: await getModules(),
      }),
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${configs.email}:${configs.password}`)}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    console.log(results.status);
  };

  await esbuild.build({
    entryPoints: glob.sync('src/*.ts'),
    outdir: 'dist',
    format: 'cjs',
    platform: 'node',
    bundle: true,
    external: ['lodash', '*.js'],
    watch: watch ? (upload !== false ? { onRebuild } : true) : false,
    incremental: !!watch,
  });

  if ((watch && upload !== false) || upload) {
    onRebuild();
  }
})();
