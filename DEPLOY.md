# Deployment Guide (Render)

This project is configured for easy deployment on [Render](https://render.com) using a Blueprint.

## Prerequisites
1.  A GitHub account with this repository pushed.
2.  A [Render](https://render.com) account.

## Steps to Deploy

1.  **Go to Render Dashboard**: Log in to https://dashboard.render.com/
2.  **Create New Blueprint**:
    -   Click **New +** -> **Blueprint**.
    -   Connect your GitHub repository (`LearnStream`).
3.  **Configure**:
    -   Render will automatically detect the `render.yaml` file.
    -   It will ask you to fill in the **Environment Variables** defined in the blueprint (like `MONGO_URI`).
    -   **IMPORTANT**:
        -   `MONGO_URI`: Your MongoDB connection string.
        -   `CLIENT_URL`: The URL of your frontend (you might need to deploy first to get this, or just use `*` temporarily).
        -   `SERVER_URL`: The URL of your backend (Render provides this).
4.  **Apply**: Click **Apply**. Render will deploy both the backend (as a Docker container) and the frontend (as a static site).

## Why Docker?
The backend uses **Docker** (`server/Dockerfile`) to ensure **Python** is installed. This is required for the transcript generation fallback to work correctly.
