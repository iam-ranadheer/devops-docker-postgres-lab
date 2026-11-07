DevOps Exercise: Node.js, Docker Compose, and PostgreSQL
This project demonstrates how to containerize a Node.js application, pass configuration through environment variables, run the application as a non-root user, configure container health checks, connect the application to PostgreSQL using Docker Compose, and persist database data using a Docker named volume.

Architecture
User or curl
     |
     | HTTP port 3000
     v
Node.js / Express container
     |
     | Docker Compose network
     | DB_HOST=db
     v
PostgreSQL container
     |
     | /var/lib/postgresql/data
     v
Docker named volume
postgres_data
Features
Node.js and Express web application
Dockerized application
Runtime configuration through environment variables
Non-root application container
Application health endpoint
Docker health check
PostgreSQL database container
PostgreSQL readiness check
Docker Compose orchestration
Automatic database initialization
Persistent database storage using a named volume
.env.example configuration template
Git and Docker ignore rules
Technology Stack
Node.js 20
Express 4
PostgreSQL 16
Docker
Docker Compose
Git
Project Structure
devops-docker-postgres-lab/
├── db/
│   └── init/
│       └── init.sql
├── .dockerignore
├── .env
├── .env.example
├── .gitignore
├── Dockerfile
├── compose.yaml
├── package.json
├── README.md
└── server.js
The .env file contains local configuration and must not be committed to Git.

Prerequisites
Install the following before running the project:

Git
Docker Engine
Docker Compose plugin
Verify the installation:

git --version
docker --version
docker compose version
Setup Instructions
1. Clone the repository
git clone git@github.com:YOUR_GITHUB_USERNAME/devops-docker-postgres-lab.git
Move into the repository:

cd devops-docker-postgres-lab
Replace YOUR_GITHUB_USERNAME with your actual GitHub username.

2. Create the environment configuration
Copy the example configuration:

cp .env.example .env
Edit the local configuration:

nano .env
Example:

APP_PORT=3000
PORT=3000
APP_GREETING=Hello from Docker Compose

POSTGRES_DB=devopsdb
POSTGRES_USER=devopsuser
POSTGRES_PASSWORD=change-me
Change POSTGRES_PASSWORD before starting the application.

The .env file is ignored by Git and should not be committed.

3. Validate the Compose configuration
docker compose config
This command validates the YAML structure and displays the resolved Compose configuration.

Do not share its output publicly because resolved values may include sensitive configuration.

4. Build and start the application
docker compose up -d --build
This command:

Builds the Node.js application image.
Creates the Docker Compose network.
Creates the PostgreSQL named volume.
Starts PostgreSQL.
Runs the database initialization script for a new database.
Waits for PostgreSQL to become healthy.
Starts the Node.js application.
5. Check container status
docker compose ps
Both the application and database services should be running.

Check all Docker containers:

docker ps
Test the Application
Main endpoint
curl http://localhost:3000
Example response:

{
  "message": "Hello from Docker Compose",
  "visits": "1"
}
Every request to / adds a record to the PostgreSQL visits table.

Run it again:

curl http://localhost:3000
The visit count should increase.

Health endpoint
curl http://localhost:3000/health
Expected response:

{
  "status": "healthy"
}
The endpoint performs a PostgreSQL query to confirm that both the Node.js application and database connection are working.

View Logs
View all service logs:

docker compose logs
Follow logs continuously:

docker compose logs -f
View only application logs:

docker compose logs app
View only PostgreSQL logs:

docker compose logs db
Press Ctrl+C to exit continuous log output. This does not stop the containers.

Verify Non-Root Execution
Run:

docker compose exec app whoami
Expected:

node
Check the user's UID and GID:

docker compose exec app id
The application process should not use uid=0(root).

Verify Environment Variables
Check the application greeting:

docker compose exec app printenv APP_GREETING
Check the database host:

docker compose exec app printenv DB_HOST
Expected:

db
Check the database name:

docker compose exec app printenv POSTGRES_DB
Verify Docker Health Status
Check service status:

docker compose ps
Inspect the application health status:

docker inspect devops-app --format '{{.State.Health.Status}}'
Expected:

healthy
Connect to PostgreSQL
Open an interactive PostgreSQL session:

docker compose exec db \
  psql -U devopsuser -d devopsdb
List tables:

\dt
Query visit records:

SELECT * FROM visits;
Count records:

SELECT COUNT(*) FROM visits;
Exit PostgreSQL:

