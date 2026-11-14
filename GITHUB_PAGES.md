# Publish IGNIS on GitHub Pages

No local Node.js or Python installation is required for this upload method. GitHub builds the React app with the included workflow.

1. Extract IGNIS-GitHub-Pages.zip. Open the inner IGNIS folder containing package.json, index.html, src, public, backend, and .github.
2. Visit https://github.com/new. Name the repository ignis-dashboard. Select Public for GitHub Free, turn on Add a README, and click Create repository. This makes the repository and website publicly accessible.
3. In the repository, open Settings → Pages. Under Build and deployment → Source, select GitHub Actions. The workflow is already included; no template is needed.
4. Return to Code → Add file → Upload files. In Windows File Explorer, open the extracted IGNIS folder, select everything inside it, and drag the selection onto the upload area. Make sure .github is included. Upload these extracted contents, not the ZIP or its enclosing IGNIS directory.
5. Check that package.json and index.html appear at the repository root and .github/workflows/deploy.yml is present. Commit the upload directly to main with the message Add IGNIS dashboard.
6. Open Actions → Deploy IGNIS to GitHub Pages. Wait for the green success check. Open Settings → Pages → Visit site. For the suggested repository name, the URL is https://YOUR-USERNAME.github.io/ignis-dashboard/.

If the first deployment started before Pages was enabled, open its failed run, choose Re-run jobs → Re-run all jobs after Step 3. If no run appears, verify the workflow file is present, then use Actions → Deploy IGNIS to GitHub Pages → Run workflow on main.

Check the deployed page: load research, change oxygen, find relevant research, select Compare scenario, click a point, open its report reference, and download the JSON.

## What works on Pages

The React dashboard, local ranking, graphs, sources, exports, and saved browser scenarios work on GitHub Pages. GitHub Pages cannot run the Python API. The assistant stays Not connected until a separate Python service is configured.

For AI later:

1. Deploy the included backend on a Python/container host; setup commands are in README.md.
2. On that host set OPENAI_API_KEY, OPENAI_MODEL and ALLOWED_ORIGINS=https://YOUR-USERNAME.github.io. CORS uses the origin only, with no repository path or trailing slash.
3. In the GitHub repository, open Settings → Secrets and variables → Actions → Variables → New repository variable. Name it VITE_API_URL and set its value to the HTTPS backend URL. The provided workflow reads this variable.
4. Run the deployment workflow again. The model API key belongs only on the Python host, never in the repository or a VITE_ variable.

## Updating the website

Edit and commit the source files on main. The workflow rebuilds the site automatically. For data changes, update public/data/BASS_II_data.json with the existing schema; summary/catalog changes also require updating src/catalog.json. Review the deployed output after the workflow succeeds.

## Troubleshooting

- A package.json not found error: the files were uploaded inside another folder. Move the contents so package.json is at the repository root.
- No deployment listed: check .github/workflows/deploy.yml exists and the branch is main.
- Pages not found / not enabled in Actions: set Settings → Pages → Source to GitHub Actions, then re-run the workflow.
- Data load failure with an old package: this version fixes absolute /data paths to work under the repository URL.
- Do not double-click index.html to run the React source locally. Use the deployed URL, or install Node.js and follow README.md for npm run dev.

Official references:
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- https://vite.dev/guide/static-deploy
- https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
