import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { UserContext } from '../context/user.context';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  // Modal open flag & form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');

  // List of all projects
  const [projects, setProjects] = useState([]);

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      const res = await axios.get('/projects/all');
      setProjects(res.data.projects);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  // On mount, load projects
  useEffect(() => {
    fetchProjects();
  }, []);

  // Create a new project then re-fetch
  const createProject = async e => {
    e.preventDefault();
    try {
      const res = await axios.post('/projects/create', { name: projectName });
      console.log('Created project', res.data);
      setProjectName('');
      setIsModalOpen(false);
      await fetchProjects();
    } catch (err) {
      console.error('Error creating project:', err);
    }
  };

  return (
    <main className="p-4">
      <h1 className="text-2xl mb-4">Welcome, {user?.name || 'Guest'}</h1>

      <div className="projects flex flex-wrap gap-4">
        {/* New Project Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-4 border border-slate-400 rounded-md hover:bg-slate-100"
        >
          + New Project
        </button>

        {/* Existing Projects */}
        {projects.map(proj => (
          <div
            key={proj._id}
            className="cursor-pointer p-4 border border-slate-400 rounded-md hover:bg-slate-100 min-w-[12rem]"
            onClick={() => navigate('/project', { state: { project: proj } })}
          >
            <h2 className="font-semibold">{proj.name}</h2>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <i className="ri-user-line" /> Collaborators: {proj.users?.length || 0}
            </p>
          </div>
        ))}
      </div>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-md shadow-md w-80">
            <h2 className="text-xl mb-4">Create New Project</h2>
            <form onSubmit={createProject}>
              <label className="block mb-2 font-medium">Project Name</label>
              <input
                type="text"
                required
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded-md"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
