import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import ProjectModal from '../components/project/ProjectModal';
import { Project } from '../types/Project';
import { projectService } from '../services/projectService';
import { formatDate } from '../utils/dateUtils';
import '../App.css';
import './ProjectsPage.css';

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [selectedTeamId]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAllProjects();
      // Filter by selected team if a team is selected
      let filteredData = data;
      if (selectedTeamId) {
        filteredData = data.filter(project => 
          project.teamIds && project.teamIds.includes(selectedTeamId)
        );
      }
      setProjects(filteredData);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    setSelectedProject(null);
    setIsProjectModalOpen(true);
  };

  const handleProjectClick = (project: Project, e: React.MouseEvent) => {
    // If clicking on delete button, don't navigate
    if ((e.target as HTMLElement).closest('.btn-delete-project')) {
      return;
    }
    // Navigate to project detail page
    navigate(`/projects/${project.id}`);
  };

  const handleEditProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProject(project);
    setIsProjectModalOpen(true);
  };

  const handleProjectSaved = () => {
    fetchProjects();
  };

  const handleDeleteProject = async (id: number) => {
    if (window.confirm('Bu projeyi silmek istediğinize emin misiniz?')) {
      try {
        await projectService.deleteProject(id);
        fetchProjects();
      } catch (error) {
        console.error('Failed to delete project:', error);
        alert('Proje silinemedi. Lütfen tekrar deneyin.');
      }
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ACTIVE':
        return '#89b4fa'; // Blue
      case 'COMPLETED':
        return '#a6e3a1'; // Green
      case 'ON_HOLD':
        return '#f9e2af'; // Yellow
      case 'CANCELLED':
        return '#9399b2'; // Overlay1
      default:
        return '#6c7086'; // Overlay0
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'ACTIVE':
        return 'Aktif';
      case 'COMPLETED':
        return 'Tamamlandı';
      case 'ON_HOLD':
        return 'Beklemede';
      case 'CANCELLED':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  const isProjectEndingSoon = (project: Project): boolean => {
    if (!project.endDate || project.status !== 'ACTIVE') {
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(project.endDate);
    endDate.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1; // 1 gün kaldıysa
  };

  return (
    <div className="app-container">
      <Sidebar selectedTeamId={selectedTeamId} onTeamSelect={setSelectedTeamId} />
      <div className="main-content">
        <Header selectedYear={selectedYear} onYearChange={setSelectedYear} />
        <div className="content-area">
          <div className="projects-container">
            <div className="projects-header">
              <h1>Projeler</h1>
              <button 
                onClick={handleCreateProject}
                className="btn-create-project"
              >
                + Yeni Proje
              </button>
            </div>
            
            {loading ? (
              <div className="loading">Yükleniyor...</div>
            ) : projects.length === 0 ? (
              <div className="empty-state">
                <p>Henüz proje yok. Yeni bir proje oluşturun.</p>
              </div>
            ) : (
              <div className="projects-grid">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`project-card ${isProjectEndingSoon(project) ? 'ending-soon' : ''}`}
                    onClick={(e) => handleProjectClick(project, e)}
                  >
                    <div className="project-card-header">
                      <h3 className="project-card-title">{project.name}</h3>
                      <div
                        className="project-status-badge"
                        style={{ backgroundColor: getStatusColor(project.status) }}
                      >
                        {getStatusLabel(project.status)}
                      </div>
                    </div>
                    
                    {project.description && (
                      <p className="project-card-description">{project.description}</p>
                    )}
                    
                    <div className="project-card-meta">
                      {project.startDate && project.endDate && (
                        <div className="project-card-dates">
                          {formatDate(project.startDate)} - {formatDate(project.endDate)}
                        </div>
                      )}
                      {project.teamNames && project.teamNames.length > 0 && (
                        <div className="project-card-teams">
                          Ekipler: {project.teamNames.join(', ')}
                        </div>
                      )}
                    </div>
                    
                    <div className="project-card-footer">
                      <span className="project-card-creator">
                        Oluşturan: {project.createdByName}
                      </span>
                      <div className="project-card-actions">
                        <button
                          className="btn-edit-project"
                          onClick={(e) => handleEditProject(project, e)}
                        >
                          Düzenle
                        </button>
                        <button
                          className="btn-delete-project"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setSelectedProject(null);
        }}
        onSave={handleProjectSaved}
        project={selectedProject}
      />
    </div>
  );
};

export default ProjectsPage;

