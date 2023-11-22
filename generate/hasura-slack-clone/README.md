# Hasura Slack Clone: Effortless Database Seeding with Snaplet Generate

### What's This All About?

In today's fast-paced development world, efficiently seeding a complex database is crucial for rapid application development. `Snaplet generate` offers a seamless solution, and in this post, we'll explore its powerful capabilities using a Hasura slack clone as a case study.

### Our Approach

To demonstrate the effectiveness of `snaplet generate`, we'll take a Hasura slack clone as our example. We'll deploy a local Hasura instance using the Hasura CLI and Docker, followed by employing `snaplet generate` to populate our app with data.

### Prerequisites

- Node.js and npm: [Installation Guide](https://github.com/nvm-sh/nvm#usage)
- Docker and docker-compose: [Get Docker](https://docs.docker.com/get-docker/)

### Getting Started

Setting up a working local environment is our first step. Here's how to get started:

1. Clone the Snaplet examples repository and navigate to the Hasura slack clone example:
   ```bash
   git clone git@github.com:snaplet/examples.git && cd examples/generate/hasura-slack-clone
   ```
2. Install the necessary Node packages:
   ```bash
   npm install
   ```
3. Spin up Docker containers:
   ```bash
   docker-compose up -d
   ```
4. Launch the Hasura console:
   ```bash
   npx hasura console
   ```
5. In a separate terminal, apply Hasura metadata and migrations:
   ```bash
   npx hasura metadata apply && npx hasura migrate apply && npx hasura metadata apply
   ```

Opening `http://localhost:9695/console` should now display the Hasura console. You'll notice that our database is currently empty, but we're all set to change that!

![hasura-todo-app-database-schema](https://graphql-engine-cdn.hasura.io/learn-hasura/assets/graphql-hasura-auth/slack-datamodel.png)

![hasura-console-image-gif]()

As you can see for now, there is no data in our database. But we now have a deployed schema who look like this:

![hasura-schema-database-image-gif]()

Let's setup snaplet to generate some data for us.

### Setting up Snaplet

Snaplet operates in two main steps:

1. **Introspection:** Snaplet analyzes your database, gathering schema, data, and relationship details.
2. **Configuration:** You'll receive a `snaplet.config.ts` file for declarative data specification.

To set it up:

```bash
npx --yes snaplet@latest setup 
```

Select "No, I want to generate data locally" and enter the Docker database credentials used by Hasura. 

`postgres://postgres:postgrespassword@0.0.0.0:5433/postgres`

This process generates a `snaplet.config.ts` file:

```ts
import { copycat, faker } from "@snaplet/copycat";
import { defineConfig } from "snaplet";
copycat.setHashKey("cC8KfCmUSznTuR4d");
export default defineConfig({
  generate: {
    async run(snaplet) {
      // This is an example generate plan. It's a starting point, but you'll probably need to
      // give snaplet more detail about the plan for it to fit your application logic better.
      //
      // For more on how to do this, check out the docs:
      // https://docs.snaplet.dev/reference/configuration#generate
      await snaplet.workspace_user_type((x) => x(2));
    },
  },
});
```

### Generating Data

Now that we have our `snaplet.config.ts` file, we can generate data with the following command:

```bash
npx snaplet generate
```

With our current configuration this will create 2 workspace user types. Not very useful.

To build a more realistic environment, we plan to add:

1. **Workspaces**: We aim to create 2 distinct workspaces.
2. **Users**: For each workspace, we'll create 2 users.
3. **Channels**: Each workspace will have 2 channels.
4. **Messages**: We plan to create 2 messages in each channel.

These additions will help us simulate a more authentic workspace environment, giving us a better platform to demonstrate the capabilities of `snaplet generate`.

```ts
export default defineConfig({
  select: {
    // We don't want to alter hasura internal table
    hdb_catalog: false,
  },
  generate: {
    async run(snaplet) {
      await snaplet.workspace((x) =>
        // 1. We want to create 2 workspaces
        x(2, () => ({
          // 2. We want to 2 users per workspace
          workspace_member: (x) => x(2),
          channel: (x) =>
            // 3. We want to create 2 channels per workspace
            x(2, () => ({
              // 4. We want two members per channel
              channel_member: (x) => x(2),
              channel_thread: (x) =>
              // 5. We want to create 2 thread per channel
                x(2, () => ({
                  // 6. We want to create 2 messages per thread
                  channel_thread_message: (x) => x(2),
                })),
            })),
        }))
      );
    },
  },
});
``````

Based on our configuration, here's what we expect:

2 workspaces
4 users
4 channels
8 channel members
8 channel threads
16 channel thread messages
Let's generate the data and explore the result:

```bash
npx snaplet generate
```

![snaplet-generate-image-gif]()

As you can see, we have now a lot of data in our database. Let's explore it in the Hasura console.

![hasura-console-data-image-gif]()

Something is off, the actual generated data is not what we expected. We have:

1. 2 workspaces (ok)
2. 30 users (not ok)
3. 4 channels (ok)
4. 8 channel members (ok)
5. 8 channel threads (ok)
6. 16 channel thread messages (ok)


What happened here ?

### Understanding data connection

By default, snaplet will generate data for all the tables in your database.
But it will also try to generate data for all the tables that are connected to the tables you want to generate data for.
And by default, it will either "create data" or "try to connect to existing data". By default he will try to create data.
This is the reason why we see 30 users created and also why we have 4 workspace_user_type created. Even if we didn't ask for it.
Because `workspace_member` require a valid `user_id` to be created, each workspace also require a valid user for `owner_id` and so on.
Right now, every time generate see this kind of relationships it'll create a new user for it.

This could be fine, but in our case we want to have more control over the data we generate.
What we really want it to re-use a pool of defined users and assign them to differents workspaces and channels.

Let's rewrite our expectations:

1. Create a pool of 9 users.
2. Establish 2 different workspace_user_type categories: "admin" and "user".

Using this initial data pool, we then aim to:

3. Create 2 workspaces.
4. Assign 2 users to each workspace.
5. Create 2 channels for each workspace.
6. Assign 2 users to each channel.
7. Generate 2 threads per channel.
8. Create 2 messages per thread.
9. Generate 20 messages between users across the workspaces.

To implement this, we'll utilize the `snaplet generate` [$pipe operator](https://docs.snaplet.dev/core-concepts/generate#using-pipe).

Let's see what it look like:

```ts
export default defineConfig({
  select: {
    hdb_catalog: false,
  },
  generate: {
    async run(snaplet) {
      // The $pipe operator allows you to chain multiple plans together, injecting the store of the previous plan into the next plan.
      await snaplet.$pipe([
        //  We start by creating our two different workspace_user_type
        snaplet.workspace_user_type((x) =>
          x(2, (index) => ({
            // We will create only two of them, and assign them a type via a static array
            // row 1 will have type "admin" and row 2 will have type "user"
            type: ["admin", "user"][index],
          }))
        ),
        // Then we create our pool of 9 users
        snaplet.users((x) => x(9)),
        // Then we create our workspaces and other data as before
        snaplet.workspace(
          (x) =>
            x(2, () => ({
              channel: (x) =>
                x(2, () => ({
                  channel_member: (x) => x(2),
                  channel_thread: (x) =>
                    x(2, () => ({
                      channel_thread_message: (x) => x(2),
                    })),
                })),
              workspace_member: (x) => x(2),
            })),
          // Here we use the autoConnect option again to connect our
          // users and workspace_user_type to our workspaces, channels and thread messages
          { autoConnect: true }
        ),
        // Then we create 20 direct messages between our users here you can see that we use the
        // autoConnect option. This option will tell snaplet to try to connect to existing data instead of creating new one.
        // in this case, the messages creator and recipient will be dispatched between our 9 users and the 2 workspace already created
        snaplet.user_message((x) => x(20), { autoConnect: true }),
      ]);
    },
  },
});
```

After adjusting our data generation strategy, let's run the command again to see the results:

```bash
npx snaplet generate
```

![snaplet-generate-image-gif]()

__Hiro Nakamura voice__: "Yatta !"

We've successfully generated a more controlled and realistic dataset.

### Nitpicking for Realism

Having a large dataset is great, but realism in data is key. For example, our users' "name" fields currently lack authenticity. To rectify this, we can refine our `users` definition in the `snaplet.config.ts` file:

```ts
snaplet.users((x) => x(9, () => ({
    // We can customize each field to generate more realistic data
    // Utilizing the `seed` and the copycat library for deterministic results
    name: ({seed}) => copycat.fullName(seed),
    display_name: ({seed}) => copycat.username(seed),
}))),
```

![snaplet-generate-fixed-image-gif]()

### Going Further

While our data now looks more realistic, there are still relationships that could be improved:

- Ensuring a `workspace_owner` is also a `workspace_member`.
- Making sure a `channel_owner` is included as a `channel_member`.
- Guaranteeing `channel_members` are also `workspace_members`.
- Confirming messages are exchanged only among members of the same workspace or channel.

We'll address these nuances to further refine the relationships in our data, ensuring consistency and realism.

TODO: complete when smarterAutocomplete is ready
```ts
```

### Conclusions

Through this journey, we've showcased the flexibility and power of `snaplet generate` in creating a realistic and intricate database for a Hasura Slack clone. From addressing unexpected data generation results to refining relationships for authenticity, Snaplet proves to be an indispensable tool for developers looking to efficiently model complex data scenarios.

Whether you're a seasoned developer or just starting out, we hope this guide inspires you to explore the possibilities of Snaplet in your own projects. Dive in, experiment, and see how Snaplet can revolutionize your development workflow!
