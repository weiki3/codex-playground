const projectGrid = document.getElementById("project-grid");
const template = document.getElementById("project-card-template");
const refreshButton = document.getElementById("refresh");

async function loadProjects() {
  projectGrid.innerHTML = '<div class="empty">Loading project registry...</div>';

  try {
    const response = await fetch("./projects/registry.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Registry load failed with status ${response.status}`);
    }

    const { projects } = await response.json();
    renderProjects(projects ?? []);
  } catch (error) {
    projectGrid.innerHTML = `<div class="empty">Could not load registry: ${error.message}</div>`;
  }
}

function renderProjects(projects) {
  projectGrid.innerHTML = "";

  if (!projects.length) {
    projectGrid.innerHTML =
      '<div class="empty">No projects yet. Add one to <code>projects/registry.json</code>.</div>';
    return;
  }

  projects.forEach((project) => {
    const node = template.content.cloneNode(true);

    node.querySelector("[data-title]").textContent = project.name;
    node.querySelector("[data-status]").textContent = project.status;
    node.querySelector("[data-description]").textContent = project.description;

    const tagsContainer = node.querySelector("[data-tags]");
    (project.tags ?? []).forEach((tag) => {
      const chip = document.createElement("span");
      chip.textContent = tag;
      tagsContainer.appendChild(chip);
    });

    const demoLink = node.querySelector("[data-demo]");
    demoLink.href = project.demo;

    const sourceLink = node.querySelector("[data-source]");
    sourceLink.href = project.source;

    projectGrid.appendChild(node);
  });
}

refreshButton.addEventListener("click", loadProjects);
loadProjects();
