import esbuild from 'esbuild';
import fs from 'fs-extra';
import fetch from 'node-fetch';

esbuild
  .build({
    bundle: true,
    watch: {
      async onRebuild() {
        await fetch('https://screeps.com/api/user/code', {
          body: JSON.stringify({
            branch: 'default',
            modules: {
              main: await fs.readFile('dist/screepy.js'),
            },
          }),
          method: 'POST',
          headers: {
            Authorization: (await fs.readJson('screepy.json')).authToken,
            'Content-Type': 'application/json',
          },
        });
      },
    },
  })
  .then((result) => result.stop());
