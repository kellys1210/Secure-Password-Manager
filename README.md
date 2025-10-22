# Secure-Password-Manager

#### Run Docker containers for backend + DB:

#### 1. Install Docker desktop app

https://www.docker.com/products/docker-desktop/

#### 2. Set up environment variables

Copy the `.env.example` file to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

Edit the `.env` file and set your actual values:

- **JWT_SECRET**: A strong, random string for JWT token signing
- **DATABASE_URL**: Database connection string
- **SQLALCHEMY_DATABASE_URI**: SQLAlchemy database URI

**Important**: Never commit the `.env` file to version control. It contains sensitive information.

#### 3. Run the following command from the root dir (where compose.yaml lives):

` docker compose up --build`

If not the first time running and no changes were made to Dockerfile or dependencies, you can just use:

` docker compose up`

If you open Docker UI, you will see these containers:

- backend-services: Flask backend

- postgres-db: PostgreSQL database

- pg-admin: PostgreSQL UI

If all show green dots, all containers are running

#### 4. To Access the Backend:

Open http://localhost:8080
in your browser.

You should see a response like Hi :).

#### 5. Access pgAdmin (Database UI)

Open http://localhost:5050

Log in with these credentials:

Email: admin@admin.com

Pw: admin

#### 6. Connect pgAdmin to Postgres

In pgAdmin, right-click Servers > Register ? Server

Fill in:

**Name**: Local Docker DB (anything you want)

**Host name/address**: postgres-db

**Port**: 5432

**Username**: postgres

**Password**: postgres

**Database**: postgres

#### 7. Stopping Containers

To stop everything:

`docker compose down`

### **Notes**

- Changes _should_ be applied with just a page refresh, instead of having to stop and restart containers.

- If you run into any issues with this, please let me know. This is my first time creating Docker containers! - Kelly
