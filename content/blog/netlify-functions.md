---
title: Testing Netlify Functions Locally
description: A guide to developing serverless functions with Netlify
tags: ['netlify', 'serverless', 'typescript']
related: []
featured: false
createdAt: '2025-06-14T07:00:00.000Z'
---

Netlify Functions provides serverless capabilities to your static sites. They're perfect for API endpoints, form handling, authentication, and any server-side logic you need without managing the entire infrastructure.


## What Are Netlify Functions?
Netlify Functions are serverless functions that run on AWS Lambda under the hood. They allow you to:

- Create API endpoints for your frontend
- Handle form submissions and webhooks
- Integrate with third-party services
- Process data without a traditional backend

Each function is a JavaScript/TypeScript or Go file that exports a handler function. And Netlify automatically deploys them as serverless endpoints.

## Prerequisites and Setup
First, install the Netlify CLI globally:
```bash
npm install -g netlify-cli
or
pnpm add -g netlify-cli
```

Then authenticate with your Netlify account:
```bash
netlify login
```

Link your local project to a Netlify site:
```bash
netlify link
```
## Your First Function
Create a `netlify/functions` directory in your project root and add a simple function:
```typescript hello.ts
export default async (req: Request) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  return new Response(
    JSON.stringify({
      message: "Hello from Netlify Functions!",
      timestamp: new Date().toISOString()
    }),
    { status: 200, headers }
  );
};
```
## Local Development and Testing
Netlify CLI provides two main approaches for local testing:
### Method 1: Full Development Server with `netlify dev`
```bash
netlify dev
```
Your functions will be available at `http://localhost:8888/.netlify/functions/[function-name]`

### Method 2: Functions-Only Server with `netlify functions:serve`
For testing functions in isolation:
```bash
netlify functions:serve
```
Functions are served on `http://localhost:9999/.netlify/functions/[function-name]`

Both automatically load your Netlify environment variables.

## Real Example: API with Error Handling
Here's a mock function that fetches "music" data:
```typescript music.ts
export default async (req: Request) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers
    });
  }

  try {
    const url = new URL(req.url);
    const user = url.searchParams.get("user") || "defaultuser";

    const apiKey = process.env.LASTFM_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key missing" }), {
        status: 500, headers
      });
    }

    const data = { username: `${user}`, data: [{}, {}, {}] };

    return new Response(JSON.stringify(data), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500, headers
    });
  }
};
```

For real world-examples, you can check out the repository of this blog: [gh:gokay.biz/netlify/functions](https://github.com/gokaybiz/gokay.biz/tree/main/netlify/functions).
