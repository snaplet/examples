### Prerequisites

- [Node.js and npm](https://github.com/nvm-sh/nvm#usage)
- [Docker and docker-compose](https://docs.docker.com/get-docker/)


### Getting Started

1. `git clone git@github.com:snaplet/examples.git && cd examples/generate/hasura-slack-clone`
2. `npm install`
3. Edit `DATABASE_URL` in `.env` to make it match your PostgreSQL database.
4. Deploy the prisma model to our local database with: `npx prisma db push --force-reset`
5. Run the app with `npm run dev`

We will be building the backend of a basic Slack clone, setting up permissions so that the right data is exposed to the right user. There won't be any front-end app building associated with this.

You can use the one-click to deploy on Hasura Cloud to get started quickly

[![Deploy to Hasura Cloud](https://hasura.io/deploy-button.svg)](https://cloud.hasura.io/deploy?github_repo=https://github.com/hasura/learn-graphql&hasura_dir=tutorials/backend/hasura-auth-slack/slack-backend)

You will learn the following from this Slack Clone sample app

- Roles: Define roles based on Slack user controls.
- Access Control: Who can access what part of the database.
- Authorization Mode: Setup authorization so that app users can only run operations on data that they should be allowed to.
- Authentication: Integrate a JWT based auth provider (Node.js/Passport) with Hasura.
- Auth with external services: Add a custom GraphQL resolver and forward headers to handle permissions.
- Allow Lists: Go production ready by allowing only a list of queries you specify.

You can follow the tutorial here to learn more - [https://hasura.io/learn/graphql/hasura-auth-slack/thinking-in-roles/](https://hasura.io/learn/graphql/hasura-auth-slack/thinking-in-roles/)
