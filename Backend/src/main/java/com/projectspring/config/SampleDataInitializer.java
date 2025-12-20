package com.projectspring.config;

import com.projectspring.model.*;
import com.projectspring.model.enums.*;
import com.projectspring.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class SampleDataInitializer implements CommandLineRunner {

    @Value("${app.seed.sample-data:0}")
    private String seedSampleData;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private SubtaskRepository subtaskRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final Random random = new Random();

    @Override
    @Transactional
    public void run(String... args) {
        if (!"1".equals(seedSampleData)) {
            System.out.println("Sample data seeding is disabled. Set app.seed.sample-data=1 to enable.");
            return;
        }

        System.out.println("Starting sample data initialization...");

        // Get existing teams
        List<Team> teams = teamRepository.findAll();
        if (teams.isEmpty()) {
            System.out.println("No teams found. Please run migrations first.");
            return;
        }

        // Get roles
        RoleEntity yazilimciRole = roleRepository.findByName("YAZILIMCI")
            .orElseThrow(() -> new RuntimeException("YAZILIMCI role not found"));
        RoleEntity devopsRole = roleRepository.findByName("DEVOPS")
            .orElseThrow(() -> new RuntimeException("DEVOPS role not found"));
        RoleEntity isAnalistiRole = roleRepository.findByName("IS_ANALISTI")
            .orElseThrow(() -> new RuntimeException("IS_ANALISTI role not found"));
        RoleEntity testciRole = roleRepository.findByName("TESTCI")
            .orElseThrow(() -> new RuntimeException("TESTCI role not found"));
        RoleEntity takimLideriRole = roleRepository.findByName("TAKIM_LIDERI")
            .orElseThrow(() -> new RuntimeException("TAKIM_LIDERI role not found"));

        // Create users for each team (5 users per team)
        Map<Team, List<User>> teamUsers = new HashMap<>();
        String[] firstNames = {"Ahmet", "Mehmet", "Ayşe", "Fatma", "Ali", "Zeynep", "Mustafa", "Elif", "Can", "Deniz"};
        String[] lastNames = {"Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Arslan", "Doğan", "Öztürk", "Aydın", "Özdemir"};

        int userCounter = 1;
        for (Team team : teams) {
            List<User> users = new ArrayList<>();
            
            // Create team leader (first user)
            User leader = createUser(
                "user" + userCounter++,
                "user" + (userCounter - 1) + "@projectspring.local",
                firstNames[random.nextInt(firstNames.length)] + " " + lastNames[random.nextInt(lastNames.length)],
                Collections.singleton(takimLideriRole),
                Collections.singleton(team)
            );
            users.add(leader);

            // Create 4 more users for the team
            RoleEntity[] teamRoles = {yazilimciRole, devopsRole, isAnalistiRole, testciRole};
            for (int i = 0; i < 4; i++) {
                User user = createUser(
                    "user" + userCounter++,
                    "user" + (userCounter - 1) + "@projectspring.local",
                    firstNames[random.nextInt(firstNames.length)] + " " + lastNames[random.nextInt(lastNames.length)],
                    Collections.singleton(teamRoles[random.nextInt(teamRoles.length)]),
                    Collections.singleton(team)
                );
                users.add(user);
            }

            teamUsers.put(team, users);
            System.out.println("Created 5 users for team: " + team.getName());
        }

        // Create projects
        List<Project> projects = createProjects(teamUsers);
        System.out.println("Created " + projects.size() + " projects");

        // Create tasks for 2025
        createTasksFor2025(teamUsers, projects);
        System.out.println("Created tasks for 2025");

        System.out.println("Sample data initialization completed!");
    }

    private User createUser(String username, String email, String fullName, Set<RoleEntity> roles, Set<Team> teams) {
        if (userRepository.findByUsername(username).isPresent()) {
            return userRepository.findByUsername(username).get();
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPassword(passwordEncoder.encode("password123")); // Default password
        user.setIsActive(true);
        user.setRoles(roles);
        user.setTeams(teams);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    private List<Project> createProjects(Map<Team, List<User>> teamUsers) {
        List<Project> projects = new ArrayList<>();
        
        String[] projectNames = {
            "Web Portal Geliştirme",
            "Mobil Uygulama Projesi",
            "API Entegrasyonu",
            "Veritabanı Optimizasyonu",
            "Güvenlik Güncellemesi"
        };

        String[] projectDescriptions = {
            "Kurumsal web portal geliştirme ve entegrasyon projesi",
            "iOS ve Android platformları için mobil uygulama geliştirme",
            "Üçüncü parti servislerle API entegrasyonu",
            "Veritabanı performans optimizasyonu ve yedekleme sistemi",
            "Sistem güvenlik açıklarının kapatılması ve güncellemeler"
        };

        List<Team> teams = new ArrayList<>(teamUsers.keySet());
        List<User> allUsers = new ArrayList<>();
        teamUsers.values().forEach(allUsers::addAll);

        for (int i = 0; i < projectNames.length; i++) {
            if (projectRepository.findByName(projectNames[i]).isPresent()) {
                continue; // Skip if project already exists
            }

            Project project = new Project();
            project.setName(projectNames[i]);
            project.setDescription(projectDescriptions[i]);
            project.setStartDate(LocalDate.of(2025, 1 + i, 1));
            project.setEndDate(LocalDate.of(2025, 6 + i, 30));
            project.setStatus(ProjectStatus.ACTIVE);
            project.setCreatedBy(allUsers.get(random.nextInt(allUsers.size())));
            project.setCreatedAt(LocalDateTime.now());
            project.setUpdatedAt(LocalDateTime.now());

            // Assign 2-3 random teams to project
            Set<Team> projectTeams = new HashSet<>();
            int teamCount = 2 + random.nextInt(2);
            Collections.shuffle(teams);
            for (int j = 0; j < Math.min(teamCount, teams.size()); j++) {
                projectTeams.add(teams.get(j));
            }
            project.setTeams(projectTeams);

            projects.add(projectRepository.save(project));
        }

        return projects;
    }

    private void createTasksFor2025(Map<Team, List<User>> teamUsers, List<Project> projects) {
        String[] taskTitles = {
            "Veritabanı şema tasarımı",
            "API endpoint geliştirme",
            "Frontend component oluşturma",
            "Unit test yazma",
            "Integration test yazma",
            "Code review",
            "Dokümantasyon hazırlama",
            "Performans optimizasyonu",
            "Güvenlik testleri",
            "Deployment hazırlığı",
            "Bug fix",
            "Feature geliştirme",
            "UI/UX iyileştirmeleri",
            "Backend servis geliştirme",
            "Mobil uygulama testi"
        };

        TaskType[] taskTypes = {TaskType.TASK, TaskType.FEATURE, TaskType.BUG};
        Priority[] priorities = {Priority.NORMAL, Priority.HIGH, Priority.URGENT};
        TaskStatus[] statuses = {TaskStatus.OPEN, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.POSTPONED};

        List<Team> teams = new ArrayList<>(teamUsers.keySet());

        // Create tasks for each month in 2025
        for (int month = 1; month <= 12; month++) {
            int tasksPerMonth = 15 + random.nextInt(20); // 15-35 tasks per month

            for (int i = 0; i < tasksPerMonth; i++) {
                Team team = teams.get(random.nextInt(teams.size()));
                List<User> teamMembers = teamUsers.get(team);
                if (teamMembers == null || teamMembers.isEmpty()) continue;

                User creator = teamMembers.get(random.nextInt(teamMembers.size()));
                User assignee = teamMembers.get(random.nextInt(teamMembers.size()));

                // Random dates within the month
                int daysInMonth = LocalDate.of(2025, month, 1).lengthOfMonth();
                int startDay = 1 + random.nextInt(daysInMonth - 5);
                int endDay = startDay + 1 + random.nextInt(7); // 1-7 days duration
                if (endDay > daysInMonth) endDay = daysInMonth;

                LocalDate startDate = LocalDate.of(2025, month, startDay);
                LocalDate endDate = LocalDate.of(2025, month, endDay);

                Task task = new Task();
                task.setTitle(taskTitles[random.nextInt(taskTitles.length)] + " - " + month + "/2025");
                task.setContent("Bu iş " + month + ". ay için oluşturulmuş örnek bir iştir.");
                task.setStartDate(startDate);
                task.setEndDate(endDate);
                task.setStatus(statuses[random.nextInt(statuses.length)]);
                task.setTaskType(taskTypes[random.nextInt(taskTypes.length)]);
                task.setPriority(priorities[random.nextInt(priorities.length)]);
                task.setTeam(team);
                task.setCreatedBy(creator);
                task.setCreatedAt(LocalDateTime.now());
                task.setUpdatedAt(LocalDateTime.now());

                // Assign to project (50% chance)
                if (random.nextBoolean() && !projects.isEmpty()) {
                    task.setProject(projects.get(random.nextInt(projects.size())));
                }

                // Assign user to task
                task.setAssignees(Collections.singleton(assignee));
                Task savedTask = taskRepository.save(task);

                // 30% chance to create subtasks
                if (random.nextDouble() < 0.3) {
                    createSubtasks(savedTask, teamMembers);
                }
            }
        }
    }

    private void createSubtasks(Task parentTask, List<User> teamMembers) {
        String[] subtaskTitles = {
            "Alt görev 1",
            "Alt görev 2",
            "Alt görev 3"
        };

        int subtaskCount = 1 + random.nextInt(3); // 1-3 subtasks
        for (int i = 0; i < subtaskCount && i < subtaskTitles.length; i++) {
            Subtask subtask = new Subtask();
            subtask.setTask(parentTask);
            subtask.setTitle(subtaskTitles[i] + " - " + parentTask.getTitle());
            subtask.setContent("Alt görev açıklaması");
            subtask.setStartDate(parentTask.getStartDate());
            subtask.setEndDate(parentTask.getEndDate());
            subtask.setIsCompleted(random.nextBoolean());
            
            if (!teamMembers.isEmpty() && random.nextBoolean()) {
                User assignee = teamMembers.get(random.nextInt(teamMembers.size()));
                subtask.setAssignee(assignee);
            }

            // Save subtask first, then it will be added to parent's subtasks via cascade
            subtaskRepository.save(subtask);
        }
    }
}