\q
The username and database in these commands must match the values in .env.

Automatic Database Initialization
The initialization script is located at:

db/init/init.sql
It contains:

CREATE TABLE IF NOT EXISTS visits (
    id SERIAL PRIMARY KEY,
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
Docker Compose mounts this directory at:

/docker-entrypoint-initdb.d
PostgreSQL runs scripts in this directory only when it initializes a new, empty database data directory.

The initialization script does not run again during normal container restarts when the database volume already contains data.

Database Persistence
PostgreSQL stores its data in the named volume:

postgres_data
The volume is mounted inside the PostgreSQL container at:

/var/lib/postgresql/data
List volumes:

docker volume ls
Inspect the project volume:

docker volume inspect devops-docker-postgres-lab_postgres_data
The exact volume name can vary depending on the Compose project name.

Test persistence
Create some visit records:

curl http://localhost:3000
curl http://localhost:3000
curl http://localhost:3000
Check the number of records:

docker compose exec db \
  psql -U devopsuser -d devopsdb \
  -c "SELECT COUNT(*) FROM visits;"
Stop and remove the containers:

docker compose down
Confirm that the volume still exists:

docker volume ls
Start new containers:

docker compose up -d
Check the records again:

docker compose exec db \
  psql -U devopsuser -d devopsdb \
  -c "SELECT COUNT(*) FROM visits;"
The previous records should still exist.

Stop the Application
Stop and remove the containers and Compose network:

docker compose down
This preserves the PostgreSQL named volume.

Start the application again:

docker compose up -d
Delete All Database Data
Warning: the following command deletes the PostgreSQL named volume and all database data:

docker compose down -v
Use it only when you intentionally want to create a completely fresh database.

After deleting the volume, start the stack again:

docker compose up -d --build
PostgreSQL will initialize a new database and execute db/init/init.sql.

Docker Networking
Docker Compose automatically creates a network for the project.

List Docker networks:

docker network ls
Inspect the Compose network:

docker network inspect devops-docker-postgres-lab_default
The application connects to PostgreSQL using the Compose service name:

DB_HOST=db
Verify Docker DNS resolution from the application container:

docker compose exec app getent hosts db
The application must not use localhost to connect to PostgreSQL because localhost inside the application container refers to the application container itself.

Port Mapping
The Compose configuration uses:

ports:
  - "${APP_PORT}:3000"
This follows:

HOST_PORT:CONTAINER_PORT
With APP_PORT=3000, the mapping is:

EC2 port 3000
       |
       v
Container port 3000
       |
       v
Node.js
To expose the application through host port 8080, update .env:

APP_PORT=8080
PORT=3000
Recreate the application:

docker compose up -d --force-recreate app
Then test:

curl http://localhost:8080
Useful Commands
Build and start:

docker compose up -d --build
Check services:

docker compose ps
Follow logs:

docker compose logs -f
Restart a service:

docker compose restart app
Rebuild only the application:

docker compose up -d --build app
Enter the application container:

docker compose exec app sh
Enter PostgreSQL:

docker compose exec db \
  psql -U devopsuser -d devopsdb
Stop the stack:

docker compose down
Security Considerations
The Node.js container runs as the non-root node user.
The .env file is excluded through .gitignore.
The .env file is excluded from the Docker build context through .dockerignore.
The initialization directory is mounted read-only.
PostgreSQL is not published directly to the EC2 host.
Database credentials are supplied through environment variables.
.env.example contains only template values.
For production usage, store credentials in a dedicated secret-management solution rather than a plain .env file.

Exercise Requirements
Requirement	Implementation
Simple application	Node.js and Express
Create a Dockerfile	Dockerfile
Run using Docker	Docker Compose builds and runs the image
Environment variables	.env and compose.yaml
Non-root container	USER node
Health check	/health, Docker health check, and pg_isready
Application with PostgreSQL	app and db Compose services
Persistent database	postgres_data named volume
Automatic table creation	db/init/init.sql
Setup instructions	This README
Final Validation
Run:

docker compose up -d --build
Then verify:

docker compose ps
curl http://localhost:3000
curl http://localhost:3000/health
docker compose exec app whoami
docker compose exec app getent hosts db
docker volume ls
Expected results:

Application responds successfully.
Visit count increases.
Health endpoint returns healthy.
Application container user is node.
The db service resolves through Docker DNS.
PostgreSQL data is stored in a named volume.
Data survives docker compose down and docker compose up -d.
