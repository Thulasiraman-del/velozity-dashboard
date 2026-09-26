import { useEffect, useState } from "react";
import { createProject, getProjects, type Project } from "../api/projects";
import { useAuth } from "../context/AuthContext";

export default function Projects() {
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientName, setClientName] = useState("");
  const [creating, setCreating] = useState(false);

  async function loadProjects() {
    try {
      setLoading(true);
      setError("");

      const data = await getProjects();
      setProjects(data);
    } catch {
      setError("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  async function handleCreateProject(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!user) return;

    try {
      setCreating(true);
      setError("");

      const project = await createProject({
        name,
        description,
        clientName,
        managerId: user.id,
      });

      setProjects((current) => [project, ...current]);

      setName("");
      setDescription("");
      setClientName("");
    } catch {
      setError("Failed to create project.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage client projects and project assignments.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {(user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER") && (
        <form
          onSubmit={handleCreateProject}
          className="rounded-xl border border-slate-800 bg-slate-900 p-5"
        >
          <h2 className="mb-4 text-lg font-semibold text-white">
            Create Project
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Project name"
              required
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-lime-400"
            />

            <input
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              placeholder="Client name"
              required
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-lime-400"
            />

            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-lime-400"
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="mt-4 rounded-lg bg-lime-400 px-5 py-2 font-semibold text-slate-950 hover:bg-lime-300 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Project"}
          </button>
        </form>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="font-semibold text-white">
            {loading ? "Loading..." : `${projects.length} Projects`}
          </h2>
        </div>

        {projects.length === 0 && !loading ? (
          <div className="px-5 py-10 text-center text-slate-400">
            No projects found.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {projects.map((project) => (
              <div
                key={project.id}
                className="px-5 py-5 hover:bg-slate-800/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">
                      {project.name}
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      {project.description || "No description"}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      Client:{" "}
                      <span className="text-slate-300">
                        {project.clientName}
                      </span>
                    </p>
                  </div>

                  <span className="rounded-full bg-lime-400/10 px-3 py-1 text-xs font-medium text-lime-300">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
