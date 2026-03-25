# Projects Directory Contract

Every vibe coding experiment lives in its own folder under `projects/`.

## Required per-project files

- `README.md`: what the project does and next steps.
- `index.html`: entry page for demo.
- `style.css`: project styles.
- `script.js`: project logic.

## Registry process

After creating a project, add an entry to `projects/registry.json`:

- `name`: readable title.
- `status`: one of `idea`, `active`, `ready`, `archived`.
- `description`: one sentence summary.
- `tags`: short searchable labels.
- `demo`: relative URL to runnable page.
- `source`: relative URL to folder.

This keeps the root clean and allows the navigation portal to discover projects automatically.
