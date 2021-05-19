# Mercuri - a workflow based application builder

## Setting up for development

To get started, you will need to have node and npm installed. Use
[nvm](https://github.com/nvm-sh/nvm) to manage node versions and save yourself
from future headaches.

After that, setup is really easy:

1. Clone this repo.
2. Install all required npm packages using: `npm install`
3. Start a local (auto-updating) development server with: `npm run dev`.
4. Run the `jupyter-caduceus` docker image (build instructions [here](https://github.com/mercuri-bio/caduceus#build-the-caduceus-docker-image-for-mercuri))
  ```
  docker run --user root -p 8888:8888 jupyter-caduceus:latest
  ```
5. Visit [localhost:5000](http://localhost:5000) in your browser.
6. Edit code to see changes on the fly.

That's it.

## Helper scripts

A few other npm scripts are available to help with common tasks:

- `npm run build`: builds (actually bundles) the application and puts it in the
  `public/build` directory.
- `npm run lint`: runs [eslint](https://eslint.org/) and [prettier](https://prettier.io/)
  on source files where it makes sense. See [`.eslintignore`](./.eslintignore)
  and [`.prettierignore`](./.prettierignore) to see which files are not considered.
- `npm run start`: Hosts the application locally on port 5000. But does not rebuild
  the application as changes are made to the source.
- `npm run validate`: Runs the [`svelte-check`](https://github.com/sveltejs/language-tools/tree/master/packages/svelte-check)
  utility on the Svelte components.

## Recommended VS Code plugins:

- The official [Svelte language support](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)
  extension.
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) for linting.
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) for formatting.
  Periodically, press (Ctrl+Shift+I) to format the whole file.
