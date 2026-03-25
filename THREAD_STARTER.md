# Codex New Thread Starter Prompt

Use this prompt whenever you open a new thread for a fresh idea:

```text
Create a new project at projects/<project-slug>/.

Rules:
1. Put all implementation files inside that folder (index.html, style.css, script.js, assets/).
2. Add a README.md inside the project with setup notes and TODOs.
3. Register this project in projects/registry.json with name, status, description, tags, demo, and source.
4. Do not modify unrelated project folders.
5. Keep the visual style modern/minimal unless instructed otherwise.
```

## Folder naming

- Use lowercase kebab-case slugs.
- Example: `projects/ai-moodboard/`.

## Recommended mini-structure

- `projects/<slug>/index.html`
- `projects/<slug>/style.css`
- `projects/<slug>/script.js`
- `projects/<slug>/assets/`
- `projects/<slug>/README.md`
